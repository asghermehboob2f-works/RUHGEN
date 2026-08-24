// Reloaded with Live Razorpay Credentials
require("dotenv").config({ path: require("node:path").join(__dirname, "..", "..", ".env") });
require("dotenv").config({ path: require("node:path").join(__dirname, "..", "..", ".env.local") });

const path = require("node:path");
const cors = require("cors");
const express = require("express");
const multer = require("multer");

const { openDb } = require("./db");
const { validateConfig } = require("./config");
const { verifyAdminToken } = require("./auth");
const { requireAdmin } = require("./middleware/adminAuth");
const { requestLogger } = require("./middleware/requestLogger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  verificationLimiter,
  contactFormLimiter,
  studioLimiter,
} = require("./middleware/rateLimiter");
const { mountStudioRoutes } = require("./studio-routes");
const { mountUserAuthRoutes } = require("./user-auth-routes");
const { mountCommunityRoutes } = require("./community-routes");
const { mountAcademyRoutes } = require("./academy-routes");
const { mountFaqRoutes } = require("./faq-routes");
const { mountAdminUsersRoutes } = require("./admin-users-routes");
const { mountVerificationRoutes } = require("./verification-routes");
const { startVerificationCrons, stopVerificationCrons } = require("./verification-cron");
const { mountPaymentRoutes } = require("./payment-routes");
const { mountSupportRoutes } = require("./support-routes");
const { mountAdminContentRoutes } = require("./admin-content-routes");
const { mountContactRoutes } = require("./contact-routes");
const { mountNewsletterRoutes } = require("./newsletter-routes");

const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 4000, 10);
const projectRoot = path.resolve(__dirname, "..", "..");

const { db, dataDir } = openDb(projectRoot);
validateConfig();

const MEDIA_ROOT = path.join(projectRoot, "media");
const PUBLIC_MEDIA_ROOT = path.join(projectRoot, "public", "media");
const MAX_SHOWCASE_VIDEO_BYTES = 22 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB for video uploads
});

const app = express();
app.disable("x-powered-by");

// --- Security Headers Middleware ---
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// --- Standard Security & Utility Middlewares ---
const allowedOrigins = [
  process.env.APP_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((allowed) => allowed.replace(/\/$/, "") === origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      return callback(null, true); // Dev/permissive fallback
    },
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "4mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf ? buf.toString("utf8") : "";
    },
  })
);
app.use(requestLogger);

// --- Rate Limiting ---
app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/admin/auth/login", authLimiter);
app.use("/api/auth/forgot-password", passwordResetLimiter);
app.use("/api/auth/reset-password", passwordResetLimiter);
app.use("/api/verify-email", verificationLimiter);
app.use("/api/verification", verificationLimiter);
app.use("/api/contact", contactFormLimiter);
app.use("/api/newsletter", contactFormLimiter);
app.use("/api/studio/generate", studioLimiter);
app.use("/api/studio/generate-video", studioLimiter);

// --- Static Media Serving with Video Streaming Header Support ---
const mediaStaticOptions = {
  acceptRanges: true,
  setHeaders: (res, filePath) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range, Authorization");
    const lower = filePath.toLowerCase();
    if (lower.endsWith(".mov") || lower.endsWith(".mp4") || lower.endsWith(".m4v") || lower.endsWith(".mkv")) {
      res.setHeader("Content-Type", "video/mp4");
    } else if (lower.endsWith(".webm")) {
      res.setHeader("Content-Type", "video/webm");
    }
  },
};

app.use("/media", express.static(MEDIA_ROOT, mediaStaticOptions));
app.use("/media", express.static(PUBLIC_MEDIA_ROOT, mediaStaticOptions));

// --- Root & Health Check ---
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "ruhgen-backend", message: "RUHGEN Express API Backend operational" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ruhgen-backend" });
});

// --- Route Registrations ---
mountAdminContentRoutes(app, {
  db,
  requireAdmin,
  upload,
  dataDir,
  projectRoot,
  mediaRoot: MEDIA_ROOT,
  publicMediaRoot: PUBLIC_MEDIA_ROOT,
  maxShowcaseVideoBytes: MAX_SHOWCASE_VIDEO_BYTES,
});
mountContactRoutes(app, { db, requireAdmin });
mountNewsletterRoutes(app, { db, requireAdmin });
mountUserAuthRoutes(app, { db });
mountVerificationRoutes(app, { db });
mountStudioRoutes(app, { upload, db });
mountCommunityRoutes(app, { db });
mountAcademyRoutes(app, { db, projectRoot });
mountFaqRoutes(app, { db });
mountAdminUsersRoutes(app, { db });
mountPaymentRoutes(app, { db, verifyAdminToken });
mountSupportRoutes(app, { db, verifyAdminToken, upload, dataDir });

// --- Central Error & 404 Handlers ---
app.use(notFoundHandler);
app.use(errorHandler);

// --- Server Lifecycle & Graceful Shutdown ---
const server = app.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] Server listening on http://127.0.0.1:${PORT} (data: ${dataDir})`);
  startVerificationCrons(db);
});

let isShuttingDown = false;
function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[backend] ${signal} received. Initiating graceful shutdown...`);

  stopVerificationCrons();

  server.close((err) => {
    if (err) {
      console.error("[backend] Error closing HTTP server:", err);
    } else {
      console.log("[backend] HTTP server closed.");
    }

    try {
      if (db && typeof db.close === "function") {
        db.close();
        console.log("[backend] SQLite database connection closed safely.");
      }
    } catch (dbErr) {
      console.error("[backend] Error closing SQLite database:", dbErr);
    }

    process.exit(err ? 1 : 0);
  });

  // Force shutdown after 10 seconds if connections refuse to close
  setTimeout(() => {
    console.error("[backend] Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

module.exports = app;
