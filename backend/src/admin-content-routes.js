const path = require("node:path");
const fs = require("node:fs/promises");
const {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  signAdminToken,
} = require("./auth");
const { deleteMediaUrl, extractMediaPaths } = require("./media-cleanup");

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

/**
 * Mount admin auth, settings, CMS content, and upload routes.
 */
function mountAdminContentRoutes(app, { db, requireAdmin, upload, dataDir, projectRoot, mediaRoot, publicMediaRoot, maxShowcaseVideoBytes }) {
  // Admin auth login
  app.post("/api/admin/auth/login", (req, res, next) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
      if (!email || !password) {
        return res.status(400).json({ ok: false, error: "Email and password are required." });
      }

      const ipKey = `admin-login-ip:${req.ip || "unknown"}`;
      const emailKey = `admin-login-email:${email}`;
      const ipLock = checkRateLimit(ipKey);
      if (ipLock.locked) {
        return res.status(429).json({ ok: false, error: `Too many failed login attempts. Try again in ${ipLock.minutesLeft} minute(s).` });
      }

      const row = db.prepare("SELECT id, email, name, password_hash FROM admins WHERE email = ?").get(email);
      if (!row) {
        recordFailedAttempt(ipKey);
        recordFailedAttempt(emailKey);
        return res.status(401).json({ ok: false, error: "Invalid email or password." });
      }

      const { isValid, isLegacy } = verifyPassword(password, row.password_hash);
      if (!isValid) {
        recordFailedAttempt(ipKey);
        recordFailedAttempt(emailKey);
        return res.status(401).json({ ok: false, error: "Invalid email or password." });
      }

      clearFailedAttempts(ipKey);
      clearFailedAttempts(emailKey);

      // Auto-upgrade legacy SHA256 hashes to PBKDF2
      if (isLegacy) {
        try {
          const updatedHash = hashPassword(password);
          db.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").run(updatedHash, row.id);
        } catch (upgradeErr) {
          console.error("[admin-auth] Transparent hash upgrade failed:", upgradeErr);
        }
      }

      const admin = { id: row.id, email: row.email, name: row.name || "" };
      const token = signAdminToken(admin);
      return res.json({ ok: true, token, admin });
    } catch (err) {
      next(err);
    }
  });

  // Admin auth me
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

  // Update admin settings
  app.put("/api/admin/settings", requireAdmin, async (req, res, next) => {
    try {
      const id = req.admin.sub;
      const adminEmailFromToken = typeof req.admin.email === "string" ? req.admin.email.trim().toLowerCase() : "";
      const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
      if (!currentPassword) {
        return res.status(400).json({ ok: false, error: "Current password is required to save changes." });
      }

      let row = db.prepare("SELECT id, email, name, password_hash FROM admins WHERE id = ? OR email = ?").get(id, adminEmailFromToken);
      if (!row) {
        row = db.prepare("SELECT id, email, name, password_hash FROM admins LIMIT 1").get();
      }
      if (!row) {
        return res.status(404).json({ ok: false, error: "Admin not found." });
      }

      const envPassword = process.env.ADMIN_SEED_PASSWORD;
      let { isValid: curValid, isLegacy: curLegacy } = verifyPassword(currentPassword, row.password_hash);
      if (!curValid && envPassword && currentPassword === envPassword) {
        curValid = true;
      }
      if (!curValid) {
        return res.status(400).json({ ok: false, error: "Current password is incorrect." });
      }

      const nameIn = typeof req.body?.name === "string" ? req.body.name.trim() : row.name || "";
      const name = nameIn.slice(0, 120);

      let email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : row.email;
      if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: "Invalid email address." });
      }
      const other = db.prepare("SELECT id FROM admins WHERE email = ? AND id != ?").get(email, row.id);
      if (other) {
        return res.status(400).json({ ok: false, error: "That email is already in use by another admin." });
      }

      const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
      let password_hash = row.password_hash;
      let finalPlainPassword = newPassword || currentPassword;

      if (newPassword.length > 0) {
        const passCheck = validatePasswordStrength(newPassword);
        if (!passCheck.ok) {
          return res.status(400).json({ ok: false, error: passCheck.error });
        }
        if (verifyPassword(newPassword, row.password_hash).isValid) {
          return res.status(400).json({ ok: false, error: "New password must be different from current password." });
        }
        password_hash = hashPassword(newPassword);
      } else if (curLegacy) {
        password_hash = hashPassword(currentPassword);
      }

      db.prepare("UPDATE admins SET email = ?, name = ?, password_hash = ? WHERE id = ?").run(
        email,
        name,
        password_hash,
        row.id
      );

      // Sync updated admin credentials to .env so restart retains changes
      try {
        const envPaths = [
          path.join(projectRoot, ".env"),
          path.join(projectRoot, "backend", ".env"),
        ];
        for (const envPath of envPaths) {
          let content = await fs.readFile(envPath, "utf8").catch(() => null);
          if (!content) continue;

          const updateOrAppend = (key, val) => {
            const regex = new RegExp(`^${key}=.*$`, "m");
            if (regex.test(content)) {
              content = content.replace(regex, `${key}=${val}`);
            } else {
              content += `\n${key}=${val}`;
            }
          };

          if (email) updateOrAppend("ADMIN_SEED_EMAIL", email);
          if (finalPlainPassword) updateOrAppend("ADMIN_SEED_PASSWORD", finalPlainPassword);
          if (name) updateOrAppend("ADMIN_SEED_NAME", name);

          await fs.writeFile(envPath, content, "utf8");
          console.log(`[env-sync] Updated ${envPath} with new admin seed credentials.`);
        }
        if (email) process.env.ADMIN_SEED_EMAIL = email;
        if (finalPlainPassword) process.env.ADMIN_SEED_PASSWORD = finalPlainPassword;
        if (name) process.env.ADMIN_SEED_NAME = name;
      } catch (envErr) {
        console.error("[env-sync] Failed to write updated credentials to .env:", envErr);
      }

      const admin = { id: row.id, email, name };
      const token = signAdminToken(admin);
      return res.json({ ok: true, token, admin });
    } catch (err) {
      next(err);
    }
  });

  // Site content read (Public)
  app.get("/api/admin/content", (_req, res, next) => {
    try {
      const row = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
      if (!row) {
        return res.status(500).json({ error: "Site content not initialized." });
      }
      const data = JSON.parse(row.json);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // Site content update (Admin)
  app.put("/api/admin/content", requireAdmin, async (req, res, next) => {
    try {
      const nextBody = req.body;
      if (!nextBody || typeof nextBody !== "object") {
        return res.status(400).json({ ok: false, error: "Invalid body." });
      }
      const json = JSON.stringify(nextBody);
      JSON.parse(json);

      let oldContent = null;
      try {
        const oldRow = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
        if (oldRow && oldRow.json) {
          oldContent = JSON.parse(oldRow.json);
        }
      } catch (e) {
        console.error("[cms] Could not read old site content:", e);
      }

      db.prepare("INSERT OR REPLACE INTO site_content (id, json) VALUES (1, ?)").run(json);

      if (oldContent) {
        const oldPaths = extractMediaPaths(oldContent);
        const newPaths = extractMediaPaths(nextBody);
        for (const p of oldPaths) {
          if (!newPaths.has(p)) {
            deleteMediaUrl(projectRoot, p).catch(err => {
              console.error(`[cms] Failed to delete unused media ${p}:`, err.message);
            });
          }
        }
      }

      try {
        const prettyJson = JSON.stringify(nextBody, null, 2);
        const primaryPath = path.join(dataDir, "site-content.json");
        const fallbackPath = path.join(projectRoot, "data", "site-content.json");
        await fs.writeFile(primaryPath, prettyJson, "utf8");
        await fs.writeFile(fallbackPath, prettyJson, "utf8");
        console.log("[cms] Successfully synced content updates to disk JSON files.");
      } catch (diskErr) {
        console.error("[cms] Disk sync failed:", diskErr.message);
      }

      return res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Media upload (Admin)
  app.post("/api/admin/upload", requireAdmin, upload.single("file"), async (req, res, next) => {
    try {
      const file = req.file;
      const folder = String(req.body?.folder || "");

      if (!file) {
        return res.status(400).json({ ok: false, error: "Missing file." });
      }
      if (
        folder !== "hero" &&
        folder !== "gallery" &&
        folder !== "img" &&
        folder !== "showcase" &&
        folder !== "homepage" &&
        folder !== "academy" &&
        folder !== "tutorials"
      ) {
        return res.status(400).json({ ok: false, error: "Invalid folder." });
      }

      const ext = path.extname(file.originalname || "").toLowerCase();
      const imageOk = ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp" || ext === ".gif";
      const videoOk = ext === ".mp4" || ext === ".webm" || ext === ".mov";

      if (folder === "showcase" || folder === "hero" || folder === "homepage" || folder === "academy" || folder === "tutorials") {
        if (!imageOk && !videoOk) {
          return res.status(400).json({ ok: false, error: "Only images (.png, .jpg, .webp, .gif) or videos (.mp4, .webm, .mov) allowed." });
        }
        const isBigVideoFolder = folder === "academy" || folder === "tutorials";
        const maxBytes = isBigVideoFolder ? 500 * 1024 * 1024 : maxShowcaseVideoBytes;
        if (videoOk && file.size > maxBytes) {
          return res.status(400).json({ ok: false, error: `Video file too large (max ~${isBigVideoFolder ? 500 : 22}MB).` });
        }
      } else if (!imageOk) {
        return res.status(400).json({ ok: false, error: "Only .png, .jpg, .jpeg, .webp, .gif allowed." });
      }

      const safeBase = `${require("node:crypto").randomUUID()}${ext}`;
      const targetDir = path.join(mediaRoot, folder);
      const publicDir = path.join(publicMediaRoot, folder);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.mkdir(publicDir, { recursive: true });
      await fs.writeFile(path.join(targetDir, safeBase), file.buffer);
      await fs.writeFile(path.join(publicDir, safeBase), file.buffer);

      return res.json({
        ok: true,
        src: `/media/${folder}/${safeBase}`,
        filename: safeBase,
      });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = { mountAdminContentRoutes };
