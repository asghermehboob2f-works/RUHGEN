import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readSiteContent, writeSiteContent, type SiteContent } from "@/lib/site-content";

function getProvidedSecret(req: Request): string {
  const header = req.headers.get("x-admin-secret")?.trim() ?? "";
  const auth = req.headers.get("authorization")?.trim() ?? "";
  const bearer =
    auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return header || bearer;
}

function assertAdmin(req: Request) {
  // Trim: Windows .env often leaves \r on values, which breaks ===
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) throw new Error("ADMIN_SECRET is not configured.");
  const got = getProvidedSecret(req);
  if (!got || got !== secret) throw new Error("Unauthorized.");
}

export async function GET() {
  const content = await readSiteContent();
  return NextResponse.json(content);
}

export async function PUT(req: Request) {
  try {
    assertAdmin(req);
    const next = (await req.json()) as SiteContent;
    await writeSiteContent(next);

    // Public homepage (and sections) update immediately.
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: msg === "Unauthorized." ? 401 : 400 });
  }
}

