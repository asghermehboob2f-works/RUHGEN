/**
 * RUHGEN Email Templates — Premium dark-slate brand design with logo header.
 * All templates are self-contained HTML with inline styles for email client compatibility.
 */

const { getAppUrl } = require("./config");

const BRAND = {
  primaryAccent: "#6366F1",
  cyan: "#00D4FF",
  purple: "#7B61FF",
  bg: "#0B0F17",
  card: "#161B26",
  border: "#262E40",
  textPrimary: "#F8FAFC",
  textMuted: "#94A3B8",
  textSubtle: "#64748B",
};

function baseLayout(title, bodyContent) {
  const siteUrl = getAppUrl("base");
  const logoUrl = `${siteUrl}/media/img/logo.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: ${BRAND.bg}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.textPrimary}; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 580px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding-bottom: 28px; }
    .header-logo { height: 38px; width: auto; max-height: 38px; border: 0; outline: none; text-decoration: none; vertical-align: middle; }
    .logo-text { font-size: 24px; font-weight: 800; letter-spacing: 0.05em; color: #FFFFFF; text-decoration: none; display: inline-block; }
    .card { background-color: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 12px; padding: 32px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
    .badge { display: inline-block; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); color: #818CF8; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 700; line-height: 1.35; color: ${BRAND.textPrimary}; margin-bottom: 12px; }
    .subtitle { font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 13px 32px; background-color: ${BRAND.primaryAccent}; color: #FFFFFF !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
    .btn-center { text-align: center; margin: 28px 0; }
    .divider { border: none; border-top: 1px solid ${BRAND.border}; margin: 24px 0; }
    .small { font-size: 12px; color: ${BRAND.textSubtle}; line-height: 1.6; }
    .link-box { background-color: #0D111A; border: 1px solid ${BRAND.border}; border-radius: 8px; padding: 12px 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; word-break: break-all; color: ${BRAND.cyan}; margin: 12px 0; }
    .otp-box { background-color: #0D111A; border: 1px solid ${BRAND.border}; border-radius: 10px; padding: 22px 16px; text-align: center; margin: 20px 0; }
    .otp-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 0.35em; color: ${BRAND.cyan}; text-indent: 0.35em; }
    .otp-hint { font-size: 12px; color: ${BRAND.textSubtle}; margin-top: 10px; font-weight: 500; }
    .info-box { background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: ${BRAND.textMuted}; line-height: 1.5; }
    .warn-box { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #FCA5A5; line-height: 1.5; }
    .footer { text-align: center; padding-top: 32px; }
    .footer p { font-size: 12px; color: ${BRAND.textSubtle}; line-height: 1.7; }
    .footer a { color: ${BRAND.textMuted}; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <a href="${siteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
        <img src="${logoUrl}" alt="RUHGEN" class="header-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" />
        <span class="logo-text" style="display: none;">RUHGEN</span>
      </a>
    </div>
    <div class="card">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>© 2026 RUHGEN. All rights reserved.<br/>
      Official communication from RUHGEN Security.<br/>
      If you did not request this email, please secure your account immediately.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * One-click verification email (primary method).
 */
function verificationEmail({ name, verifyUrl, expiresHours = 72, otp }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <div class="badge">Email Verification</div>
    <div class="title">Verify your email address</div>
    <div class="subtitle">
      Hi ${firstName}, welcome to RUHGEN! Click the button below to verify your email address and activate your account.
    </div>
    <div class="btn-center">
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    </div>
    <div class="info-box">
      This verification link is valid for <strong>${expiresHours} hours</strong>. If not verified within 7 days, your account access will be paused.
    </div>
    ${otp ? `
    <div style="margin-top: 24px;">
      <p style="font-size: 13px; color: ${BRAND.textMuted}; margin-bottom: 10px;">
        <strong style="color: ${BRAND.textPrimary};">Alternative:</strong> Enter this 6-digit verification code directly on the website:
      </p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-hint">Valid for 15 minutes · Single-use code</div>
      </div>
    </div>` : ""}
    <hr class="divider" />
    <p class="small">
      If the button above does not work, copy and paste this secure link into your browser:
    </p>
    <div class="link-box">${verifyUrl}</div>
  `;
  return { subject: "Verify your RUHGEN email address", html: baseLayout("Verify Email — RUHGEN", body) };
}

/**
 * Reminder email (Day 1, 3, 6, 24h before expiry).
 */
