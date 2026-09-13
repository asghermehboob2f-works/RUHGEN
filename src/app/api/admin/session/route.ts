import { type NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "ruhgen_admin_sess";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, matching JWT expiry

/**
 * POST /api/admin/session
 * Called immediately after a successful login.
 * Body: { token: string }
 * Sets an HTTP-only, SameSite=Lax cookie carrying the signed admin JWT.
 * The secret never leaves the server — only the signed token is stored.
 */
export async function POST(req: NextRequest) {
  let token: string | undefined;
  try {
    const body = (await req.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : undefined;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ ok: false, error: "Token is required." }, { status: 400 });
  }

  const isProd = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

/**
 * DELETE /api/admin/session
 * Clears the admin session cookie. Safe to call even if already logged out.
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}
