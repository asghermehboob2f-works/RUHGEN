"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Coins,
  CreditCard,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Sparkles,
  Video,
  Zap,
  ShieldCheck,
  TrendingUp,
  Server,
  DollarSign,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import {
  ProLabel,
  ProSettingsCard,
  ProSettingsHero,
  proInputClass,
  proInputStyle,
} from "@/components/settings/ProSettingsShell";

interface FinancialsData {
  providerBalance?: {
    ok: boolean;
    configured: boolean;
    credits: number;
    creditsUsd: number;
    isSufficientForVideo: boolean;
    error?: string;
  };
  creditSupply: {
    outstandingPurchasedCredits: number;
    outstandingPromotionalCredits: number;
    reservedCredits: number;
    totalCreditSupply: number;
    creditInrRate: number;
    monetaryLiabilityINR: number;
  };
  providerSpend: {
    totalJobs: number;
    succeededJobs: number;
    failedJobs: number;
    totalCreditsConsumed: number;
    totalKieCostUSD: number;
    totalKieCostINR: number;
    inrUsdRate: number;
    spendByModel: Array<{
      modelId: string;
      type: string;
      jobsCount: number;
      creditsConsumed: number;
      totalCostUsd: string;
      totalCostInr: number;
    }>;
  };
  marginAnalysis: {
    totalRevenueINR: number;
    successfulPaymentsCount: number;
    totalKieCostINR: number;
    grossProfitINR: number;
    grossMarginPercent: number;
  };
}

interface AdminModel {
  id: string;
  name: string;
  type: string;
  tier: string;
  credit_cost_type: string;
  base_credit_cost: number;
  base_provider_cost: number;
  min_margin_percent: number;
  enabled: boolean;
}

