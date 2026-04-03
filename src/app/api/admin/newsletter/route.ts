import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-request";
import { readNewsletterSubscribers } from "@/lib/newsletter-subscribers";

export async function GET(req: Request) {
  try {
    requireAdmin(req);
    const subscribers = await readNewsletterSubscribers();
    return NextResponse.json({ ok: true, subscribers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: msg === "Unauthorized." ? 401 : 400 }
    );
  }
}
