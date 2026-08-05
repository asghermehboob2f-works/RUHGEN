"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Coins,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RazorpayCheckoutModal, type Plan } from "@/components/payments/RazorpayCheckoutModal";

function CheckoutContent() {
  const { user, ready, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();

  const planIdParam = searchParams.get("plan") || "pro";
  const billingParam = searchParams.get("billing") || "monthly";

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentsAvailable, setPaymentsAvailable] = useState<boolean>(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [agreed, setAgreed] = useState(true);

  // 1. Fetch available plans & status from backend
  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/plans");
      const data = await res.json();
      if (data.ok) {
        setPlans(data.plans || []);
        setPaymentsAvailable(data.available !== false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready && !user) {
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/sign-in?next=${currentUrl}`);
      return;
    }
    if (user) {
      loadPlans();
    }
  }, [ready, user, router, loadPlans]);

  // 2. Derive selected plan during render
  const selectedPlan = useMemo(() => {
    if (plans.length === 0) return null;

    // Resolve target plan ID
    let targetId = planIdParam;
    if (billingParam === "yearly") {
      if (planIdParam === "pro") targetId = "pro_yearly";
      if (planIdParam === "pro_plus") targetId = "pro_plus_yearly";
    } else {
      if (planIdParam === "pro_yearly") targetId = "pro";
      if (planIdParam === "pro_plus_yearly") targetId = "pro_plus";
    }

    return plans.find((p) => p.id === targetId) || plans.find((p) => p.id === planIdParam) || plans[0];
  }, [plans, planIdParam, billingParam]);

  if (!ready || loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
          Retrieving Checkout Details…
        </p>
      </div>
    );
  }

  if (!user || !selectedPlan) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-sm text-[var(--text-muted)]">Plan details not found.</p>
        <Link href="/dashboard/billing" className="mt-4 inline-block text-sm font-bold text-[#7B61FF] hover:underline">
          Go back to Billing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-8 px-4 py-8">
      {/* Checkout Modal Trigger */}
      {showCheckoutModal && (
        <RazorpayCheckoutModal
          plan={selectedPlan}
          onClose={() => setShowCheckoutModal(false)}
          onSuccess={async () => {
            setShowCheckoutModal(false);
            if (typeof refreshUser === "function") await refreshUser();
            router.push("/dashboard/billing?success=1");
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/billing"
          className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-white/5"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--text-subtle)" }}>
            Review Order
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Checkout
          </h1>
        </div>
      </div>

      {/* Temporary Gateway Notice Banner */}
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

      <div className="grid gap-8 md:grid-cols-12 items-start">
        {/* Left Side: Plan Info (7 columns) */}
        <div className="md:col-span-7 space-y-6">
          {/* Card details */}
          <div
            className="rounded-2xl border p-6 sm:p-8"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="rounded bg-[#7B61FF]/10 border border-[#7B61FF]/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#A08AFF]">
                  Subscription Plan
                </span>
                <h2 className="font-display mt-2 text-2xl font-black text-white">
                  {selectedPlan.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedPlan.description}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] block">Price</span>
                <span className="font-display text-3xl font-extrabold text-white">
                  {selectedPlan.price_display}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] my-6 bg-[var(--border-subtle)]" />

            {/* Credits Info */}
            <div
              className="flex items-center justify-between rounded-xl border p-4"
              style={{
                borderColor: "color-mix(in srgb, #7B61FF 25%, transparent)",
                background: "color-mix(in srgb, #7B61FF 8%, transparent)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <Coins className="h-5 w-5 text-[#00D4FF]" />
                <div>
                  <span className="text-sm font-extrabold text-white block">
                    {selectedPlan.credits.toLocaleString()} Credits Included
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Added immediately to your account balance upon verification
                  </span>
                </div>
              </div>
              <Zap className="h-5 w-5 text-[#7B61FF]" />
            </div>

            {/* Features check list */}
            <div className="mt-8 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Included with your plan:
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {selectedPlan.features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00E575]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Secure details */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Secure Checkout", desc: "256-bit SSL transaction protection", icon: Lock, color: "#00D4FF" },
              { title: "UPI & Cards", desc: "All popular payment modes supported", icon: Shield, color: "#7B61FF" },
              { title: "Cancel Anytime", desc: "No contract or lock-in period", icon: RefreshCw, color: "#00E575" },
            ].map((s) => (
              <div
                key={s.title}
                className="rounded-xl border p-4 text-center"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div
                  className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `${s.color}15` }}
                >
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <h4 className="text-xs font-bold text-white">{s.title}</h4>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Checkout Action Panel (5 columns) */}
        <div className="md:col-span-5 space-y-6">
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <h3 className="font-display text-lg font-bold text-white mb-4">Summary</h3>

            {/* Price lines */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Subtotal</span>
                <span>{selectedPlan.price_display}</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Estimated Tax</span>
                <span>₹0</span>
              </div>
              <div className="h-[1px] bg-[var(--border-subtle)] my-2" />
              <div className="flex justify-between text-sm font-bold text-white">
                <span>Total Amount Due</span>
                <span className="text-[#00D4FF]">{selectedPlan.price_display}</span>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-white/[0.01] p-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border-subtle)] text-[#7B61FF] focus:ring-[#7B61FF]/40"
              />
              <span className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                I agree to the terms of service, server-side payment verification policy, and confirm that all payments are secure.
              </span>
            </label>

            {/* Pay Button */}
            <button
              onClick={() => agreed && paymentsAvailable && setShowCheckoutModal(true)}
              disabled={!agreed || !paymentsAvailable}
              className="mt-6 w-full rounded-xl py-4 font-display text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{
                background: paymentsAvailable
                  ? "linear-gradient(135deg, #7B61FF, #00D4FF)"
                  : "rgba(255,255,255,0.1)",
                boxShadow: agreed && paymentsAvailable ? "0 8px 24px -8px rgba(123,97,255,0.6)" : "none",
              }}
            >
              {paymentsAvailable ? "Proceed to Payment" : "Payments Temporarily Unavailable"}
            </button>
          </div>

          <div
            className="rounded-xl border p-4 text-xs"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <p className="leading-relaxed text-[var(--text-muted)]">
              Need assistance? Email support at{" "}
              <Link href="mailto:support@ruhgen.in" className="font-semibold text-[#00D4FF] hover:underline">
                support@ruhgen.in
              </Link>{" "}
              or open a support ticket inside your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
          Preparing Checkout Page…
        </p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
