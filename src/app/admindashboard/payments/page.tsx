"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Eye,
  Filter,
  Key,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

const STATUS_COLOR: Record<string, string> = {
  CREDITED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  captured: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  VERIFIED: "text-blue-400 bg-blue-400/10 border-blue-400/25",
  FAILED: "text-rose-400 bg-rose-400/10 border-rose-400/25",
  failed: "text-rose-400 bg-rose-400/10 border-rose-400/25",
  REFUNDED: "text-purple-400 bg-purple-400/10 border-purple-400/25",
  CREATED: "text-amber-400 bg-amber-400/10 border-amber-400/25",
  CHECKOUT_STARTED: "text-amber-400 bg-amber-400/10 border-amber-400/25",
};

export default function AdminPaymentsPage() {
  const { admin, ready, authHeaders } = useAdminAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 30;

  // Selected transaction detail drawer
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Refund Modal State
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  // Credit Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustType, setAdjustType] = useState("ADMIN_ADJUSTMENT");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Gateway Config State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configData, setConfigData] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Config Update Form
  const [cfgKeyId, setCfgKeyId] = useState("");
  const [cfgKeySecret, setCfgKeySecret] = useState("");
  const [cfgMode, setCfgMode] = useState("test");
  const [cfgWebhookSecret, setCfgWebhookSecret] = useState("");
  const [submittingConfig, setSubmittingConfig] = useState(false);

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

  // Load single transaction details
  const openDetail = async (id: string) => {
    setSelectedTxId(id);
    setLoadingDetail(true);
    const h = authHeaders();
    try {
      const res = await fetch(`/api/admin/payments/${id}`, { headers: h });
      const d = await res.json();
      if (d.ok) setDetailData(d.transaction);
    } catch {}
    finally { setLoadingDetail(false); }
  };

  // Load config status
  const loadConfig = async () => {
    setLoadingConfig(true);
    const h = authHeaders();
    try {
      const res = await fetch("/api/admin/payment-config", { headers: h });
      const d = await res.json();
      if (d.ok) {
        setConfigData(d);
        setCfgMode(d.mode || "test");
      }
    } catch {}
    finally { setLoadingConfig(false); }
  };

  // Test Gateway Connection
  const testConnection = async () => {
    setTestingConn(true);
    setTestResult(null);
    const h = authHeaders();
    try {
      const res = await fetch("/api/admin/payment-config/test", {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
      });
      const d = await res.json();
      setTestResult(d);
    } catch (e: any) {
      setTestResult({ ok: false, connected: false, message: e.message });
    } finally {
      setTestingConn(false);
    }
  };

  // Save Gateway Credentials
  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingConfig(true);
    const h = authHeaders();
    try {
      const res = await fetch("/api/admin/payment-config", {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({
          keyId: cfgKeyId,
          keySecret: cfgKeySecret,
          mode: cfgMode,
          webhookSecret: cfgWebhookSecret,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        alert("Payment configuration updated successfully.");
        setCfgKeySecret("");
        loadConfig();
        load();
      } else {
        alert(d.error || "Failed to update payment configuration.");
      }
    } catch {
      alert("Request failed.");
    } finally {
      setSubmittingConfig(false);
    }
  };

  // Process Refund
  const handleRefund = async () => {
    if (!selectedTxId) return;
    if (!confirm("Are you sure you want to refund this transaction and reverse the credited balance?")) return;

    setSubmittingRefund(true);
    const h = authHeaders();
    try {
      const res = await fetch(`/api/admin/payments/${selectedTxId}/refund`, {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({ reason: refundReason }),
      });
      const d = await res.json();
      if (d.ok) {
        alert(d.message);
        openDetail(selectedTxId);
        load();
      } else {
        alert(d.error || "Refund failed.");
      }
    } catch {
      alert("Refund request failed.");
    } finally {
      setSubmittingRefund(false);
    }
  };

  // Process Manual Credit Adjustment
  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetUser || !adjustAmount || !adjustReason) {
      alert("Please fill in all adjustment fields.");
      return;
    }

    setSubmittingAdjust(true);
    const h = authHeaders();
    try {
      const res = await fetch("/api/admin/credits/adjust", {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({
          userId: adjustTargetUser,
          amount: Number(adjustAmount),
          reason: adjustReason,
          type: adjustType,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        alert(d.message);
        setShowAdjustModal(false);
        setAdjustAmount("");
        setAdjustReason("");
        load();
      } else {
        alert(d.error || "Credit adjustment failed.");
      }
    } catch {
      alert("Adjustment request failed.");
    } finally {
      setSubmittingAdjust(false);
    }
  };

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
      <div className="mx-auto max-w-[1280px] space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border p-6 sm:p-8 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>Admin · Payment Infrastructure</p>
            <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Razorpay Transactions &amp; Audit
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Server-authoritative payment log, analytics dashboard, credit ledger adjustments, and gateway key configuration.
            </p>
          </div>
            <Link
              href="/admindashboard/credits"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#FFB800]/40 bg-[#FFB800]/10 px-4 text-sm font-semibold text-white hover:bg-[#FFB800]/20"
            >
              <Coins className="h-4 w-4 text-[#FFB800]" /> Credit Cost Rates
            </Link>
            <button
              onClick={() => { setShowAdjustModal(true); }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#7B61FF]/40 bg-[#7B61FF]/10 px-4 text-sm font-semibold text-white hover:bg-[#7B61FF]/20"
            >
              <Plus className="h-4 w-4 text-[#7B61FF]" /> Credit Adjustment
            </button>
            <button
              onClick={() => { setShowConfigModal(true); loadConfig(); }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/10 px-4 text-sm font-semibold text-white hover:bg-[#00D4FF]/20"
            >
              <Key className="h-4 w-4 text-[#00D4FF]" /> Gateway Settings
            </button>
            <button onClick={load} disabled={loading} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
            </button>
        </div>

        {/* Revenue Analytics Metrics */}
        {analytics && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Total Revenue", value: analytics.analytics?.totalRevenue || "₹0", sub: `Avg Order: ${analytics.analytics?.averageOrderValue || "₹0"}`, icon: TrendingUp, color: "#00E575" },
              { label: "Today Revenue", value: analytics.analytics?.todayRevenue || "₹0", sub: `Weekly: ${analytics.analytics?.weeklyRevenue || "₹0"}`, icon: Clock, color: "#00D4FF" },
              { label: "Successful", value: analytics.analytics?.successfulPayments || 0, sub: `${analytics.analytics?.upgradedUsers || 0} upgraded users`, icon: CheckCircle2, color: "#7B61FF" },
              { label: "Failed / Refunded", value: `${analytics.analytics?.failedPayments || 0} / ${analytics.analytics?.refundedPayments || 0}`, sub: `${analytics.analytics?.pendingPayments || 0} pending orders`, icon: ShieldAlert, color: "#FF2E9A" },
              { label: "Credits Sold", value: (analytics.analytics?.totalCreditsSold || 0).toLocaleString(), sub: "Total granted via plans", icon: Zap, color: "#FFB800" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${m.color}1a` }}>
                  <m.icon className="h-5 w-5" style={{ color: m.color }} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>{m.label}</p>
                <p className="mt-1 font-display text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>{String(m.value)}</p>
                <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>{m.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-subtle)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by TXN-ID, Razorpay order, payment ID, email, or name…"
              className="min-h-[42px] w-full rounded-xl border pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
              style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="min-h-[42px] rounded-xl border px-3 text-sm outline-none"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
          >
            <option value="">All Statuses</option>
            <option value="CREDITED">Credited / Success</option>
            <option value="CREATED">Pending / Created</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="min-h-[42px] rounded-xl border px-3 text-sm outline-none"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
          >
            <option value="">All Plans</option>
            <option value="pro">Pro (Monthly)</option>
            <option value="pro_yearly">Pro (Yearly)</option>
            <option value="pro_plus">Pro Plus (Monthly)</option>
            <option value="pro_plus_yearly">Pro Plus (Yearly)</option>
          </select>
        </div>

        {/* Transactions Table */}
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}>
                  <th className="px-5 py-3 font-bold">Transaction Ref</th>
                  <th className="px-5 py-3 font-bold">User</th>
                  <th className="px-4 py-3 font-bold">Plan</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Credits</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && payments.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#7B61FF]" /></td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>No matching payment records found.</td></tr>
                ) : payments.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: "var(--border-subtle)" }}>
                    <td className="px-5 py-3 font-mono text-xs">
                      <span className="font-bold text-white block">{p.internalTransactionId}</span>
                      <span className="text-[10px] text-[var(--text-subtle)]">{p.razorpayOrderId}</span>
                    </td>
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
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLOR[p.status] || STATUS_COLOR.CREATED}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--text-subtle)" }}>
                      {p.date ? new Date(p.date).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(p.id)}
                        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold hover:bg-white/10"
                        style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </button>
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

        {/* ─── MODAL 1: Transaction Detail Drawer ─────────────────────────── */}
        {selectedTxId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setSelectedTxId(null)} />
            <div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 sm:p-8"
              style={{ background: "var(--soft-black)", borderColor: "var(--border-subtle)" }}
            >
              <button
                onClick={() => setSelectedTxId(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-muted)] hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="font-display text-xl font-bold text-white mb-4">
                Transaction Audit Overview
              </h2>

              {loadingDetail ? (
                <div className="py-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#7B61FF]" /></div>
              ) : detailData ? (
                <div className="space-y-6 text-sm">
                  {/* Basic summary */}
                  <div className="rounded-xl border p-4 grid grid-cols-2 gap-4" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}>
                    <div>
                      <p className="text-xs text-[var(--text-subtle)]">Internal TX ID</p>
                      <p className="font-mono font-bold text-white">{detailData.internalTransactionId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-subtle)]">Status</p>
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLOR[detailData.status] || ""}`}>
                        {detailData.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-subtle)]">User</p>
                      <p className="font-semibold text-white">{detailData.user.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{detailData.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-subtle)]">Plan &amp; Amount</p>
                      <p className="font-bold text-[#00D4FF]">{detailData.plan.name} ({detailData.plan.priceDisplay})</p>
                      <p className="text-xs text-[var(--text-muted)]">+{detailData.plan.creditsToGrant} Credits</p>
                    </div>
                  </div>

                  {/* Razorpay Info */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Razorpay IDs</h3>
                    <div className="rounded-xl border p-3 font-mono text-xs space-y-1" style={{ borderColor: "var(--border-subtle)" }}>
                      <p><span className="text-[var(--text-subtle)]">Razorpay Order:</span> {detailData.razorpayOrderId}</p>
                      <p><span className="text-[var(--text-subtle)]">Razorpay Payment:</span> {detailData.razorpayPaymentId || "—"}</p>
                      <p><span className="text-[var(--text-subtle)]">Signature:</span> {detailData.razorpaySignature || "—"}</p>
                    </div>
                  </div>

                  {/* Audit Timeline */}
                  {detailData.auditTimeline && detailData.auditTimeline.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Audit Event History</h3>
                      <div className="space-y-2">
                        {detailData.auditTimeline.map((ev: any) => (
                          <div key={ev.id} className="flex items-center justify-between rounded-lg border p-2.5 text-xs" style={{ borderColor: "var(--border-subtle)" }}>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-[#00E575]" />
                              <span className="font-semibold capitalize text-white">{ev.action.replace(/_/g, " ")}</span>
                            </div>
                            <span className="font-mono text-[var(--text-subtle)]">{new Date(ev.timestamp).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failure reason if any */}
                  {detailData.failureReason && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-200 text-xs">
                      <span className="font-bold">Failure Reason:</span> {detailData.failureReason}
                    </div>
                  )}

                  {/* Refund Control */}
                  {(detailData.status === "CREDITED" || detailData.status === "captured") && (
                    <div className="rounded-xl border p-4 border-purple-500/30 bg-purple-500/10 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">Admin Refund Action</h4>
                      <input
                        type="text"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Reason for refund (e.g. User requested cancelation)"
                        className="w-full rounded-lg border px-3 py-2 text-xs outline-none bg-black/40 text-white border-purple-500/30"
                      />
                      <button
                        onClick={handleRefund}
                        disabled={submittingRefund}
                        className="w-full rounded-lg py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                      >
                        {submittingRefund ? "Processing Refund..." : "Issue Refund & Reverse Credits"}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ─── MODAL 2: Credit Adjustment Modal ──────────────────────────── */}
        {showAdjustModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setShowAdjustModal(false)} />
            <form
              onSubmit={handleAdjustCredits}
              className="relative w-full max-w-md rounded-2xl border p-6 sm:p-8 space-y-4"
              style={{ background: "var(--soft-black)", borderColor: "var(--border-subtle)" }}
            >
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-muted)] hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="font-display text-xl font-bold text-white">Manual Credit Adjustment</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Grant bonus credits or deduct credits with an immutable credit ledger record.
              </p>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">User ID</label>
                <input
                  type="text"
                  required
                  value={adjustTargetUser}
                  onChange={(e) => setAdjustTargetUser(e.target.value)}
                  placeholder="e.g. usr_123456"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none bg-black/40 text-white border-[var(--border-subtle)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Credit Delta (+ or -)</label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 500 or -200"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none bg-black/40 text-white border-[var(--border-subtle)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none bg-black/40 text-white border-[var(--border-subtle)]"
                >
                  <option value="ADMIN_ADJUSTMENT">ADMIN_ADJUSTMENT</option>
                  <option value="BONUS">BONUS</option>
                  <option value="REVERSAL">REVERSAL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Reason (Mandatory Audit Log)</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Customer compensation for service interruption"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none bg-black/40 text-white border-[var(--border-subtle)]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAdjust}
                className="w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)" }}
              >
                {submittingAdjust ? "Applying Adjustment…" : "Confirm Credit Adjustment"}
              </button>
            </form>
          </div>
        )}

        {/* ─── MODAL 3: Razorpay Gateway Settings Modal ───────────────────── */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setShowConfigModal(false)} />
            <div
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 sm:p-8 space-y-6"
              style={{ background: "var(--soft-black)", borderColor: "var(--border-subtle)" }}
            >
              <button
                onClick={() => setShowConfigModal(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-muted)] hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-[#00D4FF]" /> Razorpay Gateway Configuration
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Configure live production keys or test environment credentials securely.
                </p>
              </div>

              {loadingConfig ? (
                <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#7B61FF]" /></div>
              ) : configData ? (
                <div className="space-y-4 text-xs">
                  {/* Status Banner */}
                  <div className="rounded-xl border p-4 flex items-center justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}>
                    <div>
                      <p className="font-bold text-white">Active Mode: {configData.mode?.toUpperCase()}</p>
                      <p className="text-[var(--text-muted)]">Key ID: {configData.keyIdMasked}</p>
                      <p className="text-[var(--text-muted)]">Secret Configured: {configData.isSecretConfigured ? "Yes ✓" : "No ✗"}</p>
                    </div>
                    <button
                      onClick={testConnection}
                      disabled={testingConn}
                      className="rounded-lg border px-3 py-2 font-semibold text-white bg-white/5 hover:bg-white/10 disabled:opacity-50"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      {testingConn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Connection"}
                    </button>
                  </div>

                  {testResult && (
                    <div className={`rounded-xl border p-3 ${testResult.connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>
                      <p className="font-bold">{testResult.message}</p>
                    </div>
                  )}

                  {/* Form to Update Credentials */}
                  <form onSubmit={saveConfig} className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Update Credentials</h3>

                    <div>
                      <label className="block mb-1 text-[var(--text-muted)]">Gateway Mode</label>
                      <select
                        value={cfgMode}
                        onChange={(e) => setCfgMode(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-black/40 text-white border-[var(--border-subtle)]"
                      >
                        <option value="test">Test Mode</option>
                        <option value="live">Live Production Mode</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-[var(--text-muted)]">Key ID (rzp_test_... or rzp_live_...)</label>
                      <input
                        type="text"
                        value={cfgKeyId}
                        onChange={(e) => setCfgKeyId(e.target.value)}
                        placeholder="rzp_live_your_key_id"
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-black/40 text-white border-[var(--border-subtle)]"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-[var(--text-muted)]">Key Secret (Encrypted Server-Side)</label>
                      <input
                        type="password"
                        value={cfgKeySecret}
                        onChange={(e) => setCfgKeySecret(e.target.value)}
                        placeholder="Enter new secret to update..."
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-black/40 text-white border-[var(--border-subtle)]"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-[var(--text-muted)]">Webhook Secret</label>
                      <input
                        type="password"
                        value={cfgWebhookSecret}
                        onChange={(e) => setCfgWebhookSecret(e.target.value)}
                        placeholder="Enter webhook secret..."
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-black/40 text-white border-[var(--border-subtle)]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingConfig}
                      className="w-full rounded-xl py-3 font-bold text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)" }}
                    >
                      {submittingConfig ? "Saving Configuration..." : "Save Credentials"}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
