"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  Film,
  Search,
  Sliders,
  Calculator,
  UserCheck,
  History,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Edit3,
  Check,
  X,
  Clock,
  ShieldAlert,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
    totalProviderCostUSD?: number;
    totalProviderCostINR?: number;
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
    totalProviderCostINR?: number;
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
  max_reference_images?: number;
  max_duration?: number;
  max_resolution?: string;
  supported_aspect_ratios?: string[];
  supported_resolutions?: string[];
  supported_durations?: number[];
  supported_controls?: string[];
}

interface PricingSettings {
  credit_inr_rate: number;
  inr_usd_rate: number;
  pg_fee_percent: number;
  infra_allowance_percent: number;
  min_platform_margin_percent: number;
  default_new_user_promo_credits: number;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  action_type: string;
  credit_type: string;
  credits_added: number;
  credits_deducted: number;
  balance_after: number;
  description: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

type TabKey = "overview" | "rates" | "models" | "economics" | "simulator" | "adjustments";

function CreditsDashboardContent() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();

  const tabParam = searchParams.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (tabParam && ["overview", "rates", "models", "economics", "simulator", "adjustments"].includes(tabParam)) {
      return tabParam;
    }
    return "overview";
  });

  useEffect(() => {
    if (tabParam && ["overview", "rates", "models", "economics", "simulator", "adjustments"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: TabKey) => {
    setActiveTab(newTab);
    router.replace(`/admindashboard/credits?tab=${newTab}`, { scroll: false });
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Rates State
  const [costImageSchnell, setCostImageSchnell] = useState("2");
  const [costImageDev, setCostImageDev] = useState("4");
  const [costVideoStd, setCostVideoStd] = useState("5");
  const [costVideoPro, setCostVideoPro] = useState("8");
  const [rateStatus, setRateStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [ratesPending, setRatesPending] = useState(false);

  // Financials & Economics State
  const [financials, setFinancials] = useState<FinancialsData | null>(null);
  const [models, setModels] = useState<AdminModel[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    credit_inr_rate: 1.0,
    inr_usd_rate: 87.0,
    pg_fee_percent: 2.36,
    infra_allowance_percent: 10.0,
    min_platform_margin_percent: 60.0,
    default_new_user_promo_credits: 0,
  });
  const [settingsPending, setSettingsPending] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Model Management State
  const [modelSearch, setModelSearch] = useState("");
  const [modelFilterType, setModelFilterType] = useState<"all" | "image" | "video">("all");
  const [togglingModelId, setTogglingModelId] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<AdminModel | null>(null);
  const [editModelPending, setEditModelPending] = useState(false);

  // Credit Adjustment State
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"purchased" | "promotional">("purchased");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustPending, setAdjustPending] = useState(false);
  const [adjustStatus, setAdjustStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Transactions State
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Margin Simulator State
  const [simModelId, setSimModelId] = useState<string>("flux-1-dev");
  const [simVolume, setSimVolume] = useState<number>(1000);
  const [simDuration, setSimDuration] = useState<number>(5);
  const [simCustomCreditPrice, setSimCustomCreditPrice] = useState<number>(4);

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const h = authHeaders();
      const [ratesRes, finRes, modelsRes, settingsRes] = await Promise.all([
        fetch("/api/credits/rates", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/financials", { headers: h, cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/models", { headers: h, cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/pricing-settings", { headers: h, cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
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

      if (settingsRes?.ok && settingsRes.settings) {
        setPricingSettings(settingsRes.settings);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error fetching admin credit data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authHeaders]);

  const fetchTransactions = useCallback(async (page = 1) => {
    setTxLoading(true);
    try {
      const h = authHeaders();
      const res = await fetch(`/api/admin/credits/transactions?page=${page}&limit=15`, { headers: h, cache: "no-store" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        if (data.pagination) {
          setTxPage(data.pagination.page);
          setTxTotalPages(data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error("Error fetching credit transactions", err);
    } finally {
      setTxLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (ready && admin) {
      fetchAllData();
    }
  }, [ready, admin, fetchAllData]);

  useEffect(() => {
    if (ready && admin && activeTab === "adjustments") {
      fetchTransactions(1);
    }
  }, [ready, admin, activeTab, fetchTransactions]);

  // Save Standard & Premium Rates
  const onSaveRates = async () => {
    setRateStatus(null);
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
      setRateStatus({ type: "error", message: "Rates must be valid non-negative numbers." });
      return;
    }

    setRatesPending(true);
    try {
      const h = authHeaders();
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
        setRateStatus({ type: "error", message: data.error || "Could not save rates." });
      } else {
        setRateStatus({ type: "success", message: "Credit rates and model registry synchronized successfully." });
        fetchAllData(true);
      }
    } catch {
      setRateStatus({ type: "error", message: "Network error occurred while saving rates." });
    } finally {
      setRatesPending(false);
    }
  };

  // Save Platform Economics
  const onSaveEconomics = async () => {
    setSettingsStatus(null);
    setSettingsPending(true);
    try {
      const h = authHeaders();
      const res = await fetch("/api/admin/pricing-settings", {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify(pricingSettings),
      });
      const data = await res.json();
      if (data.ok) {
        setSettingsStatus({ type: "success", message: "Platform economic policies saved successfully." });
        fetchAllData(true);
      } else {
        setSettingsStatus({ type: "error", message: data.error || "Failed to update pricing settings." });
      }
    } catch {
      setSettingsStatus({ type: "error", message: "Network error occurred." });
    } finally {
      setSettingsPending(false);
    }
  };

  // Toggle Model Active Status
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

  // Save Model Parameter Updates
  const onSaveModelEdit = async () => {
    if (!editingModel) return;
    setEditModelPending(true);
    try {
      const h = authHeaders();
      const res = await fetch(`/api/admin/models/${encodeURIComponent(editingModel.id)}`, {
        method: "PATCH",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({
          name: editingModel.name,
          base_credit_cost: Number(editingModel.base_credit_cost),
          base_provider_cost: Number(editingModel.base_provider_cost),
          min_margin_percent: Number(editingModel.min_margin_percent),
          max_reference_images: Number(editingModel.max_reference_images || 0),
          enabled: editingModel.enabled,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setModels((prev) => prev.map((m) => (m.id === editingModel.id ? { ...m, ...editingModel } : m)));
        setEditingModel(null);
        fetchAllData(true);
      }
    } catch (err) {
      console.error("Error saving model edit", err);
    } finally {
      setEditModelPending(false);
    }
  };

  // Perform Manual Credit Adjustment
  const onPerformCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustStatus(null);
    const amt = Number(adjustAmount);
    if (!adjustUserId.trim()) {
      setAdjustStatus({ type: "error", message: "User ID is required." });
      return;
    }
    if (isNaN(amt) || amt === 0) {
      setAdjustStatus({ type: "error", message: "Enter a non-zero adjustment amount (positive to add, negative to deduct)." });
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustStatus({ type: "error", message: "A clear reason is required for administrative audit logs." });
      return;
    }

    setAdjustPending(true);
    try {
      const h = authHeaders();
      const res = await fetch("/api/admin/credits/adjust", {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({
          userId: adjustUserId.trim(),
          amount: amt,
          creditType: adjustType,
          reason: adjustReason.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAdjustStatus({
          type: "success",
          message: `Successfully adjusted ${amt > 0 ? `+${amt}` : amt} ${adjustType} credits for user.`,
        });
        setAdjustAmount("");
        setAdjustReason("");
        fetchAllData(true);
        fetchTransactions(1);
      } else {
        setAdjustStatus({ type: "error", message: data.error || "Adjustment failed." });
      }
    } catch {
      setAdjustStatus({ type: "error", message: "Network error occurred." });
    } finally {
      setAdjustPending(false);
    }
  };

  // Filtered Models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchType = modelFilterType === "all" || m.type === modelFilterType;
      const matchSearch =
        m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.tier.toLowerCase().includes(modelSearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [models, modelFilterType, modelSearch]);

  // Margin Calculator Simulation Computations
  const simResult = useMemo(() => {
    const model = models.find((m) => m.id === simModelId) || models[0];
    if (!model) return null;

    const inrUsd = pricingSettings.inr_usd_rate || 87.0;
    const creditInr = pricingSettings.credit_inr_rate || 1.0;
    const isVideo = model.type === "video";

    const unitProviderCostUsd = isVideo ? (model.base_provider_cost / 5) * simDuration : model.base_provider_cost;
    const totalProviderCostUsd = unitProviderCostUsd * simVolume;
    const totalProviderCostInr = totalProviderCostUsd * inrUsd;

    const chargedCreditsPerUnit = isVideo ? simCustomCreditPrice * simDuration : simCustomCreditPrice;
    const totalCreditsCharged = chargedCreditsPerUnit * simVolume;
    const totalRevenueInr = totalCreditsCharged * creditInr;

    const grossProfitInr = totalRevenueInr - totalProviderCostInr;
    const grossMarginPercent = totalRevenueInr > 0 ? (grossProfitInr / totalRevenueInr) * 100 : 0;
    const meetsSafeguard = grossMarginPercent >= (pricingSettings.min_platform_margin_percent || 60);

    return {
      modelName: model.name,
      totalRevenueInr,
      totalProviderCostUsd,
      totalProviderCostInr,
      grossProfitInr,
      grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
      meetsSafeguard,
      chargedCreditsPerUnit,
      totalCreditsCharged,
    };
  }, [models, simModelId, simVolume, simDuration, simCustomCreditPrice, pricingSettings]);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4" style={{ color: "var(--text-muted)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
        <p className="text-sm font-semibold tracking-wide">Loading Credit Command Deck…</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-2xl border p-8" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <p className="font-display text-xl font-bold text-white">Admin Authentication Required</p>
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
    <div className="relative flex-1 overflow-x-clip px-4 pb-24 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-[1100px] space-y-6">
        
        {/* Header Hero */}
        <ProSettingsHero
          eyebrow="Financial Economics & Credit Control"
          title="RUHGEN Credit Command Deck"
          description="Authoritative single source of truth for generation costs, customer monetary liability, AI provider infrastructure, platform economics, and margin protection."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fetchAllData(false)}
                disabled={refreshing}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-white/5 active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
                title={`Last updated: ${lastRefreshed.toLocaleTimeString()}`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#7B61FF]" : "text-[var(--text-muted)]"}`} />
                <span>{refreshing ? "Syncing…" : "Sync Live Data"}</span>
              </button>

              <Link
                href="/admindashboard/payments"
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors hover:border-emerald-500/40"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <CreditCard className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                Payments &amp; Ledger
              </Link>

              <Link
                href="/admindashboard/analytics"
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors hover:border-[#7B61FF]/35"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#7B61FF]" />
                Analytics
              </Link>
            </div>
          }
        />

        {/* Live Top Financial Summary Cards */}
        {financials && (
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Live AI Provider Account Health Banner */}
            {financials.providerBalance && financials.providerBalance.configured && (
              <div
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  financials.providerBalance.isSufficientForVideo
                    ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                    : "border-amber-500/30 bg-amber-950/20 text-amber-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    financials.providerBalance.isSufficientForVideo
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  }`}>
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold tracking-wide text-white">
                        Live AI Provider Infrastructure:{" "}
                        <span className="font-mono text-cyan-400 font-extrabold">
                          {financials.providerBalance.credits.toLocaleString()} credits
                        </span>{" "}
                        <span className="text-xs text-white/60">
                          (≈ ${financials.providerBalance.creditsUsd.toFixed(3)} USD)
                        </span>
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                          financials.providerBalance.isSufficientForVideo
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {financials.providerBalance.isSufficientForVideo ? "Operational" : "Low Provider Balance"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/70 leading-relaxed">
                      {financials.providerBalance.isSufficientForVideo
                        ? "Provider account has sufficient balance for live image synthesis and high-definition video pipelines."
                        : `Current AI provider balance (${financials.providerBalance.credits} credits) is low. Video generation pipelines may require top-up to maintain low latency.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4 Core Economics Tiles */}
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Tile 1: Customer Monetary Liability */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4.5 space-y-2 shadow-md transition-all hover:border-rose-500/30">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Customer Liability
                  </span>
                  <span className="font-mono">₹{financials.creditSupply.creditInrRate}/cr</span>
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  ₹{financials.creditSupply.monetaryLiabilityINR.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  {financials.creditSupply.outstandingPurchasedCredits.toLocaleString()} purchased credits held by users.
                </p>
              </div>

              {/* Tile 2: Total Active Credit Supply */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4.5 space-y-2 shadow-md transition-all hover:border-cyan-500/30">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  <span className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4" /> Total Credit Supply
                  </span>
                  <span className="font-mono">Active</span>
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  {financials.creditSupply.totalCreditSupply.toLocaleString()}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  {financials.creditSupply.outstandingPromotionalCredits.toLocaleString()} promo + {financials.creditSupply.reservedCredits.toLocaleString()} in flight.
                </p>
              </div>

              {/* Tile 3: AI Provider Spend */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4.5 space-y-2 shadow-md transition-all hover:border-violet-500/30">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-violet-400">
                  <span className="flex items-center gap-1.5">
                    <Server className="h-4 w-4" /> Provider Spend
                  </span>
                  <span className="font-mono">USD</span>
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  ${(financials.providerSpend.totalProviderCostUSD ?? 0).toFixed(2)}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  ≈ ₹{(financials.providerSpend.totalProviderCostINR ?? 0).toLocaleString("en-IN")} across {financials.providerSpend.totalJobs} jobs.
                </p>
              </div>

              {/* Tile 4: Gross Margin % */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4.5 space-y-2 shadow-md transition-all hover:border-emerald-500/30">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" /> Gross Margin
                  </span>
                  <span className="font-mono">Protected</span>
                </div>
                <div className="text-2xl font-extrabold text-white font-mono flex items-baseline gap-1">
                  <span>{financials.marginAnalysis.grossMarginPercent}%</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  Profit: ₹{financials.marginAnalysis.grossProfitINR.toLocaleString("en-IN")} on ₹{financials.marginAnalysis.totalRevenueINR.toLocaleString("en-IN")} rev.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex overflow-x-auto rounded-xl border border-white/10 bg-[var(--soft-black)] p-1 gap-1 text-xs font-semibold">
          {[
            { key: "overview", label: "Financial Overview", icon: LayoutDashboard },
            { key: "rates", label: "Rate Matrix & Pricing", icon: Coins },
            { key: "models", label: "AI Model Registry", icon: Layers },
            { key: "economics", label: "Platform Economics", icon: Sliders },
            { key: "simulator", label: "Margin Simulator", icon: Calculator },
            { key: "adjustments", label: "Adjustments & Ledger", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key as TabKey)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all shrink-0 cursor-pointer ${
                  active
                    ? "bg-[var(--glass-elevated)] text-white shadow-sm border border-white/15"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-[#00D4FF]" : "text-[var(--text-muted)]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: FINANCIAL OVERVIEW & SPEND BREAKDOWN */}
        {activeTab === "overview" && financials && (
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ProSettingsCard>
              <div className="space-y-4">
                <div className="flex flex-col gap-1 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#00D4FF]" /> AI Generation Spend &amp; Job Volume by Engine
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Aggregated provider usage, credit consumption, and estimated INR infrastructure costs per AI model.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                      <tr>
                        <th className="py-3 px-4">Model Engine</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Jobs Executed</th>
                        <th className="py-3 px-4">Credits Consumed</th>
                        <th className="py-3 px-4">Provider Cost (USD)</th>
                        <th className="py-3 px-4 text-right">Provider Cost (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {financials.providerSpend.spendByModel.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                            No generation jobs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        financials.providerSpend.spendByModel.map((item) => {
                          const isVid = item.type === "video";
                          return (
                            <tr key={item.modelId} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 font-sans font-bold text-white">
                                {item.modelId}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase font-sans ${isVid ? "bg-amber-500/15 text-amber-300" : "bg-cyan-500/15 text-cyan-300"}`}>
                                  {isVid ? <Video className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
                                  {item.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white">
                                {item.jobsCount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-amber-400 font-bold">
                                {item.creditsConsumed.toLocaleString()} cr
                              </td>
                              <td className="py-3 px-4 text-[var(--text-muted)]">
                                ${item.totalCostUsd}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-white">
                                ₹{item.totalCostInr.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </ProSettingsCard>
          </motion.div>
        )}

        {/* TAB 2: RATE MATRIX & MODEL PRICING */}
        {activeTab === "rates" && (
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ProSettingsCard>
              <div className="space-y-6">
                <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <Coins className="h-4 w-4 text-[#FFB800]" /> Credit Billing Defaults &amp; Rate Matrix
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Authoritative rates used when users generate images or videos. Updating here synchronizes both credit settings and model registry automatically.
                  </p>
                </div>

                {/* 4 Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Card 1: Standard Image */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-cyan-500/40">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Zap className="h-4 w-4" />
                        </span>
                        <div>
                          <span className="text-sm font-bold text-white block">Standard Image</span>
                          <span className="text-[10px] text-cyan-400/80 font-mono">Flux 1 Schnell</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-cyan-300 font-mono">
                        ~72% Margin
                      </span>
                    </div>

                    <div>
                      <ProLabel htmlFor="rate-img-schnell">Credits / Image Generation</ProLabel>
                      <input
                        id="rate-img-schnell"
                        type="number"
                        min="1"
                        value={costImageSchnell}
                        onChange={(e) => setCostImageSchnell(e.target.value)}
                        className={proInputClass}
                        style={proInputStyle}
                      />
                      <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                        Fast image generation tier. Standard resolution stills.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Premium Image */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-violet-500/40">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <div>
                          <span className="text-sm font-bold text-white block">Premium Image</span>
                          <span className="text-[10px] text-violet-400/80 font-mono">Flux 1 Dev HD</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-violet-300 font-mono">
                        ~68% Margin
                      </span>
                    </div>

                    <div>
                      <ProLabel htmlFor="rate-img-dev">Credits / Image Generation</ProLabel>
                      <input
                        id="rate-img-dev"
                        type="number"
                        min="1"
                        value={costImageDev}
                        onChange={(e) => setCostImageDev(e.target.value)}
                        className={proInputClass}
                        style={proInputStyle}
                      />
                      <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                        Photorealistic cinema stills with high prompt adherence.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: RUHGEN Premium (Genesis 2) */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-emerald-500/40">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Film className="h-4 w-4" />
                        </span>
                        <div>
                          <span className="text-sm font-bold text-white block">RUHGEN Premium Video</span>
                          <span className="text-[10px] text-emerald-400/80 font-mono">Genesis 2 Engine</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-emerald-300 font-mono">
                        3 cr / sec
                      </span>
                    </div>

                    <div>
                      <ProLabel htmlFor="rate-vid-std">Credits / Video Second</ProLabel>
                      <input
                        id="rate-vid-std"
                        type="number"
                        min="1"
                        value={costVideoStd}
                        onChange={(e) => setCostVideoStd(e.target.value)}
                        className={proInputClass}
                        style={proInputStyle}
                      />
                      <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                        5s = 15 cr, 10s = 30 cr. High fidelity motion diffusion.
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Seedance 2.5 Video */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-amber-500/40">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Film className="h-4 w-4" />
                        </span>
                        <div>
                          <span className="text-sm font-bold text-white block">Seedance 2.5 Video</span>
                          <span className="text-[10px] text-amber-400/80 font-mono">Native Sound &amp; Multi-Ref</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-amber-300 font-mono">
                        6 cr / sec
                      </span>
                    </div>

                    <div>
                      <ProLabel htmlFor="rate-vid-pro">Credits / Video Second</ProLabel>
                      <input
                        id="rate-vid-pro"
                        type="number"
                        min="1"
                        value={costVideoPro}
                        onChange={(e) => setCostVideoPro(e.target.value)}
                        className={proInputClass}
                        style={proInputStyle}
                      />
                      <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                        5s = 30 cr, 10s = 60 cr, 15s = 90 cr, 30s = 180 cr. Synchronized audio.
                      </p>
                    </div>
                  </div>
                </div>

                {rateStatus && (
                  <div className={`rounded-xl border p-3.5 text-xs font-semibold ${
                    rateStatus.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  }`}>
                    {rateStatus.message}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <motion.button
                    type="button"
                    onClick={onSaveRates}
                    disabled={ratesPending}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-xl px-7 text-sm font-bold shadow-lg disabled:opacity-60 cursor-pointer transition-all hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                      color: "#fff",
                    }}
                  >
                    {ratesPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Rates…
                      </>
                    ) : (
                      "Save Credit Rates & Sync Models"
                    )}
                  </motion.button>
                </div>
              </div>
            </ProSettingsCard>
          </motion.div>
        )}

        {/* TAB 3: AI MODEL REGISTRY & CAPABILITIES */}
        {activeTab === "models" && (
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ProSettingsCard>
              <div className="space-y-5">
                <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#00D4FF]" /> RUHGEN AI Model Registry
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Control active models, base credit costs, provider costs, and margin constraints. Disabling a model removes it instantly from client studios.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-subtle)]" />
                      <input
                        type="text"
                        placeholder="Search models…"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className="rounded-lg border border-white/15 bg-black/50 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[var(--text-subtle)] focus:border-white/40 focus:outline-none"
                      />
                    </div>
                    <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5 text-xs">
                      {(["all", "image", "video"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setModelFilterType(t)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                            modelFilterType === t
                              ? "bg-white/15 text-white"
                              : "text-[var(--text-muted)] hover:text-white"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                      <tr>
                        <th className="py-3 px-4">Model &amp; Tier</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">RUHGEN Price</th>
                        <th className="py-3 px-4">Provider Cost</th>
                        <th className="py-3 px-4">Min Margin</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {filteredModels.map((m) => {
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
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingModel({ ...m })}
                                  className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white hover:bg-white/15 transition-all"
                                  title="Edit Model Parameters"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={togglingModelId === m.id}
                                  onClick={() => onToggleModel(m.id, m.enabled)}
                                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
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
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </ProSettingsCard>

            {/* Edit Model Parameter Modal */}
            <AnimatePresence>
              {editingModel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg rounded-2xl border border-white/15 bg-[var(--rich-black)] p-6 shadow-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h4 className="font-display text-base font-bold text-white">Edit AI Model Configuration</h4>
                        <p className="text-[11px] text-[var(--text-subtle)] font-mono">{editingModel.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingModel(null)}
                        className="rounded-lg p-1 text-[var(--text-muted)] hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <ProLabel htmlFor="edit-model-name">Display Name</ProLabel>
                        <input
                          id="edit-model-name"
                          type="text"
                          value={editingModel.name}
                          onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                          className={proInputClass}
                          style={proInputStyle}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <ProLabel htmlFor="edit-model-price">
                            RUHGEN Price ({editingModel.type === "video" ? "cr / sec" : "credits"})
                          </ProLabel>
                          <input
                            id="edit-model-price"
                            type="number"
                            step="0.5"
                            value={editingModel.base_credit_cost}
                            onChange={(e) => setEditingModel({ ...editingModel, base_credit_cost: Number(e.target.value) })}
                            className={proInputClass}
                            style={proInputStyle}
                          />
                        </div>
                        <div>
                          <ProLabel htmlFor="edit-model-cost">Provider Cost (USD)</ProLabel>
                          <input
                            id="edit-model-cost"
                            type="number"
                            step="0.001"
                            value={editingModel.base_provider_cost}
                            onChange={(e) => setEditingModel({ ...editingModel, base_provider_cost: Number(e.target.value) })}
                            className={proInputClass}
                            style={proInputStyle}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <ProLabel htmlFor="edit-model-margin">Min Margin (%)</ProLabel>
                          <input
                            id="edit-model-margin"
                            type="number"
                            value={editingModel.min_margin_percent}
                            onChange={(e) => setEditingModel({ ...editingModel, min_margin_percent: Number(e.target.value) })}
                            className={proInputClass}
                            style={proInputStyle}
                          />
                        </div>
                        <div>
                          <ProLabel htmlFor="edit-model-refs">Max Reference Images</ProLabel>
                          <input
                            id="edit-model-refs"
                            type="number"
                            value={editingModel.max_reference_images || 0}
                            onChange={(e) => setEditingModel({ ...editingModel, max_reference_images: Number(e.target.value) })}
                            className={proInputClass}
                            style={proInputStyle}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          id="edit-model-enabled"
                          type="checkbox"
                          checked={editingModel.enabled}
                          onChange={(e) => setEditingModel({ ...editingModel, enabled: e.target.checked })}
                          className="h-4 w-4 rounded border-white/20 bg-black text-[#00D4FF]"
                        />
                        <label htmlFor="edit-model-enabled" className="text-xs text-white font-semibold">
                          Enable model for client studio generation
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setEditingModel(null)}
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={editModelPending}
                        onClick={onSaveModelEdit}
                        className="rounded-xl bg-[#00D4FF] px-5 py-2 text-xs font-bold text-black hover:bg-[#00D4FF]/90 disabled:opacity-50"
                      >
                        {editModelPending ? "Saving…" : "Save Model"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* TAB 4: PLATFORM ECONOMICS & CURRENCY SETTINGS */}
        {activeTab === "economics" && (
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ProSettingsCard>
              <div className="space-y-6">
                <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[#00D4FF]" /> Global Platform Economics &amp; Policy
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Define baseline currency conversion rates, monetary selling prices, and automated margin safeguards.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <ProLabel htmlFor="eco-inr-usd">INR to USD Exchange Rate (₹/$)</ProLabel>
                    <input
                      id="eco-inr-usd"
                      type="number"
                      step="0.1"
                      value={pricingSettings.inr_usd_rate}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, inr_usd_rate: Number(e.target.value) })}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1 text-[10px] text-[var(--text-subtle)]">Used for real-time provider cost conversion.</p>
                  </div>

                  <div>
                    <ProLabel htmlFor="eco-cr-inr">Credit Rupee Price (₹ / credit)</ProLabel>
                    <input
                      id="eco-cr-inr"
                      type="number"
                      step="0.05"
                      value={pricingSettings.credit_inr_rate}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, credit_inr_rate: Number(e.target.value) })}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1 text-[10px] text-[var(--text-subtle)]">Base selling price used in customer checkout.</p>
                  </div>

                  <div>
                    <ProLabel htmlFor="eco-min-margin">Min Platform Margin Safeguard (%)</ProLabel>
                    <input
                      id="eco-min-margin"
                      type="number"
                      value={pricingSettings.min_platform_margin_percent}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, min_platform_margin_percent: Number(e.target.value) })}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1 text-[10px] text-[var(--text-subtle)]">Generations below this margin trigger warnings.</p>
                  </div>

                  <div>
                    <ProLabel htmlFor="eco-pg-fee">Payment Gateway Allowance (%)</ProLabel>
                    <input
                      id="eco-pg-fee"
                      type="number"
                      step="0.01"
                      value={pricingSettings.pg_fee_percent}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, pg_fee_percent: Number(e.target.value) })}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1 text-[10px] text-[var(--text-subtle)]">Razorpay standard transaction processing fee.</p>
                  </div>

                  <div>
                    <ProLabel htmlFor="eco-infra">Infra Buffer Allowance (%)</ProLabel>
                    <input
                      id="eco-infra"
                      type="number"
                      step="0.1"
                      value={pricingSettings.infra_allowance_percent}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, infra_allowance_percent: Number(e.target.value) })}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1 text-[10px] text-[var(--text-subtle)]">Hosting, egress, and storage provision.</p>
                  </div>

                  <div>
                    <ProLabel htmlFor="eco-signup-promo">New User Signup Promo Credits</ProLabel>
                    <input
                      id="eco-signup-promo"
                      type="number"
                      value={pricingSettings.default_new_user_promo_credits}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, default_new_user_promo_credits: Number(e.target.value) })}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1 text-[10px] text-[var(--text-subtle)]">Automatic promotional credits granted on registration.</p>
                  </div>
                </div>

                {settingsStatus && (
                  <div className={`rounded-xl border p-3.5 text-xs font-semibold ${
                    settingsStatus.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  }`}>
                    {settingsStatus.message}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <motion.button
                    type="button"
                    onClick={onSaveEconomics}
                    disabled={settingsPending}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-xl px-7 text-sm font-bold shadow-lg disabled:opacity-60 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                      color: "#fff",
                    }}
                  >
                    {settingsPending ? "Saving Settings…" : "Save Platform Economics"}
                  </motion.button>
                </div>
              </div>
            </ProSettingsCard>
          </motion.div>
        )}

        {/* TAB 5: MARGIN PROTECTION SIMULATOR */}
        {activeTab === "simulator" && (
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ProSettingsCard>
              <div className="space-y-6">
                <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#00D4FF]" /> Real-time Margin Protection &amp; Profit Simulator
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Simulate financial profitability, provider cost liabilities, and gross margin percentages before adjusting pricing.
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  {/* Left Column: Inputs */}
                  <div className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-4.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Simulation Variables</h4>
                    
                    <div>
                      <ProLabel htmlFor="sim-model">Target AI Engine</ProLabel>
                      <select
                        id="sim-model"
                        value={simModelId}
                        onChange={(e) => {
                          setSimModelId(e.target.value);
                          const m = models.find((x) => x.id === e.target.value);
                          if (m) setSimCustomCreditPrice(m.base_credit_cost);
                        }}
                        className={proInputClass}
                        style={proInputStyle}
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id} className="bg-black text-white">
                            {m.name} ({m.type} · {m.base_credit_cost} cr{m.type === "video" ? "/s" : ""})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <ProLabel htmlFor="sim-vol">Batch Generation Volume (Items)</ProLabel>
                      <input
                        id="sim-vol"
                        type="number"
                        min="1"
                        step="100"
                        value={simVolume}
                        onChange={(e) => setSimVolume(Math.max(1, Number(e.target.value)))}
                        className={proInputClass}
                        style={proInputStyle}
                      />
                    </div>

                    {models.find((m) => m.id === simModelId)?.type === "video" && (
                      <div>
                        <ProLabel htmlFor="sim-dur">Video Clip Duration (Seconds)</ProLabel>
                        <select
                          id="sim-dur"
                          value={simDuration}
                          onChange={(e) => setSimDuration(Number(e.target.value))}
                          className={proInputClass}
                          style={proInputStyle}
                        >
                          <option value={5} className="bg-black text-white">5 Seconds</option>
                          <option value={10} className="bg-black text-white">10 Seconds</option>
                          <option value={15} className="bg-black text-white">15 Seconds</option>
                          <option value={30} className="bg-black text-white">30 Seconds</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <ProLabel htmlFor="sim-price">Credit Cost Per Unit ({models.find((m) => m.id === simModelId)?.type === "video" ? "cr / sec" : "credits"})</ProLabel>
                      <input
                        id="sim-price"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={simCustomCreditPrice}
                        onChange={(e) => setSimCustomCreditPrice(Math.max(0.1, Number(e.target.value)))}
                        className={proInputClass}
                        style={proInputStyle}
                      />
                    </div>
                  </div>

                  {/* Right Column: Computed Outputs */}
                  {simResult && (
                    <div className="lg:col-span-2 space-y-4 rounded-xl border border-white/10 bg-black/40 p-5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Forecasted Financial Returns</h4>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          simResult.meetsSafeguard
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}>
                          {simResult.meetsSafeguard ? "Safeguard Passed" : "Below Minimum Margin Threshold"}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-[var(--text-subtle)]">Customer Revenue</span>
                          <p className="text-xl font-mono font-bold text-white">₹{simResult.totalRevenueInr.toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{simResult.totalCreditsCharged.toLocaleString()} total credits</p>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-[var(--text-subtle)]">Provider Upstream Cost</span>
                          <p className="text-xl font-mono font-bold text-rose-400">₹{Math.round(simResult.totalProviderCostInr).toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">${simResult.totalProviderCostUsd.toFixed(2)} USD</p>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-[var(--text-subtle)]">Net Gross Profit</span>
                          <p className="text-xl font-mono font-bold text-emerald-400">₹{Math.round(simResult.grossProfitInr).toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-emerald-400/80 font-mono font-bold">{simResult.grossMarginPercent}% margin</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[var(--text-muted)]">Per Unit Customer Price:</span>
                          <span className="text-white font-bold">{simResult.chargedCreditsPerUnit} credits (₹{simResult.chargedCreditsPerUnit * (pricingSettings.credit_inr_rate || 1)})</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[var(--text-muted)]">Per Unit Provider Cost:</span>
                          <span className="text-white font-bold">${(simResult.totalProviderCostUsd / simVolume).toFixed(4)} USD (₹{Math.round((simResult.totalProviderCostInr / simVolume) * 100) / 100})</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono border-t border-white/10 pt-2">
                          <span className="text-[var(--text-muted)]">Unit Profit Margin:</span>
                          <span className={`font-bold ${simResult.meetsSafeguard ? "text-emerald-400" : "text-rose-400"}`}>
                            {simResult.grossMarginPercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ProSettingsCard>
          </motion.div>
        )}

        {/* TAB 6: DIRECT CREDIT ADJUSTMENTS & AUDIT LEDGER */}
        {activeTab === "adjustments" && (
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Quick Adjustment Form */}
            <ProSettingsCard>
              <form onSubmit={onPerformCreditAdjustment} className="space-y-4">
                <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#00D4FF]" /> Administrative Credit Adjustment
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Directly grant or deduct credits for any user. All adjustments require an audit reason and update user wallet balances immediately.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <ProLabel htmlFor="adj-user-id">Target User ID</ProLabel>
                    <input
                      id="adj-user-id"
                      type="text"
                      placeholder="e.g. usr_9482..."
                      value={adjustUserId}
                      onChange={(e) => setAdjustUserId(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                  </div>

                  <div>
                    <ProLabel htmlFor="adj-amount">Amount (+add / -deduct)</ProLabel>
                    <input
                      id="adj-amount"
                      type="number"
                      placeholder="e.g. 50 or -20"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                  </div>

                  <div>
                    <ProLabel htmlFor="adj-type">Credit Pool Type</ProLabel>
                    <select
                      id="adj-type"
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as "purchased" | "promotional")}
                      className={proInputClass}
                      style={proInputStyle}
                    >
                      <option value="purchased" className="bg-black text-white">Purchased Credits</option>
                      <option value="promotional" className="bg-black text-white">Promotional Credits</option>
                    </select>
                  </div>

                  <div>
                    <ProLabel htmlFor="adj-reason">Audit Reason</ProLabel>
                    <input
                      id="adj-reason"
                      type="text"
                      placeholder="e.g. Support compensation, beta tester reward"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                  </div>
                </div>

                {adjustStatus && (
                  <div className={`rounded-xl border p-3.5 text-xs font-semibold ${
                    adjustStatus.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  }`}>
                    {adjustStatus.message}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <motion.button
                    type="submit"
                    disabled={adjustPending}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#00D4FF] px-6 text-xs font-bold text-black hover:bg-[#00D4FF]/90 disabled:opacity-50 cursor-pointer"
                  >
                    {adjustPending ? "Processing…" : "Execute Adjustment"}
                  </motion.button>
                </div>
              </form>
            </ProSettingsCard>

            {/* Recent Credit Transactions Ledger */}
            <ProSettingsCard>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-[#7B61FF]" /> Recent Credit Ledger Transactions
                  </h3>
                  <button
                    type="button"
                    onClick={() => fetchTransactions(txPage)}
                    disabled={txLoading}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                  >
                    <RefreshCw className={`h-3 w-3 inline mr-1 ${txLoading ? "animate-spin" : ""}`} /> Refresh Ledger
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Credit Pool</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Balance After</th>
                        <th className="py-3 px-4">Reason / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                            {txLoading ? "Loading ledger transactions…" : "No credit transactions recorded yet."}
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx) => {
                          const isAdd = tx.credits_added > 0;
                          return (
                            <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 text-[var(--text-subtle)] text-[10px]">
                                {new Date(tx.created_at).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 font-sans font-medium text-white">
                                <div>{tx.user_name || tx.user_email || tx.user_id}</div>
                                <div className="text-[10px] text-[var(--text-subtle)] font-mono">{tx.user_id}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase font-sans text-white border border-white/10">
                                  {tx.action_type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[var(--text-muted)] uppercase text-[10px]">
                                {tx.credit_type}
                              </td>
                              <td className="py-3 px-4 font-bold font-mono">
                                {isAdd ? (
                                  <span className="text-emerald-400">+{tx.credits_added}</span>
                                ) : (
                                  <span className="text-rose-400">-{tx.credits_deducted}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-white font-mono">
                                {tx.balance_after}
                              </td>
                              <td className="py-3 px-4 font-sans text-[var(--text-muted)] text-[11px] truncate max-w-xs">
                                {tx.description || "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {txTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 text-xs text-[var(--text-muted)] font-mono">
                    <span>Page {txPage} of {txTotalPages}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={txPage <= 1 || txLoading}
                        onClick={() => fetchTransactions(txPage - 1)}
                        className="rounded-lg border border-white/10 px-3 py-1 text-white hover:bg-white/5 disabled:opacity-30"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={txPage >= txTotalPages || txLoading}
                        onClick={() => fetchTransactions(txPage + 1)}
                        className="rounded-lg border border-white/10 px-3 py-1 text-white hover:bg-white/5 disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </ProSettingsCard>
          </motion.div>
        )}

      </div>
    </div>
  );
}

export default function AdminCreditRatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400 font-mono text-sm">Loading Credits & Engine Management...</div>}>
      <CreditsDashboardContent />
    </Suspense>
  );
}
