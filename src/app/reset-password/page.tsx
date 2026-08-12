"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthChrome } from "@/components/AuthChrome";
import { useAuth } from "@/components/AuthProvider";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("token") || "";
      const e = params.get("email") || "";
      if (t) setToken(t);
      if (e) setEmail(e);
    }
  }, []);

  // Live password validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumOrSym = /[0-9]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumOrSym;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token && (!email || !otp)) {
      setError("Please provide either a valid reset link, or your email and 6-digit OTP code.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please ensure your password meets all complexity requirements below.");
      return;
    }

    if (!isMatch) {
      setError("New password and confirmation do not match.");
      return;
    }

    setPending(true);
    const result = await resetPassword({
      ...(token ? { token } : { email: email.trim(), otp: otp.trim() }),
      newPassword,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  };

  return (
    <AuthChrome
      title="Create new password"
      subtitle="Your new password must be at least 8 characters and include uppercase, lowercase, and numbers/symbols."
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
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center py-4 space-y-6"
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border"
            style={{
              background: "rgba(123, 97, 255, 0.12)",
              borderColor: "rgba(123, 97, 255, 0.35)",
              color: "var(--primary-purple)",
              boxShadow: "0 0 25px -5px rgba(123,97,255,0.4)",
            }}
          >
            <CheckCircle2 className="h-8 w-8 text-[#00D4FF]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
              Password updated!
            </h3>
            <p className="text-sm text-balance" style={{ color: "var(--text-muted)" }}>
              Your password has been successfully reset. You can now sign in to your workspace with your new credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/sign-in")}
            className="min-h-[52px] w-full rounded-xl text-base font-semibold text-white btn-gradient"
          >
            Sign in now
          </button>
        </motion.div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* Method indicator: Token vs Email+OTP */}
          {token ? (
            <div
              className="flex items-center gap-2 rounded-xl border p-3 text-xs"
              style={{
                borderColor: "rgba(0,212,255,0.25)",
                background: "rgba(0,212,255,0.06)",
                color: "var(--primary-cyan)",
              }}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Verifying reset token from secure email link</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="rp-email"
                  className="mb-1.5 block text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="rp-email"
                    type="email"
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

              <div>
                <label
                  htmlFor="rp-otp"
                  className="mb-1.5 block text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  6-Digit OTP Verification Code
                </label>
                <input
                  id="rp-otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="min-h-[48px] w-full text-center tracking-[0.4em] font-mono text-xl rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--deep-black)",
                    color: "var(--primary-cyan)",
                  }}
                  placeholder="123456"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="rp-pass"
              className="mb-1.5 block text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              New password
            </label>
            <div className="relative">
              <input
                id="rp-pass"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border py-3 pl-11 pr-12 text-base outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--deep-black)",
                  color: "var(--text-primary)",
                }}
                placeholder="••••••••"
              />
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5"
                style={{ color: "var(--text-muted)" }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5"
                style={{ color: "var(--text-muted)" }}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="rp-confirm"
              className="mb-1.5 block text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="rp-confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border py-3 pl-11 pr-12 text-base outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--deep-black)",
                  color: "var(--text-primary)",
                }}
                placeholder="••••••••"
              />
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5"
                style={{ color: "var(--text-muted)" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5"
                style={{ color: "var(--text-muted)" }}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Password strength guidelines */}
          <div
            className="rounded-xl border p-3.5 space-y-2 text-xs"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--deep-black)",
            }}
          >
            <p className="font-semibold" style={{ color: "var(--text-muted)" }}>
              Password Requirements
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-[#00D4FF]" : "text-gray-500"}`}>
                <span>{hasMinLength ? "✓" : "○"}</span>
                <span>8+ characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? "text-[#00D4FF]" : "text-gray-500"}`}>
                <span>{hasUpper ? "✓" : "○"}</span>
                <span>Uppercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLower ? "text-[#00D4FF]" : "text-gray-500"}`}>
                <span>{hasLower ? "✓" : "○"}</span>
                <span>Lowercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumOrSym ? "text-[#00D4FF]" : "text-gray-500"}`}>
                <span>{hasNumOrSym ? "✓" : "○"}</span>
                <span>Number / Special</span>
              </div>
            </div>
            {confirmPassword.length > 0 && (
              <div className={`flex items-center gap-1.5 ${isMatch ? "text-[#00D4FF]" : "text-[#FF2E9A]"}`}>
                <span>{isMatch ? "✓" : "✕"}</span>
                <span>Passwords match</span>
              </div>
            )}
          </div>

          {error && <p className="text-sm font-medium text-[#FF2E9A]">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="min-h-[52px] w-full rounded-xl text-base font-semibold text-white btn-gradient disabled:opacity-60"
          >
            {pending ? "Resetting password…" : "Reset Password"}
          </button>
        </form>
      )}
    </AuthChrome>
  );
}
