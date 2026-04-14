const crypto = require("node:crypto");
const { hashPassword, signUserToken, verifyUserToken } = require("./auth");

function getBearer(req) {
  const auth = String(req.headers.authorization || "").trim();
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

/**
 * Member (platform) auth: register, login, session, profile.
 * @param {import("express").Express} app
 * @param {{ db: import("better-sqlite3").Database }} ctx
 */
function mountUserAuthRoutes(app, { db }) {
  app.post("/api/auth/register", (req, res) => {
    try {
      const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : "";
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!name || !email || !password) {
        return res.status(400).json({ ok: false, error: "Please fill in all fields." });
      }
      if (password.length < 8) {
        return res.status(400).json({ ok: false, error: "Password must be at least 8 characters." });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: "Invalid email address." });
      }
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        return res.status(409).json({ ok: false, error: "An account with this email already exists." });
      }
      const id = crypto.randomUUID();
      const password_hash = hashPassword(password);
      const created_at = new Date().toISOString();
      db.prepare(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
      ).run(id, email, name, password_hash, created_at);
      const user = { id, email, name };
      let token;
      try {
        token = signUserToken(user);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Auth not configured.";
        return res.status(500).json({ ok: false, error: msg });
      }
      return res.json({ ok: true, token, user });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!email || !password) {
        return res.status(400).json({ ok: false, error: "Email and password are required." });
      }
      const row = db
        .prepare("SELECT id, email, name, password_hash, suspended FROM users WHERE email = ?")
        .get(email);
      if (!row) {
        return res.status(401).json({ ok: false, error: "Invalid email or password." });
      }
      if (row.suspended) {
        return res.status(403).json({ ok: false, error: "This account has been suspended." });
      }
      if (hashPassword(password) !== row.password_hash) {
        return res.status(401).json({ ok: false, error: "Invalid email or password." });
      }
      const user = { id: row.id, email: row.email, name: row.name };
      let token;
      try {
        token = signUserToken(user);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Auth not configured.";
        return res.status(500).json({ ok: false, error: msg });
      }
      return res.json({ ok: true, token, user });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    try {
      const bearer = getBearer(req);
      if (!bearer) {
        return res.status(401).json({ ok: false, error: "Unauthorized." });
      }
      let payload;
      try {
        payload = verifyUserToken(bearer);
      } catch {
        return res.status(401).json({ ok: false, error: "Unauthorized." });
      }
      if (payload.typ !== "user" || typeof payload.sub !== "string") {
        return res.status(401).json({ ok: false, error: "Unauthorized." });
      }
      const row = db
        .prepare(
          "SELECT id, email, name, suspended, subscription_plan, subscription_status FROM users WHERE id = ?"
        )
        .get(payload.sub);
      if (!row) {
        return res.status(401).json({ ok: false, error: "Unauthorized." });
      }
      if (row.suspended) {
        return res.status(403).json({ ok: false, error: "This account has been suspended." });
      }
      const user = {
        id: row.id,
        email: row.email,
        name: row.name,
        subscriptionPlan: row.subscription_plan,
        subscriptionStatus: row.subscription_status,
      };
      return res.json({ ok: true, user });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.put("/api/auth/profile", (req, res) => {
    try {
      const bearer = getBearer(req);
      if (!bearer) {
        return res.status(401).json({ ok: false, error: "Not signed in." });
      }
      let payload;
      try {
        payload = verifyUserToken(bearer);
      } catch {
        return res.status(401).json({ ok: false, error: "Unauthorized." });
      }
      if (payload.typ !== "user" || typeof payload.sub !== "string") {
        return res.status(401).json({ ok: false, error: "Unauthorized." });
      }
      const id = payload.sub;
      const currentPassword =
        typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
      if (!currentPassword) {
        return res.status(400).json({ ok: false, error: "Current password is required." });
      }
      const row = db.prepare("SELECT id, email, name, password_hash FROM users WHERE id = ?").get(id);
      if (!row) {
        return res.status(404).json({ ok: false, error: "Account not found." });
      }
      if (hashPassword(currentPassword) !== row.password_hash) {
        return res.status(400).json({ ok: false, error: "Current password is incorrect." });
      }
      const nameIn = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : row.name;
      const name = nameIn || row.name;
      let email =
        typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : row.email;
      if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: "Invalid email address." });
      }
      const other = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, id);
      if (other) {
        return res.status(400).json({ ok: false, error: "That email is already in use." });
      }
      const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
      let password_hash = row.password_hash;
      if (newPassword.length > 0) {
        if (newPassword.length < 8) {
          return res.status(400).json({ ok: false, error: "New password must be at least 8 characters." });
        }
        password_hash = hashPassword(newPassword);
      }
      db.prepare("UPDATE users SET email = ?, name = ?, password_hash = ? WHERE id = ?").run(
        email,
        name,
        password_hash,
        id
      );
      const user = { id, email, name };
      let token;
      try {
        token = signUserToken(user);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Auth not configured.";
        return res.status(500).json({ ok: false, error: msg });
      }
      return res.json({ ok: true, token, user });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });
}

module.exports = { mountUserAuthRoutes };
