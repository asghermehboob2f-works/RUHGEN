"use client";

import { motion } from "framer-motion";
import { Cpu, Zap, Signal, Compass } from "lucide-react";
import type { StatItem } from "@/backend/site-content/types";

const defaultStats: StatItem[] = [
  { 
    id: "stat-1",
    label: "Generations delivered", 
    value: "12.4M+", 
    sub: "and counting",
    glowColor: "rgba(123, 97, 255, 0.05)",
    textColor: "from-brand-purple to-white",
    accentColor: "#7B61FF",
    pct: 88,
  },
  { 
    id: "stat-2",
    label: "Median time to first frame", 
    value: "4.2s", 
    sub: "Pro tier, global edge",
    glowColor: "rgba(0, 212, 255, 0.05)",
    textColor: "from-brand-cyan to-white",
    accentColor: "#00D4FF",
    pct: 95,
  },
  { 
    id: "stat-3",
    label: "Creators & studios", 
    value: "84K+", 
    sub: "in 120+ countries",
    glowColor: "rgba(255, 46, 154, 0.05)",
    textColor: "from-brand-pink to-white",
    accentColor: "#FF2E9A",
    pct: 74,
  },
  { 
    id: "stat-4",
    label: "Peak output resolution", 
    value: "8K", 
    sub: "HDR-ready exports",
    glowColor: "rgba(123, 97, 255, 0.05)",
    textColor: "from-brand-purple via-white to-brand-cyan",
    accentColor: "#7B61FF",
    pct: 99,
  },
];

const iconMap = [Cpu, Zap, Signal, Compass];

export function StatsStrip({ stats }: { stats?: StatItem[] }) {
  const activeStats = stats && stats.length > 0 ? stats : defaultStats;

  return (
    <section
      className="relative border-y overflow-hidden py-10 md:py-12"
      style={{
        borderColor: "var(--border-subtle)",
        background: "#050505",
      }}
    >
      {/* Premium background design guidelines */}
      <div 
        className="absolute inset-0 opacity-[0.008] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "12.5%",
        }}
      />
      
      <div className="app-grain absolute inset-0 opacity-[0.02]" />

      <div className="mx-auto max-w-full px-6 sm:px-12 lg:px-20 xl:px-32 relative z-10">
        
        {/* Dynamic status line top header */}
        <div className="flex items-center gap-4 mb-6 text-[8.5px] font-mono tracking-[0.2em] text-white/20 uppercase justify-between lg:justify-start">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-ping" />
            <span>NODE STATUS: STREAMING LIVE</span>
          </div>
          <div className="hidden lg:block h-px flex-1 bg-white/5 mx-6" />
          <span>ENGINE METRICS V3.14</span>
        </div>

        {/* Enhanced Grid with modern responsive stacking & divider borders */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8 lg:divide-x divide-white/[0.04]">
          {activeStats.map((s, i) => {
            const IconComponent = iconMap[i % iconMap.length];
            return (
              <motion.div
                key={s.id || s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
                className="relative group px-2 sm:px-4 lg:px-5 first:pl-0 last:pr-0 flex flex-col justify-between rounded-xl"
              >
                {/* Subtle dynamic background hover tint */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
                  style={{
                    background: `radial-gradient(circle at center, ${s.glowColor || 'rgba(255,255,255,0.01)'}, transparent 80%)`,
                  }}
                />

                <div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[6.5px] sm:text-[8px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.25em] text-white/30 transition-colors duration-500 group-hover:text-white/50 leading-tight">
                      {s.label}
                    </p>
                    <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/10 group-hover:text-white/25 transition-colors duration-500 shrink-0" />
                  </div>
                  
                  {/* Bold Wide Premium Numeric Scale */}
                  <p className="font-display mt-1 sm:mt-2 text-lg sm:text-2.5xl lg:text-3.5xl font-extrabold tracking-[-0.03em] transition-transform duration-700 group-hover:translate-x-0.5">
                    <span className={`bg-gradient-to-b ${s.textColor || 'from-white to-white/70'} bg-clip-text text-transparent filter drop-shadow-sm`}>
                      {s.value}
                    </span>
                  </p>
                </div>

                {/* Segmented Level Indicators - Sleek and Uniform (Monochrome) */}
                <div className="mt-2 sm:mt-3 w-full">
                  <div className="flex justify-between items-center text-[5.5px] sm:text-[6.5px] font-mono tracking-widest text-white/20 mb-1 uppercase">
                    <span>Capacity Index</span>
                    <span className="text-white/35">{s.pct}%</span>
                  </div>
                  {/* 12 Segment level blocks */}
                  <div className="h-[1.5px] sm:h-[2px] w-full relative flex gap-[1.5px] sm:gap-[2px] overflow-hidden rounded-full">
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        className="h-full flex-1 bg-white/5 transition-colors duration-500 rounded-full"
                        initial={{ opacity: 0.1 }}
                        whileInView={{
                          opacity: idx * 8.3 < s.pct ? 0.7 : 0.1,
                          backgroundColor: idx * 8.3 < s.pct ? (s.accentColor || '#ffffff') : "rgba(255, 255, 255, 0.05)",
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: idx * 0.03 }}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-1.5 sm:mt-2.5 text-[6.5px] sm:text-[7.5px] font-bold text-white/10 tracking-[0.12em] sm:tracking-[0.2em] uppercase transition-colors duration-500 leading-none">
                  {s.sub}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
