"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Filter,
  Loader2,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

const STATUS_COLOR: Record<string, string> = {
  captured: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  failed: "text-rose-400 bg-rose-400/10 border-rose-400/25",
  created: "text-amber-400 bg-amber-400/10 border-amber-400/25",
};

export default function AdminPaymentsPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();

  const [payments, setPayments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 30;

  const load = useCallback(async () => {
    const h = authHeaders();
    if (!h.Authorization) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter) params.set("status", statusFilter);
      if (planFilter) params.set("plan", planFilter);
      if (search) params.set("search", search);

      const [payRes, anaRes] = await Promise.all([
        fetch(`/api/admin/payments?${params}`, { headers: h, cache: "no-store" }),
        fetch("/api/admin/payments/analytics", { headers: h, cache: "no-store" }),
      ]);

      const payData = await payRes.json();
      const anaData = await anaRes.json();

      if (payData.ok) { setPayments(payData.payments || []); setTotal(payData.total || 0); }
      if (anaData.ok) setAnalytics(anaData);
    } catch {}
    finally { setLoading(false); }
  }, [authHeaders, page, statusFilter, planFilter, search]);

  useEffect(() => { if (ready && admin) load(); }, [ready, admin, load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  if (!ready) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
    </div>
  );

  if (!admin) return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-[var(--text-muted)]">
        <Link href="/admin/login" className="font-semibold text-[#00D4FF] hover:underline">
          Admin login required
        </Link>
      </p>
    </div>
  );

  return (
    <div className="px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px] space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border p-6 sm:p-8 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>Admin · Payments</p>
            <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Transactions
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Monitor all Razorpay payments, revenue analytics, and credit purchases.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admindashboard" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <button onClick={load} disabled={loading} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
            </button>
          </div>
        </div>

        {/* Analytics cards */}
        {analytics && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Revenue", value: analytics.analytics?.totalRevenue || "₹0", icon: TrendingUp, color: "#00E575" },
              { label: "Successful", value: analytics.analytics?.successfulPayments || 0, icon: CheckCircle2, color: "#00D4FF" },
              { label: "Failed", value: analytics.analytics?.failedPayments || 0, icon: Activity, color: "#FF2E9A" },
              { label: "Total Orders", value: analytics.analytics?.totalTransactions || 0, icon: CreditCard, color: "#7B61FF" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${m.color}1a` }}>
                  <m.icon className="h-5 w-5" style={{ color: m.color }} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>{m.label}</p>
                <p className="mt-1 font-display text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>{String(m.value)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email, name, payment ID…"
            className="min-h-[40px] flex-1 min-w-[220px] rounded-xl border px-4 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="min-h-[40px] rounded-xl border px-3 text-sm outline-none"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
          >
            <option value="">All Statuses</option>
            <option value="captured">Successful</option>
            <option value="failed">Failed</option>
            <option value="created">Pending</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="min-h-[40px] rounded-xl border px-3 text-sm outline-none"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
          >
            <option value="">All Plans</option>
            <option value="pro">Pro (Monthly)</option>
            <option value="pro_yearly">Pro (Yearly)</option>
            <option value="pro_plus">Pro Plus (Monthly)</option>
            <option value="pro_plus_yearly">Pro Plus (Yearly)</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}>
                  <th className="px-5 py-3 font-bold">User</th>
                  <th className="px-4 py-3 font-bold">Plan</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Credits</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading && payments.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#7B61FF]" /></td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>No payments found.</td></tr>
                ) : payments.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: "var(--border-subtle)" }}>
                    <td className="px-5 py-3">
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.userName || "—"}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-[var(--deep-black)] px-2 py-1 font-mono text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                        {p.planName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: "var(--text-primary)" }}>{p.amountDisplay}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#00D4FF]">
                        <Zap className="h-3 w-3" /> {p.credits}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLOR[p.status] || ""}`}>
                        {p.status === "captured" ? "Success" : p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--text-subtle)" }}>
                      {p.date ? new Date(p.date).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                {total} total · Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                  Prev
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
