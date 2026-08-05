/**
 * RUHGEN Request Logger Middleware
 * Provides high-precision HTTP request timing, method, status, and payload details.
 */
function requestLogger(req, res, next) {
  const startMs = performance.now();
  const timestamp = new Date().toISOString();

  res.on("finish", () => {
    const durationMs = (performance.now() - startMs).toFixed(2);
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    
    // Ignore static asset noise if served through Express
    if (url.startsWith("/media/") && status < 400) return;

    const logMessage = `[${timestamp}] [HTTP] ${method} ${url} ${status} - ${durationMs}ms`;

    if (status >= 500) {
      console.error(logMessage);
    } else if (status >= 400) {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  });

  next();
}

module.exports = { requestLogger };
