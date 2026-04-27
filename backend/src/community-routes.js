/**
 * Community: real user-shared posts (images/videos), likes, saves, comments,
 * tag/creator/stat aggregation. All write endpoints require the member JWT
 * issued by /api/auth/login. Public reads expose viewer-specific flags
 * (`liked`, `saved`) when a valid bearer is present.
 */

const crypto = require("node:crypto");
const { verifyUserToken } = require("./auth");

const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 24;
const MAX_PROMPT = 1200;
const MAX_TITLE = 140;
const MAX_COMMENT = 800;
const FEED_PAGE_SIZE = 24;
const MAX_FEED_PAGE_SIZE = 60;

function getBearer(req) {
  const auth = String(req.headers.authorization || "").trim();
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

function readUserFromRequest(req) {
  const bearer = getBearer(req);
  if (!bearer) return null;
  try {
    const payload = verifyUserToken(bearer);
    if (payload.typ !== "user" || typeof payload.sub !== "string") return null;
    return { id: payload.sub, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

function requireUser(req, res, next) {
  const user = readUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: "Sign in to continue." });
  }
  req.user = user;
  next();
}

function isHttpsUrl(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  return /^https:\/\//i.test(v) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(v);
}

function isAcceptableMediaUrl(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  if (v.length > 2048) return false;
  if (v.startsWith("/media/")) return true;
  return isHttpsUrl(v);
}

function normalizeTags(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, MAX_TAG_LENGTH);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

function parseTags(value) {
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) ? v.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function postRowToPublic(row, viewerFlags) {
  const tags = parseTags(row.tags_json);
  return {
    id: row.id,
    kind: row.kind,
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url || "",
    title: row.title || "",
    prompt: row.prompt || "",
    tags,
    width: row.width || 0,
    height: row.height || 0,
    likes: row.likes,
    saves: row.saves,
    comments: row.comments_count,
    views: row.views,
    featured: !!row.featured,
    createdAt: row.created_at,
    author: {
      id: row.user_id,
      name: row.author_name || "",
    },
    viewer: viewerFlags
      ? { liked: !!viewerFlags.liked, saved: !!viewerFlags.saved, isAuthor: viewerFlags.isAuthor }
      : { liked: false, saved: false, isAuthor: false },
  };
}

function annotateViewerFlags(db, posts, userId) {
  if (!userId || posts.length === 0) {
    return new Map();
  }
  const ids = posts.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(",");
  const liked = db
    .prepare(
      `SELECT post_id FROM community_likes WHERE user_id = ? AND post_id IN (${placeholders})`
    )
    .all(userId, ...ids);
  const saved = db
    .prepare(
      `SELECT post_id FROM community_saves WHERE user_id = ? AND post_id IN (${placeholders})`
    )
    .all(userId, ...ids);
  const map = new Map();
  for (const id of ids) map.set(id, { liked: false, saved: false });
  for (const r of liked) map.get(r.post_id).liked = true;
  for (const r of saved) map.get(r.post_id).saved = true;
  return map;
}

function viewerKey(req, user) {
  if (user && user.id) return `u:${user.id}`;
  const xff = String(req.headers["x-forwarded-for"] || "").split(",")[0]?.trim();
  const ip = xff || req.ip || req.socket?.remoteAddress || "0.0.0.0";
  return `ip:${ip}`;
}

/**
 * @param {import("express").Express} app
 * @param {{ db: import("better-sqlite3").Database }} ctx
 */
function mountCommunityRoutes(app, { db }) {
  const stmtInsertPost = db.prepare(
    `INSERT INTO community_posts
       (id, user_id, kind, media_url, thumbnail_url, title, prompt, tags_json,
        width, height, likes, saves, comments_count, views, featured, removed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?)`
  );

  const stmtSelectPost = db.prepare(
    `SELECT p.*, u.name AS author_name
       FROM community_posts p
       JOIN users u ON u.id = p.user_id
      WHERE p.id = ? AND p.removed = 0`
  );

  app.get("/api/community/feed", (req, res) => {
    try {
      const viewer = readUserFromRequest(req);
      const kindRaw = String(req.query.type || "all").toLowerCase();
      const kind = ["image", "video"].includes(kindRaw) ? kindRaw : null;
      const sortRaw = String(req.query.sort || "trending").toLowerCase();
      const sort = ["trending", "recent", "top"].includes(sortRaw) ? sortRaw : "trending";
      const tag = String(req.query.tag || "").trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
      const q = String(req.query.q || "").trim().slice(0, 120);
      const limit = Math.max(
        1,
        Math.min(MAX_FEED_PAGE_SIZE, Number(req.query.limit) || FEED_PAGE_SIZE)
      );
      const offset = Math.max(0, Number(req.query.offset) || 0);

      const where = ["p.removed = 0"];
      const params = [];
      if (kind) {
        where.push("p.kind = ?");
        params.push(kind);
      }
      if (tag) {
        where.push("LOWER(p.tags_json) LIKE ?");
        params.push(`%"${tag}"%`);
      }
      if (q) {
        where.push("(LOWER(p.title) LIKE ? OR LOWER(p.prompt) LIKE ? OR LOWER(u.name) LIKE ?)");
        const like = `%${q.toLowerCase()}%`;
        params.push(like, like, like);
      }

      let orderBy = "p.created_at DESC";
      if (sort === "trending") {
        orderBy =
          "(p.likes * 4 + p.saves * 5 + p.comments_count * 3 + p.views) " +
          "/ (1.0 + (julianday('now') - julianday(p.created_at)) * 24) DESC, " +
          "p.created_at DESC";
      } else if (sort === "top") {
        orderBy = "(p.likes + p.saves * 2) DESC, p.created_at DESC";
      }

      const rows = db
        .prepare(
          `SELECT p.*, u.name AS author_name
             FROM community_posts p
             JOIN users u ON u.id = p.user_id
            WHERE ${where.join(" AND ")}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?`
        )
        .all(...params, limit, offset);

      const totalRow = db
        .prepare(
          `SELECT COUNT(*) AS c
             FROM community_posts p
             JOIN users u ON u.id = p.user_id
            WHERE ${where.join(" AND ")}`
        )
        .get(...params);

      const flagMap = annotateViewerFlags(db, rows, viewer?.id);
      const posts = rows.map((row) =>
        postRowToPublic(row, {
          ...(flagMap.get(row.id) || { liked: false, saved: false }),
          isAuthor: viewer?.id === row.user_id,
        })
      );

      return res.json({
        ok: true,
        posts,
        total: totalRow?.c ?? posts.length,
        limit,
        offset,
        viewerSignedIn: !!viewer,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/community/stats", (_req, res) => {
    try {
      const totalPosts = db
        .prepare("SELECT COUNT(*) AS c FROM community_posts WHERE removed = 0")
        .get().c;
      const totalCreators = db
        .prepare(
          "SELECT COUNT(DISTINCT user_id) AS c FROM community_posts WHERE removed = 0"
        )
        .get().c;
      const totalLikes = db.prepare("SELECT COUNT(*) AS c FROM community_likes").get().c;
      const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const weeklyPosts = db
        .prepare(
          "SELECT COUNT(*) AS c FROM community_posts WHERE removed = 0 AND created_at >= ?"
        )
        .get(last7).c;
      const weeklyLikes = db
        .prepare("SELECT COUNT(*) AS c FROM community_likes WHERE created_at >= ?")
        .get(last7).c;

      const tagRows = db
        .prepare(
          "SELECT tags_json FROM community_posts WHERE removed = 0 AND tags_json != '[]'"
        )
        .all();
      const tagSet = new Set();
      for (const r of tagRows) {
        for (const t of parseTags(r.tags_json)) tagSet.add(t);
      }

      return res.json({
        ok: true,
        stats: {
          totalPosts,
          totalCreators,
          totalLikes,
          weeklyPosts,
          weeklyLikes,
          totalTags: tagSet.size,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/community/tags", (req, res) => {
    try {
      const limit = Math.max(1, Math.min(40, Number(req.query.limit) || 18));
      const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const rows = db
        .prepare(
          `SELECT tags_json, created_at, likes, comments_count
             FROM community_posts
            WHERE removed = 0 AND tags_json != '[]'`
        )
        .all();
      const counts = new Map();
      const recent = new Map();
      for (const r of rows) {
        const isRecent = r.created_at >= last30;
        for (const t of parseTags(r.tags_json)) {
          counts.set(t, (counts.get(t) || 0) + 1);
          if (isRecent) recent.set(t, (recent.get(t) || 0) + 1);
        }
      }
      const sorted = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label, count]) => ({
          label,
          count,
          hot: (recent.get(label) || 0) >= Math.max(2, Math.floor(count / 2)),
        }));
      return res.json({ ok: true, tags: sorted });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/community/creators", (req, res) => {
    try {
      const limit = Math.max(1, Math.min(40, Number(req.query.limit) || 8));
      const rows = db
        .prepare(
          `SELECT u.id, u.name,
                  COUNT(p.id)            AS works,
                  COALESCE(SUM(p.likes),0)         AS likes,
                  COALESCE(SUM(p.views),0)         AS views,
                  COALESCE(SUM(p.comments_count),0) AS comments,
                  MAX(p.created_at)      AS last_at
             FROM community_posts p
             JOIN users u ON u.id = p.user_id
            WHERE p.removed = 0
            GROUP BY u.id, u.name
            ORDER BY likes DESC, works DESC, last_at DESC
            LIMIT ?`
        )
        .all(limit);
      const creators = rows.map((r) => ({
        id: r.id,
        name: r.name,
        works: r.works,
        likes: r.likes,
        views: r.views,
        comments: r.comments,
        lastPostAt: r.last_at,
      }));
      return res.json({ ok: true, creators });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/community/posts/:id", (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      const row = stmtSelectPost.get(id);
      if (!row) {
        return res.status(404).json({ ok: false, error: "Post not found." });
      }
      const viewer = readUserFromRequest(req);
      const flagMap = annotateViewerFlags(db, [row], viewer?.id);
      const post = postRowToPublic(row, {
        ...(flagMap.get(row.id) || { liked: false, saved: false }),
        isAuthor: viewer?.id === row.user_id,
      });
      return res.json({ ok: true, post });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post("/api/community/posts", requireUser, (req, res) => {
    try {
      const kindRaw = String(req.body?.kind || "").toLowerCase();
      if (!["image", "video"].includes(kindRaw)) {
        return res.status(400).json({ ok: false, error: "Pick image or video." });
      }
      const mediaUrl = typeof req.body?.mediaUrl === "string" ? req.body.mediaUrl.trim() : "";
      if (!isAcceptableMediaUrl(mediaUrl)) {
        return res
          .status(400)
          .json({ ok: false, error: "Media URL must be HTTPS or a /media/... path." });
      }
      const thumbInput =
        typeof req.body?.thumbnailUrl === "string" ? req.body.thumbnailUrl.trim() : "";
      const thumbnailUrl = thumbInput && isAcceptableMediaUrl(thumbInput) ? thumbInput : "";

      const title =
        typeof req.body?.title === "string" ? req.body.title.trim().slice(0, MAX_TITLE) : "";
      const prompt =
        typeof req.body?.prompt === "string" ? req.body.prompt.trim().slice(0, MAX_PROMPT) : "";
      if (prompt.length < 2) {
        return res
          .status(400)
          .json({ ok: false, error: "Add a short prompt or description (at least 2 characters)." });
      }
      const tags = normalizeTags(req.body?.tags);
      const width = Math.max(0, Math.min(8192, Number(req.body?.width) || 0));
      const height = Math.max(0, Math.min(8192, Number(req.body?.height) || 0));

      const recent = db
        .prepare(
          `SELECT COUNT(*) AS c FROM community_posts
            WHERE user_id = ? AND created_at >= ?`
        )
        .get(req.user.id, new Date(Date.now() - 60 * 1000).toISOString()).c;
      if (recent >= 5) {
        return res
          .status(429)
          .json({ ok: false, error: "Slow down — wait a moment before sharing again." });
      }

      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();
      stmtInsertPost.run(
        id,
        req.user.id,
        kindRaw,
        mediaUrl,
        thumbnailUrl,
        title,
        prompt,
        JSON.stringify(tags),
        width,
        height,
        created_at
      );

      const row = stmtSelectPost.get(id);
      const post = postRowToPublic(row, { liked: false, saved: false, isAuthor: true });
      return res.json({ ok: true, post });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.delete("/api/community/posts/:id", requireUser, (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      const row = db.prepare("SELECT user_id FROM community_posts WHERE id = ? AND removed = 0").get(id);
      if (!row) {
        return res.status(404).json({ ok: false, error: "Post not found." });
      }
      if (row.user_id !== req.user.id) {
        return res.status(403).json({ ok: false, error: "Only the author can remove this post." });
      }
      db.prepare("UPDATE community_posts SET removed = 1 WHERE id = ?").run(id);
      return res.json({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post("/api/community/posts/:id/like", requireUser, (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      const row = stmtSelectPost.get(id);
      if (!row) {
        return res.status(404).json({ ok: false, error: "Post not found." });
      }
      const existing = db
        .prepare("SELECT post_id FROM community_likes WHERE post_id = ? AND user_id = ?")
        .get(id, req.user.id);
      const tx = db.transaction((shouldLike) => {
        if (shouldLike) {
          db.prepare(
            "INSERT OR IGNORE INTO community_likes (post_id, user_id, created_at) VALUES (?, ?, ?)"
          ).run(id, req.user.id, new Date().toISOString());
          db.prepare("UPDATE community_posts SET likes = likes + 1 WHERE id = ?").run(id);
        } else {
          db.prepare("DELETE FROM community_likes WHERE post_id = ? AND user_id = ?").run(
            id,
            req.user.id
          );
          db.prepare(
            "UPDATE community_posts SET likes = MAX(0, likes - 1) WHERE id = ?"
          ).run(id);
        }
      });
      const liked = !existing;
      tx(liked);
      const updated = stmtSelectPost.get(id);
      return res.json({ ok: true, liked, likes: updated.likes });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post("/api/community/posts/:id/save", requireUser, (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      const row = stmtSelectPost.get(id);
      if (!row) {
        return res.status(404).json({ ok: false, error: "Post not found." });
      }
      const existing = db
        .prepare("SELECT post_id FROM community_saves WHERE post_id = ? AND user_id = ?")
        .get(id, req.user.id);
      const tx = db.transaction((shouldSave) => {
        if (shouldSave) {
          db.prepare(
            "INSERT OR IGNORE INTO community_saves (post_id, user_id, created_at) VALUES (?, ?, ?)"
          ).run(id, req.user.id, new Date().toISOString());
          db.prepare("UPDATE community_posts SET saves = saves + 1 WHERE id = ?").run(id);
        } else {
          db.prepare("DELETE FROM community_saves WHERE post_id = ? AND user_id = ?").run(
            id,
            req.user.id
          );
          db.prepare(
            "UPDATE community_posts SET saves = MAX(0, saves - 1) WHERE id = ?"
          ).run(id);
        }
      });
      const saved = !existing;
      tx(saved);
      const updated = stmtSelectPost.get(id);
      return res.json({ ok: true, saved, saves: updated.saves });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post("/api/community/posts/:id/view", (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      const row = stmtSelectPost.get(id);
      if (!row) {
        return res.status(404).json({ ok: false, error: "Post not found." });
      }
      const viewer = readUserFromRequest(req);
      const key = viewerKey(req, viewer);
      const inserted = db
        .prepare(
          "INSERT OR IGNORE INTO community_views (post_id, viewer_key, created_at) VALUES (?, ?, ?)"
        )
        .run(id, key, new Date().toISOString());
      if (inserted.changes > 0) {
        db.prepare("UPDATE community_posts SET views = views + 1 WHERE id = ?").run(id);
      }
      const updated = stmtSelectPost.get(id);
      return res.json({ ok: true, views: updated.views });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/community/posts/:id/comments", (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      const post = stmtSelectPost.get(id);
      if (!post) {
        return res.status(404).json({ ok: false, error: "Post not found." });
      }
      const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
      const rows = db
        .prepare(
          `SELECT c.id, c.body, c.created_at AS createdAt,
                  u.id AS authorId, u.name AS authorName
             FROM community_comments c
             JOIN users u ON u.id = c.user_id
            WHERE c.post_id = ?
            ORDER BY c.created_at DESC
            LIMIT ?`
        )
        .all(id, limit);
      return res.json({ ok: true, comments: rows });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post("/api/community/posts/:id/comments", requireUser, (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      const post = stmtSelectPost.get(id);
      if (!post) {
        return res.status(404).json({ ok: false, error: "Post not found." });
      }
      const body =
        typeof req.body?.body === "string" ? req.body.body.trim().slice(0, MAX_COMMENT) : "";
      if (body.length < 1) {
        return res.status(400).json({ ok: false, error: "Comment can't be empty." });
      }
      const commentId = crypto.randomUUID();
      const created_at = new Date().toISOString();
      const tx = db.transaction(() => {
        db.prepare(
          "INSERT INTO community_comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)"
        ).run(commentId, id, req.user.id, body, created_at);
        db.prepare(
          "UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?"
        ).run(id);
      });
      tx();
      return res.json({
        ok: true,
        comment: {
          id: commentId,
          body,
          createdAt: created_at,
          authorId: req.user.id,
          authorName: req.user.name || "",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.delete("/api/community/comments/:id", requireUser, (req, res) => {
    try {
      const commentId = String(req.params.id || "").trim();
      const row = db
        .prepare("SELECT id, user_id, post_id FROM community_comments WHERE id = ?")
        .get(commentId);
      if (!row) {
        return res.status(404).json({ ok: false, error: "Comment not found." });
      }
      if (row.user_id !== req.user.id) {
        return res.status(403).json({ ok: false, error: "Only the author can delete." });
      }
      const tx = db.transaction(() => {
        db.prepare("DELETE FROM community_comments WHERE id = ?").run(commentId);
        db.prepare(
          "UPDATE community_posts SET comments_count = MAX(0, comments_count - 1) WHERE id = ?"
        ).run(row.post_id);
      });
      tx();
      return res.json({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/community/me/posts", requireUser, (req, res) => {
    try {
      const rows = db
        .prepare(
          `SELECT p.*, u.name AS author_name
             FROM community_posts p
             JOIN users u ON u.id = p.user_id
            WHERE p.user_id = ? AND p.removed = 0
            ORDER BY p.created_at DESC`
        )
        .all(req.user.id);
      const flagMap = annotateViewerFlags(db, rows, req.user.id);
      const posts = rows.map((row) =>
        postRowToPublic(row, {
          ...(flagMap.get(row.id) || { liked: false, saved: false }),
          isAuthor: true,
        })
      );
      return res.json({ ok: true, posts });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/community/me/saved", requireUser, (req, res) => {
    try {
      const rows = db
        .prepare(
          `SELECT p.*, u.name AS author_name
             FROM community_saves s
             JOIN community_posts p ON p.id = s.post_id
             JOIN users u ON u.id = p.user_id
            WHERE s.user_id = ? AND p.removed = 0
            ORDER BY s.created_at DESC`
        )
        .all(req.user.id);
      const flagMap = annotateViewerFlags(db, rows, req.user.id);
      const posts = rows.map((row) =>
        postRowToPublic(row, {
          ...(flagMap.get(row.id) || { liked: false, saved: true }),
          isAuthor: row.user_id === req.user.id,
        })
      );
      return res.json({ ok: true, posts });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });
}

module.exports = { mountCommunityRoutes };
