import { NextResponse } from "next/server";
import { appendContactMessage } from "@/backend/contact";
import { isValidEmail } from "@/backend/lib/validation";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      message?: string;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !isValidEmail(email) || message.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Please provide your name, a valid email, and a message (8+ characters)." },
        { status: 400 }
      );
    }

    await appendContactMessage({ name, email, message });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}
