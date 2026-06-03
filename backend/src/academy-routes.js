const crypto = require("node:crypto");
const { verifyAdminToken } = require("./auth");

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

const { deleteMediaUrl } = require("./media-cleanup");

/**
 * Academy backend routes: fetch lessons, update views/likes, and secure admin management.
 * @param {import("express").Express} app
 * @param {{ db: import("better-sqlite3").Database, projectRoot: string }} ctx
 */
function mountAcademyRoutes(app, { db, projectRoot }) {
  // Public: Get all tutorials
  app.get("/api/academy/tutorials", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM academy_tutorials ORDER BY created_at DESC").all();
      const userCountRow = db.prepare("SELECT COUNT(*) as count FROM users").get();
      const totalUsers = userCountRow ? userCountRow.count : 0;
      return res.json({ ok: true, tutorials: rows, totalUsers });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  // Public: Increment view count
  app.post("/api/academy/tutorials/:id/view", (req, res) => {
    try {
      const id = req.params.id;
      const result = db.prepare("UPDATE academy_tutorials SET views = views + 1 WHERE id = ?").run(id);
      if (result.changes === 0) {
        return res.status(404).json({ ok: false, error: "Tutorial not found." });
      }
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Increment like count
  app.post("/api/academy/tutorials/:id/like", (req, res) => {
    try {
      const id = req.params.id;
      const result = db.prepare("UPDATE academy_tutorials SET likes = likes + 1 WHERE id = ?").run(id);
      if (result.changes === 0) {
        return res.status(404).json({ ok: false, error: "Tutorial not found." });
      }
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Public: Decrement like count
  app.post("/api/academy/tutorials/:id/unlike", (req, res) => {
    try {
      const id = req.params.id;
      // Ensure likes do not go below 0
      const result = db.prepare("UPDATE academy_tutorials SET likes = MAX(0, likes - 1) WHERE id = ?").run(id);
      if (result.changes === 0) {
        return res.status(404).json({ ok: false, error: "Tutorial not found." });
      }
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Admin: Create tutorial
  app.post("/api/admin/academy/tutorials", requireAdmin, (req, res) => {
    try {
      const { title, description, video_url, thumbnail_url, category, duration, difficulty, premium, instructor } = req.body || {};
      
      if (!title || !description || !category || !duration || !difficulty) {
        return res.status(400).json({ ok: false, error: "Missing required fields." });
      }

      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();

      db.prepare(`
        INSERT INTO academy_tutorials (
          id, title, description, video_url, thumbnail_url, category, duration, difficulty, premium, instructor, created_at, views, likes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      `).run(
        id,
        title.trim(),
        description.trim(),
        (video_url || "").trim(),
        (thumbnail_url || "").trim(),
        category.trim(),
        duration.trim(),
        difficulty.trim(),
        premium ? 1 : 0,
        (instructor || "RUHGEN Masterclass").trim(),
        created_at
      );

      const newTutorial = db.prepare("SELECT * FROM academy_tutorials WHERE id = ?").get(id);
      return res.json({ ok: true, tutorial: newTutorial });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  // Admin: Update tutorial
  app.put("/api/admin/academy/tutorials/:id", requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const { title, description, video_url, thumbnail_url, category, duration, difficulty, premium, instructor, views, likes } = req.body || {};

      if (!title || !description || !category || !duration || !difficulty) {
        return res.status(400).json({ ok: false, error: "Missing required fields." });
      }

      const existing = db.prepare("SELECT views, likes, video_url, thumbnail_url FROM academy_tutorials WHERE id = ?").get(id);
      if (!existing) {
        return res.status(404).json({ ok: false, error: "Tutorial not found." });
      }

      const result = db.prepare(`
        UPDATE academy_tutorials
        SET title = ?, description = ?, video_url = ?, thumbnail_url = ?, category = ?, duration = ?, difficulty = ?, premium = ?, instructor = ?, views = ?, likes = ?
        WHERE id = ?
      `).run(
        title.trim(),
        description.trim(),
        (video_url || "").trim(),
        (thumbnail_url || "").trim(),
        category.trim(),
        duration.trim(),
        difficulty.trim(),
        premium ? 1 : 0,
        (instructor || "RUHGEN Masterclass").trim(),
        views !== undefined ? parseInt(views, 10) || 0 : existing.views,
        likes !== undefined ? parseInt(likes, 10) || 0 : existing.likes,
        id
      );

      if (result.changes === 0) {
        return res.status(404).json({ ok: false, error: "Tutorial not found." });
      }

      // Delete old media files if they were replaced
      if (existing.video_url && existing.video_url !== (video_url || "").trim()) {
        deleteMediaUrl(projectRoot, existing.video_url).catch(err => {
          console.error("[academy] Failed to delete old video:", err.message);
        });
      }
      if (existing.thumbnail_url && existing.thumbnail_url !== (thumbnail_url || "").trim()) {
        deleteMediaUrl(projectRoot, existing.thumbnail_url).catch(err => {
          console.error("[academy] Failed to delete old thumbnail:", err.message);
        });
      }

      const updated = db.prepare("SELECT * FROM academy_tutorials WHERE id = ?").get(id);
      return res.json({ ok: true, tutorial: updated });
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

      const result = db.prepare("DELETE FROM academy_tutorials WHERE id = ?").run(id);
      
      if (result.changes === 0) {
        return res.status(404).json({ ok: false, error: "Tutorial not found." });
      }

      // Delete associated media files on successful deletion
      if (existing.video_url) {
        deleteMediaUrl(projectRoot, existing.video_url).catch(err => {
          console.error("[academy] Failed to delete video on tutorial removal:", err.message);
        });
      }
      if (existing.thumbnail_url) {
        deleteMediaUrl(projectRoot, existing.thumbnail_url).catch(err => {
          console.error("[academy] Failed to delete thumbnail on tutorial removal:", err.message);
        });
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });
}

module.exports = { mountAcademyRoutes };
