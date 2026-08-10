const crypto = require("node:crypto");
const {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  signUserToken,
  verifyUserToken,
} = require("./auth");
const { sendMail } = require("./email-service");
const { verificationEmail } = require("./email-templates");

const GRACE_DAYS = Number(process.env.VERIFY_GRACE_DAYS) || 7;
const LINK_TTL_HOURS = Number(process.env.VERIFY_LINK_TTL_HOURS) || 72;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function hashToken(t) {
  return crypto.createHash("sha256").update(t).digest("hex");
}
function addMs(ms) { return new Date(Date.now() + ms).toISOString(); }

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
      if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: "Invalid email address." });
      }
      const passCheck = validatePasswordStrength(password);
      if (!passCheck.ok) {
        return res.status(400).json({ ok: false, error: passCheck.error });
      }
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        return res.status(409).json({ ok: false, error: "An account with this email already exists." });
      }
      const id = crypto.randomUUID();
      const password_hash = hashPassword(password);
      const created_at = new Date().toISOString();
      const verification_deadline = addMs(GRACE_DAYS * 86400 * 1000);
      // Generate verification token
      const rawToken = crypto.randomBytes(48).toString("hex");
      const tokenHash = hashToken(rawToken);
      const tokenExpiry = addMs(LINK_TTL_HOURS * 3600 * 1000);
      const otp = String(Math.floor(100000 + crypto.randomInt(900000))).padStart(6, "0");
      const otpHash = hashToken(otp);
      const otpExpiry = addMs(15 * 60 * 1000);

      db.prepare(
        `INSERT INTO users (id, email, name, password_hash, created_at,
          verification_status, verification_deadline, verification_token_hash,
          verification_token_expiry, otp_hash, otp_expiry)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`
      ).run(id, email, name, password_hash, created_at,
        verification_deadline, tokenHash, tokenExpiry, otpHash, otpExpiry);

      // Send verification email (non-blocking)
      const verifyUrl = `${SITE_URL}/api/verify-email?token=${rawToken}`;
      sendMail({ to: email, ...verificationEmail({ name, verifyUrl, expiresHours: LINK_TTL_HOURS, otp }) })
        .catch(e => console.error("[auth] verification email failed:", e.message));

      const user = { id, email, name, credits: 120, emailVerified: false, verificationStatus: "pending" };
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

      // Check rate limit lockouts
      const ipKey = `login-ip:${req.ip || "unknown"}`;
      const emailKey = `login-email:${email}`;
      const ipLock = checkRateLimit(ipKey);
      if (ipLock.locked) {
        return res.status(429).json({ ok: false, error: `Too many failed attempts. Please try again in ${ipLock.minutesLeft} minute(s).` });
      }
      const emailLock = checkRateLimit(emailKey);
      if (emailLock.locked) {
        return res.status(429).json({ ok: false, error: `Too many failed attempts on this account. Please try again in ${emailLock.minutesLeft} minute(s).` });
      }

      const row = db
        .prepare("SELECT id, email, name, password_hash, suspended, credits FROM users WHERE email = ?")
        .get(email);
      if (!row) {
        recordFailedAttempt(ipKey);
        recordFailedAttempt(emailKey);
        return res.status(401).json({ ok: false, error: "Invalid email or password." });
      }
      if (row.suspended) {
        return res.status(403).json({ ok: false, error: "This account has been suspended." });
      }

      const { isValid, isLegacy } = verifyPassword(password, row.password_hash);
      if (!isValid) {
        recordFailedAttempt(ipKey);
        recordFailedAttempt(emailKey);
        return res.status(401).json({ ok: false, error: "Invalid email or password." });
      }

      // Clear failed rate limit counters on success
      clearFailedAttempts(ipKey);
      clearFailedAttempts(emailKey);

      // Auto-upgrade legacy SHA256 hashes to PBKDF2 transparently
      if (isLegacy) {
        try {
          const updatedHash = hashPassword(password);
          db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(updatedHash, row.id);
        } catch (upgradeErr) {
          console.error("[auth] Transparent hash upgrade failed:", upgradeErr);
        }
      }

      const user = { id: row.id, email: row.email, name: row.name, credits: row.credits };
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
          `SELECT id, email, name, suspended, subscription_plan, subscription_status, credits,
           generation_disabled, special_access, role,
           email_verified, email_verified_at, verification_status, verification_deadline
           FROM users WHERE id = ?`
        )
        .get(payload.sub);
      if (!row) {
        return res.status(401).json({ ok: false, error: "Unauthorized." });
      }
      if (row.suspended && row.email_verified) {
        return res.status(403).json({ ok: false, error: "This account has been suspended." });
      }

      const pendingRow = db.prepare("SELECT COALESCE(SUM(credits), 0) as pending FROM studio_tasks WHERE user_id = ? AND status = 'pending'").get(payload.sub);
      const pending_credits = pendingRow?.pending || 0;

      const user = {
        id: row.id,
        email: row.email,
        name: row.name,
        subscriptionPlan: row.subscription_plan,
        subscriptionStatus: row.subscription_status,
        credits: row.credits,
        availableCredits: Math.max(0, row.credits - pending_credits),
        pendingCredits: pending_credits,
        generationDisabled: row.generation_disabled === 1,
        specialAccess: row.special_access === 1,
        role: row.role,
        emailVerified: !!row.email_verified,
        emailVerifiedAt: row.email_verified_at || null,
        verificationStatus: row.verification_status || "pending",
        verificationDeadline: row.verification_deadline || null,
        suspended: !!row.suspended,
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
        return res.status(400).json({ ok: false, error: "Current password is required to save changes." });
      }

      const ipKey = `profile-ip:${req.ip || "unknown"}`;
      const userKey = `profile-user:${id}`;
      const ipLock = checkRateLimit(ipKey);
      if (ipLock.locked) {
        return res.status(429).json({ ok: false, error: `Too many failed attempts. Please try again in ${ipLock.minutesLeft} minute(s).` });
      }
      const userLock = checkRateLimit(userKey);
      if (userLock.locked) {
        return res.status(429).json({ ok: false, error: `Too many failed attempts on this account. Please try again in ${userLock.minutesLeft} minute(s).` });
      }

      const row = db.prepare("SELECT id, email, name, password_hash FROM users WHERE id = ?").get(id);
      if (!row) {
        return res.status(404).json({ ok: false, error: "Account not found." });
      }

      const { isValid: curValid, isLegacy: curLegacy } = verifyPassword(currentPassword, row.password_hash);
      if (!curValid) {
        recordFailedAttempt(ipKey);
        recordFailedAttempt(userKey);
        return res.status(400).json({ ok: false, error: "Current password is incorrect." });
      }

      clearFailedAttempts(ipKey);
      clearFailedAttempts(userKey);

      const nameIn = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : row.name;
      const name = nameIn || row.name;
      let email =
        typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : row.email;
      if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: "Invalid email address." });
      }
      const other = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, id);
      if (other) {
        return res.status(400).json({ ok: false, error: "That email is already in use by another account." });
      }

      const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
      let password_hash = row.password_hash;

      if (newPassword.length > 0) {
        const passCheck = validatePasswordStrength(newPassword);
        if (!passCheck.ok) {
          return res.status(400).json({ ok: false, error: passCheck.error });
        }
        if (verifyPassword(newPassword, row.password_hash).isValid) {
          return res.status(400).json({ ok: false, error: "New password must be different from your current password." });
        }
        password_hash = hashPassword(newPassword);
      } else if (curLegacy) {
        password_hash = hashPassword(currentPassword);
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
