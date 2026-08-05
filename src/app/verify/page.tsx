"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, MailCheck, RefreshCw } from "lucide-react";

type PageStatus = "loading" | "verified" | "already_verified" | "invalid_token" | "expired_token" | "missing_token" | "error";

function VerifyContent() {
  const params = useSearchParams();

  const pageStatus = useMemo<PageStatus>(() => {
    const status = params.get("status");
    const error = params.get("error");
    if (status === "verified") return "verified";
    if (status === "already_verified") return "already_verified";
    if (error === "invalid_token") return "invalid_token";
    if (error === "expired_token") return "expired_token";
    if (error === "missing_token") return "missing_token";
    return "error";
  }, [params]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--deep-black)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold tracking-tight" style={{
            background: "linear-gradient(135deg, #7B61FF, #00D4FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>RUHGEN</span>
        </div>

        <div className="rounded-2xl border p-8 text-center" style={{
          borderColor: "var(--border-subtle)",
          background: "var(--soft-black)",
          boxShadow: "0 24px 60px -20px rgba(123,97,255,0.2)",
        }}>
          {pageStatus === "loading" && (
            <StateBlock icon={<Loader2 className="h-12 w-12 animate-spin text-[#7B61FF]" />}
              title="Processing…" subtitle="Please wait while we verify your email." />
          )}

          {pageStatus === "verified" && (
            <StateBlock icon={<CheckCircle2 className="h-12 w-12 text-emerald-400" />}
              title="Email Verified!" subtitle="Your RUHGEN account is fully activated. All restrictions have been removed."
              action={<Link href="/dashboard" className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)", boxShadow: "0 8px 24px -8px rgba(123,97,255,0.5)" }}>
                Go to Dashboard
              </Link>} />
          )}

          {pageStatus === "already_verified" && (
            <StateBlock icon={<CheckCircle2 className="h-12 w-12 text-[#00D4FF]" />}
              title="Already Verified" subtitle="Your email is already verified. You have full access to all features."
              action={<Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white mt-6"
                style={{ background: "linear-gradient(135deg, #00D4FF, #7B61FF)" }}>
                Go to Dashboard
              </Link>} />
          )}

          {(pageStatus === "invalid_token" || pageStatus === "missing_token") && (
            <StateBlock icon={<XCircle className="h-12 w-12 text-rose-400" />}
              title="Invalid Link" subtitle="This verification link is invalid or has already been used. Request a new one from your dashboard."
              action={<Link href="/dashboard/verify" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold mt-6"
                style={{ border: "1px solid rgba(123,97,255,0.4)", color: "#7B61FF", background: "rgba(123,97,255,0.06)" }}>
                <RefreshCw className="h-4 w-4" /> Request New Link
              </Link>} />
          )}

          {pageStatus === "expired_token" && (
            <StateBlock icon={<MailCheck className="h-12 w-12 text-amber-400" />}
              title="Link Expired" subtitle="Your verification link has expired. Request a new one from your verification center."
              action={<Link href="/dashboard/verify" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold mt-6"
                style={{ border: "1px solid rgba(123,97,255,0.4)", color: "#7B61FF", background: "rgba(123,97,255,0.06)" }}>
                <RefreshCw className="h-4 w-4" /> Get New Link
              </Link>} />
          )}

          {pageStatus === "error" && (
            <StateBlock icon={<XCircle className="h-12 w-12 text-rose-400" />}
              title="Something went wrong" subtitle="An unexpected error occurred. Please try again or contact support."
              action={<Link href="/dashboard/verify" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold mt-6"
                style={{ border: "1px solid rgba(123,97,255,0.4)", color: "#7B61FF", background: "rgba(123,97,255,0.06)" }}>
                Verification Center
              </Link>} />
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "var(--text-subtle)" }}>
          Need help?{" "}
          <Link href="/contact" className="text-[#00D4FF] hover:underline">Contact support</Link>
        </p>
      </div>
    </main>
  );
}

function StateBlock({ icon, title, subtitle, action }: { icon: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {icon}
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h1>
      <p className="text-sm leading-relaxed max-w-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      {action}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--deep-black)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}
