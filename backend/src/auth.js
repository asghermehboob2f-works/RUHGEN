const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password), "utf8").digest("hex");
}

function getJwtSecret() {
  const s = process.env.ADMIN_JWT_SECRET?.trim() || process.env.ADMIN_SECRET?.trim();
  if (!s) {
    throw new Error("ADMIN_JWT_SECRET or ADMIN_SECRET must be set for admin API auth.");
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
  getJwtSecret,
  signAdminToken,
  verifyAdminToken,
  signUserToken,
  verifyUserToken,
};
