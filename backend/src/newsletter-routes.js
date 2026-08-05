function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

/**
 * Mount newsletter subscription routes.
 */
function mountNewsletterRoutes(app, { db, requireAdmin }) {
  // Public subscribe
  app.post("/api/newsletter/subscribe", (req, res, next) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email : "";
      if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: "Invalid email." });
      }
      const normalized = email.trim().toLowerCase();
      const existing = db
        .prepare("SELECT email FROM newsletter_subscribers WHERE email = ?")
        .get(normalized);
      if (existing) {
        return res.json({ ok: true });
      }
      db.prepare(
        "INSERT INTO newsletter_subscribers (email, subscribed_at, source) VALUES (?, ?, ?)"
      ).run(normalized, new Date().toISOString(), "footer");
      return res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Admin subscriber list
  app.get("/api/admin/newsletter", requireAdmin, (_req, res, next) => {
    try {
      const subscribers = db
        .prepare(
          "SELECT email, subscribed_at AS subscribedAt, source FROM newsletter_subscribers ORDER BY subscribed_at DESC"
        )
        .all();
      return res.json({ ok: true, subscribers });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = { mountNewsletterRoutes };
