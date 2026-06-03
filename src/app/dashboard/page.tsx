"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Coins,
  HelpCircle,
  Image as ImageIcon,
  Settings,
  Sparkles,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { useAuth } from "@/components/AuthProvider";

const DashboardRecentActivity = dynamic(
  () => import("@/components/dashboard/DashboardRecentActivity").then((m) => m.DashboardRecentActivity),
  { ssr: false },
);

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
  { href: "/dashboard/billing", label: "Credits & plan", hint: "Balance and upgrades", icon: Coins },
  { href: "/dashboard/settings", label: "Preferences", hint: "Theme and notifications", icon: Settings },
  { href: "/contact", label: "Help & support", hint: "We reply within a day", icon: HelpCircle },
] as const;

export default function DashboardPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard");
  }, [ready, user, router]);

  if (!ready) {
    return <DashboardLoading label="Loading your studio…" className="min-h-[50vh]" />;
  }

  if (!user) return null;

  const firstName = user.name.split(" ")[0] || "creator";
  const credits = 120;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Banner / Studio Overview Section */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 lg:p-6"
        style={{
          borderColor: "transparent",
          background:
            "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, rgba(123,97,255,0.4), rgba(0,212,255,0.25), rgba(255,46,154,0.15)) border-box",
          boxShadow: "0 0 50px -15px rgba(123,97,255,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(var(--primary-purple) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Subtle decorative glow points */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-44 w-44 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--primary-purple)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-36 w-36 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--primary-cyan)" }}
          aria-hidden
        />

        <div className="relative grid gap-5 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Greeting & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--primary-cyan)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary-cyan)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--primary-cyan)]"></span>
              </span>
              Studio overview
            </div>
            
            <h1 className="font-display mt-2.5 text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
              Hello, <span className="text-gradient-primary">{firstName}</span>
            </h1>
            
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
              Your workspace is ready. Jump into image or video generation, track credits, and tune preferences anytime.
            </p>
            
            <div className="flex flex-wrap gap-2.5 mt-4">
              <Link
                href="/dashboard/generate/image"
                className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
                  boxShadow: "0 6px 20px -6px rgba(123,97,255,0.45)",
                }}
              >
                New generation
                <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
              </Link>
              <Link
                href="/dashboard/settings"
                className="inline-flex min-h-[36px] items-center justify-center rounded-lg border px-4 text-xs font-bold transition-all duration-300 hover:bg-white/5"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  color: "var(--text-primary)",
                }}
              >
                Preferences
              </Link>
            </div>
          </div>

          {/* Right Column: Statistics Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-2">
            {[
              { label: "Credits", value: String(credits), hint: "Available now", icon: Coins, color: "var(--primary-cyan)" },
              { label: "This month", value: "24", hint: "Generations", icon: TrendingUp, color: "var(--primary-purple)" },
              { label: "Queue", value: "Idle", hint: "No jobs waiting", icon: Zap, color: "var(--accent-pink)" },
              { label: "Plan", value: "Creator", hint: "Upgrade anytime", icon: Sparkles, color: "var(--primary-cyan)" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.08 + i * 0.04, duration: 0.3 }}
                whileHover={{ y: -2 }}
                className="group relative overflow-hidden rounded-xl border p-3.5 transition-all duration-300"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  background: "linear-gradient(135deg, color-mix(in srgb, var(--deep-black) 92%, transparent) 0%, color-mix(in srgb, var(--soft-black) 60%, transparent) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px -12px rgba(0,0,0,0.5)",
                }}
              >
                {/* Subtle border glow on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    border: `1px solid color-mix(in srgb, ${stat.color} 25%, transparent)`,
                    borderRadius: "11px",
                  }}
                />
                {/* Ambient glow behind icon on hover */}
                <div
                  className="absolute -right-8 -top-8 h-16 w-16 rounded-full opacity-0 group-hover:opacity-10 transition-all duration-500 blur-xl pointer-events-none"
                  style={{ background: stat.color }}
                />

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)] group-hover:text-[var(--text-muted)] transition-colors">
                    {stat.label}
                  </p>
                  <div 
                    className="flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] transition-all duration-300 group-hover:scale-105 group-hover:border-white/10 group-hover:bg-white/[0.06]"
                  >
                    <stat.icon 
                      className="h-3.5 w-3.5 transition-transform duration-300" 
                      style={{ color: stat.color }} 
                      strokeWidth={2} 
                    />
                  </div>
                </div>
                <p className="font-display mt-1 text-lg font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
                  {stat.value}
                </p>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                  {stat.hint}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Create Section */}
      <section aria-labelledby="dash-create-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="dash-create-heading" className="font-display text-lg font-bold sm:text-xl text-[var(--text-primary)]">
              Create
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
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
              transition={{ delay: reduce ? 0 : 0.15 + i * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Link
                href={t.href}
                className="group relative flex min-h-[170px] flex-col overflow-hidden rounded-2xl border p-5.5 transition-all duration-500 sm:min-h-[190px] sm:p-6.5"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  background: "linear-gradient(180deg, color-mix(in srgb, var(--soft-black) 85%, transparent) 0%, color-mix(in srgb, var(--deep-black) 98%, transparent) 100%)",
                  boxShadow: "0 16px 36px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* Visual Glow Layer */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.08] transition-all duration-700 ease-out group-hover:opacity-[0.18] group-hover:scale-105"
                  style={{ background: t.gradient }}
                  aria-hidden
                />

                {/* Cyber-mesh grid inside card */}
                <div 
                  className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(white 1px, transparent 0)",
                    backgroundSize: "16px 16px",
                  }}
                />

                {/* Border glow on hover */}
                <div
                  className="absolute inset-0 border border-transparent group-hover:border-white/15 transition-all duration-500 rounded-2xl pointer-events-none"
                  style={{
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.02)",
                  }}
                />

                <span
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-300 group-hover:scale-105"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
                  }}
                >
                  <t.icon className="h-4.5 w-4.5 text-[var(--text-muted)] group-hover:text-white transition-colors duration-300" strokeWidth={1.75} />
                </span>

                <div className="relative mt-4">
                  <p className="font-display text-base font-bold sm:text-lg text-[var(--text-primary)] group-hover:text-white transition-colors duration-300">
                    {t.title}
                  </p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--text-muted)] group-hover:text-[var(--text-primary)]/90 transition-colors duration-300">
                    {t.desc}
                  </p>
                </div>

                <span className="relative mt-auto inline-flex items-center gap-1.5 pt-4 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-cyan)] group-hover:text-white transition-colors duration-300">
                  Open studio
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Shortcuts Section */}
      <section aria-labelledby="dash-shortcuts-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="dash-shortcuts-heading" className="font-display text-lg font-bold sm:text-xl text-[var(--text-primary)]">
              Shortcuts
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
              Billing, preferences, and help in one tap.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickLinks.map((q, i) => (
            <motion.div
              key={q.href}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.2 + i * 0.04 }}
              whileHover={{ y: -3 }}
            >
              <Link
                href={q.href}
                className="group relative overflow-hidden flex items-center gap-4 rounded-xl border p-4 transition-all duration-350"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.07)",
                  background: "linear-gradient(135deg, color-mix(in srgb, var(--soft-black) 92%, transparent) 0%, color-mix(in srgb, var(--deep-black) 98%, transparent) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                  color: "var(--text-primary)",
                }}
              >
                {/* Subtle light pulse background */}
                <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 group-hover:scale-105"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    background: "rgba(255, 255, 255, 0.03)",
                  }}
                >
                  <q.icon className="h-4.5 w-4.5 text-[var(--primary-cyan)] group-hover:text-white transition-colors duration-300" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold tracking-tight text-[var(--text-primary)] group-hover:text-white transition-colors">
                    {q.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)] group-hover:text-[var(--text-subtle)] transition-colors">
                    {q.hint}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-subtle)] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <DashboardRecentActivity userId={user.id} />
    </div>
  );
}
