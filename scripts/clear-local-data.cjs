/**
 * Removes local SQLite + WAL/SHM and optionally the Next.js .next cache.
 * Browser sessions (member + admin) live in localStorage — clear those in DevTools
 * or run the snippet printed at the end.
 *
 * Usage (from repo root):
 *   node scripts/clear-local-data.cjs --yes
 *   node scripts/clear-local-data.cjs --yes --next
 *
 * Stop `npm run dev` / `dev:full` / `dev:backend` before running so the DB is not locked.
 */

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

function applyEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

applyEnvFile(path.join(repoRoot, ".env"));
applyEnvFile(path.join(repoRoot, ".env.local"));

function rmIfExists(p) {
  try {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      return true;
    }
  } catch (e) {
    const msg = e && (e.code || e.message) ? `${e.code || ""} ${e.message || e}`.trim() : String(e);
    console.error(`Could not remove ${p}: ${msg}`);
    if (e && e.code === "EBUSY") {
      console.error(
        "  → Stop the Express API (and anything using this SQLite file), then run this script again."
      );
    }
  }
  return false;
}

function resolveDataDir() {
  const fromEnv = process.env.DATA_DIR && String(process.env.DATA_DIR).trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(repoRoot, "backend", "data");
}

const SQLITE_NAMES = ["ruhgen.sqlite", "ruhgen.sqlite-wal", "ruhgen.sqlite-shm"];

/** Optional JSON files that may sit next to SQLite (legacy / seeds). */
const EXTRA_DATA_FILES = [
  "site-content.json",
  "contact-messages.json",
  "newsletter-subscribers.json",
];

function clearDirSqliteAndJson(dir) {
  if (!fs.existsSync(dir)) return [];
  const removed = [];
  for (const name of [...SQLITE_NAMES, ...EXTRA_DATA_FILES]) {
    const fp = path.join(dir, name);
    if (rmIfExists(fp)) removed.push(fp);
  }
  return removed;
}

const args = process.argv.slice(2);
const yes = args.includes("--yes");
const withNext = args.includes("--next");

if (!yes) {
  console.error(
    "Refusing to run without --yes (destructive).\n" +
      "  node scripts/clear-local-data.cjs --yes\n" +
      "  node scripts/clear-local-data.cjs --yes --next   # also delete .next cache\n"
  );
  process.exit(1);
}

const removed = [];

const dataDir = resolveDataDir();
removed.push(...clearDirSqliteAndJson(dataDir));

const legacyData = path.join(repoRoot, "data");
removed.push(...clearDirSqliteAndJson(legacyData));

if (withNext) {
  const nextDir = path.join(repoRoot, ".next");
  if (rmIfExists(nextDir)) removed.push(nextDir);
}

console.log("Removed:");
if (removed.length === 0) {
  console.log("  (nothing found — already clean or paths differ)");
} else {
  for (const p of removed) console.log(" ", p);
}

console.log(`
DATA_DIR used: ${dataDir}

Clear browser storage for this site (Application → Local storage → your origin), or paste in the console:

  ["ruhgen_admin_auth_v1","ruhgen_auth_users_v1","ruhgen_auth_session_v1","ruhgen-theme","ruhgen_remember_email","ruhgen-notify-email","ruhgen-notify-product","ruhgen-notify-marketing"].forEach(k => localStorage.removeItem(k));

Restart the API so SQLite is recreated from .env on next start.
`);
