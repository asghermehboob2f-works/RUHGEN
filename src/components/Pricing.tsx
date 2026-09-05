"use client";

import { Check, Sparkles, Zap, Shield, Cpu, ChevronDown, Lock, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SITE_CONTAINER } from "@/lib/site-layout";
import { PricingHeroGraphic } from "@/components/marketing/PricingHeroGraphic";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";

type PricingPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number;
  features: string[];
  badge?: string;
  cta: string;
  available: boolean;
  description?: string;
};

const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 1,
    features: [
      "1 Promotional Onboarding Credit",
      "Standard Image Generation Preview",
      "Community Gallery Access",
      "Prompt Engineering Sandbox",
      "Standard Queue",
      "Community Support",
      "No Premium Omni Video Generation"
    ],
    cta: "Get Started Free",
    available: true,
    description: "Test the interface and explore community showcases with 1 complimentary credit."
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 299,
    yearlyPrice: 2899,
    credits: 100,
    features: [
      "100 Generation Credits Included",
      "Standard Video Access (15 cr/5s)",
      "Standard Image Generation Access (2-3 cr)",
      "Up to 6 Standard Video Clips",
      "Standard Rendering Queue",
      "Commercial Usage Rights",
      "Core Creative Tools",
      "Basic Generation History"
    ],
    cta: "Get Starter",
    available: true
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 599,
    yearlyPrice: 5799,
    credits: 220,
    features: [
      "220 High-Capacity Credits",
      "RUHGEN Premium Video Access (30–60 cr)",
      "Standard Video Access (15 cr)",
      "Image-to-Video Reference Mode",
      "5s & 10s Clip Lengths",
      "720p & 1080p Cinema Resolution",
      "Synchronized AI Audio FX",
      "Priority Rendering Queue",
      "Commercial Usage Rights",
      "Email Support"
    ],
    badge: "Most Popular",
    cta: "Upgrade to Pro",
    available: true
  },
  {
    id: "pro_plus",
    name: "Creator",
    monthlyPrice: 1299,
    yearlyPrice: 12499,
    credits: 500,
    features: [
      "500 Ultimate Generation Credits",
      "Full Premium Video Engine",
      "Virtual Camera Controls & Movement",
      "10s Extended Cinema Rendering",
      "Direct Image Reference Synthesis",
      "Highest Queue Priority",
      "Commercial Licensing",
      "Dedicated Studio Support",
      "Early Access to New Features"
    ],
    badge: "Best Value",
    cta: "Go Creator",
    available: true
  }
];

const CREDIT_RATES = [
  {
    action: "Fast Image Generation",
    model: "RUHGEN Fast Engine",
    cost: "2 credits / image",
    description: "Rapid iteration, prompt testing, and conceptual prototyping.",
    icon: Zap,
    color: "#00D4FF",
  },
  {
    action: "Production Image Generation",
    model: "RUHGEN HD Engine",
    cost: "3 credits / image",
    description: "Detailed typography, photorealistic textures, and sharp compositions.",
    icon: Sparkles,
    color: "#7B61FF",
  },
  {
    action: "RUHGEN Standard Video",
    model: "RUHGEN Standard Video Engine",
    cost: "15 credits / 5s clip",
    description: "High-speed text-to-video motion clips.",
    icon: Cpu,
    color: "#FF2E9A",
  },
  {
    action: "RUHGEN Premium Video",
    model: "RUHGEN Premium Video Engine",
    cost: "30–60 credits / clip",
    description: "Cinema-grade video, multi-image reference input, 10s duration, 1080p, and synchronized audio.",
    icon: Shield,
    color: "#F59E0B",
  },
];

