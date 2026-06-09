"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, ShieldCheck } from "lucide-react";

const PLANS = [
  {
    id: "free",
    label: "Free",
    price: "0",
    symbol: false,
    period: "",
    credits: "120 credits",
    tagline: "Core Creative Access",
    status: "On Demand",
    accent: "rgba(255, 255, 255, 0.4)",
    accentRaw: "#ffffff",
    features: ["Standard Models", "Up to 2K Quality", "Community Support"],
  },
  {
    id: "pro",
    label: "Pro",
    price: "499",
    symbol: true,
    period: "/ month",
    credits: "510 credits",
    tagline: "Production Grade",
    status: "Priority Access",
    accent: "#7B61FF",
    accentRaw: "#7B61FF",
    features: ["Advanced Models", "4K Quality", "Priority Queue", "Commercial License"],
  },
  {
    id: "pro_plus",
    label: "Pro Plus",
    price: "999",
    symbol: true,
    period: "/ month",
    credits: "650 credits",
    tagline: "Unrestricted Power",
    status: "Instant Queue",
    accent: "#00D4FF",
    accentRaw: "#00D4FF",
    features: ["Premium Models", "Ultra HD Outputs", "Instant Queue", "API Access"],
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
    features: ["Custom AI Models", "Private Deployments", "API Scaling & SLAs", "Dedicated Manager"],
  },
];

export function PricingHeroGraphic({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion() === true;
  const [idx, setIdx] = useState(1);
  const plan = PLANS[idx];

  // Auto-cycle through plans
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % PLANS.length);
    }, 3800);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className={`relative w-full max-w-[390px] aspect-[4/5] flex flex-col justify-between ${className}`} aria-hidden="true">
      {/* ── Outer luxury glow ── */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-20 blur-3xl transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${plan.accentRaw} 0%, transparent 70%)`,
        }}
      />

      {/* ── Main card container ── */}
      <div className="relative flex flex-col justify-between flex-1 overflow-hidden rounded-[2.25rem] border border-white/[0.06] bg-black/45 p-8 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
        
        {/* Shimmer light reflection effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.015] to-transparent" />

        {/* Ambient color wash */}
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full opacity-[0.08] blur-3xl transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${plan.accentRaw} 0%, transparent 70%)`,
          }}
        />

        {/* ── Card Header ── */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Tier</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={plan.id + "-lbl"}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-bold tracking-tight text-white"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 backdrop-blur-md"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: plan.accentRaw }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: plan.accentRaw }}
                />
              </span>
              <span className="font-mono text-[8px] font-extrabold uppercase tracking-wider text-white/60">
                {plan.status}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Center: Price & Scale ── */}
        <div className="flex flex-col items-center justify-center my-6 relative z-10">
          
          {/* Subtle spinning rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-[180px] h-[180px] rounded-full border border-white/[0.02]" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute w-[200px] h-[200px] rounded-full border border-dashed border-white/[0.04]"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={plan.id + "-pricing"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <div className="flex items-start">
                {plan.symbol && (
                  <span
                    className="mt-3 mr-1 font-black leading-none"
                    style={{
                      fontFamily: "var(--font-calsans)",
                      fontSize: 26,
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
                    fontSize: plan.price.length > 4 ? 64 : 76,
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

              <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                {plan.credits}
              </span>

              <span
                className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors duration-500"
                style={{ color: plan.accent }}
              >
                {plan.tagline}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Core Features ── */}
        <div className="relative z-10 border-t border-white/[0.06] pt-6 mb-6">
          <AnimatePresence mode="wait">
            <motion.ul
              key={plan.id + "-features-list"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-3"
            >
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span
                    className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${plan.accentRaw}10` }}
                  >
                    <Check className="h-2.5 w-2.5" style={{ color: plan.accentRaw }} strokeWidth={3} />
                  </span>
                  <span className="font-mono text-[9.5px] font-medium tracking-wide text-white/50 truncate">
                    {feature}
                  </span>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>

        {/* ── Switcher Tabs ── */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/5 bg-white/[0.01] p-1.5 relative z-10">
          {PLANS.map((p, i) => {
            const isActive = idx === i;
            return (
              <button
                key={p.id}
                onClick={() => setIdx(i)}
                className="flex-1 py-2 rounded-xl text-center outline-none relative transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white/[0.05]"
                    style={{
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span
                  className="relative z-10 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 block"
                  style={{
                    color: isActive ? p.accentRaw : "rgba(255,255,255,0.3)",
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
