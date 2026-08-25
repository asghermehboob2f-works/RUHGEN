"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Coins,
  HelpCircle,
  Image as ImageIcon,
  RefreshCw,
  Settings,
  Sparkles,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { useAuth } from "@/components/AuthProvider";
import { readUserToken } from "@/lib/auth-storage";

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
  { href: "/dashboard/support", label: "Support", hint: "Create & track tickets", icon: HelpCircle },
  { href: "/dashboard/settings", label: "Preferences", hint: "Theme and notifications", icon: Settings },
] as const;

export default function DashboardPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [metrics, setMetrics] = useState<{
    credits: number;
    availableCredits: number;
    pendingCredits: number;
    pendingCount: number;
    thisMonthCount: number;
    subscriptionPlan: string;
  } | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard");
  }, [ready, user, router]);

  const fetchDashboardMetrics = async (showSpin = false) => {
    if (!user) return;
    if (showSpin) setIsRefreshing(true);
    try {
      const token = readUserToken();
      const res = await fetch("/api/credits/dashboard", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data?.ok && data?.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoadingMetrics(false);
      if (showSpin) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDashboardMetrics();
    const interval = setInterval(() => fetchDashboardMetrics(), 8000);
    return () => clearInterval(interval);
  }, [user]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Welcome back";
  }, []);

  if (!ready) {
    return <DashboardLoading label="Loading your studio…" className="min-h-[50vh]" />;
  }

  if (!user) return null;

  const firstName = user.name.split(" ")[0] || "Creator";
  const availableCreds = metrics ? metrics.availableCredits : (user.availableCredits ?? user.credits ?? 0);
  const pendingHold = metrics ? metrics.pendingCredits : (user.pendingCredits ?? 0);
  const pendingJobsCount = metrics ? metrics.pendingCount : 0;
  const monthlyCount = metrics ? metrics.thisMonthCount : 0;
  const rawPlan = metrics?.subscriptionPlan || user.subscriptionPlan || "Free";
  const planDisplay = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1);

  const stats = [
    {
      label: "Credits",
      value: loadingMetrics ? "..." : String(availableCreds),
      hint: pendingHold > 0 ? `${user.credits || availableCreds} total (${pendingHold} hold)` : "Available balance",
      icon: Coins,
      color: "#00D4FF",
      href: "/dashboard/billing",
      badge: pendingHold > 0 ? `${pendingHold} hold` : null,
      badgeColor: "#7B61FF",
    },
    {
      label: "This Month",
      value: loadingMetrics ? "..." : String(monthlyCount),
      hint: "Generations completed",
      icon: TrendingUp,
      color: "#7B61FF",
      href: "/dashboard/generate/image",
      badge: "Real-time",
      badgeColor: "#7B61FF",
    },
    {
      label: "Studio Queue",
      value: loadingMetrics ? "..." : pendingJobsCount > 0 ? `${pendingJobsCount} Active` : "Idle",
      isLiveProcessing: pendingJobsCount > 0,
      hint: pendingJobsCount > 0 ? "Jobs generating now" : "No jobs waiting",
      icon: Zap,
      color: pendingJobsCount > 0 ? "#FFAB00" : "#FF2E9A",
      href: "/dashboard/generate/image",
      badge: pendingJobsCount > 0 ? "LIVE" : null,
      badgeColor: "#FFAB00",
    },
    {
      label: "Active Plan",
      value: planDisplay,
      hint: rawPlan.toLowerCase() === "free" ? "Upgrade for higher limits" : "Pro workspace",
      icon: Sparkles,
      color: "#00E676",
      href: "/dashboard/billing",
      badge: rawPlan.toUpperCase(),
      badgeColor: "#00E676",
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Banner / Studio Overview Section */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] p-4 sm:p-5 lg:p-6 shadow-sm transition-colors duration-200"
      >
        <div className="relative grid gap-4 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Compact Greeting & Status */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="-mt-1 mb-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchDashboardMetrics(true)}
                title="Refresh real-time workspace stats"
                className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--glass)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--glass-elevated)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`h-2.5 w-2.5 transition-transform ${isRefreshing ? "animate-spin text-[var(--text-primary)]" : "group-hover:rotate-180 duration-500"}`} />
                <span>Live sync</span>
              </button>
            </div>

            <h1 className="font-display mt-2 text-xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
              {greeting},{" "}
              <span className="text-[var(--text-primary)]">
                {firstName}
              </span>
            </h1>

            <p className="mt-1 max-w-lg text-xs leading-relaxed text-[var(--text-muted)]">
              Your workspace is synchronized. Monitor credits, track active job queues, and access pipelines.
            </p>
          </div>

          {/* Right Column: Slim Statistics Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-2.5">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.05 + i * 0.03, duration: 0.25 }}
                whileHover={{ y: -2 }}
              >
                <Link
                  href={stat.href}
                  className={`group relative block overflow-hidden rounded-lg border p-3 transition-all duration-200 ${
                    stat.isLiveProcessing
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-[var(--border-subtle)] bg-[var(--soft-black)] hover:border-[var(--border-subtle)] hover:bg-[var(--glass-elevated)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)] group-hover:text-[var(--text-muted)] transition-colors">
                      {stat.label}
                    </p>
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] transition-all duration-200 group-hover:text-[var(--text-primary)]"
                    >
                      <stat.icon
                        className={`h-3.5 w-3.5 ${stat.isLiveProcessing ? "animate-pulse text-amber-400" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"}`}
                        strokeWidth={2}
                      />
                    </div>
                  </div>

                  <div className="mt-1 flex items-baseline justify-between gap-1.5">
                    <p className="font-display text-base sm:text-lg font-extrabold tracking-tight tabular-nums text-[var(--text-primary)] transition-colors">
                      {stat.value}
                    </p>

                    {stat.badge && (
                      <span
                        className="rounded px-1.5 py-0.2 text-[8px] font-extrabold tracking-wider uppercase border border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)]"
                      >
                        {stat.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-[9px] text-[var(--text-muted)] mt-0.5 truncate">
                    {stat.hint}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Create Section */}
      <section aria-labelledby="dash-create-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 id="dash-create-heading" className="font-display text-lg font-bold text-[var(--text-primary)] sm:text-xl">
              Create
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Choose a pipeline — each opens your dedicated studio.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {generateTiles.map((t, i) => (
            <motion.div
              key={t.title}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.15 + i * 0.05 }}
              whileHover={{ y: -3 }}
            >
              <Link
                href={t.href}
                className="group relative flex min-h-[160px] flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] p-5 transition-all duration-300 hover:border-[var(--border-subtle)] hover:bg-[var(--glass-elevated)] shadow-sm"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] transition-all duration-200 group-hover:border-[var(--border-subtle)] group-hover:bg-[var(--glass)]"
                >
                  <t.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>

                <div className="relative mt-3">
                  <p className="font-display text-base font-bold text-[var(--text-primary)] transition-colors duration-200">
                    {t.title}
                  </p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--text-muted)] transition-colors duration-200">
                    {t.desc}
                  </p>
                </div>

                <span className="relative mt-auto inline-flex items-center gap-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-200">
                  Open studio
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Shortcuts Section */}
      <section aria-labelledby="dash-shortcuts-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 id="dash-shortcuts-heading" className="font-display text-lg font-bold text-[var(--text-primary)] sm:text-xl">
              Shortcuts
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
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
              whileHover={{ y: -2 }}
            >
              <Link
                href={q.href}
                className="group relative overflow-hidden flex items-center gap-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] p-3.5 transition-all duration-200 hover:border-[var(--border-subtle)] hover:bg-[var(--glass-elevated)]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-muted)] transition-all duration-200 group-hover:text-[var(--text-primary)]"
                >
                  <q.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold tracking-tight text-[var(--text-primary)] transition-colors">
                    {q.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)] transition-colors">
                    {q.hint}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-subtle)] opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[var(--text-primary)]" />
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
