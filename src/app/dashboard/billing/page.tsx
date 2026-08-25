"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Check,
  Coins,
  CreditCard,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BillingSkeleton } from "@/components/Skeletons";
import { RazorpayCheckoutModal, type Plan } from "@/components/payments/RazorpayCheckoutModal";

function PlanCard({ plan, paymentsAvailable }: { plan: Plan; paymentsAvailable: boolean }) {
  const reduce = useReducedMotion();
  const planId = plan.id.replace("_yearly", "");
  const billingPeriod = plan.id.includes("yearly") ? "yearly" : "monthly";
  const labelSuffix = billingPeriod === "yearly" ? "yr" : "mo";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col rounded-xl border p-5 transition-all hover:-translate-y-0.5 ${
        plan.popular
          ? "border-zinc-700 bg-[#121215] shadow-sm"
          : "border-zinc-800 bg-[#121215]"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200">
          {plan.badge}
        </div>
      )}
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold text-zinc-100">{plan.name}</h3>
        <p className="mt-1 text-xs text-zinc-400">{plan.description}</p>
      </div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="font-display text-3xl font-extrabold text-zinc-100">{plan.price_display}</span>
        <span className="text-xs text-zinc-500">/{labelSuffix}</span>
      </div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <Zap className="h-4 w-4 text-zinc-300" />
        <span className="text-sm font-bold text-zinc-100">{plan.credits.toLocaleString()} credits</span>
      </div>
      <ul className="mb-5 flex-1 space-y-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={`/dashboard/billing/checkout?plan=${planId}&billing=${billingPeriod}`}
        className={`w-full rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all text-center block ${
          plan.popular
            ? "bg-zinc-100 text-zinc-950 hover:bg-white"
            : "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
        }`}
      >
        Upgrade Plan
      </Link>
    </motion.div>
  );
}

interface PaymentRecord {
  id: string;
  internalTransactionId?: string;
  planName: string;
  amountDisplay: string;
  credits: number;
  status: string;
  date?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

interface CreditTransaction {
  id: string;
  actionType?: string;
  creditsAdded?: number;
  creditsDeducted?: number;
  newBalance: number;
  reason?: string;
  timestamp?: string;
}

interface BillingDashboardData {
  metrics?: {
    credits: number;
    availableCredits: number;
    lifetimeUsed: number;
    lifetimeAdded: number;
  };
  transactions?: CreditTransaction[];
  paymentHistory?: PaymentRecord[];
}

export default function BillingPage() {
  const { user, ready, refreshUser } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [data, setData] = useState<BillingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentsAvailable, setPaymentsAvailable] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "plans">("overview");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const loadData = useCallback(async (silent = false) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("ruhgen_user_jwt_v1") : null;
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [creditRes, historyRes, plansRes] = await Promise.all([
        fetch("/api/credits/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/payments/history", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/payments/plans"),
      ]);
      const creditData = await creditRes.json();
      const historyData = await historyRes.json();
      const plansData = await plansRes.json();
      
      let updatedData: BillingDashboardData = {};
      if (creditData.ok) {
        updatedData = { ...creditData };
      }
      if (historyData.ok) {
        updatedData.paymentHistory = historyData.payments;
      }
      setData(updatedData);
      if (plansData.ok) {
        setPlans(plansData.plans || []);
        setPaymentsAvailable(plansData.available !== false);
      }
    } catch {
      // Handle fetch failure gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/billing");
  }, [ready, user, router]);

  useEffect(() => {
    let active = true;
    if (user && active) {
      loadData();
    }
    return () => {
      active = false;
    };
  }, [user, loadData]);

  if (!ready || (loading && !data)) return <BillingSkeleton />;
  if (!user) return null;

  const metrics = data?.metrics || { credits: user.credits ?? 0, availableCredits: user.credits ?? 0, lifetimeUsed: 0, lifetimeAdded: 0 };
  const creditHistory = data?.transactions || [];
  const paymentHistory = data?.paymentHistory || [];
  const currentPlan = user.subscriptionPlan || "free";

