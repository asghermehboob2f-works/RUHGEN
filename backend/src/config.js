/**
 * RUHGEN Production Configuration & Environment Manager
 * Centralizes all AI Provider, SMTP, and Security Configuration.
 * Never hardcodes production domains or secrets in application logic.
 */

const path = require("node:path");

function getAppUrl(type, token = "") {
  const baseAppUrl = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  if (type === "verification") {
    const configuredUrl = process.env.EMAIL_VERIFICATION_URL?.trim();
    if (configuredUrl) {
      const fullUrl = configuredUrl.includes("://")
        ? configuredUrl
        : `${baseAppUrl}${configuredUrl.startsWith("/") ? "" : "/"}${configuredUrl}`;
      if (!token) return fullUrl;
      const separator = fullUrl.includes("?") ? "&" : "?";
      return `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
    }
    return token
      ? `${baseAppUrl}/api/verify-email?token=${encodeURIComponent(token)}`
      : `${baseAppUrl}/verify-email`;
  }

  if (type === "password_reset") {
    const configuredUrl = process.env.PASSWORD_RESET_URL?.trim();
    if (configuredUrl) {
      const fullUrl = configuredUrl.includes("://")
        ? configuredUrl
        : `${baseAppUrl}${configuredUrl.startsWith("/") ? "" : "/"}${configuredUrl}`;
      if (!token) return fullUrl;
      const separator = fullUrl.includes("?") ? "&" : "?";
      return `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
    }
    return token
      ? `${baseAppUrl}/reset-password?token=${encodeURIComponent(token)}`
      : `${baseAppUrl}/reset-password`;
  }

  return baseAppUrl;
}

function parseExpiryMs(val, defaultMs) {
  if (!val) return defaultMs;
  const str = String(val).trim().toLowerCase();
  if (str.endsWith("h")) return parseFloat(str) * 3600 * 1000;
  if (str.endsWith("m")) return parseFloat(str) * 60 * 1000;
  if (str.endsWith("s")) return parseFloat(str) * 1000;
  if (str.endsWith("d")) return parseFloat(str) * 86400 * 1000;
  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return defaultMs;
  return num > 1000 ? num * 1000 : num * 60 * 1000;
}

const TRACKED_ENV_KEYS = [
  "KIE_API_KEY",
  "KIE_BASE_URL",
  "KIE_WEBHOOK_SECRET",
  "RUGEN_STANDARD_API_KEY",
  "RUGEN_STANDARD_API_URL",
  "RUGEN_STANDARD_MODEL",
  "RUGEN_PREMIUM_API_KEY",
  "RUGEN_PREMIUM_API_URL",
  "RUGEN_PREMIUM_MODEL",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USERNAME",
  "MAIL_PASSWORD",
  "MAIL_ENCRYPTION",
  "MAIL_FROM_ADDRESS",
  "MAIL_FROM_NAME",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_ENCRYPTION",
  "SMTP_FROM_EMAIL",
  "SMTP_FROM_NAME",
  "SMTP_REJECT_UNAUTHORIZED",
  "VERIFY_GRACE_DAYS",
  "VERIFY_LINK_TTL_HOURS",
  "VERIFY_OTP_TTL_MINUTES",
  "VERIFY_MAX_RESEND_PER_DAY",
  "VERIFY_RESEND_COOLDOWN_MINUTES",
];

