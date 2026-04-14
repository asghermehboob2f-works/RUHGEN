import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const backend = (process.env.BACKEND_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

/** Proxies video generation to the Express API (avoids opaque 500s when the rewrite target is down). */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }

  try {
    const res = await fetch(`${backend}/api/studio/video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body,
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
        error: `Could not reach the API server at ${backend}. Run the backend (e.g. npm run dev, which starts Next + API), or set BACKEND_URL. (${msg})`,
      },
      { status: 502 },
    );
  }
}
