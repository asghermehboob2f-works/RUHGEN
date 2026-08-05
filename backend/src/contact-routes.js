const crypto = require("node:crypto");

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

/**
 * Mount contact form routes.
 */
function mountContactRoutes(app, { db, requireAdmin }) {
  // Public contact submission
  app.post("/api/contact", (req, res, next) => {
    try {
      const body = req.body || {};
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!name || !isValidEmail(email) || message.length < 8) {
        return res.status(400).json({
          ok: false,
          error: "Please provide your name, a valid email, and a message (8+ characters).",
        });
      }
      const id = crypto.randomUUID();
      const submittedAt = new Date().toISOString();
      const msg = message.slice(0, 8000);
      const nameTrim = name.slice(0, 200);
      db.prepare(
        "INSERT INTO contact_messages (id, name, email, message, submitted_at) VALUES (?, ?, ?, ?, ?)"
      ).run(id, nameTrim, email.toLowerCase(), msg, submittedAt);
      return res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Admin list contact messages
  app.get("/api/admin/contact-messages", requireAdmin, (_req, res, next) => {
    try {
      const rows = db
        .prepare(
          "SELECT id, name, email, message, submitted_at AS submittedAt FROM contact_messages ORDER BY submitted_at DESC"
        )
        .all();
      return res.json({ ok: true, messages: rows });
    } catch (err) {
      next(err);
    }
  });

  // Admin delete contact message
  app.delete("/api/admin/contact-messages/:id", requireAdmin, (req, res, next) => {
    try {
      const id = req.params.id;
      const result = db.prepare("DELETE FROM contact_messages WHERE id = ?").run(id);
      if (result.changes === 0) {
        return res.status(404).json({ ok: false, error: "Message not found." });
      }
      return res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = { mountContactRoutes };
