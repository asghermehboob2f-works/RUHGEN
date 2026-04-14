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
  AUTH_USER_TOKEN_KEY,
  AUTH_USERS_KEY,
  hashPassword,
  readSession,
  readUserToken,
  readUsers,
  type SessionUser,
  type StoredUser,
  writeSession,
  writeUserToken,
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
    let cancelled = false;
    const run = async () => {
      const token = readUserToken();
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = (await res.json()) as {
            ok?: boolean;
            user?: SessionUser;
            error?: string;
          };
          if (cancelled) return;
          if (data.ok && data.user) {
            writeSession(data.user);
            setUser(data.user);
            setReady(true);
            return;
          }
          writeUserToken(null);
          writeSession(null);
        } catch {
          if (!cancelled) {
            writeUserToken(null);
            writeSession(null);
          }
        }
      } else {
        const s = readSession();
        if (s && !cancelled) setUser(s);
      }
      if (!cancelled) setReady(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === AUTH_SESSION_KEY ||
        e.key === AUTH_USERS_KEY ||
        e.key === AUTH_USER_TOKEN_KEY
      ) {
        const token = readUserToken();
        if (!token) {
          setUser(readSession());
          return;
        }
        void fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((data: { ok?: boolean; user?: SessionUser }) => {
            if (data.ok && data.user) {
              writeSession(data.user);
              setUser(data.user);
            } else {
              writeUserToken(null);
              writeSession(null);
              setUser(null);
            }
          })
          .catch(() => {
            setUser(readSession());
          });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signOut = useCallback(() => {
    writeUserToken(null);
    writeSession(null);
    setUser(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const e = normalizeEmail(email);
    if (!e || !password) {
      return { ok: false, error: "Email and password are required." };
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, password }),
      });
      let data: {
        ok?: boolean;
        token?: string;
        user?: SessionUser;
        error?: string;
      };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        return {
          ok: false,
          error:
            "Could not reach the sign-in API. Start the backend (port 4000), e.g. npm run dev from the repo root, or npm run dev:backend.",
        };
      }
      if (data.ok && data.token && data.user) {
        writeUserToken(data.token);
        writeSession(data.user);
        setUser(data.user);
        return { ok: true };
      }
      if (res.status === 403 && data.error) {
        return { ok: false, error: data.error };
      }

      const users = readUsers();
      const u = users.find((x) => x.email === e);
      if (!u) {
        return { ok: false, error: data.error || "Invalid email or password." };
      }
      const h = await hashPassword(password);
      if (h !== u.passwordHash) {
        return { ok: false, error: "Incorrect password." };
      }

      const reg = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: u.name, email: u.email, password }),
      });
      let regData: {
        ok?: boolean;
        token?: string;
        user?: SessionUser;
        error?: string;
      };
      try {
        regData = (await reg.json()) as typeof regData;
      } catch {
        return {
          ok: false,
          error:
            "Could not reach the sign-in API. Start the backend on port 4000 (npm run dev or npm run dev:backend).",
        };
      }
      if (regData.ok && regData.token && regData.user) {
        writeUserToken(regData.token);
        writeSession(regData.user);
        setUser(regData.user);
        return { ok: true };
      }
      if (reg.status === 409) {
        const login2 = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: e, password }),
        });
        let loginData: {
          ok?: boolean;
          token?: string;
          user?: SessionUser;
          error?: string;
        };
        try {
          loginData = (await login2.json()) as typeof loginData;
        } catch {
          return {
            ok: false,
            error:
              "Could not reach the sign-in API. Start the backend on port 4000 (npm run dev or npm run dev:backend).",
          };
        }
        if (loginData.ok && loginData.token && loginData.user) {
          writeUserToken(loginData.token);
          writeSession(loginData.user);
          setUser(loginData.user);
          return { ok: true };
        }
        return {
          ok: false,
          error:
            loginData.error ||
            "This email is already registered on the server. Use the password you chose when signing up there.",
        };
      }
      return { ok: false, error: regData.error || data.error || "Sign-in failed." };
    } catch {
      return {
        ok: false,
        error:
          "Network error. Start the API on port 4000 (npm run dev from the repo root starts Next + backend), or set BACKEND_URL if the API runs elsewhere.",
      };
    }
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
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: n, email: e, password }),
        });
        let data: {
          ok?: boolean;
          token?: string;
          user?: SessionUser;
          error?: string;
        };
        try {
          data = (await res.json()) as typeof data;
        } catch {
          return {
            ok: false,
            error:
              "Could not reach the API. Start the backend on port 4000 (npm run dev or npm run dev:backend).",
          };
        }
        if (data.ok && data.token && data.user) {
          writeUserToken(data.token);
          writeSession(data.user);
          setUser(data.user);
          return { ok: true };
        }
        return { ok: false, error: data.error || "Sign-up failed." };
      } catch {
        return {
          ok: false,
          error:
            "Network error. Start the API on port 4000 (npm run dev), or set BACKEND_URL if the API runs elsewhere.",
        };
      }
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

      const token = readUserToken();
      if (token) {
        try {
          const res = await fetch("/api/auth/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              currentPassword,
              name: input.name,
              email: input.email,
              newPassword: input.newPassword,
            }),
          });
          const data = (await res.json()) as {
            ok?: boolean;
            token?: string;
            user?: SessionUser;
            error?: string;
          };
          if (data.ok && data.token && data.user) {
            writeUserToken(data.token);
            writeSession(data.user);
            setUser(data.user);
            return { ok: true };
          }
          return { ok: false, error: data.error || "Update failed." };
        } catch {
          return { ok: false, error: "Network error." };
        }
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