function readFreshEnv() {
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const envPaths = [
      path.resolve(__dirname, "..", "..", ".env"),
      path.resolve(__dirname, "..", ".env"),
    ];
    for (const envPath of envPaths) {
      if (!fs.existsSync(envPath)) continue;
      const content = fs.readFileSync(envPath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (TRACKED_ENV_KEYS.includes(key)) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.error("[config] Error re-reading .env file:", err.message);
  }
}

function getImageConfig(tier = "standard") {
  readFreshEnv();

  const isStandard =
    tier === "standard" || tier === "fast" || tier === "schnell";

  if (isStandard) {
    const apiKey = (process.env.RUGEN_STANDARD_API_KEY || "").trim();
    const apiUrl = (
      process.env.RUGEN_STANDARD_API_URL ||
      "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b"
    ).trim();
    const model = (process.env.RUGEN_STANDARD_MODEL || "flux.2-klein-4b").trim();

    return { tier: "standard", apiKey, apiUrl, model };
  } else {
    const apiKey = (process.env.RUGEN_PREMIUM_API_KEY || "").trim();
    const apiUrl = (
      process.env.RUGEN_PREMIUM_API_URL ||
      "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b"
    ).trim();
    const model = (process.env.RUGEN_PREMIUM_MODEL || "flux.2-klein-4b").trim();

    return { tier: "premium", apiKey, apiUrl, model };
  }
}

function getVideoConfig(tier = "standard") {
  readFreshEnv();
  const kie = getKieConfig();
  return {
    tier: tier === "premium" ? "premium" : "standard",
    isConfigured: kie.isConfigured,
    provider: "kie.ai",
  };
}

function getSmtpConfig() {
  readFreshEnv();

  const host = (
    process.env.MAIL_HOST ||
    process.env.SMTP_HOST ||
    "mail.ruhgen.in"
  ).trim();

  const port = Number(
    process.env.MAIL_PORT || process.env.SMTP_PORT || 465
  );

  const username = (
    process.env.MAIL_USERNAME ||
    process.env.SMTP_USER ||
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_FROM_EMAIL ||
    ""
  ).trim();

  const password = (
    process.env.MAIL_PASSWORD ||
    process.env.SMTP_PASS ||
    ""
  ).trim();

  const encryption = (
    process.env.MAIL_ENCRYPTION ||
    process.env.SMTP_ENCRYPTION ||
    (port === 465 ? "ssl" : "tls")
  ).trim().toLowerCase();

  const fromAddress = (
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_FROM_EMAIL ||
    username ||
    "verify@ruhgen.in"
  ).trim();

  const fromName = (
    process.env.MAIL_FROM_NAME ||
    process.env.SMTP_FROM_NAME ||
    "RUHGEN"
  ).trim();

  const secure = port === 465 || encryption === "ssl";

  return {
    host,
    port,
    username,
    password,
    encryption,
    fromAddress,
    fromName,
    secure,
  };
}

function getVerificationPolicy() {
  readFreshEnv();
  const graceDays = Number(process.env.VERIFY_GRACE_DAYS) || 7;
  const linkTtlHours = Math.round(
    parseExpiryMs(
      process.env.VERIFY_LINK_TTL_HOURS || process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY,
      72 * 3600 * 1000
    ) / (3600 * 1000)
  );
  const otpTtlMinutes = Math.round(
    parseExpiryMs(
      process.env.VERIFY_OTP_TTL_MINUTES,
      15 * 60 * 1000
    ) / (60 * 1000)
  );
  const resetTtlMinutes = Math.round(
    parseExpiryMs(
      process.env.PASSWORD_RESET_TOKEN_EXPIRY,
      30 * 60 * 1000
    ) / (60 * 1000)
  );
  const maxResendPerDay = Number(process.env.VERIFY_MAX_RESEND_PER_DAY) || 5;
  const resendCooldownMinutes = Number(process.env.VERIFY_RESEND_COOLDOWN_MINUTES) || 2;

  return {
    graceDays,
    linkTtlHours,
    otpTtlMinutes,
    resetTtlMinutes,
    maxResendPerDay,
    resendCooldownMinutes,
  };
}

function getKieConfig() {
  readFreshEnv();
  const apiKey = (process.env.KIE_API_KEY || "").trim();
  const baseUrl = (process.env.KIE_BASE_URL || "https://api.kie.ai").trim().replace(/\/$/, "");
  const webhookSecret = (process.env.KIE_WEBHOOK_SECRET || "").trim();

  return {
    apiKey,
    baseUrl,
    webhookSecret,
    isConfigured: Boolean(apiKey && !apiKey.includes("your_kie_api_key")),
  };
}

function validateConfig() {
  console.log("─────────────────────────────────────────────────────────────");
  console.log("[config] Validating RUHGEN production configuration...");

  const appUrl = getAppUrl("base");
  const verifyUrl = getAppUrl("verification");
  const resetUrl = getAppUrl("password_reset");

  console.log(`[config] APP_URL: ${appUrl}`);
  console.log(`[config] EMAIL_VERIFICATION_URL: ${verifyUrl}`);
  console.log(`[config] PASSWORD_RESET_URL: ${resetUrl}`);

  const kie = getKieConfig();
  console.log(
    `[config] KIE.ai Provider API: ${kie.isConfigured ? "Configured ✓" : "WARNING: Missing or placeholder KIE_API_KEY"}`
  );
  console.log(`[config] KIE.ai Base URL: ${kie.baseUrl}`);

  const stdImg = getImageConfig("standard");
  const premImg = getImageConfig("premium");
  console.log(
    `[config] Image Standard API: ${stdImg.apiKey ? "Configured ✓" : "Legacy/Fallback key not set"}`
  );
  console.log(
    `[config] Image Premium API: ${premImg.apiKey ? "Configured ✓" : "Legacy/Fallback key not set"}`
  );

  console.log(
    `[config] Video Engine (KIE.ai): ${kie.isConfigured ? "Configured ✓" : "WARNING: Missing or placeholder KIE_API_KEY"}`
  );

  const smtp = getSmtpConfig();
  console.log(
    `[config] SMTP Server: ${smtp.host}:${smtp.port} [secure: ${smtp.secure}] (${smtp.username ? "auth user set ✓" : "WARNING: no user set"})`
  );
  console.log("─────────────────────────────────────────────────────────────");
}

module.exports = {
  getAppUrl,
  parseExpiryMs,
  getKieConfig,
  getImageConfig,
  getVideoConfig,
  getSmtpConfig,
  getVerificationPolicy,
  validateConfig,
};
