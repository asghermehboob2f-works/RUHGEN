import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

// Routes that require admin authentication
const PROTECTED_PREFIXES = ["/admindashboard"];

// The /admin path itself and /admin/login are not protected (login page)
const ADMIN_LOGIN = "/admin/login";
const ADMIN_ROOT = "/admin";

const COOKIE_NAME = "ruhgen_admin_sess";

function getSecret(): Uint8Array {
  const secret =
    process.env.ADMIN_JWT_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim();

  if (!secret) {
    // No configured secret — treat all sessions as invalid (safe fail)
    return new TextEncoder().encode("__no_secret_configured__" + Math.random());
  }
  return new TextEncoder().encode(secret);
}

async function verifyAdminCookie(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (payload.typ !== "admin" || typeof payload.sub !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if path requires admin auth
  const needsAuth =
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    (pathname === ADMIN_ROOT);

  if (!needsAuth) return NextResponse.next();

  // /admin itself — always redirect to login (or dashboard if authenticated)
  if (pathname === ADMIN_ROOT || pathname === "/admin/") {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      const payload = await verifyAdminCookie(token);
      if (payload) {
        // Already authenticated — send to dashboard
        const url = req.nextUrl.clone();
        url.pathname = "/admindashboard";
        return NextResponse.redirect(url);
      }
    }
    const url = req.nextUrl.clone();
    url.pathname = ADMIN_LOGIN;
    return NextResponse.redirect(url);
  }

  // All /admindashboard/* routes — require valid cookie
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = ADMIN_LOGIN;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const payload = await verifyAdminCookie(token);
  if (!payload) {
    // Invalid / expired token
    const url = req.nextUrl.clone();
    url.pathname = ADMIN_LOGIN;
    url.searchParams.set("next", pathname);
    // Clear the bad cookie via response header
    const res = NextResponse.redirect(url);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // Valid session — allow through
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/",
    "/admindashboard",
    "/admindashboard/:path*",
  ],
};
