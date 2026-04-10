const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { hashPassword } = require("./auth");

/**
 * Resolve directory for SQLite and local JSON (seeds, legacy migration).
 * - Default: `backend/data` next to this file (self-contained deploy).
 * - Override: absolute `DATA_DIR` (e.g. mounted volume in production).
 *
 * @param {string} projectRoot - monorepo root (parent of /backend); used for legacy `<root>/data` paths only
 * @returns {{ dataDir: string, backendRoot: string }}
 */
function resolveDataDirs(projectRoot) {
  const backendRoot = path.resolve(__dirname, "..");
  const fromEnv = process.env.DATA_DIR && String(process.env.DATA_DIR).trim();
  const dataDir = fromEnv ? path.resolve(fromEnv) : path.join(backendRoot, "data");
  return { dataDir, backendRoot };
}

/** If DB only exists under legacy repo `data/`, copy into `dataDir` once (stop server on old path first if WAL is active). */
function maybeMigrateLegacySqlite(dataDir, projectRoot) {
  const dest = path.join(dataDir, "ruhgen.sqlite");
  const legacy = path.join(projectRoot, "data", "ruhgen.sqlite");
  if (fs.existsSync(dest) || !fs.existsSync(legacy)) return;
  fs.mkdirSync(dataDir, { recursive: true });
  fs.copyFileSync(legacy, dest);
  for (const suffix of ["-wal", "-shm"]) {
    const l = legacy + suffix;
    if (fs.existsSync(l)) fs.copyFileSync(l, dest + suffix);
  }
}

function siteContentSeedPath(dataDir, projectRoot) {
  const primary = path.join(dataDir, "site-content.json");
  if (fs.existsSync(primary)) return primary;
  return path.join(projectRoot, "data", "site-content.json");
}

function legacyContactPath(dataDir, projectRoot) {
  const primary = path.join(dataDir, "contact-messages.json");
  if (fs.existsSync(primary)) return primary;
  return path.join(projectRoot, "data", "contact-messages.json");
}

function legacySubscribersPath(dataDir, projectRoot) {
  const primary = path.join(dataDir, "newsletter-subscribers.json");
  if (fs.existsSync(primary)) return primary;
  return path.join(projectRoot, "data", "newsletter-subscribers.json");
}

/**
 * @param {string} projectRoot - monorepo root (parent of /backend)
 * @returns {{ db: import("better-sqlite3").Database; dataDir: string }}
 */
function openDb(projectRoot) {
  const { dataDir } = resolveDataDirs(projectRoot);
  maybeMigrateLegacySqlite(dataDir, projectRoot);

  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "ruhgen.sqlite");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      submitted_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      subscribed_at TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'footer'
    );
    CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
  seedSiteContentIfEmpty(db, dataDir, projectRoot);
  migrateLegacyJsonIfEmpty(db, dataDir, projectRoot);
  ensureAdminFromEnv(db);
  return { db, dataDir };
}

/** Strip BOM/CR and optional wrapping quotes from .env values (Windows-friendly). */
function normalizeSeedName() {
  let n = String(process.env.ADMIN_SEED_NAME ?? "Site Admin")
    .replace(/^\uFEFF/, "")
    .trim();
  if ((n.startsWith('"') && n.endsWith('"')) || (n.startsWith("'") && n.endsWith("'"))) {
    n = n.slice(1, -1).trim();
  }
  return n || "Site Admin";
}

function getSeedCredentials() {
  const email = String(process.env.ADMIN_SEED_EMAIL ?? "admin@ruhgen.local")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
  const rawPw = process.env.ADMIN_SEED_PASSWORD;
  const password =
    rawPw != null && String(rawPw).replace(/^\uFEFF/, "").trim() !== ""
      ? String(rawPw).replace(/^\uFEFF/, "").trim()
      : "admin123";
  const name = normalizeSeedName();
  return { email, password, name };
}

/**
 * Keeps SQLite `admins` in sync with ADMIN_SEED_* from .env when the API starts.
 * - Empty table: insert one operator from env.
 * - Exactly one row: update email, password hash, and name from env (so changing .env fixes login).
 * - Multiple rows: update only the row whose email matches ADMIN_SEED_EMAIL.
 * Set ADMIN_SEED_DISABLE_SYNC=1 to only seed an empty DB (legacy behavior).
 */