const COMPARISON_DATA: Record<string, Record<string, string>> = {
  free: {
    "Unused Credit Rollover": "No Rollover",
    "Top-up Packages": "Not Available",
    "Image Generation": "Standard Preview",
    "Video Generation": "No Premium Video",
    "Max Resolution": "Up to 1K Preview",
    "Rendering Speed": "Standard Queue",
    "Concurrency": "1 active task",
    "Advanced Controls": "Core Creative Tools",
    "Commercial Usage": "Watermarked Preview only",
    "Support Level": "Community Support",
    "API Access": "No API Access",
    "Team Collaboration": "No",
  },
  starter: {
    "Unused Credit Rollover": "No Rollover",
    "Top-up Packages": "Starting at ₹199",
    "Image Generation": "Standard Models (2-3 cr)",
    "Video Generation": "Standard Video (15 cr)",
    "Max Resolution": "Up to 2K Image / 720p Video",
    "Rendering Speed": "Standard Queue",
    "Concurrency": "1 active task",
    "Advanced Controls": "Core Creative Tools",
    "Commercial Usage": "Commercial License",
    "Support Level": "Standard Support",
    "API Access": "No API Access",
    "Team Collaboration": "No",
  },
  pro: {
    "Unused Credit Rollover": "Yes (up to 2x limit)",
    "Top-up Packages": "Starting at ₹199",
    "Image Generation": "Full Image Models (2-3 cr)",
    "Video Generation": "Standard + Premium Omni (15–60 cr)",
    "Max Resolution": "Up to 4K Image / 1080p Video",
    "Rendering Speed": "Priority Queue",
    "Concurrency": "Up to 2 concurrent",
    "Advanced Controls": "Image Ref & Sound FX",
    "Commercial Usage": "Full Commercial License",
    "Support Level": "Email Support",
    "API Access": "No API Access",
    "Team Collaboration": "No",
  },
  pro_plus: {
    "Unused Credit Rollover": "Yes (up to 3x limit)",
    "Top-up Packages": "Starting at ₹149",
    "Image Generation": "Full High-Fidelity Suite",
    "Video Generation": "Priority Premium Omni Video",
    "Max Resolution": "Ultra HD / 1080p Cinema Video",
    "Rendering Speed": "Instant Priority Queue",
    "Concurrency": "Up to 4 concurrent",
    "Advanced Controls": "Camera Controls + Omni Ref",
    "Commercial Usage": "Full Commercial License",
    "Support Level": "Dedicated Support",
    "API Access": "API Access",
    "Team Collaboration": "Team Collaboration",
  },
  custom: {
    "Unused Credit Rollover": "Custom Rollover",
    "Top-up Packages": "Volume / Enterprise Rates",
    "Image Generation": "Exclusive Models",
    "Video Generation": "Exclusive Models",
    "Max Resolution": "Personalized Custom Resolution",
    "Rendering Speed": "Dedicated Infrastructure",
    "Concurrency": "Dedicated compute nodes",
    "Advanced Controls": "Personalized Workflows",
    "Commercial Usage": "Custom Enterprise Licensing",
    "Support Level": "Dedicated Account Manager",
    "API Access": "Scaling API & Webhooks",
    "Team Collaboration": "Team Management & Controls",
  }
};

const COMPARISON_SECTIONS = [
  {
    category: "Credits & Limits",
    rows: [
      {
        name: "Credits Included",
        getVal: (p: PricingPlan) => p.id === "custom" ? "Custom Quote" : `${p.credits} Credits`,
      },
      {
        name: "Max Resolution",
        getVal: (p: PricingPlan) => COMPARISON_DATA[p.id]?.["Max Resolution"] || "Up to 2K",
      },
    ],
  },
  {
    category: "Performance",
    rows: [
      {
        name: "Rendering Speed",
        getVal: (p: PricingPlan) => COMPARISON_DATA[p.id]?.["Rendering Speed"] || "Standard",
      },
      {
        name: "Concurrency",
        getVal: (p: PricingPlan) => COMPARISON_DATA[p.id]?.["Concurrency"] || "1 active task",
      },
      {
        name: "Advanced Controls",
        getVal: (p: PricingPlan) => COMPARISON_DATA[p.id]?.["Advanced Controls"] || "Core Tools",
      },
    ],
  },
];

