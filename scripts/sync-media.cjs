const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "media", "img");
const dest = path.join(root, "public", "media", "img");

if (!fs.existsSync(src)) {
  console.warn("sync-media: media/img not found — skipping");
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log("Synced media/img → public/media/img");
