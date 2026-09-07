/**
 * RUHGEN Email Service & SMTP Transport Module
 * Configurable exclusively via environment variables.
 * Supports MAIL_* and fallback SMTP_* variables.
 * Never hardcodes production credentials or domains.
 */

const nodemailer = require("nodemailer");
const { getSmtpConfig } = require("./config");

let _transporter = null;
let _cachedConfigKey = null;

function sanitizeError(err, passwordToRedact) {
  let msg = err instanceof Error ? err.message : String(err);
  if (passwordToRedact && typeof passwordToRedact === "string" && passwordToRedact.length > 2) {
    msg = msg.split(passwordToRedact).join("[REDACTED]");
  }
  return msg;
}

function getTransporter() {
  const config = getSmtpConfig();
  const currentKey = `${config.host}:${config.port}:${config.username}:${config.password}:${config.encryption}:${config.secure}`;

  if (_transporter && _cachedConfigKey === currentKey) {
    return _transporter;
  }

  // If configuration changed, clean up previous transporter
  if (_transporter) {
    resetTransporter();
  }

  if (!config.password) {
    console.warn("[email] MAIL_PASSWORD / SMTP_PASS not set — email delivery will fail until set in .env.");
  }

  // Enforce rejectUnauthorized: true by default for production TLS security,
  // allowing opt-out only if SMTP_REJECT_UNAUTHORIZED is explicitly set to 'false'.
  const rejectUnauthorized = process.env.SMTP_REJECT_UNAUTHORIZED !== "false";

  const isPort465 = config.port === 465;
  const isPort587 = config.port === 587;

  const transportOpts = {
    host: config.host,
    port: config.port,
    secure: isPort465 ? true : (isPort587 ? false : config.secure),
    tls: {
      rejectUnauthorized,
      servername: config.host,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  };

  // On port 587, explicitly require STARTTLS upgrade
  if (isPort587 || config.encryption === "tls" || config.encryption === "starttls") {
    transportOpts.requireTLS = true;
  }

  if (config.username && config.password) {
    transportOpts.auth = {
      user: config.username,
      pass: config.password,
    };
  }

  _transporter = nodemailer.createTransport(transportOpts);
  _cachedConfigKey = currentKey;
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
  _cachedConfigKey = null;
}

function getFromHeader() {
  const config = getSmtpConfig();
  return `"${config.fromName}" <${config.fromAddress}>`;
}

/**
 * Send an email using configured SMTP transport.
 * Returns { ok: true, messageId } or { ok: false, error }.
 * Sensitive credentials are never exposed in return values or logs.
 */
async function sendMail({ to, subject, html, text }) {
  const config = getSmtpConfig();
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
    const safeError = sanitizeError(err, config.password);
    console.error(`[email] Delivery failed to ${to}: ${safeError}`);
    resetTransporter();
    return { ok: false, error: safeError };
  }
}

/**
 * Verify SMTP connection state (used at server startup and by diagnostics).
 * Returns { ok: boolean, message: string, code?: string }.
 */
async function verifyConnection() {
  const config = getSmtpConfig();
  if (!config.password) {
    return {
      ok: false,
      message: "SMTP password not set in environment (MAIL_PASSWORD / SMTP_PASS missing).",
      code: "NO_PASSWORD",
    };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log(`[email] SMTP connection verified ✓ (${config.host}:${config.port}, user: ${config.username})`);
    return { ok: true, message: `SMTP connected and authenticated as ${config.username}` };
  } catch (err) {
    const safeError = sanitizeError(err, config.password);
    console.warn(`[email] SMTP connection warning: ${safeError}`);
    return { ok: false, message: safeError, code: err.code || "SMTP_VERIFY_FAILED" };
  }
}

module.exports = { sendMail, verifyConnection, resetTransporter, getSmtpConfig };
