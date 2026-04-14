import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const backend = (process.env.BACKEND_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

/** Proxies to the app API server (binary + auth). */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }

  try {
    const res = await fetch(`${backend}/api/studio/download-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body,
    });

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const text = await res.text();
      return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const buf = await res.arrayBuffer();
    const headers = new Headers();
    for (const name of ["content-type", "content-disposition", "cache-control"]) {
      const v = res.headers.get(name);
      if (v) headers.set(name, v);
    }
    return new NextResponse(buf, { status: res.status, headers });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not reach the app server. Ensure the API is running." },
      { status: 502 }
    );
  }
}
