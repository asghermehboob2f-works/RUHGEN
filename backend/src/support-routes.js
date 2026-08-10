/**
 * support-routes.js
 * User & Admin support ticket management backend.
 * Provides ticket creation, reply threads, attachment handling, ticket prioritization,
 * internal staff notes, and analytical metrics.
 */
const crypto = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs");

const TICKET_CATEGORIES = [
  "billing",
  "credits",
  "technical",
  "generation",
  "account",
  "other",
];

const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];
const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"];

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

function mountSupportRoutes(app, { db, verifyAdminToken, upload, dataDir }) {
  const authUser = requireUserAuth(db);
  const authAdmin = requireAdminAuth(verifyAdminToken);

  const attachmentsDir = path.join(dataDir || path.resolve(__dirname, "../data"), "support_attachments");
  if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
  }

  // ─── USER: Create Ticket ─────────────────────────────────────────────────
  app.post("/api/support/tickets", authUser, upload.single("attachment"), (req, res) => {
    try {
      const category = sanitize(req.body?.category || "", 50);
      const subject = sanitize(req.body?.subject || "", 200);
      const message = sanitize(req.body?.message || "", 8000);
      const priorityRaw = sanitize(req.body?.priority || "medium", 20).toLowerCase();
      const priority = TICKET_PRIORITIES.includes(priorityRaw) ? priorityRaw : "medium";

      if (!category || !TICKET_CATEGORIES.includes(category)) {
        return res.status(400).json({ ok: false, error: "Invalid category." });
      }
      if (!subject || subject.length < 5) {
        return res.status(400).json({ ok: false, error: "Subject must be at least 5 characters." });
      }
      if (!message || message.length < 15) {
        return res.status(400).json({ ok: false, error: "Message must be at least 15 characters." });
      }

      // Rate limit: max 10 open/in_progress tickets per user
      const openCount = db
        .prepare("SELECT COUNT(*) AS c FROM support_tickets WHERE user_id = ? AND status IN ('open', 'in_progress')")
        .get(req.userId).c;
      if (openCount >= 10) {
        return res.status(429).json({ ok: false, error: "You have reached the maximum open tickets limit. Please await resolution." });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO support_tickets (id, user_id, category, subject, message, priority, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`
      ).run(id, req.userId, category, subject, message, priority, now, now);

      // Save optional file attachment
      if (req.file) {
        const originalName = req.file.originalname || "attachment";
        const ext = path.extname(originalName).toLowerCase();
        const allowedExts = [".png", ".jpg", ".jpeg", ".webp", ".pdf", ".txt", ".log", ".json", ".csv", ".zip"];
        if (allowedExts.includes(ext) && req.file.size <= 10 * 1024 * 1024) {
          const attachId = crypto.randomUUID();
          const storedFilename = `${attachId}${ext}`;
          const filePath = path.join(attachmentsDir, storedFilename);
          fs.writeFileSync(filePath, req.file.buffer);

          db.prepare(
            `INSERT INTO support_attachments (id, ticket_id, filename, original_name, size, mimetype, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(attachId, id, storedFilename, originalName, req.file.size, req.file.mimetype || "application/octet-stream", now);
        }
      }

      return res.json({ ok: true, ticketId: id });
    } catch (e) {
      console.error("[support] create ticket error:", e);
      return res.status(500).json({ ok: false, error: "Failed to create support ticket." });
    }
  });

  // ─── USER: List My Tickets ───────────────────────────────────────────────
  app.get("/api/support/tickets", authUser, (req, res) => {
    try {
      const tickets = db
        .prepare(
          `SELECT t.id, t.category, t.subject, t.status, t.priority, t.created_at, t.updated_at,
                  (SELECT COUNT(*) FROM support_replies r WHERE r.ticket_id = t.id) AS reply_count,
                  (SELECT COUNT(*) FROM support_replies r WHERE r.ticket_id = t.id AND r.is_admin = 1 AND r.read_by_user = 0) AS unread_count,
                  (SELECT COUNT(*) FROM support_attachments a WHERE a.ticket_id = t.id) AS attachment_count
           FROM support_tickets t
           WHERE t.user_id = ?
           ORDER BY t.updated_at DESC
           LIMIT 100`
        )
        .all(req.userId);
      return res.json({ ok: true, tickets });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to load tickets." });
    }
  });

  // ─── USER: Get Ticket Detail with Replies & Attachments ──────────────────
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

      const attachments = db
        .prepare(
          `SELECT id, filename, original_name, size, mimetype, created_at
           FROM support_attachments WHERE ticket_id = ? ORDER BY created_at ASC`
        )
        .all(ticket.id);

      // Mark admin replies as read by user
      db.prepare(
        "UPDATE support_replies SET read_by_user = 1 WHERE ticket_id = ? AND is_admin = 1"
      ).run(ticket.id);

      return res.json({ ok: true, ticket, replies, attachments });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to load ticket." });
    }
  });

  // ─── USER: Reply to Ticket ───────────────────────────────────────────────
  app.post("/api/support/tickets/:id/reply", authUser, (req, res) => {
    try {
      const ticket = db
        .prepare("SELECT id, status FROM support_tickets WHERE id = ? AND user_id = ?")
        .get(req.params.id, req.userId);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found." });

      const message = sanitize(req.body?.message || "");
      if (!message || message.length < 2) {
        return res.status(400).json({ ok: false, error: "Reply message is required." });
      }

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO support_replies (id, ticket_id, message, is_admin, author_name, read_by_user, read_by_admin, created_at)
         VALUES (?, ?, ?, 0, ?, 1, 0, ?)`
      ).run(crypto.randomUUID(), ticket.id, message, req.userName || "User", now);

      // Re-open ticket if it was resolved or closed
      const newStatus = ticket.status === "resolved" || ticket.status === "closed" ? "open" : ticket.status;
      db.prepare("UPDATE support_tickets SET updated_at = ?, status = ? WHERE id = ?").run(now, newStatus, ticket.id);

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to send reply." });
    }
  });

  // ─── USER: Download Ticket Attachment ────────────────────────────────────
  app.get("/api/support/attachments/:id", authUser, (req, res) => {
    try {
      const att = db.prepare(
        `SELECT a.*, t.user_id FROM support_attachments a
         JOIN support_tickets t ON t.id = a.ticket_id
         WHERE a.id = ?`
      ).get(req.params.id);
      if (!att || att.user_id !== req.userId) {
        return res.status(404).json({ ok: false, error: "Attachment not found." });
      }

      const filePath = path.join(attachmentsDir, att.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ ok: false, error: "File not found on disk." });
      }

      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(att.original_name || att.filename)}"`);
      if (att.mimetype) res.setHeader("Content-Type", att.mimetype);
      return res.sendFile(filePath);
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to download attachment." });
    }
  });

  // ─── ADMIN: List All Support Tickets ─────────────────────────────────────
  app.get("/api/admin/support/tickets", authAdmin, (req, res) => {
    try {
      const statusFilter = req.query.status || "";
      const priorityFilter = req.query.priority || "";
      const categoryFilter = req.query.category || "";
      const search = req.query.search || "";
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 30);
      const offset = (page - 1) * limit;

      let where = "1=1";
      const params = [];

      if (statusFilter) {
        where += " AND t.status = ?";
        params.push(statusFilter);
      }
      if (priorityFilter) {
        where += " AND t.priority = ?";
        params.push(priorityFilter);
      }
      if (categoryFilter) {
        where += " AND t.category = ?";
        params.push(categoryFilter);
      }
      if (search) {
        where += " AND (u.email LIKE ? OR u.name LIKE ? OR t.subject LIKE ? OR t.id LIKE ?)";
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      const tickets = db
        .prepare(
          `SELECT t.id, t.category, t.subject, t.status, t.priority, t.created_at, t.updated_at,
                  u.email AS user_email, u.name AS user_name, u.subscription_plan AS user_plan, u.credits AS user_credits,
                  (SELECT COUNT(*) FROM support_replies r WHERE r.ticket_id = t.id) AS reply_count,
                  (SELECT COUNT(*) FROM support_replies r WHERE r.ticket_id = t.id AND r.is_admin = 0 AND r.read_by_admin = 0) AS unread_count,
                  (SELECT COUNT(*) FROM support_attachments a WHERE a.ticket_id = t.id) AS attachment_count
           FROM support_tickets t
           JOIN users u ON u.id = t.user_id
           WHERE ${where}
           ORDER BY 
             CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END ASC,
             t.updated_at DESC
           LIMIT ? OFFSET ?`
        )
        .all(...params, limit, offset);

      const total = db
        .prepare(`SELECT COUNT(*) AS c FROM support_tickets t JOIN users u ON u.id = t.user_id WHERE ${where}`)
        .get(...params).c;

      const summary = db
        .prepare(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count,
             SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
             SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
             SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_count,
             SUM(CASE WHEN priority IN ('high', 'urgent') THEN 1 ELSE 0 END) AS urgent_count
           FROM support_tickets`
        )
        .get();

      const unreadTotal = db
        .prepare(
          `SELECT COUNT(DISTINCT ticket_id) AS c FROM support_replies WHERE is_admin = 0 AND read_by_admin = 0`
        )
        .get().c;

      summary.unread_tickets_count = unreadTotal;

      return res.json({ ok: true, tickets, total, page, limit, summary });
    } catch (e) {
      console.error("[admin/support] list tickets error:", e);
      return res.status(500).json({ ok: false, error: "Failed to load tickets." });
    }
  });

  // ─── ADMIN: Get Ticket Detail ────────────────────────────────────────────
  app.get("/api/admin/support/tickets/:id", authAdmin, (req, res) => {
    try {
      const ticket = db
        .prepare(
          `SELECT t.*, u.email AS user_email, u.name AS user_name, u.credits AS user_credits,
                  u.subscription_plan AS user_plan, u.created_at AS user_created_at, u.suspended AS user_suspended
           FROM support_tickets t 
           JOIN users u ON u.id = t.user_id 
           WHERE t.id = ?`
        )
        .get(req.params.id);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found." });

      const replies = db
        .prepare(
          "SELECT id, message, is_admin, author_name, created_at FROM support_replies WHERE ticket_id = ? ORDER BY created_at ASC"
        )
        .all(ticket.id);

      const attachments = db
        .prepare(
          "SELECT id, filename, original_name, size, mimetype, created_at FROM support_attachments WHERE ticket_id = ? ORDER BY created_at ASC"
        )
        .all(ticket.id);

      // Mark user replies as read by admin
      db.prepare(
        "UPDATE support_replies SET read_by_admin = 1 WHERE ticket_id = ? AND is_admin = 0"
      ).run(ticket.id);

      return res.json({ ok: true, ticket, replies, attachments });
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
        `INSERT INTO support_replies (id, ticket_id, message, is_admin, author_name, read_by_user, read_by_admin, created_at)
         VALUES (?, ?, ?, 1, ?, 0, 1, ?)`
      ).run(crypto.randomUUID(), ticket.id, message, adminName, now);

      // Auto update status to in_progress if currently open
      const newStatus = ticket.status === "open" ? "in_progress" : ticket.status;
      db.prepare("UPDATE support_tickets SET updated_at = ?, status = ? WHERE id = ?").run(now, newStatus, ticket.id);

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to send reply." });
    }
  });

  // ─── ADMIN: Update Ticket (Status, Priority, Internal Notes, Category) ──
  const updateTicketHandler = (req, res) => {
    try {
      const ticket = db.prepare("SELECT id, status, priority, category, internal_notes FROM support_tickets WHERE id = ?").get(req.params.id);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found." });

      let { status, priority, category, internal_notes } = req.body || {};

      let updatedStatus = ticket.status;
      if (typeof status === "string" && status.trim()) {
        const s = status.trim().toLowerCase();
        if (!TICKET_STATUSES.includes(s)) return res.status(400).json({ ok: false, error: "Invalid status." });
        updatedStatus = s;
      }

      let updatedPriority = ticket.priority;
      if (typeof priority === "string" && priority.trim()) {
        const p = priority.trim().toLowerCase();
        if (!TICKET_PRIORITIES.includes(p)) return res.status(400).json({ ok: false, error: "Invalid priority." });
        updatedPriority = p;
      }

      let updatedCategory = ticket.category;
      if (typeof category === "string" && category.trim()) {
        const c = category.trim().toLowerCase();
        if (!TICKET_CATEGORIES.includes(c)) return res.status(400).json({ ok: false, error: "Invalid category." });
        updatedCategory = c;
      }

      let updatedNotes = ticket.internal_notes;
      if (typeof internal_notes === "string") {
        updatedNotes = sanitize(internal_notes, 8000);
      }

      const now = new Date().toISOString();
      db.prepare(
        `UPDATE support_tickets 
         SET status = ?, priority = ?, category = ?, internal_notes = ?, updated_at = ?
         WHERE id = ?`
      ).run(updatedStatus, updatedPriority, updatedCategory, updatedNotes, now, ticket.id);

      return res.json({
        ok: true,
        ticket: {
          id: ticket.id,
          status: updatedStatus,
          priority: updatedPriority,
          category: updatedCategory,
          internal_notes: updatedNotes,
          updated_at: now,
        },
      });
    } catch (e) {
      console.error("[admin/support] update ticket error:", e);
      return res.status(500).json({ ok: false, error: "Failed to update ticket." });
    }
  };

  app.patch("/api/admin/support/tickets/:id", authAdmin, updateTicketHandler);
  app.patch("/api/admin/support/tickets/:id/status", authAdmin, updateTicketHandler);

  // ─── ADMIN: Delete Support Ticket ────────────────────────────────────────
  app.delete("/api/admin/support/tickets/:id", authAdmin, (req, res) => {
    try {
      const ticket = db.prepare("SELECT id FROM support_tickets WHERE id = ?").get(req.params.id);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found." });

      // Delete attachments from disk first
      const attachments = db.prepare("SELECT filename FROM support_attachments WHERE ticket_id = ?").all(ticket.id);
      for (const a of attachments) {
        const fPath = path.join(attachmentsDir, a.filename);
        if (fs.existsSync(fPath)) {
          try { fs.unlinkSync(fPath); } catch {}
        }
      }

      db.prepare("DELETE FROM support_tickets WHERE id = ?").run(ticket.id);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to delete ticket." });
    }
  });

  // ─── ADMIN: Download Ticket Attachment ────────────────────────────────────
  app.get("/api/admin/support/attachments/:id", authAdmin, (req, res) => {
    try {
      const att = db.prepare("SELECT * FROM support_attachments WHERE id = ?").get(req.params.id);
      if (!att) return res.status(404).json({ ok: false, error: "Attachment not found." });

      const filePath = path.join(attachmentsDir, att.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ ok: false, error: "File not found on disk." });
      }

      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(att.original_name || att.filename)}"`);
      if (att.mimetype) res.setHeader("Content-Type", att.mimetype);
      return res.sendFile(filePath);
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to download attachment." });
    }
  });
}

module.exports = { mountSupportRoutes };
