const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "media");
const dest = path.join(root, "public", "media");

if (!fs.existsSync(src)) {
  console.warn("sync-media: media not found — skipping");
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log("Synced media → public/media");
