"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthChrome } from "@/components/AuthChrome";
import { useAuth } from "@/components/AuthProvider";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    setError("");
    setPending(true);
    const result = await forgotPassword(email.trim());
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
  };

  return (
    <AuthChrome
      title="Reset your password"
      subtitle="Enter the email associated with your RUHGEN account and we'll send you a recovery link & verification code."
      footer={
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 font-semibold text-[#00D4FF] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center py-2 space-y-5"
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border"
            style={{
              background: "rgba(0, 212, 255, 0.08)",
              borderColor: "rgba(0, 212, 255, 0.3)",
              color: "var(--primary-cyan)",
              boxShadow: "0 0 25px -5px rgba(0,212,255,0.3)",
            }}
          >
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
              Check your inbox
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              If an account exists for <span className="font-mono font-medium text-[#00D4FF]">{email}</span>, we&apos;ve sent a password reset link and 6-digit OTP code to your email.
            </p>
          </div>

          <div
            className="w-full rounded-2xl border p-4 text-left space-y-3"
            style={{
              background: "var(--deep-black)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7B61FF]">
              Next Steps
            </p>
            <ul className="text-xs space-y-2" style={{ color: "var(--text-muted)" }}>
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-[#00D4FF] font-bold">•</span>
                <span>Click the direct link in your email to choose a new password.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-[#00D4FF] font-bold">•</span>
                <span>Or use the 6-digit OTP code directly on the reset page.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col w-full gap-3 pt-2">
            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white btn-gradient"
            >
              <KeyRound className="h-4 w-4" />
              Enter 6-digit code now
            </Link>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border text-sm font-semibold transition-colors hover:border-[#7B61FF]/40"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--soft-black)",
                color: "var(--text-primary)",
              }}
            >
              Resend to another email
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="fp-email"
              className="mb-1.5 block text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Email address
            </label>
            <div className="relative">
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border py-3 pl-11 pr-4 text-base outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--deep-black)",
                  color: "var(--text-primary)",
                }}
                placeholder="you@company.com"
              />
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-[#FF2E9A]">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="min-h-[52px] w-full rounded-xl text-base font-semibold text-white btn-gradient disabled:opacity-60"
          >
            {pending ? "Sending recovery link…" : "Send Reset Instructions"}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/reset-password"
              className="text-xs font-medium text-[#00D4FF] hover:underline"
            >
              Already have a 6-digit code or reset token? Reset here
            </Link>
          </div>
        </form>
      )}
    </AuthChrome>
  );
}
