import { NextResponse } from "next/server";
import { requireAdmin } from "@/backend/auth/admin";
import { readContactMessages } from "@/backend/contact";

export async function GET(req: Request) {
  try {
    requireAdmin(req);
    const messages = await readContactMessages();
    const sorted = [...messages].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    return NextResponse.json({ ok: true, messages: sorted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: msg === "Unauthorized." ? 401 : 400 }
    );
  }
}
