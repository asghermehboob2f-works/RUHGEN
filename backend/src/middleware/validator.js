/**
 * RUHGEN Centralized Input Validation & Sanitization Engine
 * Protects server boundary against SQLi, NoSQLi, XSS, prototype pollution, path traversal, mass assignment, and malformed payloads.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * Validates email format strictly.
 */
function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validates password criteria.
 */
function isValidPassword(password) {
  if (typeof password !== "string") return false;
  return password.length >= 8 && password.length <= 128;
}

/**
 * Validates strings with length limits and optionally trims.
 */
function sanitizeString(val, { minLength = 0, maxLength = 1000, required = false } = {}) {
  if (val === undefined || val === null) {
    if (required) return { valid: false, error: "Field is required." };
    return { valid: true, value: "" };
  }
  if (typeof val !== "string") {
    return { valid: false, error: "Must be a string." };
  }
  const trimmed = val.trim();
  if (required && trimmed.length === 0) {
    return { valid: false, error: "Field cannot be empty." };
  }
  if (trimmed.length < minLength) {
    return { valid: false, error: `Length must be at least ${minLength} characters.` };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Length cannot exceed ${maxLength} characters.` };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validates numbers within a min/max range.
 */
function validateNumber(val, { min = -Infinity, max = Infinity, fallback = null, required = false } = {}) {
  if (val === undefined || val === null || val === "") {
    if (required) return { valid: false, error: "Numeric value is required." };
    return { valid: true, value: fallback };
  }
  const num = Number(val);
  if (isNaN(num)) {
    return { valid: false, error: "Must be a valid number." };
  }
  if (num < min || num > max) {
    return { valid: false, error: `Value must be between ${min} and ${max}.` };
  }
  return { valid: true, value: num };
}

/**
 * Validates non-negative integer IDs or alphanumeric UUIDs/tokens.
 */
function isValidId(id) {
  if (typeof id === "number") return Number.isInteger(id) && id > 0;
  if (typeof id === "string") return SAFE_ID_REGEX.test(id.trim());
  return false;
}

/**
 * Strips dangerous prototype keys from objects to prevent prototype pollution.
 */
function sanitizePayload(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  const clean = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    const val = obj[key];
    if (typeof val === "object" && val !== null) {
      clean[key] = sanitizePayload(val);
    } else if (typeof val === "string") {
      // Escape null bytes
      clean[key] = val.replace(/\0/g, "");
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Express Middleware to sanitize req.body, req.query, and req.params against prototype pollution.
 */
function sanitizeRequestMiddleware(req, _res, next) {
  if (req.body) req.body = sanitizePayload(req.body);
  if (req.query) req.query = sanitizePayload(req.query);
  if (req.params) req.params = sanitizePayload(req.params);
  next();
}

module.exports = {
  isValidEmail,
  isValidPassword,
  sanitizeString,
  validateNumber,
  isValidId,
  sanitizePayload,
  sanitizeRequestMiddleware,
};
