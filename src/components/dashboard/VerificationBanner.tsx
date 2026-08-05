"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, X, Clock, CheckCircle2, Mail } from "lucide-react";

interface VerifBannerProps {
  emailVerified: boolean;
  verificationDeadline: string | null;
  verificationStatus: string;
  suspended?: boolean;
}

function useCountdownDays(deadline: string | null) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) { setDaysLeft(0); setHoursLeft(0); return; }
      setDaysLeft(Math.ceil(ms / 86400000));
      setHoursLeft(Math.ceil(ms / 3600000));
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [deadline]);
  return { daysLeft, hoursLeft };
}

export function VerificationBanner({ emailVerified, verificationDeadline, verificationStatus, suspended }: VerifBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { daysLeft, hoursLeft } = useCountdownDays(verificationDeadline);

  // Never show if verified
  if (emailVerified || verificationStatus === "verified") return null;
  if (dismissed && verificationStatus !== "suspended" && (daysLeft ?? 99) > 1) return null;

  const isUrgent = (hoursLeft !== null && hoursLeft <= 24) || verificationStatus === "suspended";
  const isSuspended = verificationStatus === "suspended" || !!suspended;

  const bgStyle = isSuspended
    ? { background: "linear-gradient(90deg, rgba(244,63,94,0.12) 0%, rgba(123,97,255,0.06) 100%)", borderColor: "rgba(244,63,94,0.35)" }
    : isUrgent
    ? { background: "linear-gradient(90deg, rgba(255,46,154,0.10) 0%, rgba(123,97,255,0.06) 100%)", borderColor: "rgba(255,46,154,0.35)" }
    : { background: "linear-gradient(90deg, rgba(123,97,255,0.08) 0%, rgba(0,212,255,0.04) 100%)", borderColor: "rgba(123,97,255,0.25)" };

  const icon = isSuspended
    ? <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
    : isUrgent
    ? <AlertTriangle className="h-4 w-4 text-[#FF2E9A] shrink-0 animate-pulse" />
    : <Mail className="h-4 w-4 text-[#7B61FF] shrink-0" />;

  const timeLabel = hoursLeft !== null && hoursLeft <= 48
    ? `${hoursLeft}h`
    : daysLeft !== null
    ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
    : null;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium"
      style={bgStyle}
      role="alert"
    >
      {icon}
      <span className="flex-1 min-w-0" style={{ color: "var(--text-primary)" }}>
        {isSuspended ? (
          <>
            <strong className="text-rose-400">Account Suspended.</strong>{" "}
            Your email was not verified in time. Verify now to restore access.
          </>
        ) : isUrgent ? (
          <>
            <strong style={{ color: "#FF2E9A" }}>Urgent:</strong>{" "}
            Verify your email within {timeLabel} or your account will be suspended.
          </>
        ) : (
          <>
            {timeLabel ? (
              <><strong style={{ color: "#7B61FF" }}>{timeLabel} left</strong> — </>
            ) : null}
            Please verify your email address to keep full access to your account.
          </>
        )}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {hoursLeft !== null && (
          <span className="hidden sm:flex items-center gap-1 text-[11px] rounded-full px-2.5 py-0.5 font-semibold" style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: isUrgent ? "#FF2E9A" : "#00D4FF",
          }}>
            <Clock className="h-3 w-3" />
            {timeLabel} left
          </span>
        )}
        <Link href="/dashboard/verify"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: isSuspended ? "linear-gradient(135deg, #f43f5e, #7B61FF)" : "linear-gradient(135deg, #7B61FF, #00D4FF)", boxShadow: "0 4px 12px -4px rgba(123,97,255,0.4)" }}>
          {isSuspended ? "Restore Access" : "Verify Email"}
        </Link>
        {!isSuspended && (daysLeft ?? 99) > 1 && (
          <button onClick={() => setDismissed(true)} className="rounded-lg p-1.5 transition-colors hover:bg-white/5" style={{ color: "var(--text-subtle)" }}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
