"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthChrome } from "@/components/AuthChrome";
import { useAuth } from "@/components/AuthProvider";

export default function SignInPage() {
  const { user, ready, signIn } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [oauthNote, setOauthNote] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    const q = new URLSearchParams(window.location.search).get("next");
    router.replace(q && q.startsWith("/") ? q : "/dashboard");
  }, [ready, user, router]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const r = localStorage.getItem("ruhgen_remember_email");
        if (r) setEmail(r);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    const result = await signIn(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    try {
      if (remember) localStorage.setItem("ruhgen_remember_email", email.trim().toLowerCase());
      else localStorage.removeItem("ruhgen_remember_email");
    } catch {
      /* ignore */
    }
    const q = new URLSearchParams(window.location.search).get("next");
    router.push(q && q.startsWith("/") ? q : "/dashboard");
  };

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (user) return null;

  return (
    <AuthChrome
      title="Welcome back"
      subtitle="Sign in to your workspace. New here? Creation takes under a minute."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-semibold text-[#7B61FF] hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <motion.button
          type="button"
          whileTap={reduce ? undefined : { scale: 0.98 }}
          onClick={() => setOauthNote("google")}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors hover:border-[#7B61FF]/35"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--soft-black)",
            color: "var(--text-primary)",
          }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </motion.button>
        <motion.button
          type="button"
          whileTap={reduce ? undefined : { scale: 0.98 }}
          onClick={() => setOauthNote("github")}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors hover:border-[#7B61FF]/35"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--soft-black)",
            color: "var(--text-primary)",
          }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </motion.button>
      </div>
      {oauthNote && (
        <p className="mt-3 rounded-xl border border-dashed px-3 py-2 text-center text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
          OAuth for {oauthNote === "google" ? "Google" : "GitHub"} hooks up in production—use email below for this demo.
        </p>
      )}

      <div className="relative my-6 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
              or email
            </span>
        <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="si-email" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Email
          </label>
          <input
            id="si-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[48px] w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--deep-black)",
              color: "var(--text-primary)",
            }}
            placeholder="you@studio.com"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="si-pass" className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Password
            </label>
            <button
              type="button"
              className="text-xs font-medium text-[#00D4FF] hover:underline"
              onClick={() =>
                window.alert(
                  "Password reset: connect Resend, Postmark, or your IdP in production."
                )
              }
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="si-pass"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border py-3 pl-4 pr-12 text-base outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--deep-black)",
                color: "var(--text-primary)",
              }}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5"
              style={{ color: "var(--text-muted)" }}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 py-1">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-subtle)] text-[#7B61FF] focus:ring-[#7B61FF]/40"
          />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Remember this email on this device
          </span>
        </label>
        {error && <p className="text-sm font-medium text-[#FF2E9A]">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="min-h-[52px] w-full rounded-xl text-base font-semibold text-white btn-gradient disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthChrome>
  );
}
