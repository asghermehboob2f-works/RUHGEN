"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Inbox, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

const tiles = [
  {
    title: "Content studio",
    desc: "Update homepage hero previews, gallery images, and spotlight slides.",
    href: "/admindashboard/content",
    icon: "sparkles" as const,
  },
  {
    title: "Newsletter",
    desc: "Load and export captured newsletter subscribers.",
    href: "/admindashboard/subscribers",
    icon: "sparkles" as const,
  },
  {
    title: "Contact inbox",
    desc: "Read and reply to messages sent from the public contact page.",
    href: "/admindashboard/messages",
    icon: "inbox" as const,
  },
  {
    title: "Settings",
    desc: "Change admin display name, email, and password.",
    href: "/admindashboard/settings",
    icon: "settings" as const,
  },
] as const;

export default function DashboardPage() {
  const { admin, ready } = useAdminAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (ready && !admin) router.replace("/admin/login?next=/admindashboard");
  }, [ready, admin, router]);

  if (!ready) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center px-4"
        style={{ color: "var(--text-muted)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <span
            className="loading-orbit h-11 w-11 rounded-full border-2 border-[#7B61FF]/25 border-t-[#7B61FF]"
            aria-hidden
          />
          <p className="text-sm font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>
            Loading workspace…
          </p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="mx-auto max-w-[980px]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border p-6 sm:p-8"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Admin
              </p>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
                Admin dashboard
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
                Manage site content, newsletter exports, and contact form messages. Sign in at{" "}
                <Link href="/admin/login" className="font-semibold text-[#00D4FF] hover:underline">
                  /admin/login
                </Link>{" "}
                (separate from member accounts).
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                href="/#preview"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors hover:border-[#7B61FF]/45"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                  background: "var(--deep-black)",
                }}
              >
                Open live demo
              </Link>
              <Link
                href="/admindashboard/content"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 text-sm font-semibold"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--deep-black)",
                  color: "var(--text-primary)",
                }}
              >
                Edit site content
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t, i) => (
            <motion.div
              key={t.title}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.04 * i, duration: 0.32 }}
            >
              <Link
                href={t.href}
                className="group flex h-full min-h-[140px] flex-col rounded-2xl border p-6 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}>
                  {t.icon === "inbox" ? (
                    <Inbox className="h-5 w-5" strokeWidth={1.75} style={{ color: "#00D4FF" }} />
                  ) : t.icon === "settings" ? (
                    <Settings className="h-5 w-5" strokeWidth={1.75} style={{ color: "#7B61FF" }} />
                  ) : (
                    <Sparkles className="h-5 w-5" strokeWidth={1.75} style={{ color: "var(--text-muted)" }} />
                  )}
                </div>
                <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {t.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {t.desc}
                </p>
                <span className="mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                  Open →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