const FAQS = [
  {
    q: "How do RUHGEN credits work?",
    a: "Credits are spent dynamically depending on the model tier and quality you choose. Generation with Standard Models costs 2 credits, Advanced Models cost 3 credits, and cinematic video seconds cost between 5 to 8 credits. Included credits refresh monthly at the start of your billing cycle.",
  },
  {
    q: "Do unused credits roll over to the next month?",
    a: "Yes! For Pro and Pro Plus subscriptions, any unused monthly credits will automatically roll over to the next billing cycle. The rollover limit is capped at 2x your plan's monthly allocation for Pro, and 3x for Pro Plus.",
  },
  {
    q: "Can I buy more credits if I run out?",
    a: "Absolutely. Subscribers on Pro and Pro Plus tiers can buy top-up credit packs directly from their dashboard starting at ₹149. These top-up credits never expire as long as you maintain an active subscription.",
  },
  {
    q: "What commercial licensing rights are included?",
    a: "Free plans are strictly for personal, non-commercial evaluation. Pro and Pro Plus subscriptions grant full, worldwide, perpetual commercial usage rights for all generated assets. Enterprise plans include customized corporate licensing agreements.",
  },
  {
    q: "Is there a contract or cancellation fee?",
    a: "No. All plans are billed month-to-month or year-to-year and can be canceled at any time from your settings. If you cancel, your premium benefits and credit usage remain active until the end of your prepaid billing period.",
  },
];

