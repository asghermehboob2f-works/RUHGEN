import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const backend = (process.env.BACKEND_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

/** Proxies reference image upload to Express (returns HTTPS URL for PiAPI). */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data." }, { status: 400 });
  }

  try {
    const res = await fetch(`${backend}/api/studio/reference-upload`, {
      method: "POST",
      headers: {
        ...(auth ? { Authorization: auth } : {}),
      },
      body: formData,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return NextResponse.json(
      {
        ok: false,
        error: `Could not reach the API server at ${backend}. (${msg})`,
      },
      { status: 502 },
    );
  }
}