function reminderEmail({ name, verifyUrl, daysLeft, hoursLeft }) {
  const firstName = (name || "there").split(" ")[0];
  const isUrgent = hoursLeft <= 24;
  const timeLabel = hoursLeft <= 24
    ? `${Math.max(1, hoursLeft)} hour${hoursLeft !== 1 ? "s" : ""}`
    : `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;

  const body = `
    <div class="badge" style="${isUrgent ? "background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.3); color: #FCA5A5;" : ""}">
      ${isUrgent ? "Action Required" : "Reminder"}
    </div>
    <div class="title">${isUrgent ? "Your account verification is expiring soon" : "Please verify your RUHGEN email"}</div>
    <div class="subtitle">
      Hi ${firstName}, your RUHGEN account email verification is still pending. 
      Your account will be suspended in <strong>${timeLabel}</strong> if not verified.
    </div>
    <div class="btn-center">
      <a href="${verifyUrl}" class="btn">Verify Email Now</a>
    </div>
    <hr class="divider" />
    <p class="small">
      If the button above does not work, copy and paste this link into your browser:
    </p>
    <div class="link-box">${verifyUrl}</div>
  `;
  return {
    subject: isUrgent
      ? `Action Required: Verify your RUHGEN email (${timeLabel} left)`
      : `Reminder: Verify your RUHGEN email (${timeLabel} left)`,
    html: baseLayout("Verification Reminder — RUHGEN", body),
  };
}

/**
 * Suspension notice email.
 */
function suspensionEmail({ name, verifyUrl }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <div class="badge" style="background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.3); color: #FCA5A5;">Account Suspended</div>
    <div class="title">Your account has been suspended</div>
    <div class="subtitle">
      Hi ${firstName}, your RUHGEN account has been temporarily suspended because your email address was not verified within the required timeframe.
    </div>
    <div class="warn-box">
      Verify your email address now to immediately restore full access to your account and assets.
    </div>
    <div class="btn-center">
      <a href="${verifyUrl}" class="btn">Verify & Restore Access</a>
    </div>
    <hr class="divider" />
    <p class="small">
      Direct verification link:
    </p>
    <div class="link-box">${verifyUrl}</div>
  `;
  return { subject: "RUHGEN Account Suspended — Verify email to restore access", html: baseLayout("Account Suspended — RUHGEN", body) };
}

/**
 * Verification success email.
 */
function successEmail({ name }) {
  const firstName = (name || "there").split(" ")[0];
  const siteUrl = getAppUrl("base");
  const body = `
    <div class="badge" style="background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3); color: #6EE7B7;">Account Verified</div>
    <div class="title">Email address verified</div>
    <div class="subtitle">
      Hi ${firstName}, your email address has been verified successfully. Your RUHGEN account is active with full features enabled.
    </div>
    <div class="btn-center">
      <a href="${siteUrl}/dashboard" class="btn">Go to Workspace</a>
    </div>
  `;
  return { subject: "Email verified — Welcome to RUHGEN", html: baseLayout("Email Verified — RUHGEN", body) };
}

/**
 * OTP-only email (fallback when user requests OTP separately).
 */
function otpEmail({ name, otp, expiryMinutes = 15 }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <div class="badge">Verification Code</div>
    <div class="title">Your 6-digit code</div>
    <div class="subtitle">
      Hi ${firstName}, here is your single-use verification code.
    </div>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-hint">Valid for ${expiryMinutes} minutes · Never share this code</div>
    </div>
    <div class="info-box">
      If you did not request this verification code, please ignore this email or contact security if you have concerns.
    </div>
  `;
  return { subject: `${otp} is your RUHGEN verification code`, html: baseLayout("Verification Code — RUHGEN", body) };
}

/**
 * Password Reset Email
 */
function passwordResetEmail({ name, resetUrl, otp, expiresMinutes = 30 }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <div class="badge">Password Reset</div>
    <div class="title">Reset your password</div>
    <div class="subtitle">
      Hi ${firstName}, we received a request to reset the password for your RUHGEN account. Click the button below to choose a new password, or use the 6-digit verification code.
    </div>
    <div class="btn-center">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    ${otp ? `
    <div style="margin-top: 24px;">
      <p style="font-size: 13px; color: ${BRAND.textMuted}; margin-bottom: 10px;">
        <strong style="color: ${BRAND.textPrimary};">Or use 6-digit code:</strong> Enter this code on the password reset page:
      </p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-hint">Expires in ${expiresMinutes} minutes · Do not share with anyone</div>
      </div>
    </div>` : ""}
    <div class="info-box">
      This password reset link and code will expire in <strong>${expiresMinutes} minutes</strong>.
    </div>
    <hr class="divider" />
    <p class="small">
      If the button above does not work, copy and paste this link into your browser:
    </p>
    <div class="link-box">${resetUrl}</div>
    <p class="small" style="margin-top: 16px;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account stays secure.
    </p>
  `;
  return { subject: "Reset your RUHGEN password", html: baseLayout("Reset Password — RUHGEN", body) };
}

module.exports = { verificationEmail, reminderEmail, suspensionEmail, successEmail, otpEmail, passwordResetEmail };


