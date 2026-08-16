/**
 * RUHGEN Verification Cron Jobs
 * - Every hour: expire accounts past the 7-day deadline → Suspended
 * - Daily 09:00 IST: send reminder emails (Day 1, 3, 6, 24h-before)
 * - Weekly: clean up expired tokens
 */

const cron = require("node-cron");
const crypto = require("node:crypto");
const { sendMail } = require("./email-service");
const { reminderEmail, suspensionEmail } = require("./email-templates");
const { getAppUrl } = require("./config");

const GRACE_DAYS = Number(process.env.VERIFY_GRACE_DAYS) || 7;
const LINK_TTL_HOURS = Number(process.env.VERIFY_LINK_TTL_HOURS) || 72;

function hashToken(t) {
  return require("node:crypto").createHash("sha256").update(t).digest("hex");
}
function nowIso() { return new Date().toISOString(); }
function addMs(ms) { return new Date(Date.now() + ms).toISOString(); }

function buildFreshVerifyUrl(db, userId) {
  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(rawToken);
  const tokenExpiry = addMs(LINK_TTL_HOURS * 3600 * 1000);
  db.prepare("UPDATE users SET verification_token_hash = ?, verification_token_expiry = ? WHERE id = ?")
    .run(tokenHash, tokenExpiry, userId);
  return getAppUrl("verification", rawToken);
}

function logAudit(db, { target, action, details }) {
  try {
    db.prepare(`INSERT INTO email_verification_audit (id,actor_id,actor_email,target_user_id,action,old_value,new_value,timestamp,details_json)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(crypto.randomUUID(), "system", "system", target, action, null, null, nowIso(), JSON.stringify(details || {}));
  } catch {}
}

/**
 * Check and suspend accounts past verification deadline.
 */
function runExpiryCheck(db) {
  const now = nowIso();
  const expired = db.prepare(`
    SELECT id, email, name FROM users
    WHERE email_verified = 0 AND suspended = 0
    AND verification_deadline IS NOT NULL AND verification_deadline < ?
  `).all(now);

  for (const user of expired) {
    db.prepare("UPDATE users SET suspended = 1, verification_status = 'suspended' WHERE id = ?").run(user.id);
    logAudit(db, { target: user.id, action: "auto_suspended_no_verification", details: { deadline: now } });
    const verifyUrl = buildFreshVerifyUrl(db, user.id);
    sendMail({ to: user.email, ...suspensionEmail({ name: user.name, verifyUrl }) })
      .catch(e => console.error("[cron] suspension email failed:", e.message));
    console.log(`[cron] Suspended unverified user: ${user.email}`);
  }

  if (expired.length) console.log(`[cron] Suspended ${expired.length} unverified account(s).`);
}

/**
 * Send reminder emails at key intervals.
 */
function runReminderEmails(db) {
  const now = Date.now();
  const gracePeriod = GRACE_DAYS * 86400 * 1000;

  // Users to remind: Day 1, 3, 6, and 24h before expiry
  const pending = db.prepare(`
    SELECT id, email, name, created_at as createdAt, verification_deadline as deadline,
      last_reminder_at as lastReminderAt
    FROM users
    WHERE email_verified = 0 AND suspended = 0
    AND verification_deadline IS NOT NULL
  `).all();

  let sent = 0;
  for (const user of pending) {
    const deadline = new Date(user.deadline).getTime();
    const created = new Date(user.createdAt).getTime();
    const ageMs = now - created;
    const msLeft = deadline - now;
    const daysLeft = Math.ceil(msLeft / 86400000);
    const hoursLeft = Math.ceil(msLeft / 3600000);

    if (msLeft < 0) continue; // already past deadline (handled by expiry check)

    const lastReminder = user.lastReminderAt ? new Date(user.lastReminderAt).getTime() : 0;
    const hoursSinceReminder = (now - lastReminder) / 3600000;

    // Trigger points: ~24h after signup, ~72h, ~144h (day 6), ~24h before expiry
    const shouldRemind =
      (ageMs >= 20 * 3600000 && ageMs <= 28 * 3600000 && hoursSinceReminder > 23) ||  // Day 1
      (ageMs >= 68 * 3600000 && ageMs <= 76 * 3600000 && hoursSinceReminder > 23) ||  // Day 3
      (ageMs >= 140 * 3600000 && ageMs <= 148 * 3600000 && hoursSinceReminder > 23) || // Day 6
      (msLeft <= 26 * 3600000 && msLeft > 0 && hoursSinceReminder > 20);               // 24h before expiry

    if (!shouldRemind) continue;

    const verifyUrl = buildFreshVerifyUrl(db, user.id);
    sendMail({
      to: user.email,
      ...reminderEmail({ name: user.name, verifyUrl, daysLeft, hoursLeft, expiryDate: user.deadline })
    }).then(() => {
      db.prepare("UPDATE users SET last_reminder_at = ?, reminder_count = COALESCE(reminder_count, 0) + 1 WHERE id = ?")
        .run(nowIso(), user.id);
      logAudit(db, { target: user.id, action: "reminder_email_sent", details: { daysLeft, hoursLeft } });
    }).catch(e => console.error("[cron] reminder email failed:", e.message));
    sent++;
  }

  if (sent) console.log(`[cron] Queued ${sent} reminder email(s).`);
}

/**
 * Clean up expired tokens to keep DB lean.
 */
function runTokenCleanup(db) {
  const now = nowIso();
  const r1 = db.prepare("UPDATE users SET verification_token_hash = NULL, verification_token_expiry = NULL WHERE email_verified = 0 AND verification_token_expiry < ?").run(now);
  const r2 = db.prepare("UPDATE users SET otp_hash = NULL, otp_expiry = NULL, otp_attempts = 0 WHERE otp_expiry < ?").run(now);
  console.log(`[cron] Cleanup: cleared ${r1.changes} expired tokens, ${r2.changes} expired OTPs.`);
}

let activeCronTasks = [];

/**
 * Register all cron jobs. Call once from server.js startup.
 */
function startVerificationCrons(db) {
  stopVerificationCrons();

  // Every hour: check for expired accounts
  const task1 = cron.schedule("0 * * * *", () => {
    console.log("[cron] Running expiry check...");
    try { runExpiryCheck(db); } catch (e) { console.error("[cron] expiry check failed:", e.message); }
  });

  // Every 4 hours: send reminder emails
  const task2 = cron.schedule("0 */4 * * *", () => {
    console.log("[cron] Running reminder email sweep...");
    try { runReminderEmails(db); } catch (e) { console.error("[cron] reminder sweep failed:", e.message); }
  });

  // Daily at 02:00 UTC: token cleanup
  const task3 = cron.schedule("0 2 * * *", () => {
    console.log("[cron] Running token cleanup...");
    try { runTokenCleanup(db); } catch (e) { console.error("[cron] token cleanup failed:", e.message); }
  });

  activeCronTasks = [task1, task2, task3];

  // Run immediately on start — wrapped in try/catch so a startup error never crashes the server
  setImmediate(() => {
    try { runExpiryCheck(db); } catch (e) { console.error("[cron] startup expiry check failed:", e.message); }
    try { runReminderEmails(db); } catch (e) { console.error("[cron] startup reminder sweep failed:", e.message); }
  });

  console.log("[cron] Verification cron jobs scheduled.");
  return stopVerificationCrons;
}

function stopVerificationCrons() {
  for (const task of activeCronTasks) {
    try { task.stop(); } catch {}
  }
  activeCronTasks = [];
}

module.exports = { startVerificationCrons, stopVerificationCrons, runExpiryCheck, runReminderEmails };
