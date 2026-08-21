const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha512";

const COMMON_WEAK_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password123",
  "admin123",
  "qwerty123",
  "welcome123",
  "letmein123",
  "iloveyou",
  "pass1234",
  "ruhgen123",
]);

/**
 * Validates password complexity and security guidelines.
 * @param {string} password
 * @returns {{ ok: boolean, error?: string }}
 */
function validatePasswordStrength(password) {
  if (typeof password !== "string") {
    return { ok: false, error: "Password must be a valid string." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters long." };
  }
  if (password.length > 128) {
    return { ok: false, error: "Password cannot exceed 128 characters." };
  }
  if (password.trim() !== password) {
    return { ok: false, error: "Password cannot contain leading or trailing spaces." };
  }
  const lower = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lower)) {
    return { ok: false, error: "This password is too simple and easily guessed. Please choose a stronger password." };
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!hasLower) {
    return { ok: false, error: "Password must include at least one lowercase letter." };
  }
  if (!hasUpper) {
    return { ok: false, error: "Password must include at least one uppercase letter." };
  }
  if (!hasNumber && !hasSymbol) {
    return { ok: false, error: "Password must include at least one number or special character." };
  }

  return { ok: true };
}

/**
 * Securely hashes a password using PBKDF2 with a random 16-byte salt.
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(
    String(password),
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  );
  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Timing-safe password verification supporting legacy SHA256 and modern PBKDF2 hashes.
 * @param {string} password
 * @param {string} storedHash
 * @returns {{ isValid: boolean, isLegacy: boolean }}
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return { isValid: false, isLegacy: false };
  }

  const strPass = String(password);

  if (typeof storedHash === "string" && storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 4) return { isValid: false, isLegacy: false };

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const expectedHashBuf = Buffer.from(parts[3], "hex");

    if (!iterations || !salt || expectedHashBuf.length === 0) {
      return { isValid: false, isLegacy: false };
    }

    const actualHashBuf = crypto.pbkdf2Sync(
      strPass,
      salt,
      iterations,
      expectedHashBuf.length,
      PBKDF2_DIGEST
    );

    const isValid =
      actualHashBuf.length === expectedHashBuf.length &&
      crypto.timingSafeEqual(actualHashBuf, expectedHashBuf);

    return { isValid, isLegacy: false };
  }

  // Legacy SHA256 hash comparison
  const legacyActualHashBuf = crypto
    .createHash("sha256")
    .update(strPass, "utf8")
    .digest();
  const legacyExpectedHashBuf = Buffer.from(String(storedHash), "hex");

  if (legacyActualHashBuf.length !== legacyExpectedHashBuf.length) {
    return { isValid: false, isLegacy: true };
  }

  const isValid = crypto.timingSafeEqual(legacyActualHashBuf, legacyExpectedHashBuf);
  return { isValid, isLegacy: true };
}

// In-memory rate-limiter for failed auth attempts
const failedAttemptsMap = new Map();

function checkRateLimit(key, maxAttempts = 5, lockMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = failedAttemptsMap.get(key);
  if (entry && entry.lockUntil > now) {
    const minutesLeft = Math.ceil((entry.lockUntil - now) / 60000);
    return { locked: true, minutesLeft };
  }
  return { locked: false };
}

function recordFailedAttempt(key, maxAttempts = 5, lockMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = failedAttemptsMap.get(key) || { count: 0, lockUntil: 0 };
  if (entry.lockUntil <= now) {
    entry.count = 0;
  }
  entry.count += 1;
  if (entry.count >= maxAttempts) {
    entry.lockUntil = now + lockMs;
  }
  failedAttemptsMap.set(key, entry);
}

function clearFailedAttempts(key) {
  failedAttemptsMap.delete(key);
}

function getJwtSecret() {
  const s =
    process.env.ADMIN_JWT_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    process.env.USER_JWT_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim();
  if (!s) {
    return "ruhgen-production-fallback-jwt-secret-key-change-in-env-998822";
  }
  return s;
}

/**
 * @param {{ id: string; email: string; name: string }} admin
 */
function signAdminToken(admin) {
  return jwt.sign(
    { typ: "admin", sub: admin.id, email: admin.email, name: admin.name },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function verifyAdminToken(token) {
  return jwt.verify(token, getJwtSecret());
}

/**
 * @param {{ id: string; email: string; name: string }} user
 */
function signUserToken(user) {
  return jwt.sign(
    { typ: "user", sub: user.id, email: user.email, name: user.name },
    getJwtSecret(),
    { expiresIn: "30d" }
  );
}

function verifyUserToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getJwtSecret,
  signAdminToken,
  verifyAdminToken,
  signUserToken,
  verifyUserToken,
};
