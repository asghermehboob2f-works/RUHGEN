import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const backend = (process.env.BACKEND_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

type RouteContext = { params: Promise<{ taskId: string }> };

/** Proxies task status polling to the Express API. */
export async function GET(req: NextRequest, context: RouteContext) {
  const { taskId } = await context.params;
  const id = typeof taskId === "string" ? encodeURIComponent(taskId) : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing task id." }, { status: 400 });
  }
  const auth = req.headers.get("authorization");

  try {
    const res = await fetch(`${backend}/api/studio/task/${id}`, {
      method: "GET",
      headers: {
        ...(auth ? { Authorization: auth } : {}),
      },
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
