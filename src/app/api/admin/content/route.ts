import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-request";
import { readSiteContent, writeSiteContent, type SiteContent } from "@/lib/site-content";

export async function GET() {
  const content = await readSiteContent();
  return NextResponse.json(content);
}

export async function PUT(req: Request) {
  try {
    requireAdmin(req);
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

