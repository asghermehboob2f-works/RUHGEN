const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

// Sync standard media
const src = path.join(root, "media");
const dest = path.join(root, "public", "media");

if (fs.existsSync(src)) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log("Synced media → public/media");
}

// Sync community media
const srcComm = path.join(root, "media", "community-media");
const destComm = path.join(root, "public", "community-media");

if (fs.existsSync(srcComm)) {
  fs.mkdirSync(destComm, { recursive: true });
  fs.cpSync(srcComm, destComm, { recursive: true });
  console.log("Synced community media → public/community-media");
}