export function Pricing({ hideHeading = false, plans }: { hideHeading?: boolean; plans?: PricingPlan[] }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [dynamicPlans, setDynamicPlans] = useState<PricingPlan[]>(plans && plans.length > 0 ? plans : []);
  const [liveRates, setLiveRates] = useState<{
    cost_image_schnell: number;
    cost_image_dev: number;
    cost_video_std: number;
    cost_video_pro: number;
  }>({
    cost_image_schnell: 2,
    cost_image_dev: 3,
    cost_video_std: 5,
    cost_video_pro: 8,
  });
  const reduce = useReducedMotion() === true;

  React.useEffect(() => {
    fetch("/api/credits/rates")
      .then((r) => (r.ok ? r.json().catch(() => null) : null))
      .then((data) => {
        if (data?.ok && data?.rates) {
          setLiveRates({
            cost_image_schnell: data.rates.cost_image_schnell ?? data.rates.credits_per_image ?? 2,
            cost_image_dev: data.rates.cost_image_dev ?? 3,
            cost_video_std: data.rates.cost_video_std ?? data.rates.credits_per_video_second ?? 5,
            cost_video_pro: data.rates.cost_video_pro ?? 8,
          });
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (plans && plans.length > 0) {
      setDynamicPlans(plans);
      return;
    }
    fetch("/api/payments/plans")
      .then((res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        if (data && data.ok && Array.isArray(data.plans) && data.plans.length > 0) {
          const map = new Map<string, PricingPlan>();
          for (const p of data.plans) {
            const baseId = p.id.replace("_yearly", "");
            let existing = map.get(baseId);
            if (!existing) {
              existing = {
                id: baseId,
                name: p.name.replace(" (Yearly)", ""),
                monthlyPrice: 0,
                yearlyPrice: 0,
                credits: p.credits,
                features: p.features || [],
                badge: p.badge,
                cta: baseId === "free" ? "Get Started Free" : `Upgrade to ${p.name.replace(" (Yearly)", "")}`,
                available: true,
                description: p.description,
              };
              map.set(baseId, existing);
            }
            const priceRupees = p.price_inr ? Math.round(p.price_inr / 100) : 0;
            if (p.id.includes("yearly")) {
              existing.yearlyPrice = priceRupees;
            } else {
              existing.monthlyPrice = priceRupees;
            }
          }
          const loaded = Array.from(map.values());
          if (loaded.length > 0) {
            setDynamicPlans(loaded);
          }
        }
      })
      .catch(() => {});
  }, [plans]);

  const activePlans = (dynamicPlans.length > 0 ? dynamicPlans : DEFAULT_PLANS).filter(p => p.available !== false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPlanLink = (plan: PricingPlan) => {
    if (plan.id === "custom") return "/contact";
    if (plan.id === "free") return user ? "/dashboard" : "/sign-up";
    if (user) {
      return `/dashboard/billing/checkout?plan=${plan.id}&billing=${billingPeriod}`;
    }
    return `/sign-up?plan=${plan.id}&billing=${billingPeriod}`;
  };

  return (
    <>
      {/* ── Hero Section ── matches Demo / Platform split layout */}
      {!hideHeading && (
        <section
          className="relative overflow-hidden border-b pt-24 sm:pt-28"
          style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
        >
          {/* Ambient radial glows */}
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 80% 55% at 100% 0%, rgba(123,97,255,0.16), transparent 55%), radial-gradient(ellipse 60% 45% at 0% 100%, rgba(0,212,255,0.09), transparent 55%)",
            }}
          />

          <div
            className={`relative ${SITE_CONTAINER} grid gap-10 pb-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16 lg:pb-20`}
          >
            {/* Left — text content */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-[#7B61FF]">
                Exclusive Subscriptions
              </p>
              <h1
                className="font-display mt-3 text-page-title font-extrabold leading-[1.1] tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Plans that match your{" "}
                <span className="text-gradient-primary">ambition</span>
              </h1>
              <p
                className="mt-4 max-w-xl text-sm leading-relaxed sm:text-base"
                style={{ color: "var(--text-muted)" }}
              >
                Scale your creative output dynamically. Access custom credit allocations, high-speed rendering queues, and studio-grade licensing agreements built for individuals and studios alike.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white btn-gradient"
                >
                  <Sparkles className="mr-2 h-4 w-4 opacity-80" />
                  Get started free
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold transition-colors hover:border-[#7B61FF]/45"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                    background: "var(--glass)",
                  }}
                >
                  Talk to sales
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            {/* Right — animated graphic */}
            <motion.div
              className="relative flex justify-center lg:justify-end"
              initial={reduce ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <PricingHeroGraphic />
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Pricing content section ── */}
      <section id="pricing" className="relative overflow-hidden py-20 sm:py-28" style={{ background: "var(--deep-black)" }}>
        {/* Soft ambient fill */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[70vw] h-[500px] rounded-full opacity-[0.04] blur-[140px]"
            style={{ background: "radial-gradient(circle, var(--primary-purple) 30%, var(--primary-cyan) 70%)" }}
          />
        </div>

        <div className={SITE_CONTAINER}>
        {/* hideHeading variant — keep centred label for embedded use */}
        {hideHeading && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]"
              style={{ color: "var(--primary-purple)" }}
            >
              Exclusive Subscriptions
            </motion.p>
            <motion.h2
              initial={reduce ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display mt-4 text-page-title font-extrabold leading-[1.15] tracking-tight text-foreground"
            >
              Choose the Plan That Matches Your <span className="text-gradient-primary">Ambition</span>
            </motion.h2>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-sm sm:text-base leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Scale your creative output dynamically. Access custom credit allocations, high-speed rendering queues, and studio-grade licensing agreements.
            </motion.p>
          </div>
        )}

        {/* Billing Switcher */}
        <div className="flex flex-col items-center gap-3 mb-16">
          {/* Toggle pill */}
          <div
            className="relative inline-flex items-center rounded-full p-1 border border-border bg-card/40"
          >
            {/* Sliding indicator */}
            <motion.div
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full pointer-events-none"
              animate={{ x: billingPeriod === "yearly" ? "100%" : "0%" }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
              style={{
                background: "linear-gradient(135deg, #7B61FF, #00D4FF)",
              }}
            />

            {/* Monthly */}
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className="relative z-10 min-w-[140px] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 outline-none select-none rounded-full"
              style={{
                color: billingPeriod === "monthly" ? "#ffffff" : "var(--text-muted)",
              }}
            >
              Monthly
            </button>

            {/* Annually */}
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className="relative z-10 min-w-[140px] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 outline-none select-none rounded-full"
              style={{
                color: billingPeriod === "yearly" ? "#ffffff" : "var(--text-muted)",
              }}
            >
              Annually
            </button>
          </div>

          {/* Save badge */}
          <AnimatePresence mode="wait">
            {billingPeriod === "yearly" && (
              <motion.span
                key="save"
                initial={reduce ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase text-white"
                style={{
                  background: "linear-gradient(135deg, #FF2E9A, #7B61FF)",
                  letterSpacing: "0.18em",
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                Save ~20%
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Pricing Cards Grid (4 plans) */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 items-stretch mb-28">
          {activePlans.map((plan, idx) => {
            const isFree = plan.monthlyPrice === 0 && plan.id === "free";
            const isCustom = plan.id === "custom" || plan.monthlyPrice === -1 || plan.name.toLowerCase().includes("custom");
            const price = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const suffix = isFree ? "" : billingPeriod === "yearly" ? " / year" : " / month";

            const isPro = plan.id === "pro";
            const isPlus = plan.id === "pro_plus";

            // Luxury Card styling
            let cardStyle: React.CSSProperties = {
              borderColor: "var(--border-subtle)",
              background: "linear-gradient(180deg, var(--glass) 0%, var(--glass-elevated) 100%)",
            };

            if (isPro) {
              cardStyle = {
                borderColor: "transparent",
                background: "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, #7B61FF, #00D4FF) border-box",
                border: "2px solid transparent",
                boxShadow: theme === "light"
                  ? "0 12px 36px -8px rgba(123, 97, 255, 0.14), 0 4px 12px -2px rgba(0, 0, 0, 0.05)"
                  : "0 20px 48px -12px rgba(123, 97, 255, 0.22)",
              };
            } else if (isPlus) {
              cardStyle = {
                borderColor: "transparent",
                background: "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, #FF2E9A, #7B61FF) border-box",
                border: "2px solid transparent",
                boxShadow: theme === "light"
                  ? "0 12px 36px -8px rgba(255, 46, 154, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)"
                  : "0 20px 48px -12px rgba(255, 46, 154, 0.18)",
              };
            }

            return (
              <motion.div
                key={plan.id || idx}
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 sm:p-6 ${
                  isPro ? "xl:scale-[1.02]" : ""
                }`}
                style={cardStyle}
              >
                {/* Visual Ambient Halos */}
                {isPro && (
                  <div className="absolute -inset-[1px] rounded-[16px] bg-gradient-to-r from-[#7B61FF] to-[#00D4FF] opacity-[0.06] blur-lg pointer-events-none" />
                )}
                {isPlus && (
                  <div className="absolute -inset-[1px] rounded-[16px] bg-gradient-to-r from-[#FF2E9A] to-[#7B61FF] opacity-[0.06] blur-lg pointer-events-none" />
                )}

                {/* Popular / Best Value Badge */}
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[8.5px] font-mono uppercase tracking-widest text-white shadow-md ${
                      isPro ? "bg-gradient-to-r from-[#7B61FF] to-[#00D4FF]" : "bg-gradient-to-r from-[#FF2E9A] to-[#7B61FF]"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-semibold font-display text-foreground">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-[11px] leading-tight font-light" style={{ color: "var(--text-muted)" }}>
                        {isFree
                          ? "Explore core capabilities"
                          : isPro
                          ? "Standard production grade"
                          : isPlus
                          ? "Ultimate creative autonomy"
                          : "Fully customized deployment"}
                      </p>
                    </div>
                  </div>

                  {/* Price Block */}
                  {isCustom ? (
                    <div className="mt-5 flex flex-col justify-end min-h-[44px]">
                      <span className="text-2xl font-bold tracking-tight font-display text-foreground">
                        Custom
                      </span>
                      <span className="text-[9.5px] font-mono tracking-wider uppercase mt-0.5" style={{ color: "var(--text-subtle)" }}>
                        Enterprise Solution
                      </span>
                    </div>
                  ) : (
                    <div className="mt-5 flex items-baseline min-h-[44px]">
                      <span
                        className="text-2xl font-black mr-0.5 leading-none"
                        style={{
                          fontFamily: "var(--font-calsans)",
                          color: isPro ? "#00D4FF" : isPlus ? "#FF2E9A" : "var(--text-primary)",
                        }}
                      >
                        ₹
                      </span>
                      <span className="text-3xl font-bold tracking-tight font-display text-foreground">
                        {price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10.5px] font-normal ml-1.5" style={{ color: "var(--text-muted)" }}>
                        {suffix}
                      </span>
                    </div>
                  )}

                  {/* Credits Pill / Status */}
                  <div className="mt-3.5 flex items-center justify-between p-2 rounded-lg bg-card/30 border border-border/40 text-[9.5px] font-mono">
                    <span className="tracking-wide uppercase text-muted-foreground/75">Monthly Allowance</span>
                    <span className="px-2 py-0.5 rounded font-mono font-medium tracking-wider" style={{ background: "var(--border-subtle)", color: isPro ? "#00D4FF" : isPlus ? "#FF2E9A" : "var(--text-primary)" }}>
                      {isCustom ? "Custom" : `${plan.credits} Credits`}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] my-4 bg-border/50 w-full" />

                  {/* Feature List */}
                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 text-[11px] leading-relaxed font-light">
                        <Check
                           className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                            isPro ? "text-[#00D4FF]" : isPlus ? "text-[#FF2E9A]" : "text-[#7B61FF]"
                          }`}
                          strokeWidth={2.5}
                        />
                        <span style={{ color: "var(--text-muted)" }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA */}
                <Link
                  href={getPlanLink(plan)}
                  className={`mt-6 block w-full rounded-xl py-2.5 text-center text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] ${
                    isPro || isPlus ? "text-white btn-gradient" : "border"
                  }`}
                  style={
                    !(isPro || isPlus)
                      ? {
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                          background: "var(--glass)",
                        }
                      : undefined
                  }
                >
                  {plan.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Credit Explanation section */}
        <div className="mb-24 rounded-2xl border border-border bg-card/10 p-6 sm:p-10 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-10 bg-radial-at-t from-[#7B61FF] via-transparent to-transparent" />

          <div className="relative text-center max-w-xl mx-auto mb-10">
            <p className="font-mono text-[9px] font-normal uppercase tracking-[0.2em]" style={{ color: "var(--primary-cyan)" }}>Dynamic Rendering Weights</p>
            <h3 className="font-display mt-2 text-xl font-bold text-foreground sm:text-2xl">
              Understanding Credit Rates
            </h3>
            <p className="mt-2 text-xs sm:text-sm font-light" style={{ color: "var(--text-muted)" }}>
              Credits are spent dynamically depending on compute power required.
            </p>
          </div>

          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CREDIT_RATES.map((rate, idx) => {
              const Icon = rate.icon;
              let costDisplay = rate.cost;
              if (idx === 0) costDisplay = `${liveRates.cost_image_schnell} credits / image`;
              if (idx === 1) costDisplay = `${liveRates.cost_image_dev} credits / image`;
              if (idx === 2) costDisplay = `${liveRates.cost_video_std} credits / second`;
              if (idx === 3) costDisplay = `${liveRates.cost_video_pro} credits / second`;

              return (
                <div key={idx} className="rounded-xl border border-border/50 bg-card/25 p-4 flex flex-col justify-between">
                  <div>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-card/40 border border-border/40 mb-3">
                      <Icon className="h-4 w-4" style={{ color: rate.color }} strokeWidth={1.5} />
                    </div>
                    <h4 className="text-[10.5px] font-mono tracking-wider uppercase text-muted-foreground">{rate.action}</h4>
                    <p className="text-[9.5px] font-mono text-muted-foreground/60 mt-0.5">{rate.model}</p>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-2 font-light">{rate.description}</p>
                  </div>
                  <div className="mt-4 border-t border-border/50 pt-2.5">
                    <span className="text-[11px] font-mono font-semibold" style={{ color: rate.color }}>{costDisplay}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Comparison Table Section */}
        <div className="mb-28">
          <div className="text-center mb-12">
            <p className="font-mono text-[9px] font-normal uppercase tracking-[0.2em]" style={{ color: "var(--primary-purple)" }}>Side-by-Side Comparison</p>
            <h3 className="font-display mt-2 text-2xl font-bold text-foreground">
              Compare Features in Detail
            </h3>
            <p className="mt-3 text-xs sm:text-sm font-light" style={{ color: "var(--text-muted)" }}>
              A full technical breakdown of capability ceilings and pipeline infrastructure.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-border bg-card/10">
                  <th className="p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Technical Specs</th>
                  {activePlans.map((plan, idx) => (
                    <th key={idx} className="p-5 text-sm font-bold w-[20%]" style={{ color: "var(--text-primary)" }}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {COMPARISON_SECTIONS.map((section, sidx) => (
                  <React.Fragment key={sidx}>
                    <tr className="bg-card/5">
                      <td colSpan={1 + activePlans.length} className="p-4 text-xs font-semibold uppercase tracking-wider text-[#7B61FF]">
                        {section.category}
                      </td>
                    </tr>
                    {section.rows.map((row, ridx) => (
                      <tr key={ridx} className="hover:bg-card/20 transition-colors">
                        <td className="p-5 text-xs font-normal text-foreground/80">{row.name}</td>
                        {activePlans.map((plan, pidx) => (
                          <td key={pidx} className="p-5 text-xs font-normal text-muted-foreground">
                            {row.getVal(plan)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enterprise Spotlight Card */}
        <div className="mb-28 relative rounded-2xl overflow-hidden border border-border bg-card/20 p-8 sm:p-12">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-brand-purple/10 via-transparent to-brand-cyan/10" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold font-mono tracking-wider uppercase text-[#00D4FF] bg-[#00D4FF]/10 mb-4 border border-[#00D4FF]/20">
                Studio Infrastructure
              </div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Enterprise-Grade Scale & Private Deployments
              </h3>
              <p className="mt-4 text-xs sm:text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-muted)" }}>
                For creative studios, game devs, and digital agencies requiring dedicated compute power, API rate limits, custom fine-tuned workflows, or on-prem private installations. Get high-concurrency capability backed by service-level guarantees.
              </p>
            </div>
            <div className="flex flex-col gap-3 justify-center lg:items-end">
              <Link href="/contact" className="inline-flex min-h-[46px] items-center justify-center rounded-xl px-6 text-xs font-bold uppercase tracking-wider text-white btn-gradient w-full lg:w-auto">
                Contact Enterprise Sales
              </Link>
              <p className="text-[10px] text-center lg:text-right text-text-subtle font-semibold">
                SLA-backed response within 12 hours
              </p>
            </div>
          </div>
        </div>

        {/* Secure Checkout / Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 py-8 border-y border-border text-muted-foreground/60 text-[11px] font-semibold mb-28">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#00D4FF]" />
            <span>Secure 256-bit SSL Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#7B61FF]" />
            <span>UPI & Card Payments Protected</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#FF2E9A]" />
            <span>High-Speed Compute Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            <span>Cancel or Pause Anytime</span>
          </div>
        </div>
      </div>
      </section>
    </>
  );
}
