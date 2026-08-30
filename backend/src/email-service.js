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

  const transportOpts = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === "true",
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  };

  if (config.username && config.password) {
    transportOpts.auth = {
      user: config.username,
      pass: config.password,
    };
  }

  _transporter = nodemailer.createTransport(transportOpts);
  return _transporter;
}

function resetTransporter() {
  if (_transporter && typeof _transporter.close === "function") {
    try {
      _transporter.close();
    } catch {
      /* ignore */
    }
  }
  _transporter = null;
}

function getFromHeader() {
  const config = getSmtpConfig();
  return `"${config.fromName}" <${config.fromAddress}>`;
}

/**
 * Send an email using configured SMTP transport.
 * Returns { ok: true, messageId } or { ok: false, error }.
 */
async function sendMail({ to, subject, html, text }) {
  try {
    const transporter = getTransporter();
    const from = getFromHeader();
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log(`[email] Sent "${subject}" to ${to} (id: ${info.messageId || "ok"})`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[email] Delivery failed to", to, ":", errMsg);
    resetTransporter();
    return { ok: false, error: errMsg };
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

module.exports = { sendMail, verifyConnection, resetTransporter };
