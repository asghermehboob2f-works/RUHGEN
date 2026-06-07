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

function mountAdminUsersRoutes(app, { db }) {
  // Get all users
  app.get("/api/admin/users", requireAdmin, (req, res) => {
    try {
      const rows = db.prepare(
        "SELECT id, email, name, created_at as createdAt, suspended, subscription_plan as subscriptionPlan, subscription_status as subscriptionStatus, admin_notes as adminNotes, credits FROM users ORDER BY created_at DESC"
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
      
      const row = db.prepare("SELECT id, credits FROM users WHERE id = ?").get(id);
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

      let creditsChanged = false;
      let oldCredits = row.credits;
      let newCredits = oldCredits;
      if (typeof body.credits === "number") {
        if (oldCredits !== body.credits) {
          creditsChanged = true;
          newCredits = body.credits;
          updates.push("credits = ?");
          values.push(newCredits);
        }
      }

      const runUpdate = db.transaction(() => {
        if (updates.length > 0) {
          values.push(id);
          db.prepare(
            `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
          ).run(...values);
        }

        if (creditsChanged) {
          const diff = newCredits - oldCredits;
          const added = diff > 0 ? diff : 0;
          const deducted = diff < 0 ? -diff : 0;
          const reason = typeof body.creditsReason === "string" && body.creditsReason.trim()
            ? body.creditsReason.trim()
            : (diff > 0 ? "Admin added credits" : "Admin removed credits");
          
          db.prepare(`
            INSERT INTO credit_transactions (id, user_id, action_type, credits_added, credits_deducted, previous_balance, new_balance, timestamp, source, reason, details_json)
            VALUES (?, ?, 'admin_adjustment', ?, ?, ?, ?, ?, 'admin', ?, ?)
          `).run(
            crypto.randomUUID(),
            id,
            added,
            deducted,
            oldCredits,
            newCredits,
            new Date().toISOString(),
            reason,
            JSON.stringify({ adminId: req.admin.sub, reason })
          );
        }
      });

      runUpdate();

      const updatedRow = db.prepare(
        "SELECT id, email, name, created_at as createdAt, suspended, subscription_plan as subscriptionPlan, subscription_status as subscriptionStatus, admin_notes as adminNotes, credits FROM users WHERE id = ?"
      ).get(id);

      return res.json({ ok: true, user: updatedRow });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Get all transaction history (admin view)
  app.get("/api/admin/credits/transactions", requireAdmin, (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT t.id, t.user_id as userId, u.name as userName, u.email as userEmail, t.action_type as actionType, t.credits_added as creditsAdded, t.credits_deducted as creditsDeducted, t.previous_balance as previousBalance, t.new_balance as newBalance, t.timestamp, t.source, t.reason, t.details_json as detailsJson
        FROM credit_transactions t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.timestamp DESC
        LIMIT 200
      `).all();
      return res.json({ ok: true, transactions: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Get credit settings (admin view)
  app.get("/api/admin/credits/rates", requireAdmin, (req, res) => {
    try {
      const rows = db.prepare("SELECT key, value FROM credit_settings").all();
      const rates = {};
      for (const r of rows) {
        rates[r.key] = Number(r.value);
      }
      if (rates.credits_per_image === undefined) rates.credits_per_image = 2;
      if (rates.credits_per_video_second === undefined) rates.credits_per_video_second = 5;
      return res.json({ ok: true, rates });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Update credit settings (admin view)
  app.post("/api/admin/credits/rates", requireAdmin, (req, res) => {
    try {
      const { credits_per_image, credits_per_video_second } = req.body;
      
      const stmt = db.prepare("INSERT OR REPLACE INTO credit_settings (key, value) VALUES (?, ?)");
      
      if (credits_per_image !== undefined && credits_per_image !== null) {
        stmt.run("credits_per_image", String(credits_per_image));
      }
      if (credits_per_video_second !== undefined && credits_per_video_second !== null) {
        stmt.run("credits_per_video_second", String(credits_per_video_second));
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });
}

module.exports = { mountAdminUsersRoutes };
