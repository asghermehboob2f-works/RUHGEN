const path = require("node:path");
const fs = require("node:fs/promises");
const { hashPassword, signAdminToken } = require("./auth");
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
      const row = db.prepare("SELECT id, email, name, password_hash FROM admins WHERE email = ?").get(email);
      if (!row || hashPassword(password) !== row.password_hash) {
        return res.status(401).json({ ok: false, error: "Invalid email or password." });
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
  app.put("/api/admin/settings", requireAdmin, (req, res, next) => {
    try {
      const id = req.admin.sub;
      const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
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

      const nameIn = typeof req.body?.name === "string" ? req.body.name.trim() : row.name || "";
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
      if (folder !== "hero" && folder !== "gallery" && folder !== "img" && folder !== "showcase" && folder !== "homepage" && folder !== "academy") {
        return res.status(400).json({ ok: false, error: "Invalid folder." });
      }

      const ext = path.extname(file.originalname || "").toLowerCase();
      const imageOk = ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp";
      const videoOk = ext === ".mp4" || ext === ".webm";

      if (folder === "showcase" || folder === "hero" || folder === "homepage" || folder === "academy") {
        if (!imageOk && !videoOk) {
          return res.status(400).json({ ok: false, error: "Only images (.png, .jpg, .webp) or videos (.mp4, .webm) allowed." });
        }
        const maxBytes = folder === "academy" ? 50 * 1024 * 1024 : maxShowcaseVideoBytes;
        if (videoOk && file.size > maxBytes) {
          return res.status(400).json({ ok: false, error: `Video file too large (max ~${folder === "academy" ? 50 : 22}MB).` });
        }
      } else if (!imageOk) {
        return res.status(400).json({ ok: false, error: "Only .png, .jpg, .jpeg, .webp allowed." });
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
