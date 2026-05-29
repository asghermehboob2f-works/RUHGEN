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

function mountAdminUsersRoutes(app, { db }) {
  // Get all users
  app.get("/api/admin/users", requireAdmin, (req, res) => {
    try {
      const rows = db.prepare(
        "SELECT id, email, name, created_at as createdAt, suspended, subscription_plan as subscriptionPlan, subscription_status as subscriptionStatus, admin_notes as adminNotes FROM users ORDER BY created_at DESC"
      ).all();
      return res.json({ ok: true, users: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Patch a user
  app.patch("/api/admin/users/:id", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      
      const row = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
      if (!row) {
        return res.status(404).json({ ok: false, error: "User not found." });
      }

      let updates = [];
      let values = [];

      if (typeof body.suspended === "boolean") {
        updates.push("suspended = ?");
        values.push(body.suspended ? 1 : 0);
      }
      if (typeof body.subscriptionPlan === "string") {
        updates.push("subscription_plan = ?");
        values.push(body.subscriptionPlan.trim());
      }
      if (typeof body.subscriptionStatus === "string") {
        updates.push("subscription_status = ?");
        values.push(body.subscriptionStatus.trim());
      }
      if (typeof body.adminNotes === "string") {
        updates.push("admin_notes = ?");
        values.push(body.adminNotes.slice(0, 4000));
      }

      if (updates.length > 0) {
        values.push(id);
        db.prepare(
          `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
        ).run(...values);
      }

      const updatedRow = db.prepare(
        "SELECT id, email, name, created_at as createdAt, suspended, subscription_plan as subscriptionPlan, subscription_status as subscriptionStatus, admin_notes as adminNotes FROM users WHERE id = ?"
      ).get(id);

      return res.json({ ok: true, user: updatedRow });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });
}

module.exports = { mountAdminUsersRoutes };
