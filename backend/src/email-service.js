/**
 * RUHGEN Email Service & SMTP Transport Module
 * Configurable exclusively via environment variables.
 * Supports MAIL_* and fallback SMTP_* variables.
 * Never hardcodes production credentials or domains.
 */

const nodemailer = require("nodemailer");
const { getSmtpConfig } = require("./config");

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const config = getSmtpConfig();

  if (!config.password) {
    console.warn("[email] MAIL_PASSWORD / SMTP_PASS not set — email delivery will fail until set in .env.");
  }

  _transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  return _transporter;
}

function getFromHeader() {
  const config = getSmtpConfig();
  return `"${config.fromName}" <${config.fromAddress}>`;
}

/**
 * Send an email using configured SMTP transport.
 * Returns { ok: true } or { ok: false, error }.
 */
async function sendMail({ to, subject, html, text }) {
  try {
    const transporter = getTransporter();
    const from = getFromHeader();
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log(`[email] Sent "${subject}" to ${to}`);
    return { ok: true };
  } catch (err) {
    console.error("[email] Delivery failed:", err instanceof Error ? err.message : String(err));
    return { ok: false, error: err instanceof Error ? err.message : "Email delivery failed." };
  }
}

/**
 * Verify SMTP connection state (used at server startup).
 */
async function verifyConnection() {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("[email] SMTP connection verified ✓");
    return true;
  } catch (err) {
    console.warn("[email] SMTP connection warning:", err instanceof Error ? err.message : String(err));
    return false;
  }
}

module.exports = { sendMail, verifyConnection };
