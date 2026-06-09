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
  const plan = PLANS[idx];
  const Icon = plan.icon;

  // Auto-cycle through plans
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % PLANS.length);
    }, 3800);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className={`relative w-full max-w-[420px] aspect-[1.2/1] flex flex-col justify-between ${className}`} aria-hidden="true">
      {/* ── Outer luxury glow ── */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-20 blur-3xl transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${plan.accentRaw} 0%, transparent 70%)`,
        }}
      />

      {/* ── Main card container ── */}
      <div className="relative flex flex-col justify-between flex-1 overflow-hidden rounded-[2.25rem] border border-white/[0.06] bg-black/40 p-7 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
        
        {/* Shimmer light reflection effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.015] to-transparent" />

        {/* Ambient color wash */}
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[70%] h-[50%] rounded-full opacity-[0.08] blur-3xl transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${plan.accentRaw} 0%, transparent 70%)`,
          }}
        />

        {/* ── Card Header ── */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] transition-colors duration-500"
              style={{ color: plan.accentRaw }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={plan.id + "-lbl"}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.3 }}
                className="text-xs font-bold tracking-wider uppercase text-white/90"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-0.5"
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
              <span className="font-mono text-[7px] font-bold uppercase tracking-wider text-white/50">
                {plan.status}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Split Center Layout ── */}
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-6 my-auto items-center relative z-10">
          
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
                      className="mt-3 mr-0.5 font-black leading-none"
                      style={{
                        fontFamily: "var(--font-calsans)",
                        fontSize: 24,
                        color: plan.accentRaw,
                      }}
                    >
                      ₹
                    </span>
                  )}
                  <span
                    className="font-extrabold leading-none tracking-tighter text-white"
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: plan.price.length > 4 ? 54 : 64,
                      lineHeight: 1,
                    }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="self-end mb-3 ml-2 text-xs font-semibold text-white/20">
                      {plan.period}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">
                    {plan.credits}
                  </span>
                  <span className="font-mono text-[8.5px] font-bold uppercase tracking-wider transition-colors duration-500" style={{ color: plan.accent }}>
                    {plan.tagline}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Performance Indicators */}
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col gap-3 relative overflow-hidden">
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
                className="space-y-2.5"
              >
                <div>
                  <div className="flex justify-between font-mono text-[7px] uppercase text-white/30 mb-0.5">
                    <span>Render Speed</span>
                    <span style={{ color: plan.accentRaw }}>{plan.performance.speed}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
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
                  <div className="flex justify-between font-mono text-[7px] uppercase text-white/30 mb-0.5">
                    <span>Concurrency</span>
                    <span style={{ color: plan.accentRaw }}>{plan.performance.concurrency}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
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
                  <div className="flex justify-between font-mono text-[7px] uppercase text-white/30 mb-0.5">
                    <span>Max Output</span>
                    <span style={{ color: plan.accentRaw }}>{plan.performance.quality}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
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
        <div className="relative z-10 border-t border-white/[0.05] pt-4 mb-4">
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
                  <Check className="h-2.8 w-2.8 shrink-0" style={{ color: plan.accentRaw }} strokeWidth={2.5} />
                  <span className="font-mono text-[8.5px] tracking-wide text-white/45 truncate">
                    {feature}
                  </span>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>

        {/* ── Switcher Tabs ── */}
        <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-white/[0.01] p-1 relative z-10">
          {PLANS.map((p, i) => {
            const isActive = idx === i;
            return (
              <button
                key={p.id}
                onClick={() => setIdx(i)}
                className="flex-1 py-1.5 rounded-lg text-center outline-none relative transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white/[0.04]"
                    style={{
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className="relative z-10 font-mono text-[8.5px] font-bold uppercase tracking-wider transition-colors duration-300 block"
                  style={{
                    color: isActive ? p.accentRaw : "rgba(255,255,255,0.25)",
                  }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