  const statusColor = (s: string) => {
    if (s === "captured" || s === "CREDITED") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/25";
    if (s === "failed" || s === "FAILED") return "text-rose-400 bg-rose-400/10 border-rose-400/25";
    if (s === "REFUNDED") return "text-purple-400 bg-purple-400/10 border-purple-400/25";
    return "text-amber-400 bg-amber-400/10 border-amber-400/25";
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "history", label: "Credit Ledger" },
    { id: "plans", label: "Upgrade Plan" },
  ] as const;

  return (
    <div className="space-y-8">
      {selectedPlan && (
        <RazorpayCheckoutModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={({ creditsAdded, newBalance, planName }) => {
            setSelectedPlan(null);
            loadData(true);
            if (typeof refreshUser === "function") refreshUser();
          }}
        />
      )}

      {/* Header */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
            Billing &amp; Credits
          </p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
            Your Plan
          </h1>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </motion.div>

      {/* Temporary Gateway Notice Banner if unconfigured */}
      {!paymentsAvailable && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-bold">Payments Temporarily Unavailable</p>
            <p className="mt-1 text-xs text-amber-200/80">
              Payments are temporarily unavailable while our payment system is being configured. Please try again later.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Current Plan", value: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1), icon: Sparkles },
          { label: "Available Credits", value: (metrics.availableCredits ?? metrics.credits ?? 0).toLocaleString(), icon: Coins },
          { label: "Credits Used", value: (metrics.lifetimeUsed ?? 0).toLocaleString(), icon: Activity },
          { label: "Credits Purchased", value: (metrics.lifetimeAdded ?? 0).toLocaleString(), icon: TrendingUp },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-zinc-800 bg-[#121215] p-4 sm:p-5 shadow-sm"
          >
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300"
            >
              <m.icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {m.label}
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-zinc-100">
              {m.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === t.id
                ? "border border-zinc-700 bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Payment History Table */}
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-sm">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="font-display text-base font-bold text-zinc-100">
                Recent Payments
              </h2>
            </div>
            {paymentHistory.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-zinc-400">
                <CreditCard className="mb-3 h-10 w-10 opacity-40 text-zinc-500" />
                <p className="text-sm">No payments yet</p>
                <button
                  onClick={() => setActiveTab("plans")}
                  className="mt-4 flex items-center gap-1 text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
                >
                  View plans <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900/40">
                      <th className="px-5 py-3 font-bold">Transaction Ref</th>
                      <th className="px-4 py-3 font-bold">Plan</th>
                      <th className="px-4 py-3 font-bold">Amount</th>
                      <th className="px-4 py-3 font-bold">Credits</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-5 py-3 font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {paymentHistory.map((p: PaymentRecord) => (
                      <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs">
                          <span className="font-bold text-zinc-200 block">{p.internalTransactionId || p.id}</span>
                          {p.razorpayOrderId && <span className="text-[10px] text-zinc-400">{p.razorpayOrderId}</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-200">{p.planName}</td>
                        <td className="px-4 py-3 font-bold text-zinc-100">{p.amountDisplay}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs font-semibold text-zinc-200">
                            <Zap className="h-3 w-3 text-zinc-400" /> +{p.credits}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColor(p.status)}`}>
                            {p.status === "captured" || p.status === "CREDITED" ? "Success" : p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                          {p.date ? new Date(p.date).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick upgrade CTA */}
          <div
            className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-[#121215] p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm"
          >
            <div>
              <p className="font-display text-base font-bold text-zinc-100">
                Need more credits?
              </p>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Top up instantly with a one-time purchase. Credits never expire.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("plans")}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-zinc-100 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              Browse Plans <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* CREDIT LEDGER TAB */}
      {activeTab === "history" && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-sm"
        >
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="font-display text-base font-bold text-zinc-100">
              Credit Transaction Ledger
            </h2>
          </div>
          {creditHistory.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-zinc-400">
              <Activity className="mb-3 h-10 w-10 opacity-40 text-zinc-500" />
              <p className="text-sm">No credit transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900/40">
                    <th className="px-5 py-3 font-bold">Action</th>
                    <th className="px-4 py-3 font-bold">Amount</th>
                    <th className="px-4 py-3 font-bold">Balance After</th>
                    <th className="px-4 py-3 font-bold">Reason</th>
                    <th className="px-5 py-3 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {creditHistory.map((t: CreditTransaction) => {
                    const isAdd = (t.creditsAdded ?? 0) > 0;
                    const amt = isAdd ? `+${t.creditsAdded}` : `-${t.creditsDeducted}`;
                    return (
                      <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-5 py-3 font-semibold capitalize text-zinc-200">
                          {(t.actionType || "").replace(/_/g, " ")}
                        </td>
                        <td className={`px-4 py-3 font-mono font-bold ${isAdd ? "text-emerald-400" : "text-rose-400"}`}>
                          {amt}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-zinc-200">
                          {t.newBalance}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">
                          {t.reason || "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                          {t.timestamp ? new Date(t.timestamp).toLocaleString() : "—"}
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

      {/* PLANS TAB */}
      {activeTab === "plans" && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-zinc-100">
                Upgrade Pricing & Plans
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Select a plan to view details and proceed to secure checkout.
              </p>
            </div>

            {/* Toggle Switcher */}
            <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  billingPeriod === "monthly"
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  billingPeriod === "yearly"
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          {plans.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 justify-center">
              {plans
                .filter((p) => {
                  const isYearly = p.id.includes("yearly");
                  return billingPeriod === "yearly" ? isYearly : !isYearly;
                })
                .map((p) => (
                  <PlanCard key={p.id} plan={p} paymentsAvailable={paymentsAvailable} />
                ))}
            </div>
          )}
          <div
            className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-[#121215] p-4 shadow-sm"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <p className="text-xs leading-relaxed text-zinc-400">
              All payments are processed securely by Razorpay with cryptographic server-side signature verification. Credits are added to your account
              immediately after payment confirmation. Contact support if you have any billing issues.
            </p>
          </div>
        </motion.div>
      )}

      {/* Support link */}
      <div className="flex items-center justify-center">
        <Link
          href="/dashboard/support"
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          Billing issue? <span className="text-zinc-200 underline">Contact Support →</span>
        </Link>
      </div>
    </div>
  );
}
