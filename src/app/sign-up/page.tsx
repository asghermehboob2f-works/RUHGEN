"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthChrome } from "@/components/AuthChrome";
import { useAuth } from "@/components/AuthProvider";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export default function SignUpPage() {
  const { user, ready, signUp } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);
  const pwLabel = useMemo(() => {
    if (!password) return "";
    if (password.length < 8) return "Use at least 8 characters";
    if (score <= 2) return "Could be stronger—add variety";
    if (score === 3) return "Solid password";
    return "Excellent";
  }, [password, score]);

  useEffect(() => {
    if (!ready || !user) return;
    router.replace("/dashboard");
  }, [ready, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!terms) {
      setError("Please accept the terms to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setPending(true);
    const result = await signUp(name, email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  };

  if (!ready) {
    return <DashboardLoading label="Preparing registration…" className="min-h-screen" />;
  }

  if (user) return null;

  return (
    <AuthChrome
      title="Create your workspace"
      subtitle="Free tier included—upgrade when you’re ready for Pro or Studio."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-[#7B61FF] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="su-name" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Full name
          </label>
          <input
            id="su-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-[48px] w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--deep-black)",
              color: "var(--text-primary)",
            }}
            placeholder="Alex Rivera"
          />
        </div>
        <div>
          <label htmlFor="su-email" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Work email
          </label>
          <input
            id="su-email"
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
          <label htmlFor="su-pass" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Password
          </label>
          <div className="relative">
            <input
              id="su-pass"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border py-3 pl-4 pr-12 text-base outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--deep-black)",
                color: "var(--text-primary)",
              }}
              placeholder="8+ characters"
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
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{
                      background:
                        score > i
                          ? i < 2
                            ? "#FF2E9A"
                            : i === 2
                              ? "#7B61FF"
                              : "#00D4FF"
                          : "var(--border-subtle)",
                    }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {pwLabel}
              </p>
            </div>
          )}
        </div>
        <label className="flex cursor-pointer items-start gap-3 py-1">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--border-subtle)] text-[#7B61FF] focus:ring-[#7B61FF]/40"
          />
          <span className="text-sm leading-snug" style={{ color: "var(--text-muted)" }}>
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-[#7B61FF] hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-[#7B61FF] hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {error && <p className="text-sm font-medium text-[#FF2E9A]">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="min-h-[52px] w-full rounded-xl text-base font-semibold text-white btn-gradient disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthChrome>
  );
}
