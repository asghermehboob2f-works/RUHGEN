/**
 * RUHGEN Email Verification Routes
 * - POST /api/auth/send-verification   — resend link + OTP
 * - POST /api/auth/verify-email        — verify via token (link click)
 * - POST /api/auth/verify-otp          — verify via 6-digit OTP
 * - GET  /api/verify-email             — one-click link handler (redirect)
 * - GET  /api/auth/verification-status — current user's verification state
 * Admin:
 * - GET  /api/admin/verification/stats
 * - POST /api/admin/verification/resend/:userId
 * - POST /api/admin/verification/extend/:userId
 * - POST /api/admin/verification/force-verify/:userId
 * - POST /api/admin/verification/unsuspend/:userId
 * - GET  /api/admin/verification/audit-logs
 */

const crypto = require("node:crypto");
const { verifyUserToken, verifyAdminToken } = require("./auth");
const { sendMail } = require("./email-service");
const { verificationEmail, reminderEmail, otpEmail, successEmail, suspensionEmail } = require("./email-templates");

// ─── Constants ───────────────────────────────────────────────────────────────
const GRACE_DAYS = Number(process.env.VERIFY_GRACE_DAYS) || 7;
const LINK_TTL_HOURS = Number(process.env.VERIFY_LINK_TTL_HOURS) || 72;
const OTP_TTL_MINUTES = Number(process.env.VERIFY_OTP_TTL_MINUTES) || 15;
const MAX_RESEND_PER_DAY = Number(process.env.VERIFY_MAX_RESEND_PER_DAY) || 5;
const RESEND_COOLDOWN_MINUTES = Number(process.env.VERIFY_RESEND_COOLDOWN_MINUTES) || 2;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.BACKEND_URL?.replace(":4000", ":3000") || "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getBearer(req) {
  const auth = String(req.headers.authorization || "").trim();
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}
function requireUser(req, res, next) {
  const bearer = getBearer(req);
  if (!bearer) return res.status(401).json({ ok: false, error: "Unauthorized." });
  try {
    const p = verifyUserToken(bearer);
    if (p.typ !== "user") throw new Error("invalid");
    req.userId = p.sub;
    next();
  } catch { res.status(401).json({ ok: false, error: "Unauthorized." }); }
}
function requireAdmin(req, res, next) {
  const bearer = getBearer(req);
  if (!bearer) return res.status(401).json({ ok: false, error: "Unauthorized." });
  try {
    const p = verifyAdminToken(bearer);
    if (p.typ !== "admin") throw new Error("invalid");
    req.admin = p;
    next();
  } catch { res.status(401).json({ ok: false, error: "Unauthorized." }); }
}
function genOtp() {
  return String(Math.floor(100000 + crypto.randomInt(900000))).padStart(6, "0");
}
function hashToken(t) {
  return crypto.createHash("sha256").update(t).digest("hex");
}
function nowIso() { return new Date().toISOString(); }
function addMs(ms) { return new Date(Date.now() + ms).toISOString(); }

