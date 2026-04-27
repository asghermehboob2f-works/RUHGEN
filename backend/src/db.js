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
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      suspended INTEGER NOT NULL DEFAULT 0,
      subscription_plan TEXT NOT NULL DEFAULT 'free',
      subscription_status TEXT NOT NULL DEFAULT 'active',
      admin_notes TEXT NOT NULL DEFAULT ''
    );

    -- Community: posts shared by members (images/videos generated in studio
    -- or pasted external URLs).  Counters are denormalized for fast feed reads.
    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('image','video')),
      media_url TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      prompt TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      width INTEGER NOT NULL DEFAULT 0,
      height INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      saves INTEGER NOT NULL DEFAULT 0,
      comments_count INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      removed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_posts_created
      ON community_posts (removed, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_community_posts_user
      ON community_posts (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_community_posts_kind
      ON community_posts (kind, removed, created_at DESC);

    CREATE TABLE IF NOT EXISTS community_likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_likes_user
      ON community_likes (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS community_saves (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_saves_user
      ON community_saves (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_comments_post
      ON community_comments (post_id, created_at DESC);

    -- Per-IP/per-user view tracking so view counts can't be inflated by spam.
    CREATE TABLE IF NOT EXISTS community_views (
      post_id TEXT NOT NULL,
      viewer_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, viewer_key)
    );
  `);
  seedSiteContentIfEmpty(db, dataDir, projectRoot);
  migrateLegacyJsonIfEmpty(db, dataDir, projectRoot);
  syncSiteContentFromSeedFile(db, dataDir, projectRoot);
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

/**
 * Admin UI reads site content only from SQLite. The repo's `data/site-content.json` usually has
 * real `/media/...` paths while an older DB row has empty hero/gallery/showcase placeholders.
 * Sync from the seed file so /admindashboard/content matches assets on disk (same idea as the
 * Next.js merge for the public homepage).
 */
function syncSiteContentFromSeedFile(db, dataDir, projectRoot) {
  const seedPath = siteContentSeedPath(dataDir, projectRoot);
  if (!fs.existsSync(seedPath)) return;
  let seed;
  try {
    seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  } catch {
    return;
  }

  const row = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
  if (!row) return;
  let data;
  try {
    data = JSON.parse(row.json);
  } catch {
    return;
  }

  let changed = false;
  if (syncHeroPreviewsFromSeed(data, seed)) changed = true;
  if (syncGalleryItemsFromSeed(data, seed)) changed = true;
  if (syncShowcaseSlidesFromSeed(data, seed)) changed = true;

  if (changed) {
    db.prepare("UPDATE site_content SET json = ? WHERE id = 1").run(JSON.stringify(data));
  }
}

function heroPreviewHasSrc(p) {
  return p && typeof p.src === "string" && p.src.trim() !== "";
}

function syncHeroPreviewsFromSeed(data, seed) {
  const seedPrev = seed?.hero?.previews;
  if (!Array.isArray(seedPrev) || seedPrev.length === 0) return false;
  if (!seedPrev.some(heroPreviewHasSrc)) return false;

  const dbPrev = data.hero?.previews;
  if (!Array.isArray(dbPrev) || dbPrev.length === 0) {
    data.hero = JSON.parse(JSON.stringify(seed.hero));
    return true;
  }
  const allMissing = dbPrev.every((p) => !heroPreviewHasSrc(p));
  if (allMissing) {
    data.hero = JSON.parse(JSON.stringify(seed.hero));
    return true;
  }

  const byId = new Map(seedPrev.filter((p) => p && p.id).map((p) => [p.id, p]));
  let changed = false;
  for (let i = 0; i < dbPrev.length; i++) {
    const p = dbPrev[i];
    if (!p || heroPreviewHasSrc(p)) continue;
    let s = byId.get(p.id);
    if (!s || !heroPreviewHasSrc(s)) s = seedPrev[i];
    if (s && heroPreviewHasSrc(s)) {
      p.src = s.src;
      if (typeof s.alt === "string" && s.alt.trim()) p.alt = s.alt;
      if (typeof s.prompt === "string") p.prompt = s.prompt;
      changed = true;
    }
  }
  return changed;
}

function galleryItemHasSrc(g) {
  return g && typeof g.src === "string" && g.src.trim() !== "";
}

function syncGalleryItemsFromSeed(data, seed) {
  const seedItems = seed?.gallery?.items;
  if (!Array.isArray(seedItems) || seedItems.length === 0) return false;
  if (!seedItems.some(galleryItemHasSrc)) return false;

  const dbItems = data.gallery?.items;
  if (!Array.isArray(dbItems) || dbItems.length === 0) {
    data.gallery = JSON.parse(JSON.stringify(seed.gallery));
    return true;
  }
  const allMissing = dbItems.every((g) => !galleryItemHasSrc(g));
  if (allMissing) {
    data.gallery = JSON.parse(JSON.stringify(seed.gallery));
    return true;
  }

  const byId = new Map(seedItems.filter((g) => g && g.id).map((g) => [g.id, g]));
  let changed = false;
  for (let i = 0; i < dbItems.length; i++) {
    const g = dbItems[i];
    if (!g || galleryItemHasSrc(g)) continue;
    let s = byId.get(g.id);
    if (!s || !galleryItemHasSrc(s)) s = seedItems[i];
    if (s && galleryItemHasSrc(s)) {
      g.src = s.src;
      if (typeof s.alt === "string" && s.alt.trim()) g.alt = s.alt;
      if (typeof s.prompt === "string") g.prompt = s.prompt;
      if (typeof s.category === "string" && s.category.trim()) g.category = s.category;
      changed = true;
    }
  }
  return changed;
}

function slideHasVideo(s) {
  return s && typeof s.videoSrc === "string" && s.videoSrc.trim() !== "";
}

function syncShowcaseSlidesFromSeed(data, seed) {
  const seedSlides = seed?.showcase?.slides;
  if (!Array.isArray(seedSlides) || seedSlides.length === 0) return false;
  if (!seedSlides.some(slideHasVideo)) return false;

  const dbSlides = data.showcase?.slides;
  if (!Array.isArray(dbSlides) || dbSlides.length === 0) {
    data.showcase = JSON.parse(JSON.stringify(seed.showcase));
    return true;
  }
  const allMissing = dbSlides.every((s) => !slideHasVideo(s));
  if (allMissing) {
    data.showcase = JSON.parse(JSON.stringify(seed.showcase));
    return true;
  }

  const byId = new Map(seedSlides.filter((s) => s && s.id).map((s) => [s.id, s]));
  let changed = false;
  for (let i = 0; i < dbSlides.length; i++) {
    const slide = dbSlides[i];
    if (!slide || slideHasVideo(slide)) continue;
    let src = byId.get(slide.id);
    if (!src || !slideHasVideo(src)) src = seedSlides[i];
    if (src && slideHasVideo(src)) {
      slide.videoSrc = src.videoSrc;
      if (typeof src.title === "string" && src.title.trim()) slide.title = src.title;
      if (typeof src.caption === "string" && src.caption.trim()) slide.caption = src.caption;
      changed = true;
    }
  }
  return changed;
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
