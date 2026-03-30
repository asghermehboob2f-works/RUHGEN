"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, KeyRound, Layers, LogOut, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { MarketingShell } from "@/components/MarketingShell";

const tiles = [
  {
    title: "New generation",
    desc: "Jump into the live studio with your saved style presets.",
    href: "/#preview",
    icon: Sparkles,
    accent: "from-[#7B61FF] to-[#00D4FF]",
  },
  {
    title: "Batch queue",
    desc: "Studio: run prompt variations overnight with webhook delivery.",
    href: "/#platform",
    icon: Layers,
    accent: "from-[#00D4FF] to-[#7B61FF]",
  },
  {
    title: "API keys",
    desc: "Issue scoped keys, rotate instantly, audit every call.",
    href: "/#pricing",
    icon: KeyRound,
    accent: "from-[#FF2E9A]/80 to-[#7B61FF]",
  },
  {
    title: "Usage & plan",
    desc: "Review burn-down, add seats, or bump tier before a launch.",
    href: "/#pricing",
    icon: Zap,
    accent: "from-[#7B61FF] to-[#FF2E9A]/70",
  },
];

export default function DashboardPage() {
  const { user, ready, signOut } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center px-4"
        style={{ color: "var(--text-muted)" }}
      >
        Loading workspace…
      </div>
    );
  }

  if (!user) return null;

  return (
    <MarketingShell>
      <main className="mesh-section relative flex-1 overflow-x-clip px-4 pb-20 pt-[max(5.5rem,env(safe-area-inset-top)+4.5rem)] sm:px-6 sm:pt-28 lg:px-10">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[min(100%,640px)] -translate-x-1/2 rounded-full blur-[120px] opacity-30" style={{ background: "#7B61FF" }} />

        <div className="relative mx-auto max-w-[1100px]">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col gap-6 border-b pb-10 sm:flex-row sm:items-end sm:justify-between sm:pb-12"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Workspace
              </p>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
                Hi, {user.name.split(" ")[0] || "there"}
              </h1>
              <p className="mt-2 max-w-xl text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
                You&apos;re signed in as <span className="font-mono text-[13px] text-[#00D4FF]">{user.email}</span>.
                This demo stores your session in the browser—swap for SSO or JWT when you go live.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors hover:border-[#FF2E9A]/40 hover:text-[#FF2E9A]"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                background: "var(--glass)",
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:gap-5">
            {tiles.map((t, i) => (
              <motion.div
                key={t.title}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.06 * i, duration: 0.4 }}
              >
                <Link
                  href={t.href}
                  className="group premium-ring flex h-full min-h-[140px] flex-col rounded-[1.25rem] border p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#7B61FF]/40 sm:min-h-[160px] sm:p-7"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                  }}
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${t.accent} shadow-lg`}
                  >
                    <t.icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                  </div>
                  <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {t.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#00D4FF]">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="mt-12 text-center text-xs sm:text-sm" style={{ color: "var(--text-subtle)" }}>
            Demo workspace · Data stays in this browser unless you wire a backend.
          </p>
        </div>
      </main>
    </MarketingShell>
  );
}
