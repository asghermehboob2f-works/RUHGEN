"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthChrome } from "@/components/AuthChrome";
import { useAuth } from "@/components/AuthProvider";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";

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
    return <DashboardLoading label="Accessing workspace…" className="min-h-screen" />;
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
