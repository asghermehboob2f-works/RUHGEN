const crypto = require("node:crypto");
const { verifyAdminToken } = require("./auth");
const { deleteMediaUrl } = require("./media-cleanup");

function getBearer(req) {
  const auth = String(req.headers.authorization || "").trim();
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

function requireAdmin(req, res, next) {
  const bearer = getBearer(req);
  if (!bearer) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
  try {
    const payload = verifyAdminToken(bearer);
    if (payload.typ !== "admin" || typeof payload.sub !== "string") {
      throw new Error("invalid");
    }
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
}

/**
 * Generate a unique viewer fingerprint from IP + User Agent or Header
 */
function getViewerKey(req) {
  const ip = req.ip || req.socket?.remoteAddress || "127.0.0.1";
  const ua = req.headers["user-agent"] || "unknown-ua";
  const clientKey = req.headers["x-viewer-key"] || "";
  if (clientKey) return String(clientKey).slice(0, 100);
  return crypto.createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

function safeJsonParse(jsonStr, fallback) {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}

/**
 * Mount complete Academy system API endpoints (Public & Admin)
 * @param {import("express").Express} app
 * @param {{ db: import("better-sqlite3").Database, projectRoot: string }} ctx
 */
function mountAcademyRoutes(app, { db, projectRoot }) {

  // ---------------------------------------------------------------------------
  // PUBLIC ENDPOINTS
  // ---------------------------------------------------------------------------

  // Public: Get all tutorials (with search, category, subcategory, tag, sort)
  app.get("/api/academy/tutorials", (req, res) => {
    try {
      const { category, subcategory, tag, search, course_id, status = "published", sort = "recent", order = "desc" } = req.query;

      let sql = "SELECT * FROM academy_tutorials WHERE 1=1";
      const params = [];

      // Filter by status (unless admin viewing)
      if (status && status !== "all") {
        sql += " AND status = ?";
        params.push(status);
      }

      if (category && category !== "all") {
        sql += " AND category = ?";
        params.push(category);
      }

      if (subcategory && subcategory !== "all") {
        sql += " AND subcategory = ?";
        params.push(subcategory);
      }

      if (course_id) {
        sql += " AND course_id = ?";
        params.push(course_id);
      }

      if (search) {
        const q = `%${String(search).trim()}%`;
        sql += " AND (title LIKE ? OR description LIKE ? OR instructor LIKE ? OR tags LIKE ?)";
        params.push(q, q, q, q);
      }

      if (tag) {
        const t = `%${String(tag).trim()}%`;
        sql += " AND tags LIKE ?";
        params.push(t);
      }

      // Sort order
      const direction = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";
      if (sort === "views") {
        sql += ` ORDER BY views ${direction}, display_order ASC, created_at DESC`;
      } else if (sort === "likes") {
        sql += ` ORDER BY likes ${direction}, display_order ASC, created_at DESC`;
      } else if (sort === "title") {
        sql += ` ORDER BY title ${direction}`;
      } else if (sort === "order") {
        sql += ` ORDER BY display_order ASC, created_at DESC`;
      } else {
        sql += ` ORDER BY display_order ASC, created_at ${direction}`;
      }

      const rows = db.prepare(sql).all(...params);

      // Parse tags for frontend compatibility
      const tutorials = rows.map(r => ({
        ...r,
        tags: safeJsonParse(r.tags, []),
        premium: Number(r.premium)
      }));

      const userCountRow = db.prepare("SELECT COUNT(*) as count FROM users").get();
      const totalUsers = userCountRow ? userCountRow.count : 0;

      return res.json({ ok: true, tutorials, totalUsers, count: tutorials.length });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  // Public: Get single tutorial by ID
  app.get("/api/academy/tutorials/:id", (req, res) => {
    try {
      const id = req.params.id;
      const row = db.prepare("SELECT * FROM academy_tutorials WHERE id = ?").get(id);
      if (!row) {
        return res.status(404).json({ ok: false, error: "Tutorial not found." });
      }

      let course = null;
      if (row.course_id) {
        course = db.prepare("SELECT * FROM academy_courses WHERE id = ?").get(row.course_id);
      }

      return res.json({
        ok: true,
        tutorial: {
          ...row,
          tags: safeJsonParse(row.tags, []),
          premium: Number(row.premium)
        },
        course
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Get all courses
  app.get("/api/academy/courses", (req, res) => {
    try {
      const { category, subcategory, search, status = "published" } = req.query;

      let sql = "SELECT * FROM academy_courses WHERE 1=1";
      const params = [];

      if (status && status !== "all") {
        sql += " AND status = ?";
        params.push(status);
      }

      if (category && category !== "all") {
        sql += " AND category = ?";
        params.push(category);
      }

      if (subcategory && subcategory !== "all") {
        sql += " AND subcategory = ?";
        params.push(subcategory);
      }

      if (search) {
        const q = `%${String(search).trim()}%`;
        sql += " AND (title LIKE ? OR description LIKE ? OR instructor LIKE ?)";
        params.push(q, q, q);
      }

      sql += " ORDER BY display_order ASC, created_at DESC";

      const rows = db.prepare(sql).all(...params);

      // Attach tutorial count for each course
      const courses = rows.map(c => {
        const countRow = db.prepare("SELECT COUNT(*) AS c FROM academy_tutorials WHERE course_id = ? AND status = 'published'").get(c.id);
        return {
          ...c,
          tags: safeJsonParse(c.tags, []),
          tutorial_count: countRow ? countRow.c : 0,
          premium: Number(c.premium)
        };
      });

      return res.json({ ok: true, courses });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Get single course with its tutorials
  app.get("/api/academy/courses/:id", (req, res) => {
    try {
      const id = req.params.id;
      const course = db.prepare("SELECT * FROM academy_courses WHERE id = ?").get(id);
      if (!course) {
        return res.status(404).json({ ok: false, error: "Course not found." });
      }

      const tutorialRows = db.prepare("SELECT * FROM academy_tutorials WHERE course_id = ? AND status = 'published' ORDER BY display_order ASC, created_at ASC").all(id);
      const tutorials = tutorialRows.map(r => ({
        ...r,
        tags: safeJsonParse(r.tags, []),
        premium: Number(r.premium)
      }));

      return res.json({
        ok: true,
        course: {
          ...course,
          tags: safeJsonParse(course.tags, []),
          premium: Number(course.premium)
        },
        tutorials
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Get categories & subcategories tree
  app.get("/api/academy/categories", (_req, res) => {
    try {
      const categories = db.prepare("SELECT * FROM academy_categories ORDER BY display_order ASC").all();
      const subcategories = db.prepare("SELECT * FROM academy_subcategories ORDER BY display_order ASC").all();

      const tree = categories.map(cat => ({
        ...cat,
        subcategories: subcategories.filter(sub => sub.category_id === cat.id)
      }));

      return res.json({ ok: true, categories: tree });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Get list of distinct tags across all content
  app.get("/api/academy/tags", (_req, res) => {
    try {
      const tRows = db.prepare("SELECT tags FROM academy_tutorials WHERE status = 'published'").all();
      const cRows = db.prepare("SELECT tags FROM academy_courses WHERE status = 'published'").all();

      const tagSet = new Set();
      for (const row of [...tRows, ...cRows]) {
        const arr = safeJsonParse(row.tags, []);
        for (const item of arr) {
          if (typeof item === "string" && item.trim()) {
            tagSet.add(item.trim());
          }
        }
      }

      return res.json({ ok: true, tags: Array.from(tagSet) });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Full aggregate academy bundle (Tutorials, Courses, Categories, Tags, Stats)
  app.get("/api/academy/content", (req, res) => {
    try {
      const tutorialsRaw = db.prepare("SELECT * FROM academy_tutorials WHERE status = 'published' ORDER BY display_order ASC, created_at DESC").all();
      const coursesRaw = db.prepare("SELECT * FROM academy_courses WHERE status = 'published' ORDER BY display_order ASC, created_at DESC").all();
      const categoriesRaw = db.prepare("SELECT * FROM academy_categories ORDER BY display_order ASC").all();
      const subcategoriesRaw = db.prepare("SELECT * FROM academy_subcategories ORDER BY display_order ASC").all();
      const userCountRow = db.prepare("SELECT COUNT(*) as count FROM users").get();

      const tutorials = tutorialsRaw.map(t => ({
        ...t,
        tags: safeJsonParse(t.tags, []),
        premium: Number(t.premium)
      }));

      const courses = coursesRaw.map(c => {
        const countRow = db.prepare("SELECT COUNT(*) AS c FROM academy_tutorials WHERE course_id = ? AND status = 'published'").get(c.id);
        return {
          ...c,
          tags: safeJsonParse(c.tags, []),
          tutorial_count: countRow ? countRow.c : 0,
          premium: Number(c.premium)
        };
      });

      const categories = categoriesRaw.map(cat => ({
        ...cat,
        subcategories: subcategoriesRaw.filter(s => s.category_id === cat.id)
      }));

      const totalViews = tutorials.reduce((acc, curr) => acc + (curr.views || 0), 0) + courses.reduce((acc, curr) => acc + (curr.views || 0), 0);
      const totalLikes = tutorials.reduce((acc, curr) => acc + (curr.likes || 0), 0) + courses.reduce((acc, curr) => acc + (curr.likes || 0), 0);

      return res.json({
        ok: true,
        tutorials,
        courses,
        categories,
        subcategories: subcategoriesRaw,
        stats: {
          totalTutorials: tutorials.length,
          totalCourses: courses.length,
          totalCategories: categories.length,
          totalViews,
          totalLikes,
          totalUsers: userCountRow ? userCountRow.count : 0
        }
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Increment view count with viewer deduplication
  app.post("/api/academy/tutorials/:id/view", (req, res) => {
    try {
      const id = req.params.id;
      const viewerKey = getViewerKey(req);
      const now = new Date().toISOString();

      const existingView = db.prepare("SELECT created_at FROM academy_views WHERE content_id = ? AND content_type = 'tutorial' AND viewer_key = ?").get(id, viewerKey);

      let incremented = false;
      if (!existingView) {
        db.prepare("INSERT OR REPLACE INTO academy_views (content_id, content_type, viewer_key, created_at) VALUES (?, 'tutorial', ?, ?)").run(id, viewerKey, now);
        db.prepare("UPDATE academy_tutorials SET views = views + 1 WHERE id = ?").run(id);
        incremented = true;
      }

      const updated = db.prepare("SELECT views FROM academy_tutorials WHERE id = ?").get(id);
      return res.json({ ok: true, views: updated ? updated.views : 0, incremented });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Increment like count with viewer deduplication
  app.post("/api/academy/tutorials/:id/like", (req, res) => {
    try {
      const id = req.params.id;
      const viewerKey = getViewerKey(req);
      const now = new Date().toISOString();

      const existingLike = db.prepare("SELECT created_at FROM academy_likes WHERE content_id = ? AND content_type = 'tutorial' AND viewer_key = ?").get(id, viewerKey);

      if (!existingLike) {
        db.prepare("INSERT INTO academy_likes (content_id, content_type, viewer_key, created_at) VALUES (?, 'tutorial', ?, ?)").run(id, viewerKey, now);
        db.prepare("UPDATE academy_tutorials SET likes = likes + 1 WHERE id = ?").run(id);
      }

      const updated = db.prepare("SELECT likes FROM academy_tutorials WHERE id = ?").get(id);
      return res.json({ ok: true, likes: updated ? updated.likes : 0, liked: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Decrement like count
  app.post("/api/academy/tutorials/:id/unlike", (req, res) => {
    try {
      const id = req.params.id;
      const viewerKey = getViewerKey(req);

      const existingLike = db.prepare("SELECT created_at FROM academy_likes WHERE content_id = ? AND content_type = 'tutorial' AND viewer_key = ?").get(id, viewerKey);

      if (existingLike) {
        db.prepare("DELETE FROM academy_likes WHERE content_id = ? AND content_type = 'tutorial' AND viewer_key = ?").run(id, viewerKey);
        db.prepare("UPDATE academy_tutorials SET likes = MAX(0, likes - 1) WHERE id = ?").run(id);
      }

      const updated = db.prepare("SELECT likes FROM academy_tutorials WHERE id = ?").get(id);
      return res.json({ ok: true, likes: updated ? updated.likes : 0, liked: false });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Get liked tutorials for viewer
  app.get("/api/academy/user-likes", (req, res) => {
    try {
      const viewerKey = getViewerKey(req);
      const likes = db.prepare("SELECT content_id FROM academy_likes WHERE viewer_key = ?").all(viewerKey);
      return res.json({ ok: true, likedIds: likes.map(l => l.content_id) });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });


  // ---------------------------------------------------------------------------
  // ADMIN CMS CONTROL PANEL ENDPOINTS
  // ---------------------------------------------------------------------------

  // Admin: Get all tutorials with full metadata & stats
  app.get("/api/admin/academy/tutorials", requireAdmin, (_req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM academy_tutorials ORDER BY display_order ASC, created_at DESC").all();
      const tutorials = rows.map(r => ({
        ...r,
        tags: safeJsonParse(r.tags, []),
        premium: Number(r.premium)
      }));
      return res.json({ ok: true, tutorials });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Admin: Create tutorial
  app.post("/api/admin/academy/tutorials", requireAdmin, (req, res) => {
    try {
      const {
        title,
        description = "",
        video_url = "",
        video_source = "external",
        thumbnail_url = "",
        course_id = null,
        category,
        subcategory = "",
        tags = [],
        duration,
        difficulty = "Beginner",
        premium = false,
        status = "published",
        display_order = 0,
        instructor = "RUHGEN Masterclass"
      } = req.body || {};

      if (!title || !category || !duration) {
        return res.status(400).json({ ok: false, error: "Title, category, and duration are required." });
      }

      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();
      const tags_str = Array.isArray(tags) ? JSON.stringify(tags) : typeof tags === "string" ? tags : "[]";
      const str = (v, fallback = "") => (typeof v === "string" ? v.trim() : fallback);

      db.prepare(`
        INSERT INTO academy_tutorials (
          id, course_id, title, description, video_source, video_url, thumbnail_url, category, subcategory, tags, duration, difficulty, premium, status, display_order, instructor, created_at, updated_at, views, likes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      `).run(
        id,
        course_id || null,
        str(title),
        str(description),
        video_source || "upload",
        str(video_url),
        str(thumbnail_url),
        str(category),
        str(subcategory),
        tags_str,
        str(duration),
        str(difficulty, "Beginner"),
        premium ? 1 : 0,
        status || "published",
        parseInt(display_order, 10) || 0,
        str(instructor, "RUHGEN Masterclass"),
        created_at,
        created_at
      );

      const newTutorial = db.prepare("SELECT * FROM academy_tutorials WHERE id = ?").get(id);
      return res.json({
        ok: true,
        tutorial: {
          ...newTutorial,
          tags: safeJsonParse(newTutorial.tags, []),
          premium: Number(newTutorial.premium)
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  // Admin: Update tutorial
  app.put("/api/admin/academy/tutorials/:id", requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const {
        title,
        description,
        video_url,
        video_source,
        thumbnail_url,
        course_id,
        category,
        subcategory,
        tags,
        duration,
        difficulty,
        premium,
        status,
        display_order,
        instructor,
        views,
        likes
      } = req.body || {};

      const existing = db.prepare("SELECT * FROM academy_tutorials WHERE id = ?").get(id);
      if (!existing) {
        return res.status(404).json({ ok: false, error: "Tutorial not found." });
      }

      const newVideoUrl = video_url !== undefined ? String(video_url).trim() : existing.video_url;
      const newThumbUrl = thumbnail_url !== undefined ? String(thumbnail_url).trim() : existing.thumbnail_url;
      const tags_str = Array.isArray(tags) ? JSON.stringify(tags) : tags !== undefined ? String(tags) : existing.tags;
      const updated_at = new Date().toISOString();

      db.prepare(`
        UPDATE academy_tutorials
        SET course_id = ?, title = ?, description = ?, video_source = ?, video_url = ?, thumbnail_url = ?, category = ?, subcategory = ?, tags = ?, duration = ?, difficulty = ?, premium = ?, status = ?, display_order = ?, instructor = ?, views = ?, likes = ?, updated_at = ?
        WHERE id = ?
      `).run(
        course_id !== undefined ? course_id : existing.course_id,
        title !== undefined ? title.trim() : existing.title,
        description !== undefined ? description.trim() : existing.description,
        video_source !== undefined ? video_source : existing.video_source,
        newVideoUrl,
        newThumbUrl,
        category !== undefined ? category.trim() : existing.category,
        subcategory !== undefined ? subcategory.trim() : existing.subcategory,
        tags_str,
        duration !== undefined ? duration.trim() : existing.duration,
        difficulty !== undefined ? difficulty.trim() : existing.difficulty,
        premium !== undefined ? (premium ? 1 : 0) : existing.premium,
        status !== undefined ? status : existing.status,
        display_order !== undefined ? parseInt(display_order, 10) || 0 : existing.display_order,
        instructor !== undefined ? instructor.trim() : existing.instructor,
        views !== undefined ? parseInt(views, 10) || 0 : existing.views,
        likes !== undefined ? parseInt(likes, 10) || 0 : existing.likes,
        updated_at,
        id
      );

      // Clean up old media files if replaced
      if (existing.video_url && existing.video_url !== newVideoUrl && existing.video_url.startsWith("/media/")) {
        deleteMediaUrl(projectRoot, existing.video_url).catch(err => {
          console.error("[academy] Failed to delete old video file:", err.message);
        });
      }
      if (existing.thumbnail_url && existing.thumbnail_url !== newThumbUrl && existing.thumbnail_url.startsWith("/media/")) {
        deleteMediaUrl(projectRoot, existing.thumbnail_url).catch(err => {
          console.error("[academy] Failed to delete old thumbnail file:", err.message);
        });
      }

      const updated = db.prepare("SELECT * FROM academy_tutorials WHERE id = ?").get(id);
      return res.json({
        ok: true,
        tutorial: {
          ...updated,
          tags: safeJsonParse(updated.tags, []),
          premium: Number(updated.premium)
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  // Admin: Delete tutorial
  app.delete("/api/admin/academy/tutorials/:id", requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const existing = db.prepare("SELECT video_url, thumbnail_url FROM academy_tutorials WHERE id = ?").get(id);
      if (!existing) {
        return res.status(404).json({ ok: false, error: "Tutorial not found." });
      }

      db.prepare("DELETE FROM academy_tutorials WHERE id = ?").run(id);

      if (existing.video_url && existing.video_url.startsWith("/media/")) {
        deleteMediaUrl(projectRoot, existing.video_url).catch(err => {
          console.error("[academy] Failed to delete video on tutorial removal:", err.message);
        });
      }
      if (existing.thumbnail_url && existing.thumbnail_url.startsWith("/media/")) {
        deleteMediaUrl(projectRoot, existing.thumbnail_url).catch(err => {
          console.error("[academy] Failed to delete thumbnail on tutorial removal:", err.message);
        });
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Admin: Get all courses
  app.get("/api/admin/academy/courses", requireAdmin, (_req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM academy_courses ORDER BY display_order ASC, created_at DESC").all();
      const courses = rows.map(c => {
        const countRow = db.prepare("SELECT COUNT(*) AS count FROM academy_tutorials WHERE course_id = ?").get(c.id);
        return {
          ...c,
          tags: safeJsonParse(c.tags, []),
          tutorial_count: countRow ? countRow.count : 0,
          premium: Number(c.premium)
        };
      });
      return res.json({ ok: true, courses });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Admin: Create course
  app.post("/api/admin/academy/courses", requireAdmin, (req, res) => {
    try {
      const {
        title,
        description = "",
        thumbnail_url = "",
        category = "courses",
        subcategory = "",
        tags = [],
        difficulty = "Intermediate",
        premium = false,
        status = "published",
        display_order = 0,
        instructor = "RUHGEN Masterclass"
      } = req.body || {};

      if (!title) {
        return res.status(400).json({ ok: false, error: "Title is required." });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const tags_str = Array.isArray(tags) ? JSON.stringify(tags) : typeof tags === "string" ? tags : "[]";

      db.prepare(`
        INSERT INTO academy_courses (
          id, title, description, thumbnail_url, category, subcategory, tags, difficulty, premium, status, display_order, instructor, views, likes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
      `).run(
        id,
        title.trim(),
        description.trim(),
        thumbnail_url.trim(),
        category.trim(),
        subcategory.trim(),
        tags_str,
        difficulty.trim(),
        premium ? 1 : 0,
        status || "published",
        parseInt(display_order, 10) || 0,
        instructor.trim(),
        now,
        now
      );

      const created = db.prepare("SELECT * FROM academy_courses WHERE id = ?").get(id);
      return res.json({
        ok: true,
        course: {
          ...created,
          tags: safeJsonParse(created.tags, []),
          premium: Number(created.premium)
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  // Admin: Update course
  app.put("/api/admin/academy/courses/:id", requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const {
        title,
        description,
        thumbnail_url,
        category,
        subcategory,
        tags,
        difficulty,
        premium,
        status,
        display_order,
        instructor,
        views,
        likes
      } = req.body || {};

      const existing = db.prepare("SELECT * FROM academy_courses WHERE id = ?").get(id);
      if (!existing) {
        return res.status(404).json({ ok: false, error: "Course not found." });
      }

      const newThumbUrl = thumbnail_url !== undefined ? String(thumbnail_url).trim() : existing.thumbnail_url;
      const tags_str = Array.isArray(tags) ? JSON.stringify(tags) : tags !== undefined ? String(tags) : existing.tags;
      const updated_at = new Date().toISOString();

      db.prepare(`
        UPDATE academy_courses
        SET title = ?, description = ?, thumbnail_url = ?, category = ?, subcategory = ?, tags = ?, difficulty = ?, premium = ?, status = ?, display_order = ?, instructor = ?, views = ?, likes = ?, updated_at = ?
        WHERE id = ?
      `).run(
        title !== undefined ? title.trim() : existing.title,
        description !== undefined ? description.trim() : existing.description,
        newThumbUrl,
        category !== undefined ? category.trim() : existing.category,
        subcategory !== undefined ? subcategory.trim() : existing.subcategory,
        tags_str,
        difficulty !== undefined ? difficulty.trim() : existing.difficulty,
        premium !== undefined ? (premium ? 1 : 0) : existing.premium,
        status !== undefined ? status : existing.status,
        display_order !== undefined ? parseInt(display_order, 10) || 0 : existing.display_order,
        instructor !== undefined ? instructor.trim() : existing.instructor,
        views !== undefined ? parseInt(views, 10) || 0 : existing.views,
        likes !== undefined ? parseInt(likes, 10) || 0 : existing.likes,
        updated_at,
        id
      );

      if (existing.thumbnail_url && existing.thumbnail_url !== newThumbUrl && existing.thumbnail_url.startsWith("/media/")) {
        deleteMediaUrl(projectRoot, existing.thumbnail_url).catch(err => {
          console.error("[academy] Failed to delete old course thumbnail:", err.message);
        });
      }

      const updated = db.prepare("SELECT * FROM academy_courses WHERE id = ?").get(id);
      return res.json({
        ok: true,
        course: {
          ...updated,
          tags: safeJsonParse(updated.tags, []),
          premium: Number(updated.premium)
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  // Admin: Delete course
  app.delete("/api/admin/academy/courses/:id", requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const existing = db.prepare("SELECT thumbnail_url FROM academy_courses WHERE id = ?").get(id);
      if (!existing) {
        return res.status(404).json({ ok: false, error: "Course not found." });
      }

      db.prepare("DELETE FROM academy_courses WHERE id = ?").run(id);
      db.prepare("UPDATE academy_tutorials SET course_id = NULL WHERE course_id = ?").run(id);

      if (existing.thumbnail_url && existing.thumbnail_url.startsWith("/media/")) {
        deleteMediaUrl(projectRoot, existing.thumbnail_url).catch(err => {
          console.error("[academy] Failed to delete course thumbnail:", err.message);
        });
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Admin: Categories CRUD
  app.post("/api/admin/academy/categories", requireAdmin, (req, res) => {
    try {
      const { name, slug, description = "", display_order = 0 } = req.body || {};
      if (!name) return res.status(400).json({ ok: false, error: "Name is required." });

      const id = `cat-${crypto.randomUUID().slice(0, 8)}`;
      const safeSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const now = new Date().toISOString();

      db.prepare("INSERT INTO academy_categories (id, name, slug, description, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
        id, name.trim(), safeSlug, description.trim(), parseInt(display_order, 10) || 0, now
      );

      const created = db.prepare("SELECT * FROM academy_categories WHERE id = ?").get(id);
      return res.json({ ok: true, category: created });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Database error." });
    }
  });

  app.put("/api/admin/academy/categories/:id", requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const { name, slug, description, display_order } = req.body || {};
      const existing = db.prepare("SELECT * FROM academy_categories WHERE id = ?").get(id);
      if (!existing) return res.status(404).json({ ok: false, error: "Category not found." });

      const newName = name !== undefined ? name.trim() : existing.name;
      const newSlug = slug !== undefined ? slug.trim() : existing.slug;
      const newDesc = description !== undefined ? description.trim() : existing.description;
      const newOrder = display_order !== undefined ? parseInt(display_order, 10) || 0 : existing.display_order;

      db.prepare("UPDATE academy_categories SET name = ?, slug = ?, description = ?, display_order = ? WHERE id = ?").run(
        newName, newSlug, newDesc, newOrder, id
      );

      const updated = db.prepare("SELECT * FROM academy_categories WHERE id = ?").get(id);
      return res.json({ ok: true, category: updated });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  app.delete("/api/admin/academy/categories/:id", requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      db.prepare("DELETE FROM academy_categories WHERE id = ?").run(id);
      db.prepare("DELETE FROM academy_subcategories WHERE category_id = ?").run(id);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Admin: Subcategories CRUD
  app.post("/api/admin/academy/subcategories", requireAdmin, (req, res) => {
    try {
      const { category_id, name, slug, description = "", display_order = 0 } = req.body || {};
      if (!category_id || !name) return res.status(400).json({ ok: false, error: "Category and name are required." });

      const id = `sub-${crypto.randomUUID().slice(0, 8)}`;
      const safeSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const now = new Date().toISOString();

      db.prepare("INSERT INTO academy_subcategories (id, category_id, name, slug, description, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        id, category_id, name.trim(), safeSlug, description.trim(), parseInt(display_order, 10) || 0, now
      );

      const created = db.prepare("SELECT * FROM academy_subcategories WHERE id = ?").get(id);
      return res.json({ ok: true, subcategory: created });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Database error." });
    }
  });

  app.put("/api/admin/academy/subcategories/:id", requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const { name, slug, description, display_order } = req.body || {};
      const existing = db.prepare("SELECT * FROM academy_subcategories WHERE id = ?").get(id);
      if (!existing) return res.status(404).json({ ok: false, error: "Subcategory not found." });

      const newName = name !== undefined ? name.trim() : existing.name;
      const newSlug = slug !== undefined ? slug.trim() : existing.slug;
      const newDesc = description !== undefined ? description.trim() : existing.description;
      const newOrder = display_order !== undefined ? parseInt(display_order, 10) || 0 : existing.display_order;

      db.prepare("UPDATE academy_subcategories SET name = ?, slug = ?, description = ?, display_order = ? WHERE id = ?").run(
        newName, newSlug, newDesc, newOrder, id
      );

      const updated = db.prepare("SELECT * FROM academy_subcategories WHERE id = ?").get(id);
      return res.json({ ok: true, subcategory: updated });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  app.delete("/api/admin/academy/subcategories/:id", requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      db.prepare("DELETE FROM academy_subcategories WHERE id = ?").run(id);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Admin: Overall engagement & platform stats
  app.get("/api/admin/academy/stats", requireAdmin, (_req, res) => {
    try {
      const totalTutorials = db.prepare("SELECT COUNT(*) AS c FROM academy_tutorials").get().c;
      const publishedTutorials = db.prepare("SELECT COUNT(*) AS c FROM academy_tutorials WHERE status = 'published'").get().c;
      const draftTutorials = db.prepare("SELECT COUNT(*) AS c FROM academy_tutorials WHERE status = 'draft'").get().c;
      
      const totalCourses = db.prepare("SELECT COUNT(*) AS c FROM academy_courses").get().c;
      const totalCategories = db.prepare("SELECT COUNT(*) AS c FROM academy_categories").get().c;

      const viewsRow = db.prepare("SELECT SUM(views) AS total_views FROM academy_tutorials").get();
      const likesRow = db.prepare("SELECT SUM(likes) AS total_likes FROM academy_tutorials").get();
      const uniqueViewsRow = db.prepare("SELECT COUNT(*) AS c FROM academy_views").get();
      const uniqueLikesRow = db.prepare("SELECT COUNT(*) AS c FROM academy_likes").get();

      const topTutorials = db.prepare("SELECT id, title, category, views, likes FROM academy_tutorials ORDER BY views DESC LIMIT 5").all();

      return res.json({
        ok: true,
        stats: {
          totalTutorials,
          publishedTutorials,
          draftTutorials,
          totalCourses,
          totalCategories,
          totalViews: viewsRow?.total_views || 0,
          totalLikes: likesRow?.total_likes || 0,
          uniqueViewsRecorded: uniqueViewsRow?.c || 0,
          uniqueLikesRecorded: uniqueLikesRow?.c || 0,
          topTutorials
        }
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });
}

module.exports = { mountAcademyRoutes };
