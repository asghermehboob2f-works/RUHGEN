export const AUTH_USERS_KEY = "ruhgen_auth_users_v1";
export const AUTH_SESSION_KEY = "ruhgen_auth_session_v1";
/** Bearer JWT from POST /api/auth/login — source of truth when set. */
export const AUTH_USER_TOKEN_KEY = "ruhgen_user_jwt_v1";

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
};

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as StoredUser[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function writeUsers(users: StoredUser[]) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function writeSession(user: SessionUser | null) {
  if (!user) localStorage.removeItem(AUTH_SESSION_KEY);
  else localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
}

export function readUserToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_USER_TOKEN_KEY);
}

export function writeUserToken(token: string | null) {
  if (!token) localStorage.removeItem(AUTH_USER_TOKEN_KEY);
  else localStorage.setItem(AUTH_USER_TOKEN_KEY, token);
}
