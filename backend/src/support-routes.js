/**
 * support-routes.js
 * User support ticket system with admin reply capability.
 */
const crypto = require("node:crypto");
const path = require("node:path");

const TICKET_CATEGORIES = [
  "billing",
  "credits",
  "technical",
  "generation",
  "account",
  "other",
];

const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];

function sanitize(str, maxLen = 4000) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

function requireUserAuth(db) {
  return function (req, res, next) {
    const auth = String(req.headers.authorization || "").trim();
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    if (!token) return res.status(401).json({ ok: false, error: "Unauthorized." });
    const { verifyUserToken } = require("./auth");
    let payload;
    try {
      payload = verifyUserToken(token);
    } catch {
      return res.status(401).json({ ok: false, error: "Unauthorized." });
    }
    if (!payload?.sub) return res.status(401).json({ ok: false, error: "Unauthorized." });
    const user = db.prepare("SELECT id, email, name, suspended FROM users WHERE id = ?").get(payload.sub);
    if (!user) return res.status(401).json({ ok: false, error: "User not found." });
    if (user.suspended) return res.status(403).json({ ok: false, error: "Account suspended." });
    req.userId = user.id;
    req.userEmail = user.email;
    req.userName = user.name;
    next();
  };
}

function requireAdminAuth(verifyAdminToken) {
  return function (req, res, next) {
    const auth = String(req.headers.authorization || "").trim();
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    if (!token) return res.status(401).json({ ok: false, error: "Unauthorized." });
    try {
      const payload = verifyAdminToken(token);
      if (payload.typ !== "admin") throw new Error("invalid");
      req.admin = payload;
      next();
    } catch {
      return res.status(401).json({ ok: false, error: "Unauthorized." });
    }
  };
}