function logAudit(db, { actor, target, action, oldVal, newVal, details }) {
  try {
    db.prepare(`INSERT INTO email_verification_audit (id,actor_id,actor_email,target_user_id,action,old_value,new_value,timestamp,details_json)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(crypto.randomUUID(), actor?.id || "system", actor?.email || "system",
        target, action, oldVal || null, newVal || null, nowIso(), JSON.stringify(details || {}));
  } catch (e) { console.error("[audit]", e.message); }
}

// Build a fresh verification token + OTP for a user, invalidating old ones.
function createVerificationCredentials(db, userId) {
  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(rawToken);
  const otp = genOtp();
  const otpHash = hashToken(otp);
  const tokenExpiry = addMs(LINK_TTL_HOURS * 3600 * 1000);
  const otpExpiry = addMs(OTP_TTL_MINUTES * 60 * 1000);

  db.prepare(`UPDATE users SET
    verification_token_hash = ?,
    verification_token_expiry = ?,
    otp_hash = ?,
    otp_expiry = ?,
    otp_attempts = 0
    WHERE id = ?`)
    .run(tokenHash, tokenExpiry, otpHash, otpExpiry, userId);

  return { rawToken, otp };
}

// Check resend rate limit. Returns error string or null.
function checkResendLimit(db, userId) {
  const user = db.prepare("SELECT last_resend_at, resend_count_today, resend_day FROM users WHERE id = ?").get(userId);
  if (!user) return "User not found.";
  const today = new Date().toISOString().slice(0, 10);
  const count = user.resend_day === today ? (user.resend_count_today || 0) : 0;
  if (count >= MAX_RESEND_PER_DAY) return `Daily resend limit (${MAX_RESEND_PER_DAY}) reached. Try again tomorrow.`;
  if (user.last_resend_at) {
    const diffMs = Date.now() - new Date(user.last_resend_at).getTime();
    if (diffMs < RESEND_COOLDOWN_MINUTES * 60 * 1000) {
      const secs = Math.ceil((RESEND_COOLDOWN_MINUTES * 60 * 1000 - diffMs) / 1000);
      return `Please wait ${secs}s before requesting again.`;
    }
  }
  return null;
}
function bumpResendCount(db, userId) {
  const today = new Date().toISOString().slice(0, 10);
  const user = db.prepare("SELECT resend_count_today, resend_day FROM users WHERE id = ?").get(userId);
  const count = user?.resend_day === today ? (user.resend_count_today || 0) : 0;
  db.prepare("UPDATE users SET last_resend_at = ?, resend_count_today = ?, resend_day = ? WHERE id = ?")
    .run(nowIso(), count + 1, today, userId);
}

// ─── Mount ────────────────────────────────────────────────────────────────────
function mountVerificationRoutes(app, { db }) {

  // ── GET /api/verify-email?token=… (one-click link) ────────────────────────
  app.get("/api/verify-email", async (req, res) => {
    const raw = String(req.query.token || "").trim();
    if (!raw) return res.redirect(`${SITE_URL}/verify?error=missing_token`);
    const hash = hashToken(raw);
    const user = db.prepare("SELECT id, email, name, email_verified, verification_token_expiry, verification_status FROM users WHERE verification_token_hash = ?").get(hash);
    if (!user) return res.redirect(`${SITE_URL}/verify?error=invalid_token`);
    if (user.email_verified) return res.redirect(`${SITE_URL}/verify?status=already_verified`);
    if (user.verification_token_expiry && new Date(user.verification_token_expiry) < new Date())
      return res.redirect(`${SITE_URL}/verify?error=expired_token&uid=${user.id}`);

    db.prepare(`UPDATE users SET
      email_verified = 1, email_verified_at = ?, verification_status = 'verified',
      verification_token_hash = NULL, verification_token_expiry = NULL,
      otp_hash = NULL, otp_expiry = NULL, suspended = 0
      WHERE id = ?`).run(nowIso(), user.id);

    logAudit(db, { target: user.id, action: "email_verified_link", details: { method: "link" } });
    sendMail({ to: user.email, ...successEmail({ name: user.name }) }).catch(() => {});
    return res.redirect(`${SITE_URL}/verify?status=verified`);
  });

  // ── GET /api/auth/verification-status ─────────────────────────────────────
  app.get("/api/auth/verification-status", requireUser, (req, res) => {
    const user = db.prepare(`SELECT email_verified, email_verified_at, verification_status,
      verification_deadline, last_resend_at, resend_count_today, resend_day,
      otp_expiry FROM users WHERE id = ?`).get(req.userId);
    if (!user) return res.status(404).json({ ok: false, error: "Not found." });
    const today = new Date().toISOString().slice(0, 10);
    const resendToday = user.resend_day === today ? (user.resend_count_today || 0) : 0;
    return res.json({
      ok: true,
      verified: !!user.email_verified,
      verifiedAt: user.email_verified_at || null,
      status: user.verification_status || "pending",
      deadline: user.verification_deadline || null,
      lastResendAt: user.last_resend_at || null,
      resendToday,
      maxResendPerDay: MAX_RESEND_PER_DAY,
      otpExpiry: user.otp_expiry || null,
    });
  });

  // ── POST /api/auth/send-verification (resend) ─────────────────────────────
  app.post("/api/auth/send-verification", requireUser, async (req, res) => {
    const userId = req.userId;
    const user = db.prepare("SELECT id, email, name, email_verified FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ ok: false, error: "User not found." });
    if (user.email_verified) return res.status(400).json({ ok: false, error: "Email already verified." });

    const limitErr = checkResendLimit(db, userId);
    if (limitErr) return res.status(429).json({ ok: false, error: limitErr });

    const { rawToken, otp } = createVerificationCredentials(db, userId);
    bumpResendCount(db, userId);
    logAudit(db, { target: userId, action: "resend_verification", details: { method: "user_request" } });

    const verifyUrl = `${SITE_URL}/api/verify-email?token=${rawToken}`;
    const emailData = verificationEmail({ name: user.name, verifyUrl, expiresHours: LINK_TTL_HOURS, otp });
    const result = await sendMail({ to: user.email, ...emailData });
    if (!result.ok) return res.status(500).json({ ok: false, error: "Failed to send email. Please try again." });

    return res.json({ ok: true, message: "Verification email sent." });
  });

  // ── POST /api/auth/verify-otp ─────────────────────────────────────────────
  app.post("/api/auth/verify-otp", requireUser, (req, res) => {
    const code = String(req.body?.otp || "").trim().replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ ok: false, error: "OTP must be 6 digits." });

    const user = db.prepare("SELECT id, email, name, email_verified, otp_hash, otp_expiry, otp_attempts FROM users WHERE id = ?").get(req.userId);
    if (!user) return res.status(404).json({ ok: false, error: "Not found." });
    if (user.email_verified) return res.status(400).json({ ok: false, error: "Already verified." });
    if (!user.otp_hash) return res.status(400).json({ ok: false, error: "No OTP requested. Please request a new verification email." });
    if (user.otp_expiry && new Date(user.otp_expiry) < new Date())
      return res.status(400).json({ ok: false, error: "OTP expired. Please request a new one." });
    if ((user.otp_attempts || 0) >= 5)
      return res.status(429).json({ ok: false, error: "Too many attempts. Request a new OTP." });

    if (hashToken(code) !== user.otp_hash) {
      db.prepare("UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = ?").run(user.id);
      return res.status(400).json({ ok: false, error: "Incorrect OTP. Please try again." });
    }

    db.prepare(`UPDATE users SET
      email_verified = 1, email_verified_at = ?, verification_status = 'verified',
      verification_token_hash = NULL, verification_token_expiry = NULL,
      otp_hash = NULL, otp_expiry = NULL, otp_attempts = 0, suspended = 0
      WHERE id = ?`).run(nowIso(), user.id);

    logAudit(db, { target: user.id, action: "email_verified_otp", details: { method: "otp" } });
    sendMail({ to: user.email, ...successEmail({ name: user.name }) }).catch(() => {});
    return res.json({ ok: true, message: "Email verified successfully." });
  });

  // ── POST /api/auth/request-otp ────────────────────────────────────────────
  app.post("/api/auth/request-otp", requireUser, async (req, res) => {
    const userId = req.userId;
    const user = db.prepare("SELECT id, email, name, email_verified FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ ok: false, error: "Not found." });
    if (user.email_verified) return res.status(400).json({ ok: false, error: "Already verified." });

    const limitErr = checkResendLimit(db, userId);
    if (limitErr) return res.status(429).json({ ok: false, error: limitErr });

    const otp = genOtp();
    const otpHash = hashToken(otp);
    db.prepare("UPDATE users SET otp_hash = ?, otp_expiry = ?, otp_attempts = 0 WHERE id = ?")
      .run(otpHash, addMs(OTP_TTL_MINUTES * 60 * 1000), userId);
    bumpResendCount(db, userId);

    const result = await sendMail({ to: user.email, ...otpEmail({ name: user.name, otp, expiryMinutes: OTP_TTL_MINUTES }) });
    if (!result.ok) return res.status(500).json({ ok: false, error: "Failed to send OTP." });
    return res.json({ ok: true, message: "OTP sent to your email." });
  });

  // ── ADMIN ──────────────────────────────────────────────────────────────────

  app.get("/api/admin/verification/stats", requireAdmin, (req, res) => {
    try {
      const total = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
      const verified = db.prepare("SELECT COUNT(*) as c FROM users WHERE email_verified = 1").get().c;
      const pending = db.prepare("SELECT COUNT(*) as c FROM users WHERE email_verified = 0 AND (suspended = 0 OR suspended IS NULL)").get().c;
      const suspended = db.prepare("SELECT COUNT(*) as c FROM users WHERE suspended = 1 AND email_verified = 0").get().c;
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayReg = db.prepare("SELECT COUNT(*) as c FROM users WHERE created_at >= ?").get(todayStr + "T00:00:00.000Z").c;
      const todayVerif = db.prepare("SELECT COUNT(*) as c FROM users WHERE email_verified_at >= ?").get(todayStr + "T00:00:00.000Z").c;
      const rate = total > 0 ? Math.round((verified / total) * 100) : 0;

      const recentUsers = db.prepare(`SELECT id, email, name, created_at as createdAt,
        email_verified as emailVerified, email_verified_at as emailVerifiedAt,
        verification_status as verificationStatus, verification_deadline as verificationDeadline,
        suspended, last_resend_at as lastResendAt, resend_count_today as resendCountToday
        FROM users ORDER BY created_at DESC LIMIT 200`).all();

      return res.json({ ok: true, stats: { total, verified, pending, suspended, verificationRate: rate, todayRegistrations: todayReg, todayVerifications: todayVerif }, users: recentUsers });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/admin/verification/resend/:userId", requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const user = db.prepare("SELECT id, email, name, email_verified FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ ok: false, error: "User not found." });
    if (user.email_verified) return res.status(400).json({ ok: false, error: "Already verified." });

    const { rawToken, otp } = createVerificationCredentials(db, userId);
    logAudit(db, { actor: { id: req.admin.sub, email: req.admin.email }, target: userId, action: "admin_resend_verification" });
    const verifyUrl = `${SITE_URL}/api/verify-email?token=${rawToken}`;
    const result = await sendMail({ to: user.email, ...verificationEmail({ name: user.name, verifyUrl, expiresHours: LINK_TTL_HOURS, otp }) });
    return res.json({ ok: result.ok, error: result.error });
  });

  app.post("/api/admin/verification/extend/:userId", requireAdmin, (req, res) => {
    const { userId } = req.params;
    const days = Number(req.body?.days) || 7;
    const user = db.prepare("SELECT id, verification_deadline FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ ok: false, error: "Not found." });
    const current = user.verification_deadline ? new Date(user.verification_deadline) : new Date();
    const newDeadline = new Date(Math.max(current.getTime(), Date.now()) + days * 86400 * 1000).toISOString();
    db.prepare("UPDATE users SET verification_deadline = ? WHERE id = ?").run(newDeadline, userId);
    logAudit(db, { actor: { id: req.admin.sub, email: req.admin.email }, target: userId, action: "admin_extend_deadline", newVal: newDeadline, details: { days } });
    return res.json({ ok: true, newDeadline });
  });

  app.post("/api/admin/verification/force-verify/:userId", requireAdmin, (req, res) => {
    const { userId } = req.params;
    const user = db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ ok: false, error: "Not found." });
    db.prepare(`UPDATE users SET email_verified = 1, email_verified_at = ?,
      verification_status = 'verified', verification_token_hash = NULL,
      verification_token_expiry = NULL, otp_hash = NULL, otp_expiry = NULL, suspended = 0 WHERE id = ?`)
      .run(nowIso(), userId);
    logAudit(db, { actor: { id: req.admin.sub, email: req.admin.email }, target: userId, action: "admin_force_verify" });
    return res.json({ ok: true });
  });

  app.post("/api/admin/verification/unsuspend/:userId", requireAdmin, (req, res) => {
    const { userId } = req.params;
    const newDeadline = addMs((Number(req.body?.graceDays) || 7) * 86400 * 1000);
    db.prepare("UPDATE users SET suspended = 0, verification_status = 'pending', verification_deadline = ? WHERE id = ?")
      .run(newDeadline, userId);
    logAudit(db, { actor: { id: req.admin.sub, email: req.admin.email }, target: userId, action: "admin_unsuspend_verification", details: { newDeadline } });
    return res.json({ ok: true, newDeadline });
  });

  app.post("/api/admin/verification/generate-otp/:userId", requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const user = db.prepare("SELECT id, email, name, email_verified FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ ok: false, error: "Not found." });
    if (user.email_verified) return res.status(400).json({ ok: false, error: "Already verified." });
    const otp = genOtp();
    db.prepare("UPDATE users SET otp_hash = ?, otp_expiry = ?, otp_attempts = 0 WHERE id = ?")
      .run(hashToken(otp), addMs(OTP_TTL_MINUTES * 60 * 1000), userId);
    logAudit(db, { actor: { id: req.admin.sub, email: req.admin.email }, target: userId, action: "admin_generate_otp" });
    const result = await sendMail({ to: user.email, ...otpEmail({ name: user.name, otp, expiryMinutes: OTP_TTL_MINUTES }) });
    return res.json({ ok: result.ok, otp, error: result.error });
  });

  app.get("/api/admin/verification/audit-logs", requireAdmin, (req, res) => {
    try {
      const logs = db.prepare(`SELECT l.*, u.email as targetEmail FROM email_verification_audit l
        LEFT JOIN users u ON l.target_user_id = u.id ORDER BY l.timestamp DESC LIMIT 500`).all();
      return res.json({ ok: true, logs });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/admin/verification/settings", requireAdmin, (req, res) => {
    return res.json({
      ok: true,
      settings: {
        graceDays: GRACE_DAYS,
        linkTtlHours: LINK_TTL_HOURS,
        otpTtlMinutes: OTP_TTL_MINUTES,
        maxResendPerDay: MAX_RESEND_PER_DAY,
        resendCooldownMinutes: RESEND_COOLDOWN_MINUTES,
      }
    });
  });
}

module.exports = { mountVerificationRoutes, createVerificationCredentials, hashToken, nowIso, addMs, logAudit };
