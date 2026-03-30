"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AUTH_SESSION_KEY,
  hashPassword,
  readSession,
  readUsers,
  type SessionUser,
  type StoredUser,
  writeSession,
  writeUsers,
} from "@/lib/auth-storage";

type AuthResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResult>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(readSession());
      setReady(true);
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_SESSION_KEY) {
        setUser(readSession());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setUser(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const e = normalizeEmail(email);
    if (!e || !password) {
      return { ok: false, error: "Email and password are required." };
    }
    const users = readUsers();
    const u = users.find((x) => x.email === e);
    if (!u) {
      return { ok: false, error: "No account found for that email." };
    }
    const h = await hashPassword(password);
    if (h !== u.passwordHash) {
      return { ok: false, error: "Incorrect password." };
    }
    const session: SessionUser = {
      id: u.id,
      email: u.email,
      name: u.name,
    };
    writeSession(session);
    setUser(session);
    return { ok: true };
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const n = name.trim();
      const e = normalizeEmail(email);
      if (!n || !e || !password) {
        return { ok: false, error: "Please fill in all fields." };
      }
      if (password.length < 8) {
        return {
          ok: false,
          error: "Password must be at least 8 characters.",
        };
      }
      const users = readUsers();
      if (users.some((x) => x.email === e)) {
        return { ok: false, error: "An account with this email already exists." };
      }
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const passwordHash = await hashPassword(password);
      const row: StoredUser = {
        id,
        email: e,
        name: n,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      writeUsers([...users, row]);
      const session: SessionUser = { id, email: e, name: n };
      writeSession(session);
      setUser(session);
      return { ok: true };
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      signIn,
      signUp,
      signOut,
    }),
    [user, ready, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
