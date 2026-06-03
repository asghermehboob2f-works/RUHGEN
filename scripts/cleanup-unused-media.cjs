const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

// Load environment variables if present
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

function resolveDataDir() {
  const fromEnv = process.env.DATA_DIR && String(process.env.DATA_DIR).trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(repoRoot, "backend", "data");
}

const dataDir = resolveDataDir();
const dbPath = path.join(dataDir, "ruhgen.sqlite");

console.log(`Database path: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error("Database file not found. Run the project first to create it.");
  process.exit(1);
}

// 1. Gather all referenced URLs
const referencedPaths = new Set([
  // Hardcoded static assets
  "/media/img/logo.png",
  "/media/img/logo1.png",
  "/media/features-monolith.png",
  "/media/features-editorial.png",
  "/media/features-sculpture.png",
  "/media/features-draft.png",
  "/media/features-master.png",
  "/media/features-sculpture-raw.png",
]);

// Helper to traverse object and extract media urls
function extractMediaUrls(val) {
  if (typeof val === "string") {
    if (val.startsWith("/media/") || val.startsWith("/community-media/")) {
      referencedPaths.add(val.trim());
    }
  } else if (Array.isArray(val)) {
    for (const item of val) extractMediaUrls(item);
  } else if (val && typeof val === "object") {
    for (const key of Object.keys(val)) {
      extractMediaUrls(val[key]);
    }
  }
}

try {
  // Use better-sqlite3 from backend node_modules
  const Database = require(path.join(repoRoot, "backend", "node_modules", "better-sqlite3"));
  const db = new Database(dbPath, { readonly: true });

  // A. Extract from site_content
  const scRow = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
  if (scRow && scRow.json) {
    try {
      const parsed = JSON.parse(scRow.json);
      extractMediaUrls(parsed);
    } catch (e) {
      console.error("Failed to parse site_content JSON:", e);
    }
  }

  // B. Extract from academy_tutorials
  const tutorials = db.prepare("SELECT video_url, thumbnail_url FROM academy_tutorials").all();
  for (const t of tutorials) {
    if (t.video_url) extractMediaUrls(t.video_url);
    if (t.thumbnail_url) extractMediaUrls(t.thumbnail_url);
  }

  // C. Extract from community_posts
  const posts = db.prepare("SELECT media_url, thumbnail_url FROM community_posts WHERE removed = 0").all();
  for (const p of posts) {
    if (p.media_url) extractMediaUrls(p.media_url);
    if (p.thumbnail_url) extractMediaUrls(p.thumbnail_url);
  }

  db.close();
} catch (e) {
  console.error("Error reading from database:", e);
  console.log("Reading references from data/site-content.json on disk as fallback...");
  const fallbackJsonPath = path.join(repoRoot, "data", "site-content.json");
  if (fs.existsSync(fallbackJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(fallbackJsonPath, "utf8"));
      extractMediaUrls(parsed);
    } catch (err) {
      console.error("Failed to read fallback JSON file:", err);
    }
  }
}

console.log(`Gathered ${referencedPaths.size} referenced media file paths.`);

// Directories to scan
const scanDirs = [
  { urlPrefix: "/media/", localPath: path.join(repoRoot, "media") },
  { urlPrefix: "/media/", localPath: path.join(repoRoot, "public", "media") },
  { urlPrefix: "/community-media/", localPath: path.join(repoRoot, "media", "community-media") },
  { urlPrefix: "/community-media/", localPath: path.join(repoRoot, "public", "community-media") },
];

let deletedCount = 0;
let bytesSaved = 0;

function walkDirAndCleanup(dirInfo, currentDir) {
  if (!fs.existsSync(currentDir)) return;

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      // Recursively walk subdirectories
      walkDirAndCleanup(dirInfo, fullPath);
      // Clean up empty directories if they are empty
      try {
        const remaining = fs.readdirSync(fullPath);
        if (remaining.length === 0) {
          fs.rmdirSync(fullPath);
          console.log(`Removed empty folder: ${fullPath}`);
        }
      } catch (e) {}
    } else {
      // It is a file. Calculate its relative URL path.
      // e.g. for /media/ hero/pic.jpg relative is hero/pic.jpg
      const relativeToMedia = path.relative(dirInfo.localPath, fullPath).replace(/\\/g, "/");
      const fileUrl = `${dirInfo.urlPrefix}${relativeToMedia}`;

      // Exclude README.md files
      if (entry.name.toLowerCase() === "readme.md") {
        continue;
      }

      if (!referencedPaths.has(fileUrl)) {
        try {
          const stats = fs.statSync(fullPath);
          fs.unlinkSync(fullPath);
          deletedCount++;
          bytesSaved += stats.size;
          console.log(`Deleted unused file: ${fileUrl} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        } catch (err) {
          console.error(`Failed to delete ${fullPath}:`, err.message);
        }
      }
    }
  }
}

for (const dirInfo of scanDirs) {
  console.log(`Scanning ${dirInfo.localPath}...`);
  walkDirAndCleanup(dirInfo, dirInfo.localPath);
}

const mbSaved = (bytesSaved / 1024 / 1024).toFixed(2);
console.log(`\nCleanup completed!`);
console.log(`Deleted ${deletedCount} unused files.`);
console.log(`Freed ${mbSaved} MB of space.`);
