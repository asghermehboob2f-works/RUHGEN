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

function mountFaqRoutes(app, { db }) {
  // Public route to get all FAQs
  app.get("/api/faqs", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM faqs ORDER BY created_at ASC").all();
      return res.json({ ok: true, faqs: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Admin route to create a new FAQ
  app.post("/api/admin/faqs", requireAdmin, (req, res) => {
    try {
      const { category, question, answer } = req.body;
      if (!category || !question || !answer) {
        return res.status(400).json({ ok: false, error: "Category, question, and answer are required." });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        "INSERT INTO faqs (id, category, question, answer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(id, category, question, answer, now, now);

      const newFaq = db.prepare("SELECT * FROM faqs WHERE id = ?").get(id);
      return res.json({ ok: true, faq: newFaq });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Admin route to update an existing FAQ
  app.put("/api/admin/faqs/:id", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { category, question, answer } = req.body;
      if (!category || !question || !answer) {
        return res.status(400).json({ ok: false, error: "Category, question, and answer are required." });
      }

      const now = new Date().toISOString();

      const info = db.prepare(
        "UPDATE faqs SET category = ?, question = ?, answer = ?, updated_at = ? WHERE id = ?"
      ).run(category, question, answer, now, id);

      if (info.changes === 0) {
        return res.status(404).json({ ok: false, error: "FAQ not found." });
      }

      const updatedFaq = db.prepare("SELECT * FROM faqs WHERE id = ?").get(id);
      return res.json({ ok: true, faq: updatedFaq });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Admin route to delete an FAQ
  app.delete("/api/admin/faqs/:id", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const info = db.prepare("DELETE FROM faqs WHERE id = ?").run(id);

      if (info.changes === 0) {
        return res.status(404).json({ ok: false, error: "FAQ not found." });
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });
}

module.exports = { mountFaqRoutes };