function mountSupportRoutes(app, { db, verifyAdminToken, upload }) {
  const authUser = requireUserAuth(db);
  const authAdmin = requireAdminAuth(verifyAdminToken);

  // ─── USER: Create Ticket ─────────────────────────────────────────────────
  app.post("/api/support/tickets", authUser, upload.single("attachment"), (req, res) => {
    try {
      const category = sanitize(req.body?.category || "", 50);
      const subject = sanitize(req.body?.subject || "", 200);
      const message = sanitize(req.body?.message || "", 8000);

      if (!category || !TICKET_CATEGORIES.includes(category)) {
        return res.status(400).json({ ok: false, error: "Invalid category." });
      }
      if (!subject || subject.length < 5) {
        return res.status(400).json({ ok: false, error: "Subject must be at least 5 characters." });
      }
      if (!message || message.length < 20) {
        return res.status(400).json({ ok: false, error: "Message must be at least 20 characters." });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // Rate limit: max 5 open tickets per user
      const openCount = db
        .prepare("SELECT COUNT(*) AS c FROM support_tickets WHERE user_id = ? AND status IN ('open', 'in_progress')")
        .get(req.userId).c;
      if (openCount >= 5) {
        return res.status(429).json({ ok: false, error: "You have too many open tickets. Please wait for existing ones to be resolved." });
      }

      db.prepare(
        `INSERT INTO support_tickets (id, user_id, category, subject, message, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`
      ).run(id, req.userId, category, subject, message, now, now);

      // Handle optional file attachment
      if (req.file) {
        const ext = path.extname(req.file.originalname || "").toLowerCase();
        const allowedExts = [".png", ".jpg", ".jpeg", ".webp", ".pdf", ".txt"];
        if (allowedExts.includes(ext) && req.file.size <= 5 * 1024 * 1024) {
          const filename = `${crypto.randomUUID()}${ext}`;
          db.prepare(
            `INSERT INTO support_attachments (id, ticket_id, filename, size, mimetype, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(crypto.randomUUID(), id, filename, req.file.size, req.file.mimetype || "", now);
        }
      }

      return res.json({ ok: true, ticketId: id });
    } catch (e) {
      console.error("[support] create ticket error:", e.message);
      return res.status(500).json({ ok: false, error: "Failed to create ticket." });
    }
  });

  // ─── USER: List My Tickets ───────────────────────────────────────────────
  app.get("/api/support/tickets", authUser, (req, res) => {
    try {
      const tickets = db
        .prepare(
          `SELECT t.id, t.category, t.subject, t.status, t.created_at, t.updated_at,
                  (SELECT COUNT(*) FROM support_replies r WHERE r.ticket_id = t.id) AS reply_count,
                  (SELECT COUNT(*) FROM support_replies r WHERE r.ticket_id = t.id AND r.is_admin = 1 AND r.read_by_user = 0) AS unread_count
           FROM support_tickets t
           WHERE t.user_id = ?
           ORDER BY t.updated_at DESC
           LIMIT 50`
        )
        .all(req.userId);
      return res.json({ ok: true, tickets });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to load tickets." });
    }
  });

  // ─── USER: Get Ticket Detail with Replies ───────────────────────────────
  app.get("/api/support/tickets/:id", authUser, (req, res) => {
    try {
      const ticket = db
        .prepare("SELECT * FROM support_tickets WHERE id = ? AND user_id = ?")
        .get(req.params.id, req.userId);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found." });

      const replies = db
        .prepare(
          `SELECT id, message, is_admin, author_name, created_at
           FROM support_replies WHERE ticket_id = ? ORDER BY created_at ASC`
        )
        .all(ticket.id);

      // Mark admin replies as read
      db.prepare(
        "UPDATE support_replies SET read_by_user = 1 WHERE ticket_id = ? AND is_admin = 1"
      ).run(ticket.id);

      return res.json({ ok: true, ticket, replies });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to load ticket." });
    }
  });

  // ─── USER: Reply to Own Ticket ───────────────────────────────────────────
  app.post("/api/support/tickets/:id/reply", authUser, (req, res) => {
    try {
      const ticket = db
        .prepare("SELECT id, status FROM support_tickets WHERE id = ? AND user_id = ?")
        .get(req.params.id, req.userId);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found." });
      if (ticket.status === "closed") return res.status(400).json({ ok: false, error: "This ticket is closed." });

      const message = sanitize(req.body?.message || "");
      if (!message || message.length < 5) {
        return res.status(400).json({ ok: false, error: "Reply must be at least 5 characters." });
      }

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO support_replies (id, ticket_id, message, is_admin, author_name, read_by_user, created_at)
         VALUES (?, ?, ?, 0, ?, 1, ?)`
      ).run(crypto.randomUUID(), ticket.id, message, req.userName, now);

      db.prepare("UPDATE support_tickets SET updated_at = ?, status = 'open' WHERE id = ?").run(now, ticket.id);

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to send reply." });
    }
  });

  // ─── ADMIN: List All Tickets ─────────────────────────────────────────────
  app.get("/api/admin/support/tickets", authAdmin, (req, res) => {
    try {
      const statusFilter = req.query.status || "";
      const search = req.query.search || "";
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 30);
      const offset = (page - 1) * limit;

      let where = "1=1";
      const params = [];
      if (statusFilter) { where += " AND t.status = ?"; params.push(statusFilter); }
      if (search) {
        where += " AND (u.email LIKE ? OR t.subject LIKE ?)";
        const s = `%${search}%`;
        params.push(s, s);
      }

      const tickets = db
        .prepare(
          `SELECT t.id, t.category, t.subject, t.status, t.created_at, t.updated_at,
                  u.email AS user_email, u.name AS user_name,
                  (SELECT COUNT(*) FROM support_replies r WHERE r.ticket_id = t.id) AS reply_count,
                  (SELECT COUNT(*) FROM support_replies r WHERE r.ticket_id = t.id AND r.is_admin = 0 AND r.read_by_admin = 0) AS unread_count
           FROM support_tickets t
           JOIN users u ON u.id = t.user_id
           WHERE ${where}
           ORDER BY t.updated_at DESC
           LIMIT ? OFFSET ?`
        )
        .all(...params, limit, offset);

      const total = db
        .prepare(
          `SELECT COUNT(*) AS c FROM support_tickets t JOIN users u ON u.id = t.user_id WHERE ${where}`
        )
        .get(...params).c;

      const summary = db
        .prepare(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count,
             SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
             SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count
           FROM support_tickets`
        )
        .get();

      return res.json({ ok: true, tickets, total, page, limit, summary });
    } catch (e) {
      console.error("[admin/support] list error:", e.message);
      return res.status(500).json({ ok: false, error: "Failed to load tickets." });
    }
  });

  // ─── ADMIN: Get Ticket Detail ────────────────────────────────────────────
  app.get("/api/admin/support/tickets/:id", authAdmin, (req, res) => {
    try {
      const ticket = db
        .prepare(
          `SELECT t.*, u.email AS user_email, u.name AS user_name, u.credits AS user_credits
           FROM support_tickets t JOIN users u ON u.id = t.user_id WHERE t.id = ?`
        )
        .get(req.params.id);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found." });

      const replies = db
        .prepare(
          "SELECT id, message, is_admin, author_name, created_at FROM support_replies WHERE ticket_id = ? ORDER BY created_at ASC"
        )
        .all(ticket.id);

      // Mark user replies as read by admin
      db.prepare(
        "UPDATE support_replies SET read_by_admin = 1 WHERE ticket_id = ? AND is_admin = 0"
      ).run(ticket.id);

      return res.json({ ok: true, ticket, replies });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to load ticket." });
    }
  });

  // ─── ADMIN: Reply to Ticket ──────────────────────────────────────────────
  app.post("/api/admin/support/tickets/:id/reply", authAdmin, (req, res) => {
    try {
      const ticket = db.prepare("SELECT id, status FROM support_tickets WHERE id = ?").get(req.params.id);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found." });

      const message = sanitize(req.body?.message || "");
      if (!message || message.length < 2) {
        return res.status(400).json({ ok: false, error: "Reply message is required." });
      }

      const adminName = req.admin?.name || "Support Team";
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO support_replies (id, ticket_id, message, is_admin, author_name, read_by_user, created_at)
         VALUES (?, ?, ?, 1, ?, 0, ?)`
      ).run(crypto.randomUUID(), ticket.id, message, adminName, now);

      // Update ticket status to in_progress when admin first replies
      const newStatus = ticket.status === "open" ? "in_progress" : ticket.status;
      db.prepare("UPDATE support_tickets SET updated_at = ?, status = ? WHERE id = ?").run(now, newStatus, ticket.id);

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to send reply." });
    }
  });

  // ─── ADMIN: Update Ticket Status ─────────────────────────────────────────
  app.patch("/api/admin/support/tickets/:id/status", authAdmin, (req, res) => {
    try {
      const ticket = db.prepare("SELECT id FROM support_tickets WHERE id = ?").get(req.params.id);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found." });

      const status = typeof req.body?.status === "string" ? req.body.status.trim() : "";
      if (!TICKET_STATUSES.includes(status)) {
        return res.status(400).json({ ok: false, error: "Invalid status." });
      }

      db.prepare("UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?").run(
        status, new Date().toISOString(), ticket.id
      );

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to update ticket." });
    }
  });
}

module.exports = { mountSupportRoutes };
