/**
 * RUHGEN Email Service
 * SMTP: mail.ruhgen.in:465 with SSL/TLS
 * All credentials loaded from environment variables.
 */

const nodemailer = require("nodemailer");

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || "mail.ruhgen.in";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || process.env.SMTP_FROM_EMAIL || "verify@ruhgen.in";
  const pass = process.env.SMTP_PASS;

  if (!pass) {
    console.warn("[email] SMTP_PASS not set — email sending will fail.");
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: true, // SSL/TLS on port 465
    auth: { user, pass: pass || "" },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  return _transporter;
}

const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "verify@ruhgen.in";
const FROM_NAME = process.env.SMTP_FROM_NAME || "RUHGEN";
const FROM = `"${FROM_NAME}" <${FROM_EMAIL}>`;

/**
 * Send an email. Returns { ok: true } or { ok: false, error }.
 */
async function sendMail({ to, subject, html, text }) {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log(`[email] Sent "${subject}" to ${to}`);
    return { ok: true };
  } catch (err) {
    console.error("[email] Send failed:", err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Verify SMTP connection (used at startup / health check).
 */
async function verifyConnection() {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("[email] SMTP connection verified ✓");
    return true;
  } catch (err) {
    console.warn("[email] SMTP connection failed:", err.message);
    return false;
  }
}

module.exports = { sendMail, verifyConnection };
