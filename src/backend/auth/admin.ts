import "server-only";

/** Admin auth for API routes (ADMIN_SECRET via x-admin-secret or Bearer). */

export function getProvidedAdminSecret(req: Request): string {
  const header = req.headers.get("x-admin-secret")?.trim() ?? "";
  const auth = req.headers.get("authorization")?.trim() ?? "";
  const bearer =
    auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return header || bearer;
}

export function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) throw new Error("ADMIN_SECRET is not configured.");
  const got = getProvidedAdminSecret(req);
  if (!got || got !== secret) throw new Error("Unauthorized.");
}
