"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clapperboard,
  CreditCard,
  ExternalLink,
  GraduationCap,
  Headphones,
  HelpCircle,
  Inbox,
  Layers,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

type OverviewStats = {
  users: { total: number; active: number; suspended: number; unverified: number };
  financials: { totalRevenueINR: number; successfulPaymentsCount: number };
  support: { openTickets: number; urgentTickets: number; unreadSupportReplies: number };
  communications: { unreadContactMessages: number; newsletterSubscribers: number };
  recentActivity: Array<{
    id: string;
    actorEmail: string;
    actionType: string;
    timestamp: string;
    targetEmail?: string;
  }>;
};

export default function DashboardPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverviewStats = useCallback(async () => {
    const h = authHeaders();
    if (!h.Authorization) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview-stats", { headers: h, cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load admin stats:", e);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (ready && !admin) router.replace("/admin/login?next=/admindashboard");
  }, [ready, admin, router]);

  useEffect(() => {
    if (ready && admin) {
      loadOverviewStats();
    }
  }, [ready, admin, loadOverviewStats]);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4" style={{ color: "var(--text-muted)" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
          <p className="text-sm font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>
            Loading workspace console…
          </p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="mx-auto max-w-[1200px] space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6 sm:p-8 relative overflow-hidden"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-400">
                  🟢 System Normal
                </span>
                <span className="text-xs font-mono text-[var(--text-subtle)]">
                  Console v2.4
                </span>
              </div>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
                Admin Command Center
              </h1>
              <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                Welcome back, <span className="font-semibold text-white">{admin.name || admin.email}</span>. Here is your operational platform summary.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadOverviewStats}
                disabled={loading}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 text-xs font-semibold disabled:opacity-50 transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#7B61FF]" : ""}`} /> Refresh Metrics
              </button>
              <Link
                href="/demo"
                target="_blank"
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition-colors hover:border-[#7B61FF]/45"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                Live Site Demo <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* User Accounts Stats */}
          <Link
            href="/admindashboard/users"
            className="group rounded-2xl border p-4 transition-all hover:border-[#7B61FF]/40 space-y-1.5"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-subtle)]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
              <Users className="h-4 w-4 text-[#7B61FF] group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold font-mono text-white">
              {stats ? stats.users.total : "..."}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              <span className="text-emerald-400 font-semibold">{stats?.users.active ?? 0}</span> active · <span className="text-rose-400 font-semibold">{stats?.users.suspended ?? 0}</span> suspended
            </p>
          </Link>

          {/* Revenue Stats */}
          <Link
            href="/admindashboard/payments"
            className="group rounded-2xl border p-4 transition-all hover:border-emerald-500/40 space-y-1.5"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-subtle)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Revenue</span>
              <CreditCard className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold font-mono text-emerald-300">
              ₹{stats ? stats.financials.totalRevenueINR.toLocaleString("en-IN") : "..."}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {stats?.financials.successfulPaymentsCount ?? 0} captured orders
            </p>
          </Link>

          {/* Support Desk Stats */}
          <Link
            href="/admindashboard/support"
            className="group rounded-2xl border p-4 transition-all hover:border-[#00D4FF]/40 space-y-1.5"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-subtle)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00D4FF]">Open Support</span>
              <Headphones className="h-4 w-4 text-[#00D4FF] group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold font-mono text-[#00D4FF]">
                {stats ? stats.support.openTickets : "..."}
              </p>
              {stats && stats.support.urgentTickets > 0 && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-bold text-rose-300 animate-pulse">
                  {stats.support.urgentTickets} urgent
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {stats?.support.unreadSupportReplies ?? 0} unread replies
            </p>
          </Link>

          {/* Contact Messages Stats */}
          <Link
            href="/admindashboard/messages"
            className="group rounded-2xl border p-4 transition-all hover:border-purple-500/40 space-y-1.5"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-subtle)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Contact Inbox</span>
              <Inbox className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold font-mono text-purple-300">
              {stats ? stats.communications.unreadContactMessages : "..."}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              unread contact inquiries
            </p>
          </Link>

          {/* Verification Queue Stats */}
          <Link
            href="/admindashboard/verification"
            className="group rounded-2xl border p-4 transition-all hover:border-amber-500/40 space-y-1.5 col-span-2 sm:col-span-1"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-subtle)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Unverified</span>
              <ShieldCheck className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold font-mono text-amber-300">
              {stats ? stats.users.unverified : "..."}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              pending email verifications
            </p>
          </Link>
        </div>

        {/* Categorized Admin Modules Sections */}
        <div className="space-y-8">
          {/* CATEGORY 1: User & Security Operations */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
              <Users className="h-4 w-4 text-[#7B61FF]" />
              <h2 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--text-primary)" }}>
                User & Security Operations
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/admindashboard/users"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-[#7B61FF]/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7B61FF]/30 bg-[#7B61FF]/10 text-[#7B61FF]">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white group-hover:text-[#00D4FF] transition-colors">
                    User Accounts Management
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    View registered members, grant or deduct credits, modify subscription plans, and toggle account suspensions.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#00D4FF]">
                  <span>Manage Users</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admindashboard/verification"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-amber-500/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    Email Verification Queue
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Review pending email OTP verifications, inspect audit logs, resend codes, and force-verify users.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-amber-400">
                  <span>Audit Verifications</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admindashboard/analytics"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-emerald-500/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Analytics & Audit Logs
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Monitor platform AI generation counts, engine usage distributions, credit consumption, and system security logs.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>View Analytics</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* CATEGORY 2: Financials & Sales */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--text-primary)" }}>
                Financials & Transactions
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/admindashboard/payments"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-emerald-500/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Payments & Razorpay Orders
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Inspect captured transactions, credit package purchases, webhook signatures, and revenue reports.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>View Payments</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* CATEGORY 3: Support & Communications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
              <Headphones className="h-4 w-4 text-[#00D4FF]" />
              <h2 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--text-primary)" }}>
                Support & Communications
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/admindashboard/support"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-[#00D4FF]/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF]">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white group-hover:text-[#00D4FF] transition-colors">
                    Support Tickets Desk
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Manage customer help tickets, reply to messages with quick presets, adjust priorities, and view attachments.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#00D4FF]">
                  <span>Open Help Desk</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admindashboard/messages"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-purple-500/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    Contact Form Inbox
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Read and respond to inquiries submitted by prospective clients from the public contact page.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-purple-400">
                  <span>Open Inbox</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admindashboard/subscribers"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-blue-500/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    Newsletter Subscribers
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Monitor newsletter subscriber growth, view email signups, and export email lists to CSV.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-blue-400">
                  <span>Manage Subscribers</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* CATEGORY 4: Content Management Systems */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
              <Layers className="h-4 w-4 text-cyan-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--text-primary)" }}>
                Content Management Systems (CMS)
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/admindashboard/content"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-cyan-500/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Site Content Studio
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Update homepage hero videos, gallery showcases, and pricing packages.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>Edit Content</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admindashboard/spotlight"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-pink-500/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                    Spotlight CMS
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Update community templates, roadmap milestones, and highlight reels.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-pink-400">
                  <span>Manage Spotlight</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admindashboard/academy"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-amber-500/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    Academy CMS
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Publish architectural video tutorials, masterclasses, and workflows.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-amber-400">
                  <span>Manage Academy</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admindashboard/faq"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-emerald-500/40 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    FAQ Manager
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Create and edit public FAQ topics, questions, and answers.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>Manage FAQs</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* CATEGORY 5: System Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
              <Settings className="h-4 w-4 text-slate-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--text-primary)" }}>
                System Configuration & Security
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/admindashboard/settings"
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-white/20 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white group-hover:text-[#00D4FF] transition-colors">
                    Admin Account Settings
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Update operator display name, email address, password, and credit generation rates.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-white">
                  <span>Open Settings</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Audit Log Stream */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#7B61FF]" /> Recent Audit Activity Stream
              </h3>
              <Link href="/admindashboard/analytics" className="text-xs font-semibold text-[#00D4FF] hover:underline">
                View All Audit Logs →
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {stats.recentActivity.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md border border-[#7B61FF]/30 bg-[#7B61FF]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#00D4FF]">
                      {log.actionType}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      By <strong className="text-white">{log.actorEmail}</strong> {log.targetEmail ? <>on <strong className="text-white">{log.targetEmail}</strong></> : null}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--text-subtle)]">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