function ensureAdminFromEnv(db) {
  const legacyOnly = ["1", "true", "yes"].includes(
    String(process.env.ADMIN_SEED_DISABLE_SYNC ?? "")
      .trim()
      .toLowerCase()
  );
  if (legacyOnly) {
    seedAdminsIfEmptyOnly(db);
    return;
  }

  const { email, password, name } = getSeedCredentials();
  const password_hash = hashPassword(password);

  const count = db.prepare("SELECT COUNT(*) AS c FROM admins").get().c;
  if (count === 0) {
    const crypto = require("node:crypto");
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    db.prepare(
      "INSERT INTO admins (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(id, email, password_hash, name, created_at);
    return;
  }

  if (count === 1) {
    const row = db.prepare("SELECT id FROM admins LIMIT 1").get();
    if (row) {
      db.prepare("UPDATE admins SET email = ?, password_hash = ?, name = ? WHERE id = ?").run(
        email,
        password_hash,
        name,
        row.id
      );
    }
    return;
  }

  const found = db.prepare("SELECT id FROM admins WHERE email = ?").get(email);
  if (found) {
    db.prepare("UPDATE admins SET password_hash = ?, name = ? WHERE id = ?").run(
      password_hash,
      name,
      found.id
    );
  }
}

function seedAdminsIfEmptyOnly(db) {
  const crypto = require("node:crypto");
  const n = db.prepare("SELECT COUNT(*) AS c FROM admins").get().c;
  if (n > 0) return;

  const { email, password, name } = getSeedCredentials();
  const id = crypto.randomUUID();
  const password_hash = hashPassword(password);
  const created_at = new Date().toISOString();

  db.prepare(
    "INSERT INTO admins (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, email, password_hash, name, created_at);
}

function seedSiteContentIfEmpty(db, dataDir, projectRoot) {
  const row = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
  if (row) return;
  const seedPath = siteContentSeedPath(dataDir, projectRoot);
  if (fs.existsSync(seedPath)) {
    const json = fs.readFileSync(seedPath, "utf8");
    JSON.parse(json);
    db.prepare("INSERT INTO site_content (id, json) VALUES (1, ?)").run(json);
    return;
  }
  const fallback = JSON.stringify({
    hero: { previews: [] },
    gallery: { items: [] },
    showcase: {
      slides: [
        {
          id: "show-1",
          title: "Face swap",
          caption:
            "Identity-aware blends that respect lighting, skin tone, and camera angle—built for believable hero shots.",
          videoSrc: "",
        },
        {
          id: "show-2",
          title: "Background genius",
          caption:
            "Replace environments in one pass—studio cyclorama, matte painting, or full CG—with depth-aware separation.",
          videoSrc: "",
        },
        {
          id: "show-3",
          title: "Motion trials",
          caption:
            "Export ultra-short motion snippets for socials and client review without burning full-length credits.",
          videoSrc: "",
        },
      ],
    },
  });
  db.prepare("INSERT INTO site_content (id, json) VALUES (1, ?)").run(fallback);
}

function migrateLegacyJsonIfEmpty(db, dataDir, projectRoot) {
  const contactFile = legacyContactPath(dataDir, projectRoot);
  const n = db.prepare("SELECT COUNT(*) AS c FROM contact_messages").get().c;
  if (n === 0 && fs.existsSync(contactFile)) {
    try {
      const raw = fs.readFileSync(contactFile, "utf8");
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      const ins = db.prepare(
        "INSERT OR IGNORE INTO contact_messages (id, name, email, message, submitted_at) VALUES (?, ?, ?, ?, ?)"
      );
      for (const row of data) {
        if (
          row &&
          typeof row.id === "string" &&
          typeof row.name === "string" &&
          typeof row.email === "string" &&
          typeof row.message === "string" &&
          typeof row.submittedAt === "string"
        ) {
          ins.run(row.id, row.name, row.email, row.message, row.submittedAt);
        }
      }
    } catch {
      /* ignore corrupt legacy file */
    }
  }

  const subFile = legacySubscribersPath(dataDir, projectRoot);
  const ns = db.prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers").get().c;
  if (ns === 0 && fs.existsSync(subFile)) {
    try {
      const raw = fs.readFileSync(subFile, "utf8");
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      const ins = db.prepare(
        "INSERT OR IGNORE INTO newsletter_subscribers (email, subscribed_at, source) VALUES (?, ?, ?)"
      );
      for (const row of data) {
        if (
          row &&
          typeof row.email === "string" &&
          typeof row.subscribedAt === "string"
        ) {
          const source = typeof row.source === "string" ? row.source : "footer";
          ins.run(row.email.trim().toLowerCase(), row.submittedAt, source);
        }
      }
    } catch {
      /* ignore */
    }
  }
}

module.exports = { openDb };
