/**
 * RUHGEN Email Templates — Premium dark-purple brand design.
 * All templates are self-contained HTML with inline styles for email client compatibility.
 */

const BRAND = {
  primaryAccent: "#555555",
  purple: "#555555",
  cyan: "#555555",
  pink: "#555555",
  bg: "#2E2E2E",
  card: "#1F1F1F",
  border: "#3A3A3A",
  textPrimary: "#FFFFFF",
  textMuted: "#CCCCCC",
  textSubtle: "#999999",
};

function baseLayout(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${BRAND.bg}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: ${BRAND.textPrimary}; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
  .header { text-align: center; padding-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: ${BRAND.primaryAccent}; }
    .card { background: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 8px; padding: 24px 20px; }
    .title { font-size: 22px; font-weight: 800; line-height: 1.3; color: ${BRAND.textPrimary}; margin-bottom: 12px; }
    .subtitle { font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.5; margin-bottom: 20px; }
    .btn { display: inline-block; padding: 12px 30px; background: ${BRAND.primaryAccent}; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; }
    .btn-center { text-align: center; margin: 24px 0; }
    .divider { border: none; border-top: 1px solid ${BRAND.border}; margin: 24px 0; }
    .small { font-size: 12px; color: ${BRAND.textSubtle}; line-height: 1.7; }
    .link-box { background: #f5f5f5; border: 1px solid ${BRAND.border}; border-radius: 6px; padding: 12px 16px; font-family: monospace; font-size: 12px; word-break: break-all; color: ${BRAND.primaryAccent}; margin: 12px 0; }
    .otp-box { background: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 32px; font-weight: 800; color: ${BRAND.primaryAccent}; }
    .otp-hint { font-size: 12px; color: ${BRAND.textSubtle}; margin-top: 8px; }
    .footer { text-align: center; padding-top: 24px; }
    .footer p { font-size: 11px; color: ${BRAND.textSubtle}; line-height: 1.7; }
    </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">RUHGEN</div>
    </div>
    <div class="card">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>© 2025 RUHGEN. All rights reserved.<br/>
      This email was sent to you because you created a RUHGEN account.<br/>
      If you did not register, please ignore this email.</p>
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
    <div class="title">Verify your email address</div>
    <div class="subtitle">
      Hi ${firstName}, welcome to RUHGEN! Click the button below to verify your email address and unlock your full account access.
    </div>
    <div class="btn-center">
      <a href="${verifyUrl}" class="btn">✓ &nbsp; Verify My Email</a>
    </div>
    <hr class="divider" />
    <div class="countdown-info">
      <p>⏱ This verification link expires in <strong>${expiresHours} hours</strong>. After 7 days without verification, your account will be suspended.</p>
    </div>
    ${otp ? `
    <div style="margin-top: 20px;">
      <p style="font-size: 13px; color: ${BRAND.textMuted}; margin-bottom: 12px;">
        <strong style="color: ${BRAND.textPrimary};">Button not working?</strong> Use this one-time code instead:
      </p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-hint">6-digit OTP — expires in 15 minutes</div>
      </div>
    </div>` : ""}
    <hr class="divider" />
    <p class="small">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <div class="link-box">${verifyUrl}</div>
    <p class="small" style="margin-top: 16px;">This link is single-use and will expire after verification or after ${expiresHours} hours, whichever comes first.</p>
  `;
  return { subject: "Verify your RUHGEN email address", html: baseLayout("Verify Email — RUHGEN", body) };
}

/**
 * Reminder email (Day 1, 3, 6, 24h before expiry).
 */
function reminderEmail({ name, verifyUrl, daysLeft, hoursLeft, expiryDate }) {
  const firstName = (name || "there").split(" ")[0];
  const isUrgent = hoursLeft <= 24;
  const timeLabel = hoursLeft <= 24
    ? `${Math.max(1, hoursLeft)} hour${hoursLeft !== 1 ? "s" : ""}`
    : `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;

  const body = `
    <div class="title">${isUrgent ? "Your account expires soon!" : "Don't forget to verify your email"}</div>
    <div class="subtitle">
      Hi ${firstName}, your RUHGEN email verification is still pending. 
      Your account will be <strong style="color: #FF2E9A;">suspended in ${timeLabel}</strong> if not verified.
    </div>
    ${isUrgent ? `
    <div class="warn-box">
    </div>` : ""}
    <div class="btn-center">
      <a href="${verifyUrl}" class="btn">✓ &nbsp; Verify Email Now</a>
    </div>
    <hr class="divider" />
    <p class="small">
      If the button doesn't work, copy and paste this link:<br />
    </p>
    <div class="link-box">${verifyUrl}</div>
    <p class="small" style="margin-top: 16px;">After suspension, you can still verify your email to restore full access.</p>
  `;
  return {
    subject: isUrgent
      ? `⚠ URGENT: Verify your email in ${timeLabel} or lose access`
      : `Reminder: Verify your RUHGEN email (${timeLabel} left)`,
    html: baseLayout("Email Verification Reminder — RUHGEN", body),
  };
}

/**
 * Suspension notice email.
 */
function suspensionEmail({ name, verifyUrl }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <div class="title">Your account has been suspended</div>
    <div class="subtitle">
      Hi ${firstName}, your RUHGEN account has been temporarily suspended because your email was not verified within the 7-day grace period.
    </div>
    <div class="warn-box">
    </div>
    <div class="btn-center">
      <a href="${verifyUrl}" class="btn">Verify Email & Restore Access</a>
    </div>
    <hr class="divider" />
    <p class="small">
      If the button doesn't work, copy and paste this link:
    </p>
    <div class="link-box">${verifyUrl}</div>
  `;
  return { subject: "Your RUHGEN account has been suspended — Verify to restore access", html: baseLayout("Account Suspended — RUHGEN", body) };
}

/**
 * Verification success email.
 */
function successEmail({ name }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <div class="title">Email successfully verified!</div>
    <div class="subtitle">
      Hi ${firstName}, your RUHGEN email has been verified. You now have full, unrestricted access to all platform features.
    </div>
    <div class="countdown-info">
      <p>✓ All verification banners and restrictions have been removed from your account.</p>
    </div>
    <div class="btn-center">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://ruhgen.in"}/dashboard" class="btn">Go to Dashboard</a>
    </div>
    <hr class="divider" />
    <p class="small">Thank you for verifying your email. You can now enjoy all features RUHGEN has to offer without any restrictions.</p>
  `;
  return { subject: "✓ Email verified — Welcome to RUHGEN!", html: baseLayout("Email Verified — RUHGEN", body) };
}

/**
 * OTP-only email (fallback when user requests OTP separately).
 */
function otpEmail({ name, otp, expiryMinutes = 15 }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <div class="title">Your verification code</div>
    <div class="subtitle">
      Hi ${firstName}, here is your 6-digit verification code. This is a one-time code valid for ${expiryMinutes} minutes.
    </div>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-hint">Expires in ${expiryMinutes} minutes · Do not share this code</div>
    </div>
    <hr class="divider" />
    <div class="warn-box">
      <p>⚠ Never share this code with anyone. RUHGEN will never ask for your OTP via phone or chat.</p>
    </div>
    <p class="small" style="margin-top: 16px;">If you did not request this code, you can safely ignore this email.</p>
  `;
  return { subject: `${otp} is your RUHGEN verification code`, html: baseLayout("Verification Code — RUHGEN", body) };
}

/**
 * Password Reset Email
 */
function passwordResetEmail({ name, resetUrl, otp, expiresMinutes = 30 }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <div class="badge" style="background: rgba(123,97,255,0.12); border-color: rgba(123,97,255,0.3); color: #7B61FF;">Password Reset</div>
    <div class="title">Reset your RUHGEN password</div>
    <div class="subtitle">
      Hi ${firstName}, we received a request to reset the password for your RUHGEN account. Click the button below to choose a new password, or use the 6-digit verification code.
    </div>
    <div class="btn-center">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <hr class="divider" />
    <div class="countdown-info">
      <p>⏱ This reset link and code will expire in <strong>${expiresMinutes} minutes</strong>.</p>
    </div>
    ${otp ? `
    <div style="margin-top: 20px;">
      <p style="font-size: 13px; color: ${BRAND.textMuted}; margin-bottom: 12px;">
        <strong style="color: ${BRAND.textPrimary};">Prefer using a verification code?</strong> Enter this 6-digit OTP on the password reset page:
      </p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-hint">6-digit OTP code · Valid for ${expiresMinutes} minutes</div>
      </div>
    </div>` : ""}
    <hr class="divider" />
    <p class="small">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <div class="link-box">${resetUrl}</div>
    <p class="small" style="margin-top: 16px;">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
  `;
  return { subject: "Reset your RUHGEN password", html: baseLayout("Reset Password — RUHGEN", body) };
}

module.exports = { verificationEmail, reminderEmail, suspensionEmail, successEmail, otpEmail, passwordResetEmail };

