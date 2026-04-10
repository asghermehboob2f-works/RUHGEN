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
  AUTH_USERS_KEY,
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
  updateProfile: (input: {
    currentPassword: string;
    name: string;
    email: string;
    newPassword?: string;
  }) => Promise<AuthResult>;
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
      if (e.key === AUTH_SESSION_KEY || e.key === AUTH_USERS_KEY) {
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

  const updateProfile = useCallback(
    async (input: {
      currentPassword: string;
      name: string;
      email: string;
      newPassword?: string;
    }): Promise<AuthResult> => {
      const session = readSession();
      if (!session) {
        return { ok: false, error: "Not signed in." };
      }
      const currentPassword = input.currentPassword;
      if (!currentPassword) {
        return { ok: false, error: "Current password is required." };
      }

      const users = readUsers();
      const idx = users.findIndex((x) => x.id === session.id);
      if (idx === -1) {
        return { ok: false, error: "Account not found." };
      }
      const u = users[idx];
      const h = await hashPassword(currentPassword);
      if (h !== u.passwordHash) {
        return { ok: false, error: "Current password is incorrect." };
      }

      const name = input.name.trim().slice(0, 120) || u.name;
      const email = normalizeEmail(input.email);
      if (!email) {
        return { ok: false, error: "Email is required." };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Invalid email address." };
      }
      if (email !== u.email && users.some((x) => x.email === email && x.id !== u.id)) {
        return { ok: false, error: "That email is already in use." };
      }

      const newPw = input.newPassword?.trim() ?? "";
      let passwordHash = u.passwordHash;
      if (newPw.length > 0) {
        if (newPw.length < 8) {
          return { ok: false, error: "New password must be at least 8 characters." };
        }
        passwordHash = await hashPassword(newPw);
      }

      const nextRow: StoredUser = {
        ...u,
        name,
        email,
        passwordHash,
      };
      const nextUsers = users.slice();
      nextUsers[idx] = nextRow;
      writeUsers(nextUsers);

      const nextSession: SessionUser = { id: u.id, email, name };
      writeSession(nextSession);
      setUser(nextSession);
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
      updateProfile,
    }),
    [user, ready, signIn, signUp, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
