"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function GenerateImagePlaceholder() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/generate/image");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }
  if (!user) return null;

  return (
    <motion.div
      className="pb-8"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-10"
        style={{
          borderColor: "transparent",
          background:
            "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, rgba(123,97,255,0.45), rgba(0,212,255,0.2)) border-box",
          boxShadow: "0 0 60px -20px rgba(123,97,255,0.35)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl" style={{ background: "var(--primary-purple)" }} aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))" }}
            >
              <ImageIcon className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Image studio
              </p>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
                Generator — coming soon
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
                Replace this view with your real prompt UI, model picker, and result grid. Routing and shell are ready.
              </p>
            </div>
          </div>
        </div>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border px-5 text-sm font-semibold"
            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
          >
            Back to dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))",
              boxShadow: "0 8px 28px -6px rgba(123,97,255,0.45)",
            }}
          >
            Settings
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
