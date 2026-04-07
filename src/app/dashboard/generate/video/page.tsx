"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function GenerateVideoPlaceholder() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/generate/video");
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
            "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, rgba(0,212,255,0.35), rgba(123,97,255,0.28)) border-box",
          boxShadow: "0 0 60px -20px rgba(0,212,255,0.3)",
        }}
      >
        <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full opacity-28 blur-3xl" style={{ background: "var(--primary-cyan)" }} aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ background: "linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))" }}
            >
              <Video className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Video studio
              </p>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
                Generator — coming soon
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
                Swap this page for timeline controls, duration, and your video pipeline. Authentication is already enforced.
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
            href="/dashboard/billing"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))",
              boxShadow: "0 8px 28px -6px rgba(0,212,255,0.4)",
            }}
          >
            Credits & plan
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
