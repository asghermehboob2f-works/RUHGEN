import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

function getProvidedSecret(req: Request): string {
  const header = req.headers.get("x-admin-secret")?.trim() ?? "";
  const auth = req.headers.get("authorization")?.trim() ?? "";
  const bearer =
    auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return header || bearer;
}

function assertAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) throw new Error("ADMIN_SECRET is not configured.");
  const got = getProvidedSecret(req);
  if (!got || got !== secret) throw new Error("Unauthorized.");
}

/** Source folder (synced to public on build); public mirror for instant dev/static serving */
const MEDIA_ROOT = path.join(process.cwd(), "media");
const PUBLIC_MEDIA_ROOT = path.join(process.cwd(), "public", "media");

export async function POST(req: Request) {
  try {
    assertAdmin(req);
    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "");

    if (!(file instanceof File)) throw new Error("Missing file.");
    if (folder !== "hero" && folder !== "gallery" && folder !== "img") {
      throw new Error("Invalid folder.");
    }

    const ext = path.extname(file.name || "").toLowerCase();
    const okExt = ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp";
    if (!okExt) throw new Error("Only .png, .jpg, .jpeg, .webp allowed.");

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

    // Ensure served asset appears immediately after sync/build.
    revalidatePath("/");

    return NextResponse.json({
      ok: true,
      src: `/media/${folder}/${safeBase}`,
      filename: safeBase,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: msg === "Unauthorized." ? 401 : 400 });
  }
}

