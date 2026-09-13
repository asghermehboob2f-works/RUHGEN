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

type AuthResult = { ok: true } | { ok: false; error: string };

type AdminAuthContextValue = {
  admin: AdminUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  authHeaders: () => Record<string, string>;
  /** After profile update from API (new JWT). */
  applySession: (session: AdminSession) => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function hydrateSession() {
      try {
        const res = await fetch("/api/admin/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (active && data.ok && data.admin && data.token) {
            setAdmin(data.admin);
            setToken(data.token);
          }
        }
      } catch {
        // Fetch failed or invalid cookie
      } finally {
        if (active) {
          setReady(true);
        }
      }
    }
    hydrateSession();
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } catch {
      // Ignore network errors on logout
    }
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

      // Establish HTTP-only session cookie server-side
      const sessionRes = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.token }),
      });

      if (!sessionRes.ok) {
        return { ok: false, error: "Failed to establish secure session cookie." };
      }

      setToken(data.token);
      setAdmin(data.admin);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error." };
    }
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const applySession = useCallback(async (session: AdminSession) => {
    try {
      await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.token }),
      });
    } catch {
      // Ignore network errors
    }
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

