"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AdminSession, AdminUser } from "@/lib/admin-auth-storage";
import {
  ADMIN_AUTH_KEY,
  clearAdminSession,
  readAdminSession,
  writeAdminSession,
} from "@/lib/admin-auth-storage";

type AuthResult = { ok: true } | { ok: false; error: string };

type AdminAuthContextValue = {
  admin: AdminUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  authHeaders: () => Record<string, string>;
  /** After profile update from API (new JWT). */
  applySession: (session: AdminSession) => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const s = readAdminSession();
      if (s) {
        setToken(s.token);
        setAdmin(s.admin);
      }
      setReady(true);
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_AUTH_KEY) {
        const s = readAdminSession();
        setToken(s?.token ?? null);
        setAdmin(s?.admin ?? null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setToken(null);
    setAdmin(null);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const e = email.trim().toLowerCase();
    if (!e || !password) {
      return { ok: false, error: "Email and password are required." };
    }
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, password }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        token?: string;
        admin?: AdminUser;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.token || !data.admin) {
        return { ok: false, error: data.error || "Sign-in failed." };
      }
      const session: AdminSession = { token: data.token, admin: data.admin };
      writeAdminSession(session);
      setToken(data.token);
      setAdmin(data.admin);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error." };
    }
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    const t = token ?? readAdminSession()?.token;
    if (!t) return {};
    return { Authorization: `Bearer ${t}` };
  }, [token]);

  const applySession = useCallback((session: AdminSession) => {
    writeAdminSession(session);
    setToken(session.token);
    setAdmin(session.admin);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      token,
      ready,
      login,
      logout,
      authHeaders,
      applySession,
    }),
    [admin, token, ready, login, logout, authHeaders, applySession]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
