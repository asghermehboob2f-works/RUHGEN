import { NextResponse } from "next/server";
import { appendNewsletterSubscriber } from "@/backend/newsletter";
import { isValidEmail } from "@/backend/lib/validation";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = typeof body.email === "string" ? body.email : "";
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
    }
    await appendNewsletterSubscriber(email, "footer");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}
