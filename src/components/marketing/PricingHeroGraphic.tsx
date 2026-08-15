"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, Cpu, Zap, Shield, Sparkles } from "lucide-react";

const PLANS = [
  {
    id: "free",
    label: "Free",
    price: "0",
    symbol: false,
    period: "",
    credits: "120 credits / mo",
    tagline: "Core Creative Access",
    status: "On Demand",
    accent: "rgba(255, 255, 255, 0.4)",
    accentRaw: "#ffffff",
    performance: { speed: "Standard", concurrency: "1 Active", quality: "2K Max" },
    icon: Zap,
    features: ["Standard Models", "2K Resolution", "Standard Queue"],
  },
  {
    id: "pro",
    label: "Pro",
    price: "499",
    symbol: true,
    period: "/ mo",
    credits: "510 credits / mo",
    tagline: "Production Grade",
    status: "Priority Access",
    accent: "#7B61FF",
    accentRaw: "#7B61FF",
    performance: { speed: "High-Speed", concurrency: "3 Active", quality: "4K Max" },
    icon: Sparkles,
    features: ["Advanced Models", "4K Resolution", "Priority Queue"],
  },
  {
    id: "pro_plus",
    label: "Pro Plus",
    price: "999",
    symbol: true,
    period: "/ mo",
    credits: "650 credits / mo",
    tagline: "Unrestricted Power",
    status: "Instant Queue",
    accent: "#00D4FF",
    accentRaw: "#00D4FF",
    performance: { speed: "Ultra-Fast", concurrency: "Unlimited", quality: "Ultra HD" },
    icon: Cpu,
    features: ["Premium Models", "Ultra HD Output", "Instant Queue"],
  },
  {
    id: "custom",
    label: "Custom",
    price: "Scale",
    symbol: false,
    period: "",
    credits: "Custom allocations",
    tagline: "Tailored Infrastructure",
    status: "Dedicated Compute",
    accent: "#FF2E9A",
    accentRaw: "#FF2E9A",
    performance: { speed: "Dedicated Node", concurrency: "Infinite", quality: "Custom Custom" },
    icon: Shield,
    features: ["Custom AI Models", "Private Deployments", "Dedicated SLA"],
  },
];

