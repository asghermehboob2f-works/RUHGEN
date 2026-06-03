const fs = require("node:fs/promises");
const path = require("node:path");

/**
 * Safely deletes a media file from both /media and /public/media folders.
 * Checks for path traversal and ignores static system assets.
 * 
 * @param {string} projectRoot - Root path of the repository.
 * @param {string} mediaUrl - Path of the media file (e.g. "/media/hero/foo.jpg").
 */
async function deleteMediaUrl(projectRoot, mediaUrl) {
  if (!mediaUrl || typeof mediaUrl !== "string" || !mediaUrl.startsWith("/media/")) {
    return;
  }

  // Safe relative path to prevent directory traversal
  const normalized = path.normalize(mediaUrl).replace(/^(\.\.(\/|\\))+/, "");
  if (!normalized.startsWith("/media/") && !normalized.startsWith("media/")) {
    return;
  }

  const rel = normalized.replace(/^\/?media\//, "");
  if (!rel || rel.includes("..")) {
    return;
  }

  // Check if it is a hardcoded static file
  const isStatic = [
    "img/logo.png",
    "img/logo1.png",
    "features-monolith.png",
    "features-editorial.png",
    "features-sculpture.png",
    "features-draft.png",
    "features-master.png",
    "features-sculpture-raw.png"
  ].some(sf => rel === sf || rel.endsWith(sf));

  if (isStatic) return;

  const p1 = path.resolve(projectRoot, "media", rel);
  const p2 = path.resolve(projectRoot, "public", "media", rel);

  // Extra safety checks to ensure paths are within the media directories
  if (!p1.startsWith(path.join(projectRoot, "media"))) return;
  if (!p2.startsWith(path.join(projectRoot, "public", "media"))) return;

  try {
    await fs.unlink(p1);
    console.log(`[cleanup] Deleted source file: ${p1}`);
  } catch (e) {
    // Ignore error if not exist
  }

  try {
    await fs.unlink(p2);
    console.log(`[cleanup] Deleted public copy: ${p2}`);
  } catch (e) {
    // Ignore error if not exist
  }
}

/**
 * Traverses a JSON object and collects all strings that look like /media/ paths.
 * 
 * @param {any} obj - Object to extract paths from.
 * @returns {Set<string>} - Set of extracted media paths.
 */
function extractMediaPaths(obj) {
  const paths = new Set();
  function traverse(val) {
    if (typeof val === "string") {
      if (val.startsWith("/media/")) {
        paths.add(val.trim());
      }
    } else if (Array.isArray(val)) {
      for (const item of val) traverse(item);
    } else if (val && typeof val === "object") {
      for (const key of Object.keys(val)) traverse(val[key]);
    }
  }
  traverse(obj);
  return paths;
}

module.exports = {
  deleteMediaUrl,
  extractMediaPaths
};
