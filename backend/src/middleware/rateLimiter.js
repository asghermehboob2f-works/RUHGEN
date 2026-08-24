/**
 * RUHGEN Rate Limiter Middleware
 * Memory-efficient sliding window rate limiter for sensitive authentication and API routes.
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = "Too many requests, please try again later." } = {}) {
  const requests = new Map();

  // Periodic cleanup every 5 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, valid);
      }
    }
  }, 5 * 60 * 1000);
  if (cleanupTimer.unref) cleanupTimer.unref();

  return function rateLimiter(req, res, next) {
    const ip = String(req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1").split(",")[0].trim();
    const now = Date.now();
    const timestamps = requests.get(ip) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= max) {
      console.warn(`[RateLimit Exceeded] IP: ${ip} on path ${req.originalUrl || req.url}`);
      return res.status(429).json({
        ok: false,
        error: message,
      });
    }

    validTimestamps.push(now);
    requests.set(ip, validTimestamps);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - validTimestamps.length));

    next();
  };
}

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 login/signup attempts per 15 mins
  message: "Too many authentication attempts. Please try again after 15 minutes.",
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 password reset requests per 15 mins
  message: "Too many password reset requests. Please try again after 15 minutes.",
});

const verificationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 verification requests/OTPs per 15 mins
  message: "Too many verification attempts. Please try again after 15 minutes.",
});

const contactFormLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 contact/newsletter submissions per hour
  message: "Too many submissions. Please try again later.",
});

const studioLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 studio generation/editing requests per minute
  message: "Studio generation limit exceeded. Please slow down.",
});

const apiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 180, // 180 requests per minute
  message: "Rate limit exceeded. Please slow down.",
});

module.exports = {
  createRateLimiter,
  authLimiter,
  passwordResetLimiter,
  verificationLimiter,
  contactFormLimiter,
  studioLimiter,
  apiLimiter,
};
