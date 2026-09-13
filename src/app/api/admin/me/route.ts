import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "../session/route";

function getSecret(): Uint8Array {
  const secret =
    process.env.ADMIN_JWT_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim();

  if (!secret) {
    return new TextEncoder().encode("__no_secret_configured__" + Math.random());
  }
  return new TextEncoder().encode(secret);
}

/**
 * GET /api/admin/me
 * Internal route for rehydrating admin session state from HTTP-only cookie on mount/refresh.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: "No session cookie" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (payload.typ !== "admin" || typeof payload.sub !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid session payload" }, { status: 401 });
    }

    const admin = {
      id: payload.sub,
      email: (payload.email as string) || "",
      name: (payload.name as string) || "",
    };

    return NextResponse.json({
      ok: true,
      admin,
      token,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Expired or invalid session" }, { status: 401 });
  }
}
