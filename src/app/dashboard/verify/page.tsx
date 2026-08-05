"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Mail, RefreshCw, ShieldCheck,
  AlertTriangle, KeyRound, Loader2, Send, RotateCcw,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface VerifStatus {
  verified: boolean;
  verifiedAt: string | null;
  status: string;
  deadline: string | null;
  lastResendAt: string | null;
  resendToday: number;
  maxResendPerDay: number;
  otpExpiry: string | null;
}

function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    if (!deadline) { setTimeLeft(null); return; }
    const tick = () => {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimeLeft({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return timeLeft;
}

export default function VerificationCenterPage() {
  const { user, ready, token, refreshUser } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<VerifStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgErr, setMsgErr] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (ready && !user) router.replace("/sign-in?next=/dashboard/verify"); }, [ready, user, router]);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/verification-status`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.ok) {
        setStatus(d);
        if (d.verified && !user?.emailVerified) {
          void refreshUser();
        }
      }
    } finally { setLoading(false); }
  }, [token, user?.emailVerified, refreshUser]);

  useEffect(() => { if (ready && user) fetchStatus(); }, [ready, user, fetchStatus]);

  const countdown = useCountdown(status?.deadline ?? null);

  const resend = async () => {
    if (!token) return;
    setSubmitting(true); setMsg(""); setMsgErr(false);
    try {
      const r = await fetch(`${API}/api/auth/send-verification`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.ok) { setMsg("✓ Verification email sent! Check your inbox."); await fetchStatus(); }
      else { setMsg(d.error || "Failed to send."); setMsgErr(true); }
    } finally { setSubmitting(false); }
  };

  const requestOtp = async () => {
    if (!token) return;
    setSubmitting(true); setMsg(""); setMsgErr(false);
    try {
      const r = await fetch(`${API}/api/auth/request-otp`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.ok) { setMsg("✓ OTP sent to your email."); setOtpMode(true); setTimeout(() => otpRef.current?.focus(), 100); await fetchStatus(); }
      else { setMsg(d.error || "Failed."); setMsgErr(true); }
    } finally { setSubmitting(false); }
  };

  const submitOtp = async () => {
    if (!token || otp.length !== 6) return;
    setSubmitting(true); setMsg(""); setMsgErr(false);
    try {
      const r = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const d = await r.json();
      if (d.ok) { setMsg("✓ Email verified!"); await fetchStatus(); await refreshUser(); router.refresh(); }
      else { setMsg(d.error || "Invalid OTP."); setMsgErr(true); }
    } finally { setSubmitting(false); }
  };

  if (!ready || !user) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
    </div>
  );

  const isVerified = status?.verified || user?.emailVerified;
  const isSuspended = status?.status === "suspended" || user?.suspended;
  const urgency = countdown ? (countdown.d < 1 && countdown.h < 24) : false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-subtle)" }}>Dashboard · Account</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Verification Center</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage your email verification status and account security.</p>
      </motion.div>

      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl border p-6" style={{
          borderColor: isVerified ? "rgba(16,185,129,0.3)" : isSuspended ? "rgba(244,63,94,0.3)" : urgency ? "rgba(255,46,154,0.3)" : "rgba(123,97,255,0.3)",
          background: isVerified ? "rgba(16,185,129,0.04)" : isSuspended ? "rgba(244,63,94,0.04)" : "rgba(123,97,255,0.04)",
        }}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border" style={{
            borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
          }}>
            {isVerified ? <CheckCircle2 className="h-6 w-6 text-emerald-400" /> :
              isSuspended ? <AlertTriangle className="h-6 w-6 text-rose-400" /> :
              <Mail className="h-6 w-6 text-[#7B61FF]" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {isVerified ? "Email Verified" : isSuspended ? "Account Suspended" : "Verification Pending"}
              </h2>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{
                background: isVerified ? "rgba(16,185,129,0.15)" : isSuspended ? "rgba(244,63,94,0.15)" : "rgba(123,97,255,0.15)",
                color: isVerified ? "#10b981" : isSuspended ? "#f43f5e" : "#7B61FF",
              }}>
                {isVerified ? "Active" : isSuspended ? "Suspended" : "Pending"}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {isVerified
                ? `Verified on ${new Date(status?.verifiedAt || "").toLocaleDateString("en-IN", { dateStyle: "long" })}. Your account has full access.`
                : isSuspended
                ? "Your account was suspended because the 7-day verification window expired. Verify now to restore access."
                : "Verify your email to unlock full access. Your account works normally during the 7-day grace period."}
            </p>
            {isVerified && <p className="mt-2 text-xs" style={{ color: "var(--text-subtle)" }}>Email: {user.email}</p>}
          </div>
        </div>
      </motion.div>

      {/* Countdown (if not verified) */}
      {!isVerified && countdown && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border p-5" style={{ borderColor: urgency ? "rgba(255,46,154,0.3)" : "rgba(255,255,255,0.08)", background: "var(--soft-black)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" style={{ color: urgency ? "#FF2E9A" : "#00D4FF" }} />
            <span className="text-sm font-semibold" style={{ color: urgency ? "#FF2E9A" : "var(--text-primary)" }}>
              {urgency ? "⚠ Urgent — Account expires soon!" : "Time remaining to verify"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[["Days", countdown.d], ["Hours", countdown.h], ["Mins", countdown.m], ["Secs", countdown.s]].map(([label, val]) => (
              <div key={label} className="rounded-xl border p-3 text-center" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <span className="block text-2xl font-extrabold tabular-nums" style={{
                  background: `linear-gradient(135deg, ${urgency ? "#FF2E9A" : "#7B61FF"}, ${urgency ? "#7B61FF" : "#00D4FF"})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{String(val).padStart(2, "0")}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>{label}</span>
              </div>
            ))}
          </div>
          {status?.deadline && (
            <p className="mt-3 text-xs" style={{ color: "var(--text-subtle)" }}>
              Verification deadline: {new Date(status.deadline).toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
          )}
        </motion.div>
      )}

      {/* Actions (if not verified) */}
      {!isVerified && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border p-6 space-y-5" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Verify Your Email</h3>

          {/* Primary: Resend link */}
          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(123,97,255,0.2)", background: "rgba(123,97,255,0.04)" }}>
            <div className="flex items-start gap-3 mb-3">
              <Mail className="h-5 w-5 mt-0.5 text-[#7B61FF] shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Send Verification Link</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>We&apos;ll send a one-click verification link to <strong>{user.email}</strong></p>
              </div>
            </div>
            <button onClick={resend} disabled={submitting || (status?.resendToday ?? 0) >= (status?.maxResendPerDay ?? 5)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)", boxShadow: "0 6px 20px -6px rgba(123,97,255,0.4)" }}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Verification Email
            </button>
            {status && <p className="mt-2 text-[10px]" style={{ color: "var(--text-subtle)" }}>{status.resendToday}/{status.maxResendPerDay} sends used today</p>}
          </div>

          {/* Fallback: OTP */}
          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(0,212,255,0.15)", background: "rgba(0,212,255,0.03)" }}>
            <div className="flex items-start gap-3 mb-3">
              <KeyRound className="h-5 w-5 mt-0.5 text-[#00D4FF] shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>OTP Fallback</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>If the link doesn&apos;t work, request a 6-digit code instead</p>
              </div>
            </div>
            {otpMode ? (
              <div className="flex gap-2 flex-wrap">
                <input ref={otpRef} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6} placeholder="Enter 6-digit OTP"
                  className="w-40 rounded-lg border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-[#00D4FF]/40"
                  style={{ borderColor: "rgba(0,212,255,0.3)", background: "var(--deep-black)", color: "var(--text-primary)" }} />
                <button onClick={submitOtp} disabled={submitting || otp.length !== 6}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #7B61FF)" }}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Verify OTP
                </button>
                <button onClick={() => { setOtpMode(false); setOtp(""); }} className="text-xs px-3 py-2 rounded-lg" style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={requestOtp} disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF", background: "rgba(0,212,255,0.05)" }}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Request OTP Instead
              </button>
            )}
          </div>

          {/* Feedback */}
          {msg && (
            <div className="rounded-xl border px-4 py-3 text-sm font-medium" style={{
              borderColor: msgErr ? "rgba(244,63,94,0.3)" : "rgba(16,185,129,0.3)",
              background: msgErr ? "rgba(244,63,94,0.06)" : "rgba(16,185,129,0.06)",
              color: msgErr ? "#f43f5e" : "#10b981",
            }}>{msg}</div>
          )}

          {/* Refresh status */}
          <button onClick={fetchStatus} disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors"
            style={{ color: "var(--text-subtle)", border: "1px solid var(--border-subtle)" }}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Refresh status
          </button>
        </motion.div>
      )}

      {/* Verified success card */}
      {isVerified && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border p-6 flex items-center gap-4" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.04)" }}>
          <ShieldCheck className="h-10 w-10 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Your account is fully verified and secure.</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>No restrictions apply. Enjoy the full RUHGEN experience.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
