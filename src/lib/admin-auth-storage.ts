export const ADMIN_AUTH_KEY = "ruhgen_admin_auth_v1";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
};

export type AdminSession = {
  token: string;
  admin: AdminUser;
};

export function readAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { token?: string; admin?: AdminUser };
    if (!data?.token || !data?.admin?.id || !data?.admin?.email) return null;
    return { token: data.token, admin: data.admin };
  } catch {
    return null;
  }
}

export function writeAdminSession(session: AdminSession) {
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
}