export function PricingHeroGraphic({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion() === true;
  const [idx, setIdx] = useState(1);
  const [dynamicPlans, setDynamicPlans] = useState(PLANS);

  useEffect(() => {
    fetch("/api/payments/plans")
      .then((res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        if (data && data.ok && Array.isArray(data.plans)) {
          setDynamicPlans((prev) =>
            prev.map((p) => {
              const matched = data.plans.find((item: any) => item.id === p.id);
              if (matched) {
                const priceInRupees = matched.price_inr ? Math.round(matched.price_inr / 100).toString() : p.price;
                const creditStr = matched.credits ? `${matched.credits.toLocaleString("en-IN")} credits / mo` : p.credits;
                return {
                  ...p,
                  label: matched.name || p.label,
                  price: priceInRupees,
                  credits: creditStr,
                };
              }
              return p;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  const plan = dynamicPlans[idx] || dynamicPlans[0] || PLANS[0];
  const Icon = plan.icon;

  // Auto-cycle through plans
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % dynamicPlans.length);
    }, 3800);
    return () => clearInterval(id);
  }, [reduce, dynamicPlans.length]);

  return (
    <div className={`relative w-full max-w-[420px] select-none ${className}`} aria-hidden="true">
      {/* ── Outer luxury glow ── */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-[2.5rem] opacity-20 blur-3xl transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${plan.accentRaw} 0%, transparent 70%)`,
        }}
      />

      {/* ── Main Classic Console Chassis ── */}
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-card shadow-[0_20px_60px_-16px_rgba(0,0,0,0.35)]">
        
        {/* macOS-style Header Bar */}
        <div className="relative z-20 flex items-center border-b border-border/50 bg-card/40 px-3.5 py-2 backdrop-blur-md">
          <div className="mr-3 flex shrink-0 items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f56]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="truncate font-mono text-[7px] font-bold uppercase tracking-[0.25em] text-neutral-500">
            RUHGEN ENGINE // SUBSCRIPTION_CONSOLE
          </span>
        </div>

        {/* ── Main display area ── */}
        <div className="relative w-full overflow-hidden bg-gradient-to-b from-card to-background p-6" style={{ aspectRatio: "16/10" }}>
          
          {/* Shimmer light reflection effect */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-[var(--text-primary)]/[0.01] to-transparent" />

          {/* Ambient color wash inside */}
          <div
            className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[70%] h-[55%] rounded-full opacity-[0.07] blur-3xl transition-all duration-1000"
            style={{
              background: `radial-gradient(circle, ${plan.accentRaw} 0%, transparent 70%)`,
            }}
          />

          {/* Top Row: Plan Title & Status Badge */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded border border-border/50 bg-card/10 transition-colors duration-500"
                style={{ color: plan.accentRaw }}
              >
                <Icon className="h-3 w-3" />
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={plan.id + "-lbl"}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-[10px] font-bold tracking-wider uppercase text-foreground"
                >
                  {plan.label}
                </motion.span>
              </AnimatePresence>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={plan.id + "-status"}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/10 px-2 py-0.5"
              >
                <span className="relative flex h-1 w-1">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ backgroundColor: plan.accentRaw }}
                  />
                  <span
                    className="relative inline-flex h-1 w-1 rounded-full"
                    style={{ backgroundColor: plan.accentRaw }}
                  />
                </span>
                <span className="font-mono text-[6.5px] font-bold uppercase tracking-wider text-muted-foreground">
                  {plan.status}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Split Center Layout ── */}
          <div className="grid grid-cols-[1.1fr_0.9fr] gap-6 mt-5 items-center relative z-10">
            
            {/* Left Column: Price & Credits */}
            <div className="flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={plan.id + "-pricing"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-start">
                    {plan.symbol && (
                      <span
                        className="mt-2 mr-0.5 font-black leading-none"
                        style={{
                          fontFamily: "var(--font-calsans)",
                          fontSize: 22,
                          color: plan.accentRaw,
                        }}
                      >
                        ₹
                      </span>
                    )}
                    <span
                      className="font-extrabold leading-none tracking-tighter text-foreground"
                      style={{
                        fontFamily: "var(--font-syne)",
                        fontSize: plan.price.length > 4 ? 48 : 58,
                        lineHeight: 1,
                      }}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="self-end mb-2 ml-1 text-[10px] font-semibold text-muted-foreground/65">
                        {plan.period}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-0.5">
                    <span className="font-mono text-[8.5px] uppercase tracking-wider text-muted-foreground/65">
                      {plan.credits}
                    </span>
                    <span className="font-mono text-[8px] font-bold uppercase tracking-wider transition-colors duration-500" style={{ color: plan.accent }}>
                      {plan.tagline}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Column: Performance Indicators */}
            <div className="rounded-xl border border-border/50 bg-card/10 p-3.5 flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-radial-gradient" 
                style={{
                  background: `radial-gradient(circle at 100% 0%, ${plan.accentRaw}15, transparent 60%)`
                }}
              />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={plan.id + "-perf"}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <div>
                    <div className="flex justify-between font-mono text-[6.5px] uppercase text-muted-foreground/45 mb-0.5">
                      <span>Render Speed</span>
                      <span style={{ color: plan.accentRaw }}>{plan.performance.speed}</span>
                    </div>
                    <div className="h-1 rounded-full bg-border overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: plan.id === "free" ? "25%" : plan.id === "pro" ? "60%" : plan.id === "pro_plus" ? "85%" : "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ backgroundColor: plan.accentRaw }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-mono text-[6.5px] uppercase text-muted-foreground/45 mb-0.5">
                      <span>Concurrency</span>
                      <span style={{ color: plan.accentRaw }}>{plan.performance.concurrency}</span>
                    </div>
                    <div className="h-1 rounded-full bg-border overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: plan.id === "free" ? "15%" : plan.id === "pro" ? "50%" : plan.id === "pro_plus" ? "85%" : "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ backgroundColor: plan.accentRaw }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-mono text-[6.5px] uppercase text-muted-foreground/45 mb-0.5">
                      <span>Max Output</span>
                      <span style={{ color: plan.accentRaw }}>{plan.performance.quality}</span>
                    </div>
                    <div className="h-1 rounded-full bg-border overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: plan.id === "free" ? "40%" : plan.id === "pro" ? "70%" : plan.id === "pro_plus" ? "90%" : "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ backgroundColor: plan.accentRaw }}
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

          {/* ── Feature List Footer (Compact Horizontal Row) ── */}
          <div className="relative z-10 border-t border-border/50 pt-3 mt-4">
            <AnimatePresence mode="wait">
              <motion.ul
                key={plan.id + "-features-list"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="flex justify-between gap-2"
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1.5">
                    <Check className="h-2.5 w-2.5 shrink-0" style={{ color: plan.accentRaw }} strokeWidth={2.5} />
                    <span className="font-mono text-[8px] tracking-wide text-muted-foreground/60 truncate">
                      {feature}
                    </span>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>

        </div>

        {/* ── Bottom Dock: active selector presets ── */}
        <div className="relative z-20 border-t border-border/50 bg-card p-3">
          <div className="mb-2 text-left font-mono text-[7.5px] font-bold uppercase tracking-widest text-neutral-500">
            ACTIVE PLAN PRESETS
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {dynamicPlans.map((p, i) => {
              const isActive = idx === i;
              return (
                <button
                  key={p.id}
                  onClick={() => setIdx(i)}
                  className={`relative flex flex-col overflow-hidden rounded-lg border p-1.5 text-left outline-none transition-all duration-300 cursor-pointer ${
                    isActive ? "" : "border-border/40 bg-card/10 hover:bg-card/25 hover:border-border"
                  }`}
                  style={
                    isActive
                      ? { borderColor: `${p.accentRaw}55`, backgroundColor: `${p.accentRaw}08` }
                      : {}
                  }
                >
                  {isActive && (
                    <span
                      className="absolute right-1 top-1 h-1 w-1 rounded-full animate-pulse"
                      style={{ background: p.accentRaw }}
                    />
                  )}
                  <span
                    className={`font-mono text-[8.5px] font-bold tracking-tight transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {p.label}
                  </span>
                  <span className="mt-0.5 block font-mono text-[6.5px] uppercase tracking-wider text-neutral-500 truncate">
                    {p.id === "custom" ? "Custom" : p.price === "0" ? "Free" : `${p.price}/mo`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
