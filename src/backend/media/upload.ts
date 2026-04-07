import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/backend/auth/admin";

/** Source folder (synced to public on build); public mirror for instant dev/static serving */
const MEDIA_ROOT = path.join(process.cwd(), "media");
const PUBLIC_MEDIA_ROOT = path.join(process.cwd(), "public", "media");

const MAX_SHOWCASE_VIDEO_BYTES = 22 * 1024 * 1024; // ~3s HD; raise if needed

export type AdminMediaUploadResult = {
  src: string;
  filename: string;
};

export async function saveAdminMediaUpload(req: Request): Promise<AdminMediaUploadResult> {
  requireAdmin(req);
  const form = await req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "");

  if (!(file instanceof File)) throw new Error("Missing file.");
  if (folder !== "hero" && folder !== "gallery" && folder !== "img" && folder !== "showcase") {
    throw new Error("Invalid folder.");
  }

  const ext = path.extname(file.name || "").toLowerCase();
  const imageOk = ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp";
  const videoOk = ext === ".mp4" || ext === ".webm";
  if (folder === "showcase") {
    if (!videoOk) throw new Error("Showcase: only .mp4 or .webm (short clips, ~3s recommended).");
    if (file.size > MAX_SHOWCASE_VIDEO_BYTES) {
      throw new Error("Showcase video too large (max ~22MB). Export a shorter clip.");
    }
  } else if (!imageOk) {
    throw new Error("Only .png, .jpg, .jpeg, .webp allowed.");
  }

  const safeBase =
    (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`) + ext;
  const targetDir = path.join(MEDIA_ROOT, folder);
  const targetFsPath = path.join(targetDir, safeBase);
  const publicDir = path.join(PUBLIC_MEDIA_ROOT, folder);
  const publicFsPath = path.join(publicDir, safeBase);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.mkdir(publicDir, { recursive: true });
  const bytes = new Uint8Array(await file.arrayBuffer());
  await fs.writeFile(targetFsPath, bytes);
  await fs.writeFile(publicFsPath, bytes);

  return {
    src: `/media/${folder}/${safeBase}`,
    filename: safeBase,
  };
}
