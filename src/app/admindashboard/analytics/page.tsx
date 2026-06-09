"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowLeft, Users, ShieldAlert, Zap, Loader2, RefreshCw, Layers, ClipboardList } from "lucide-react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

export default function AdminAnalyticsPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const h = authHeaders();
      const res = await fetch("/api/admin/analytics", { headers: h });
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        setError(json.error || "Failed to load analytics data.");
      }
    } catch (err: any) {
      setError(err.message || "Network error occurred.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (ready && admin) {
      void loadData();
    }
  }, [ready, admin]);

  if (!ready || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4" style={{ color: "var(--text-muted)" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#7B61FF]" />
          <p className="text-sm font-semibold tracking-wide">Loading platform statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[980px] px-4 py-12">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
          <h2 className="text-lg font-bold text-rose-200">Error</h2>
          <p className="mt-2 text-sm text-rose-300/80">{error}</p>
          <button
            onClick={() => void loadData()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const { stats, engines, plans, auditLogs } = data || {};

  return (
    <div className="px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/admindashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Title Block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Platform Analytics
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Real-time platform activity metrics, engine consumption, and administrative audit trails.
            </p>
          </div>
          <button
            disabled={refreshing}
            onClick={() => void loadData(true)}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold text-white transition-colors"
            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#7B61FF]" : ""}`} />
            Refresh statistics
          </button>
        </div>

        {/* 4-Column Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl border p-5 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Registered Members</span>
              <Users className="h-4 w-4 text-[#7B61FF]" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.totalUsers ?? 0}</p>
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-2 border-t border-white/5 pt-2">
              <span>Active: {stats?.activeUsers ?? 0}</span>
              <span>Suspended: {stats?.suspendedUsers ?? 0}</span>
            </div>
          </div>

          <div className="rounded-2xl border p-5 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Active Computes</span>
              <Activity className="h-4 w-4 text-[#00E575]" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.activeTasks ?? 0}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-2 border-t border-white/5 pt-2">
              Pending tasks currently in queue
            </p>
          </div>

          <div className="rounded-2xl border p-5 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Credits Consumed</span>
              <Zap className="h-4 w-4 text-[#FFB000]" />
            </div>
            <p className="text-2xl font-bold text-white">{(stats?.totalCreditsConsumed ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-2 border-t border-white/5 pt-2">
              Lifetime generation costs deducted
            </p>
          </div>

          <div className="rounded-2xl border p-5 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Credits Issued</span>
              <Zap className="h-4 w-4 text-[#00D4FF]" />
            </div>
            <p className="text-2xl font-bold text-white">{(stats?.totalCreditsAdded ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-2 border-t border-white/5 pt-2">
              Lifetime total credits created/granted
            </p>
          </div>
        </div>

        {/* Engine usage & Billing distribution */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Engine Popularity */}
          <div className="rounded-2xl border p-6 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#7B61FF]" /> Model & Engine Usage
            </h2>
            {engines?.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">No tasks executed yet.</p>
            ) : (
              <div className="space-y-3">
                {engines?.map((item: any) => {
                  const maxCount = Math.max(...engines.map((e: any) => e.count), 1);
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white font-mono">{item.name}</span>
                        <span className="text-[var(--text-muted)]">{item.count} tasks</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#7B61FF] to-[#00D4FF]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Billing Plan Distribution */}
          <div className="rounded-2xl border p-6 bg-[var(--soft-black)]" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#00E575]" /> Membership Plan Shares
            </h2>
            {plans?.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">No user subscription distribution available.</p>
            ) : (
              <div className="space-y-3">
                {plans?.map((item: any) => {
                  const maxPlan = Math.max(...plans.map((p: any) => p.count), 1);
                  const pct = Math.round((item.count / maxPlan) * 100);
                  return (
                    <div key={item.plan} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white capitalize">{item.plan || "free"}</span>
                        <span className="text-[var(--text-muted)]">{item.count} user(s)</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF2E9A]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Global Audit Logs Ledger */}
        <div className="rounded-2xl border bg-[var(--soft-black)] overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="p-6 border-b border-white/5 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#00D4FF]" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Administrative Audit Logs
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Full chronological ledger of setting modifications, role switches, and suspensions.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b uppercase tracking-wider text-[var(--text-subtle)] font-bold bg-black/20" style={{ borderColor: "var(--border-subtle)" }}>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Actor (Admin)</th>
                  <th className="px-6 py-3">Target User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Value Change</th>
                  <th className="px-6 py-3">Meta / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-[var(--text-muted)]">
                      No audit log entries logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs?.map((log: any) => {
                    let detailsObj: any = {};
                    try {
                      detailsObj = JSON.parse(log.detailsJson);
                    } catch(e) {}
                    return (
                      <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-[var(--text-subtle)] font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-semibold text-white">
                          {log.actorEmail}
                        </td>
                        <td className="px-6 py-3 font-mono text-[var(--text-muted)]">
                          {log.targetUserEmail || log.targetUserId || "—"}
                        </td>
                        <td className="px-6 py-3 font-semibold">
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-white">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-[var(--text-subtle)]">
                          {log.oldValue !== undefined && log.oldValue !== null ? (
                            <span className="line-through text-rose-400 mr-2">{log.oldValue}</span>
                          ) : null}
                          {log.newValue !== undefined && log.newValue !== null ? (
                            <span className="text-emerald-400 font-bold">{log.newValue}</span>
                          ) : null}
                        </td>
                        <td className="px-6 py-3 text-[var(--text-muted)] max-w-xs truncate">
                          {detailsObj?.reason || detailsObj?.message || JSON.stringify(detailsObj)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
