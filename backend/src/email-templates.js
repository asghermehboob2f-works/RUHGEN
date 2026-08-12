/**
 * RUHGEN Email Templates — Premium dark-purple brand design.
 * All templates are self-contained HTML with inline styles for email client compatibility.
 */

const BRAND = {
  purple: "#7B61FF",
  cyan: "#00D4FF",
  pink: "#FF2E9A",
  bg: "#0A0A0F",
  card: "#111118",
  border: "#1E1E2E",
  textPrimary: "#FFFFFF",
  textMuted: "#8B8BA7",
  textSubtle: "#4A4A6A",
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
    .header { text-align: center; padding-bottom: 32px; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(135deg, ${BRAND.purple}, ${BRAND.cyan}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card { background: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 16px; padding: 40px 36px; }
    .title { font-size: 24px; font-weight: 800; line-height: 1.3; letter-spacing: -0.5px; color: ${BRAND.textPrimary}; margin-bottom: 12px; }
    .subtitle { font-size: 15px; color: ${BRAND.textMuted}; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, ${BRAND.purple} 0%, ${BRAND.cyan} 100%); color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; letter-spacing: 0.2px; box-shadow: 0 8px 24px -8px rgba(123,97,255,0.5); }
    .btn-center { text-align: center; margin: 28px 0; }
    .divider { border: none; border-top: 1px solid ${BRAND.border}; margin: 28px 0; }
    .small { font-size: 12px; color: ${BRAND.textSubtle}; line-height: 1.7; }
    .link-box { background: rgba(123,97,255,0.06); border: 1px solid rgba(123,97,255,0.2); border-radius: 8px; padding: 12px 16px; font-family: monospace; font-size: 12px; word-break: break-all; color: ${BRAND.cyan}; margin: 12px 0; }
    .otp-box { background: linear-gradient(135deg, rgba(123,97,255,0.08), rgba(0,212,255,0.04)); border: 1px solid rgba(123,97,255,0.25); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; background: linear-gradient(135deg, ${BRAND.purple}, ${BRAND.cyan}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .otp-hint { font-size: 12px; color: ${BRAND.textSubtle}; margin-top: 8px; }
    .badge { display: inline-block; background: rgba(123,97,255,0.12); border: 1px solid rgba(123,97,255,0.2); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: ${BRAND.purple}; text-transform: uppercase; margin-bottom: 20px; }
    .warn-box { background: rgba(255,46,154,0.06); border: 1px solid rgba(255,46,154,0.2); border-radius: 10px; padding: 14px 18px; margin: 20px 0; }
    .warn-box p { font-size: 13px; color: #FF2E9A; font-weight: 600; }
    .footer { text-align: center; padding-top: 24px; }
    .footer p { font-size: 11px; color: ${BRAND.textSubtle}; line-height: 1.7; }
    .countdown-info { background: rgba(0,212,255,0.06); border: 1px solid rgba(0,212,255,0.15); border-radius: 10px; padding: 14px 18px; margin: 20px 0; }
    .countdown-info p { font-size: 13px; color: ${BRAND.cyan}; }
    .steps { counter-reset: step; }
    .step { display: flex; gap: 14px; margin-bottom: 14px; align-items: flex-start; }
    .step-num { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, ${BRAND.purple}, ${BRAND.cyan}); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .step-text { font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.5; padding-top: 3px; }
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
    <div class="badge">Email Verification</div>
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
    <div class="badge" style="${isUrgent ? `background: rgba(255,46,154,0.12); border-color: rgba(255,46,154,0.3); color: #FF2E9A;` : ""}">
      ${isUrgent ? "⚠ Urgent Reminder" : "Verification Reminder"}
    </div>
    <div class="title">${isUrgent ? "Your account expires soon!" : "Don't forget to verify your email"}</div>
    <div class="subtitle">
      Hi ${firstName}, your RUHGEN email verification is still pending. 
      Your account will be <strong style="color: #FF2E9A;">suspended in ${timeLabel}</strong> if not verified.
    </div>
    ${isUrgent ? `
    <div class="warn-box">
      <p>⚠ Account suspension on ${new Date(expiryDate).toLocaleDateString("en-IN", { dateStyle: "long" })}. All your data will be preserved, but access will be blocked.</p>
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
    <div class="badge" style="background: rgba(255,46,154,0.12); border-color: rgba(255,46,154,0.3); color: #FF2E9A;">Account Suspended</div>
    <div class="title">Your account has been suspended</div>
    <div class="subtitle">
      Hi ${firstName}, your RUHGEN account has been temporarily suspended because your email was not verified within the 7-day grace period.
    </div>
    <div class="warn-box">
      <p>Your account data is safe and preserved. Verify your email to restore immediate access.</p>
    </div>
    <div class="btn-center">
      <a href="${verifyUrl}" class="btn" style="background: linear-gradient(135deg, #FF2E9A, #7B61FF);">Verify Email & Restore Access</a>
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
    <div class="badge" style="background: rgba(0,212,255,0.10); border-color: rgba(0,212,255,0.25); color: #00D4FF;">Verified ✓</div>
    <div class="title">Email successfully verified!</div>
    <div class="subtitle">
      Hi ${firstName}, your RUHGEN email has been verified. You now have full, unrestricted access to all platform features.
    </div>
    <div class="countdown-info">
      <p>✓ All verification banners and restrictions have been removed from your account.</p>
    </div>
    <div class="btn-center">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://ruhgen.in"}/dashboard" class="btn" style="background: linear-gradient(135deg, #00D4FF, #7B61FF);">Go to Dashboard</a>
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
    <div class="badge">OTP Verification</div>
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

