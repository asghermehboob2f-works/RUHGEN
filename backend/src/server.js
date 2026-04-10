require("dotenv").config({ path: require("node:path").join(__dirname, "..", "..", ".env") });
require("dotenv").config({ path: require("node:path").join(__dirname, "..", "..", ".env.local") });

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const cors = require("cors");
const express = require("express");
const multer = require("multer");
const { openDb } = require("./db");
const { hashPassword, signAdminToken, verifyAdminToken } = require("./auth");

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 4000, 10);
const projectRoot = path.resolve(__dirname, "..", "..");

const { db, dataDir } = openDb(projectRoot);

const MEDIA_ROOT = path.join(projectRoot, "media");
const PUBLIC_MEDIA_ROOT = path.join(projectRoot, "public", "media");
const MAX_SHOWCASE_VIDEO_BYTES = 22 * 1024 * 1024;

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

function getBearer(req) {
  const auth = String(req.headers.authorization || "").trim();
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

/** Admin JWT (issued by POST /api/admin/auth/login). */
function requireAdmin(req, res, next) {
  const bearer = getBearer(req);
  if (!bearer) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
  try {
    const payload = verifyAdminToken(bearer);
    if (payload.typ !== "admin" || typeof payload.sub !== "string") {
      throw new Error("invalid");
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "4mb" }));

// --- Admin auth (SQLite `admins` table; seed on first run) ---
app.post("/api/admin/auth/login", (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password.trim() : "";
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required." });
    }
    const row = db
      .prepare("SELECT id, email, name, password_hash FROM admins WHERE email = ?")
      .get(email);
    if (!row) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }
    if (hashPassword(password) !== row.password_hash) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }
    const admin = { id: row.id, email: row.email, name: row.name || "" };
    let token;
    try {
      token = signAdminToken(admin);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Auth not configured.";
      return res.status(500).json({ ok: false, error: msg });
    }
    return res.json({ ok: true, token, admin });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error.";
    return res.status(500).json({ ok: false, error: msg });
  }
});

app.get("/api/admin/auth/me", requireAdmin, (req, res) => {
  const p = req.admin;
  return res.json({
    ok: true,
    admin: {
      id: p.sub,
      email: p.email,
      name: typeof p.name === "string" ? p.name : "",
    },
  });
});

/** Update logged-in admin profile / password. Requires current password. */
app.put("/api/admin/settings", requireAdmin, (req, res) => {
  try {
    const id = req.admin.sub;
    const currentPassword =
      typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    if (!currentPassword) {
      return res.status(400).json({ ok: false, error: "Current password is required." });
    }

    const row = db.prepare("SELECT id, email, name, password_hash FROM admins WHERE id = ?").get(id);
    if (!row) {
      return res.status(404).json({ ok: false, error: "Admin not found." });
    }
    if (hashPassword(currentPassword) !== row.password_hash) {
      return res.status(400).json({ ok: false, error: "Current password is incorrect." });
    }

    const nameIn =
      typeof req.body?.name === "string" ? req.body.name.trim() : row.name || "";
    const name = nameIn.slice(0, 120);

    let email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : row.email;
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email address." });
    }
    const other = db.prepare("SELECT id FROM admins WHERE email = ? AND id != ?").get(email, id);
    if (other) {
      return res.status(400).json({ ok: false, error: "That email is already in use." });
    }

    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    let password_hash = row.password_hash;
    if (newPassword.length > 0) {
      if (newPassword.length < 8) {
        return res.status(400).json({ ok: false, error: "New password must be at least 8 characters." });
      }
      password_hash = hashPassword(newPassword);
    }

    db.prepare("UPDATE admins SET email = ?, name = ?, password_hash = ? WHERE id = ?").run(
      email,
      name,
      password_hash,
      id
    );

    const admin = { id, email, name };
    let token;
    try {
      token = signAdminToken(admin);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Auth not configured.";
      return res.status(500).json({ ok: false, error: msg });
    }
    return res.json({ ok: true, token, admin });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error.";
    return res.status(500).json({ ok: false, error: msg });
  }
});

// --- Site content (public read for CMS payload) ---
app.get("/api/admin/content", (_req, res) => {
  try {
    const row = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
    if (!row) {
      return res.status(500).json({ error: "Site content not initialized." });
    }
    const data = JSON.parse(row.json);
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "Failed to read site content." });
  }
});

