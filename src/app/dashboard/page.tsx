"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Coins,
  HelpCircle,
  History,
  Image as ImageIcon,
  Settings,
  Sparkles,
  TrendingUp,
  Video,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

const generateTiles = [
  {
    title: "Image studio",
    desc: "High-resolution stills from text and references.",
    href: "/dashboard/generate/image",
    icon: ImageIcon,
    gradient: "linear-gradient(135deg, rgba(123,97,255,0.35) 0%, rgba(0,212,255,0.15) 100%)",
  },
  {
    title: "Video studio",
    desc: "Motion, camera, and pacing under your control.",
    href: "/dashboard/generate/video",
    icon: Video,
    gradient: "linear-gradient(135deg, rgba(0,212,255,0.22) 0%, rgba(123,97,255,0.18) 100%)",
  },
] as const;

const quickLinks = [
  { href: "/dashboard/billing", label: "Credits & plan", icon: Coins },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/contact", label: "Help & support", icon: HelpCircle },
] as const;

export default function DashboardPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" style={{ color: "var(--text-muted)" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.span
            className="h-11 w-11 rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--primary-purple)", borderTopColor: "transparent" }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
          <p className="text-sm font-medium">Loading your studio…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.name.split(" ")[0] || "creator";
  const credits = 120;

  return (
    <div className="space-y-8 sm:space-y-10">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 lg:p-10"
        style={{
          borderColor: "transparent",
          background:
            "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, rgba(123,97,255,0.45), rgba(0,212,255,0.25), rgba(255,46,154,0.15)) border-box",
          boxShadow: "0 0 80px -20px rgba(123,97,255,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: "var(--primary-purple)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full opacity-35 blur-3xl"
          style={{ background: "var(--primary-cyan)" }}
          aria-hidden
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "var(--text-subtle)" }}>
              Studio overview
            </p>
            <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              <span className="text-gradient-primary">Hello, {firstName}</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
              Your workspace is ready. Jump into image or video generation, track credits, and tune preferences from
              Settings.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/generate/image"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
                boxShadow: "0 12px 40px -8px rgba(123,97,255,0.55)",
              }}
            >
              New generation
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border px-5 text-sm font-semibold transition-colors"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-primary)",
              }}
            >
              Settings
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Credits", value: String(credits), hint: "Available now", icon: Coins },
            { label: "This month", value: "24", hint: "Generations", icon: TrendingUp },
            { label: "Queue", value: "Idle", hint: "No jobs waiting", icon: Zap },
            { label: "Plan", value: "Creator", hint: "Upgrade anytime", icon: Sparkles },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.08 + i * 0.05, duration: 0.35 }}
              className="rounded-2xl border p-4 backdrop-blur-sm"
              style={{
                borderColor: "var(--border-subtle)",
                background: "color-mix(in srgb, var(--deep-black) 65%, transparent)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                  {stat.label}
                </p>
                <stat.icon className="h-4 w-4 opacity-70" style={{ color: "var(--primary-cyan)" }} strokeWidth={1.75} />
              </div>
              <p className="font-display mt-2 text-2xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {stat.hint}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="grid gap-3 sm:grid-cols-3">
        {quickLinks.map((q, i) => (
          <motion.div
            key={q.href}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.15 + i * 0.05 }}
          >
            <Link
              href={q.href}
              className="group flex min-h-[72px] items-center gap-3 rounded-2xl border px-4 py-3 transition-all hover:border-[color-mix(in_srgb,var(--primary-purple)_40%,var(--border-subtle))]"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--soft-black)",
                color: "var(--text-primary)",
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--glass)" }}
              >
                <q.icon className="h-5 w-5 text-[var(--primary-cyan)]" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-semibold">{q.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </motion.div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl" style={{ color: "var(--text-primary)" }}>
              Create
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Choose a pipeline — each opens your dedicated studio.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {generateTiles.map((t, i) => (
            <motion.div
              key={t.title}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.2 + i * 0.06 }}
            >
              <Link
                href={t.href}
                className="group relative flex min-h-[180px] flex-col overflow-hidden rounded-3xl border p-6 transition-transform hover:-translate-y-0.5 sm:min-h-[200px] sm:p-8"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--soft-black)",
                  boxShadow: "0 24px 60px -28px rgba(0,0,0,0.45)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-40 transition-opacity group-hover:opacity-55"
                  style={{ background: t.gradient }}
                  aria-hidden
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--soft-black)] via-transparent to-transparent" aria-hidden />
                <span
                  className="relative flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-md"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "color-mix(in srgb, var(--glass) 80%, transparent)",
                  }}
                >
                  <t.icon className="h-7 w-7" strokeWidth={1.5} style={{ color: "var(--text-primary)" }} />
                </span>
                <div className="relative mt-4">
                  <p className="font-display text-xl font-bold sm:text-2xl">{t.title}</p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t.desc}
                  </p>
                </div>
                <span className="relative mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-[var(--primary-cyan)]">
                  Open studio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.25 }}
        className="rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: "var(--border-subtle)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--soft-black) 100%, transparent) 0%, color-mix(in srgb, var(--deep-black) 100%, transparent) 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "var(--glass)" }}
          >
            <History className="h-5 w-5" style={{ color: "var(--text-muted)" }} strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Recent activity
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Your generations will appear here once you start creating.
            </p>
          </div>
        </div>
        <div
          className="mt-6 flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-dashed py-10"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <Wand2 className="h-8 w-8 opacity-40" style={{ color: "var(--primary-purple)" }} strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            No activity yet — start with a new generation.
          </p>
          <Link
            href="/dashboard/generate/image"
            className="mt-4 text-sm font-semibold text-[var(--primary-cyan)] hover:underline"
          >
            Go to image studio
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