export default function AdminCreditRatesPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();

  const [costImageSchnell, setCostImageSchnell] = useState("2");
  const [costImageDev, setCostImageDev] = useState("4");
  const [costVideoStd, setCostVideoStd] = useState("5");
  const [costVideoPro, setCostVideoPro] = useState("8");

  const [financials, setFinancials] = useState<FinancialsData | null>(null);
  const [models, setModels] = useState<AdminModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateStatus, setRateStatus] = useState("");
  const [ratesPending, setRatesPending] = useState(false);
  const [togglingModelId, setTogglingModelId] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const h = authHeaders();
      const [ratesRes, finRes, modelsRes] = await Promise.all([
        fetch("/api/credits/rates", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/financials", { headers: h, cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/models", { headers: h, cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      ]);

      if (ratesRes?.ok && ratesRes.rates) {
        setCostImageSchnell(String(ratesRes.rates.cost_image_schnell ?? ratesRes.rates.credits_per_image ?? 2));
        setCostImageDev(String(ratesRes.rates.cost_image_dev ?? 4));
        setCostVideoStd(String(ratesRes.rates.cost_video_std ?? ratesRes.rates.credits_per_video_second ?? 5));
        setCostVideoPro(String(ratesRes.rates.cost_video_pro ?? 8));
      }

      if (finRes?.ok && finRes.financials) {
        setFinancials(finRes.financials);
      }

      if (modelsRes?.ok && Array.isArray(modelsRes.models)) {
        setModels(modelsRes.models);
      }
    } catch (err) {
      console.error("Error fetching admin credit data", err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (ready && admin) {
      fetchAllData();
    }
  }, [ready, admin, fetchAllData]);

  const onSaveRates = async () => {
    setRateStatus("");
    const imgSchnellVal = Number(costImageSchnell);
    const imgDevVal = Number(costImageDev);
    const vidStdVal = Number(costVideoStd);
    const vidProVal = Number(costVideoPro);

    if (
      isNaN(imgSchnellVal) || imgSchnellVal < 0 ||
      isNaN(imgDevVal) || imgDevVal < 0 ||
      isNaN(vidStdVal) || vidStdVal < 0 ||
      isNaN(vidProVal) || vidProVal < 0
    ) {
      setRateStatus("Rates must be non-negative numbers.");
      return;
    }

    setRatesPending(true);
    try {
      const h = authHeaders();
      if (!h.Authorization) {
        setRateStatus("Sign in again at /admin/login.");
        setRatesPending(false);
        return;
      }

      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({
          cost_image_schnell: imgSchnellVal,
          cost_image_dev: imgDevVal,
          cost_video_std: vidStdVal,
          cost_video_pro: vidProVal,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setRateStatus(data.error || "Could not save rates.");
      } else {
        setRateStatus("Saved credit rates successfully. Model registry and pricing updated.");
        fetchAllData();
      }
    } catch {
      setRateStatus("Network error.");
    } finally {
      setRatesPending(false);
    }
  };

  const onToggleModel = async (modelId: string, currentEnabled: boolean) => {
    setTogglingModelId(modelId);
    try {
      const h = authHeaders();
      const res = await fetch(`/api/admin/models/${encodeURIComponent(modelId)}`, {
        method: "PATCH",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.ok) {
        setModels((prev) =>
          prev.map((m) => (m.id === modelId ? { ...m, enabled: !currentEnabled } : m))
        );
      }
    } catch (err) {
      console.error("Error toggling model", err);
    } finally {
      setTogglingModelId(null);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4" style={{ color: "var(--text-muted)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
        <p className="text-sm font-semibold tracking-wide">Loading credit control deck…</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-2xl border p-8" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <p className="font-display text-xl font-bold text-white">Admin access required</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            <Link className="font-semibold text-[#00D4FF] hover:underline" href="/admin/login?next=/admindashboard/credits">
              Sign in as Admin
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-[1000px] space-y-8">
        <ProSettingsHero
          eyebrow="Admin Credit Control"
          title="KIE.ai Economics & Rate Matrix"
          description="Authoritative single source of truth for generation credit costs, customer liability tracking, provider spend, and economic margin protection."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admindashboard/payments"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-emerald-500/40"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <CreditCard className="h-4 w-4 shrink-0 text-emerald-400" />
                Payments &amp; Ledger
              </Link>
              <Link
                href="/admindashboard/analytics"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#7B61FF]/35"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <TrendingUp className="h-4 w-4 shrink-0 text-[#7B61FF]" />
                Analytics
              </Link>
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-white/20"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
                Overview
              </Link>
            </div>
          }
        />

        {/* 1. FINANCIAL LIABILITY & MARGIN METRICS */}
        {financials && (
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Live KIE.ai Provider Status & Balance Banner */}
            {financials.providerBalance && financials.providerBalance.configured && (
              <div
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  financials.providerBalance.isSufficientForVideo
                    ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                    : "border-amber-500/30 bg-amber-950/20 text-amber-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Server className={`h-5 w-5 mt-0.5 shrink-0 ${
                    financials.providerBalance.isSufficientForVideo ? "text-emerald-400" : "text-amber-400"
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold tracking-wide text-white">
                        KIE.ai Live Provider Account Balance:{" "}
                        <span className="font-mono text-cyan-400 font-extrabold">
                          {financials.providerBalance.credits.toLocaleString()} credits
                        </span>{" "}
                        <span className="text-xs text-white/60">
                          (≈ ${financials.providerBalance.creditsUsd.toFixed(3)} USD)
                        </span>
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          financials.providerBalance.isSufficientForVideo
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {financials.providerBalance.isSufficientForVideo ? "Ready" : "Low Provider Balance"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/70">
                      {financials.providerBalance.isSufficientForVideo
                        ? "Provider account has sufficient credits for live Kling Standard & Premium video generations."
                        : `Current KIE.ai balance (${financials.providerBalance.credits} credits) is below the 55 credits required for Kling 2.6 video rendering. Please top up your balance at kie.ai to generate videos.`}
                    </p>
                  </div>
                </div>
                <a
                  href="https://kie.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all"
                >
                  Manage at KIE.ai ↗
                </a>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Customer Monetary Liability */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Customer Liability
                  </span>
                  <span>₹{financials.creditSupply.creditInrRate}/cr</span>
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  ₹{financials.creditSupply.monetaryLiabilityINR.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {financials.creditSupply.outstandingPurchasedCredits.toLocaleString()} purchased credits held by active users.
                </p>
              </div>

              {/* Credit Supply Breakdown */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  <span className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4" /> Total Credit Supply
                  </span>
                  <span>Live</span>
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  {financials.creditSupply.totalCreditSupply.toLocaleString()}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {financials.creditSupply.outstandingPromotionalCredits.toLocaleString()} promo + {financials.creditSupply.reservedCredits.toLocaleString()} reserved.
                </p>
              </div>

              {/* KIE.ai Provider Spend */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-violet-400">
                  <span className="flex items-center gap-1.5">
                    <Server className="h-4 w-4" /> KIE.ai Spend
                  </span>
                  <span>Est.</span>
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  ${financials.providerSpend.totalKieCostUSD.toFixed(2)}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  ≈ ₹{financials.providerSpend.totalKieCostINR.toLocaleString("en-IN")} across {financials.providerSpend.totalJobs} generation jobs.
                </p>
              </div>

              {/* Gross Margin % */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" /> Gross Margin
                  </span>
                  <span>Protected</span>
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  {financials.marginAnalysis.grossMarginPercent}%
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Net Profit: ₹{financials.marginAnalysis.grossProfitINR.toLocaleString("en-IN")} on ₹{financials.marginAnalysis.totalRevenueINR.toLocaleString("en-IN")} revenue.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. KIE.AI MODEL REGISTRY MANAGEMENT */}
        <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ProSettingsCard>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-subtle)" }}>
                <div>
                  <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#00D4FF]" /> KIE.ai Model Registry &amp; Economics
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Direct integration layer for KIE.ai providers. Disabling a model instantly removes it from client studio pickers.
                  </p>
                </div>
                <button
                  onClick={fetchAllData}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#7B61FF]" : ""}`} />
                  Refresh Models
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                    <tr>
                      <th className="py-3 px-4">Model &amp; Tier</th>
                      <th className="py-3 px-4">Engine Type</th>
                      <th className="py-3 px-4">RUHGEN Price</th>
                      <th className="py-3 px-4">Provider Cost</th>
                      <th className="py-3 px-4">Min Margin</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {models.map((m) => {
                      const isVideo = m.type === "video";
                      return (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-sans">
                            <div className="font-bold text-white">{m.name}</div>
                            <div className="text-[10px] text-[var(--text-subtle)] font-mono">{m.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase font-sans ${isVideo ? "bg-amber-500/15 text-amber-300" : "bg-cyan-500/15 text-cyan-300"}`}>
                              {isVideo ? <Video className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                              {m.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white font-bold">
                            {m.base_credit_cost} cr{isVideo ? "/s" : ""}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-muted)]">
                            ${m.base_provider_cost.toFixed(3)}{isVideo ? "/5s" : ""}
                          </td>
                          <td className="py-3 px-4 text-emerald-400 font-bold">
                            ≥{m.min_margin_percent}%
                          </td>
                          <td className="py-3 px-4 font-sans">
                            {m.enabled ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                                <XCircle className="h-3.5 w-3.5" /> Disabled
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <button
                              disabled={togglingModelId === m.id}
                              onClick={() => onToggleModel(m.id, m.enabled)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                m.enabled
                                  ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                                  : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                              }`}
                            >
                              {togglingModelId === m.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : m.enabled ? (
                                "Disable"
                              ) : (
                                "Enable"
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </ProSettingsCard>
        </motion.div>

        {/* 3. ENGINE CREDIT RATE MATRIX (Direct Controls) */}
        <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ProSettingsCard>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-subtle)" }}>
                <div>
                  <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <Coins className="h-5 w-5 text-[#FFB800]" /> Credit Billing Defaults
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Authoritative rates used when resolving user generation requests across standard and premium tiers.
                  </p>
                </div>
              </div>

              {/* 4 Separate Tiles Grid */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Tile 1: Standard Image */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-cyan-500/40">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Zap className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">Standard Image</span>
                        <span className="text-[10px] text-cyan-400/80 font-mono">key: cost_image_schnell</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-cyan-300">
                      Flux Standard
                    </span>
                  </div>

                  <div>
                    <ProLabel htmlFor="rate-img-schnell">Credits / Image Generation</ProLabel>
                    <input
                      id="rate-img-schnell"
                      type="number"
                      value={costImageSchnell}
                      onChange={(e) => setCostImageSchnell(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                      Standard speed image output (Flux 1 Schnell).
                    </p>
                  </div>
                </div>

                {/* Tile 2: Premium Image */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-violet-500/40">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">Premium Image</span>
                        <span className="text-[10px] text-violet-400/80 font-mono">key: cost_image_dev</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-violet-300">
                      Flux Dev HD
                    </span>
                  </div>

                  <div>
                    <ProLabel htmlFor="rate-img-dev">Credits / Image Generation</ProLabel>
                    <input
                      id="rate-img-dev"
                      type="number"
                      value={costImageDev}
                      onChange={(e) => setCostImageDev(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                      High-fidelity photorealistic image output (Flux 1 Dev).
                    </p>
                  </div>
                </div>

                {/* Tile 3: Standard Video */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-emerald-500/40">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Video className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">Standard Video</span>
                        <span className="text-[10px] text-emerald-400/80 font-mono">key: cost_video_std</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
                      Kling 1.5 Std
                    </span>
                  </div>

                  <div>
                    <ProLabel htmlFor="rate-vid-std">Credits / Video Second</ProLabel>
                    <input
                      id="rate-vid-std"
                      type="number"
                      value={costVideoStd}
                      onChange={(e) => setCostVideoStd(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                      Standard cinematic video generation at 720p.
                    </p>
                  </div>
                </div>

                {/* Tile 4: Premium Video */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-amber-500/40">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Video className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">Premium Video</span>
                        <span className="text-[10px] text-amber-400/80 font-mono">key: cost_video_pro</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                      Kling Pro Omni
                    </span>
                  </div>

                  <div>
                    <ProLabel htmlFor="rate-vid-pro">Credits / Video Second</ProLabel>
                    <input
                      id="rate-vid-pro"
                      type="number"
                      value={costVideoPro}
                      onChange={(e) => setCostVideoPro(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                      Cinema-grade 1080p video with complex motion kinematics.
                    </p>
                  </div>
                </div>
              </div>

              {rateStatus && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-300">
                  {rateStatus}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <Link
                  href="/admindashboard"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-5 text-sm font-semibold"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Cancel &amp; Back
                </Link>
                <motion.button
                  type="button"
                  onClick={onSaveRates}
                  disabled={ratesPending}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-8 text-sm font-bold disabled:opacity-60 cursor-pointer"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                    color: "#fff",
                  }}
                >
                  {ratesPending ? "Saving Credit Rates…" : "Save Credit Rates"}
                </motion.button>
              </div>
            </div>
          </ProSettingsCard>
        </motion.div>
      </div>
    </div>
  );
}