app.put("/api/admin/content", requireAdmin, (req, res) => {
  try {
    const nextBody = req.body;
    if (!nextBody || typeof nextBody !== "object") {
      return res.status(400).json({ ok: false, error: "Invalid body." });
    }
    const json = JSON.stringify(nextBody);
    JSON.parse(json);
    db.prepare("INSERT OR REPLACE INTO site_content (id, json) VALUES (1, ?)").run(json);
    return res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return res.status(400).json({ ok: false, error: msg });
  }
});

// --- Contact ---
app.post("/api/contact", (req, res) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!name || !isValidEmail(email) || message.length < 8) {
      return res.status(400).json({
        ok: false,
        error: "Please provide your name, a valid email, and a message (8+ characters).",
      });
    }
    const id = crypto.randomUUID();
    const submittedAt = new Date().toISOString();
    const msg = message.slice(0, 8000);
    const nameTrim = name.slice(0, 200);
    db.prepare(
      "INSERT INTO contact_messages (id, name, email, message, submitted_at) VALUES (?, ?, ?, ?, ?)"
    ).run(id, nameTrim, email.toLowerCase(), msg, submittedAt);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error." });
  }
});

app.get("/api/admin/contact-messages", requireAdmin, (_req, res) => {
  try {
    const rows = db
      .prepare(
        "SELECT id, name, email, message, submitted_at AS submittedAt FROM contact_messages ORDER BY submitted_at DESC"
      )
      .all();
    return res.json({ ok: true, messages: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return res.status(msg === "Unauthorized." ? 401 : 400).json({ ok: false, error: msg });
  }
});

// --- Newsletter ---
app.post("/api/newsletter/subscribe", (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email." });
    }
    const normalized = email.trim().toLowerCase();
    const existing = db
      .prepare("SELECT email FROM newsletter_subscribers WHERE email = ?")
      .get(normalized);
    if (existing) {
      return res.json({ ok: true });
    }
    db.prepare(
      "INSERT INTO newsletter_subscribers (email, subscribed_at, source) VALUES (?, ?, ?)"
    ).run(normalized, new Date().toISOString(), "footer");
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error." });
  }
});

app.get("/api/admin/newsletter", requireAdmin, (_req, res) => {
  try {
    const subscribers = db
      .prepare(
        "SELECT email, subscribed_at AS subscribedAt, source FROM newsletter_subscribers ORDER BY subscribed_at DESC"
      )
      .all();
    return res.json({ ok: true, subscribers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return res.status(401).json({ ok: false, error: msg });
  }
});

// --- Media upload ---
app.post("/api/admin/upload", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const folder = String(req.body?.folder || "");

    if (!file) {
      return res.status(400).json({ ok: false, error: "Missing file." });
    }
    if (folder !== "hero" && folder !== "gallery" && folder !== "img" && folder !== "showcase") {
      return res.status(400).json({ ok: false, error: "Invalid folder." });
    }

    const ext = path.extname(file.originalname || "").toLowerCase();
    const imageOk = ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp";
    const videoOk = ext === ".mp4" || ext === ".webm";
    if (folder === "showcase") {
      if (!videoOk) {
        return res.status(400).json({ ok: false, error: "Showcase: only .mp4 or .webm (short clips, ~3s recommended)." });
      }
      if (file.size > MAX_SHOWCASE_VIDEO_BYTES) {
        return res.status(400).json({ ok: false, error: "Showcase video too large (max ~22MB). Export a shorter clip." });
      }
    } else if (!imageOk) {
      return res.status(400).json({ ok: false, error: "Only .png, .jpg, .jpeg, .webp allowed." });
    }

    const safeBase = `${crypto.randomUUID()}${ext}`;
    const targetDir = path.join(MEDIA_ROOT, folder);
    const publicDir = path.join(PUBLIC_MEDIA_ROOT, folder);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.mkdir(publicDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, safeBase), file.buffer);
    await fs.writeFile(path.join(publicDir, safeBase), file.buffer);

    return res.json({
      ok: true,
      src: `/media/${folder}/${safeBase}`,
      filename: safeBase,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return res.status(401).json({ ok: false, error: msg });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ruhgen-backend" });
});

app.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] http://127.0.0.1:${PORT} (data: ${dataDir})`);
});
