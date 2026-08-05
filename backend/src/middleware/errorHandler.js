/**
 * RUHGEN Centralized Error Handling Middleware for Express.
 * Guarantees unhandled exceptions return structured JSON error responses.
 */
function errorHandler(err, req, res, _next) {
  const status = typeof err.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message = err.message || "Internal server error.";

  console.error(`[Express Error] [${req.method} ${req.originalUrl || req.url}]`, err);

  if (res.headersSent) {
    return;
  }

  return res.status(status).json({
    ok: false,
    error: message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}

/**
 * 404 Fallback Middleware for unmatched API routes.
 */
function notFoundHandler(req, res) {
  if (res.headersSent) return;
  return res.status(404).json({
    ok: false,
    error: `Route ${req.method} ${req.originalUrl || req.url} not found.`,
  });
}

module.exports = { errorHandler, notFoundHandler };
