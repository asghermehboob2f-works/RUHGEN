"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Coins, CreditCard, Activity, Zap, ClipboardList, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BillingSkeleton } from "@/components/Skeletons";

export default function BillingPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ledger" | "history">("ledger");

  const loadDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const token = localStorage.getItem("ruhgen_user_jwt_v1");
    if (!token) return;

    try {
      const res = await fetch("/api/credits/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resJson = await res.json();
      if (resJson.ok) {
        setData(resJson);
      }
    } catch (err) {
      console.error("Error fetching credit dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/billing");
  }, [ready, user, router]);

  useEffect(() => {
    if (user) {
      void loadDashboardData();
    }
  }, [user]);

  if (!ready || (loading && !data)) {
    return <BillingSkeleton />;
  }

  if (!user) return null;

  const metrics = data?.metrics || {
    credits: user.credits ?? 0,
    pendingCredits: 0,
    availableCredits: user.credits ?? 0,
    lifetimeUsed: 0,
    lifetimeAdded: 0,
    pendingCount: 0
  };

  const transactions = data?.transactions || [];
  const generations = data?.generations || [];
  const monthlyStats = data?.monthlyStats || [];

  const features = ["Priority processing queue", "HD generation exports", "Engine selector & custom settings", "Dedicated email support"];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
            Billing
          </p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
            Credits & usage
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
            Manage your compute balance, monitor active holds, and view your generation history logs.
          </p>
        </motion.div>
        
        <button
          disabled={refreshing}
          onClick={() => void loadDashboardData(true)}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold text-white transition-colors self-start sm:self-center"
          style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#7B61FF]" : ""}`} />
          Refresh usage
        </button>
      </div>

      {/* Credit Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main balance card */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.06 }}
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 lg:col-span-2 flex flex-col justify-between"
          style={{
            borderColor: "transparent",
            background:
              "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, rgba(123,97,255,0.4), rgba(0,212,255,0.2)) border-box",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))" }}
            >
              <Coins className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Available Balance
              </p>
              <p className="font-display mt-1 text-5xl font-extrabold tabular-nums text-white">
                {metrics.availableCredits}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                net credits available (holds subtracted)
              </p>
            </div>
          </div>

          {/* Sub metrics / holds block */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">Settled credits</p>
              <p className="text-lg font-bold text-white mt-0.5">{metrics.credits}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1">
                Active holds
                {metrics.pendingCount > 0 && (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">
                {metrics.pendingCredits} <span className="text-xs font-medium text-[var(--text-muted)]">({metrics.pendingCount} active)</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))",
                boxShadow: "0 10px 32px -8px rgba(123,97,255,0.5)",
              }}
            >
              View pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Plan Details Card */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.1 }}
          className="rounded-3xl border p-6 sm:p-8 flex flex-col justify-between"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5" style={{ color: "var(--primary-cyan)" }} strokeWidth={1.75} />
              <h2 className="font-display text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Current plan
              </h2>
            </div>
            <p className="mt-2 text-2xl font-extrabold capitalize text-white">
              {user.subscriptionPlan || "free"} tier
            </p>
            <p className="mt-1 text-xs uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>
              Status: <span className="text-emerald-400">{user.subscriptionStatus || "active"}</span>
            </p>
            <ul className="mt-6 space-y-2.5">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary-cyan)_15%,transparent)]">
                    <Check className="h-3 w-3 text-[var(--primary-cyan)]" strokeWidth={2.5} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Lifetime stats grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border p-4 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">Lifetime Spent</p>
          <p className="text-xl font-bold text-white mt-1">{metrics.lifetimeUsed} credits</p>
        </div>
        <div className="rounded-2xl border p-4 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">Total Issued</p>
          <p className="text-xl font-bold text-white mt-1">{metrics.lifetimeAdded} credits</p>
        </div>
        <div className="rounded-2xl border p-4 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">Active Tasks</p>
          <p className="text-xl font-bold text-white mt-1">{metrics.pendingCount} queued</p>
        </div>
        <div className="rounded-2xl border p-4 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">Account Access</p>
          <p className="text-xl font-bold mt-1 text-emerald-400">Full Access</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-white/5 flex gap-6">
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 text-sm font-semibold relative transition-colors ${activeTab === "ledger" ? "text-white" : "text-[var(--text-subtle)] hover:text-white"}`}
        >
          Transaction Ledger
          {activeTab === "ledger" && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B61FF]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 text-sm font-semibold relative transition-colors ${activeTab === "history" ? "text-white" : "text-[var(--text-subtle)] hover:text-white"}`}
        >
          Generation History & Holds
          {activeTab === "history" && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B61FF]" />
          )}
        </button>
      </div>

      {/* Ledger Tab */}
      {activeTab === "ledger" && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border p-6 bg-[var(--soft-black)]"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {transactions.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl bg-black/10">
              <p className="text-xs text-[var(--text-muted)]">No transaction logs logged yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[var(--text-subtle)] font-bold uppercase tracking-wider pb-3">
                    <th className="pb-3 pr-4">Action Type</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Settled Balance</th>
                    <th className="pb-3 pr-4">Details / Source</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((item: any) => {
                    const isAdd = item.creditsAdded > 0;
                    const amtStr = isAdd ? `+${item.creditsAdded}` : `-${item.creditsDeducted}`;
                    const color = isAdd ? "text-emerald-400" : "text-rose-400";
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 pr-4 font-semibold text-white capitalize">
                          {item.actionType.replace(/_/g, " ")}
                        </td>
                        <td className={`py-3 pr-4 font-bold tabular-nums ${color}`}>
                          {amtStr}
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-[var(--text-muted)]">
                          {item.newBalance}
                        </td>
                        <td className="py-3 pr-4 text-[var(--text-muted)] max-w-xs truncate" title={item.reason}>
                          {item.reason} <span className="text-[10px] text-[var(--text-subtle)] font-mono">({item.source})</span>
                        </td>
                        <td className="py-3 text-[var(--text-subtle)] whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* History & Queue Tab */}
      {activeTab === "history" && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border p-6 bg-[var(--soft-black)]"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {generations.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl bg-black/10">
              <p className="text-xs text-[var(--text-muted)]">No generations recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[var(--text-subtle)] font-bold uppercase tracking-wider pb-3">
                    <th className="pb-3 pr-4">Task ID</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Model</th>
                    <th className="pb-3 pr-4">Credit Cost</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Prompt preview</th>
                    <th className="pb-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {generations.map((gen: any) => {
                    let statusColor = "text-zinc-400 bg-zinc-800/40";
                    if (gen.status === "completed") statusColor = "text-emerald-400 bg-emerald-500/10";
                    else if (gen.status === "pending") statusColor = "text-amber-400 bg-amber-500/10 animate-pulse";
                    else if (gen.status === "failed") statusColor = "text-rose-400 bg-rose-500/10";

                    return (
                      <tr key={gen.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 pr-4 font-mono text-[var(--text-subtle)]">
                          {gen.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 pr-4 font-semibold text-white capitalize">
                          {gen.type}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[var(--text-muted)]">
                          {gen.model ? gen.model.split("/").pop() : "—"}
                        </td>
                        <td className="py-3 pr-4 font-bold text-white tabular-nums">
                          {gen.credits}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${statusColor}`}>
                            {gen.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[var(--text-muted)] max-w-xs truncate" title={gen.prompt}>
                          {gen.prompt || "—"}
                        </td>
                        <td className="py-3 text-[var(--text-subtle)] whitespace-nowrap">
                          {new Date(gen.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
