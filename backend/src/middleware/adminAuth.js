const { verifyAdminToken } = require("../auth");

function getBearer(req) {
  const auth = String(req.headers.authorization || "").trim();
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

/** Admin JWT verification middleware. */
function requireAdmin(req, res, next) {
  const bearer = getBearer(req);
  if (!bearer) {
    console.warn("[auth] missing bearer token");
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
  try {
    const payload = verifyAdminToken(bearer);
    if (payload.typ !== "admin" || typeof payload.sub !== "string") {
      console.warn("[auth] invalid payload typ or sub", payload);
      throw new Error("invalid");
    }
    req.admin = payload;
    next();
  } catch (err) {
    console.error("[auth] jwt verification failed:", err.message);
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
}

module.exports = { requireAdmin, getBearer };
