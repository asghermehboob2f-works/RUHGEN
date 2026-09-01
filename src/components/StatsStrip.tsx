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
      className="relative border-y overflow-hidden py-6 sm:py-7"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--deep-black)",
      }}
    >
      {/* Premium background design guidelines */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.01] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, var(--text-primary) 1px, transparent 1px)",
          backgroundSize: "12.5%",
        }}
      />
      
      <div className="app-grain absolute inset-0 opacity-[0.02]" />

      <div className="mx-auto max-w-full px-6 sm:px-12 lg:px-20 xl:px-32 relative z-10">
        {/* Enhanced Grid with modern responsive stacking & divider borders */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-5 sm:gap-y-6 lg:divide-x divide-border/30">
          {activeStats.map((s, i) => {
            const IconComponent = iconMap[i % iconMap.length];
            return (
              <motion.div
                key={s.id || s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className="relative group px-2 sm:px-4 lg:px-5 first:pl-0 last:pr-0 flex flex-col justify-between rounded-xl"
              >
                {/* Subtle dynamic background hover tint */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
                  style={{
                    background: `radial-gradient(circle at center, ${s.glowColor || 'var(--glass)'}, transparent 80%)`,
                  }}
                />

                <div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground/80 transition-colors duration-500 group-hover:text-muted-foreground leading-snug">
                      {s.label}
                    </p>
                    <IconComponent className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors duration-500 shrink-0" />
                  </div>
                  
                  {/* Crisp Professional Numeric Value */}
                  <p className="font-display mt-1 text-xl sm:text-2xl lg:text-3xl font-bold tracking-normal transition-transform duration-500 group-hover:translate-x-0.5 text-foreground leading-tight">
                    <span>
                      {s.value}
                    </span>
                  </p>
                </div>

                {/* Segmented Level Indicators - Sleek and Uniform */}
                <div className="mt-2.5 sm:mt-3 w-full">
                  <div className="flex justify-between items-center text-[8.5px] sm:text-[9px] font-mono tracking-wider text-muted-foreground/75 mb-1 uppercase">
                    <span className="text-muted-foreground/60">Capacity Index</span>
                    <span className="text-muted-foreground/90 font-semibold">{s.pct}%</span>
                  </div>
                  {/* 14 Segment level blocks */}
                  <div className="h-[2px] w-full relative flex gap-[2px] overflow-hidden rounded-full">
                    {Array.from({ length: 14 }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        className="h-full flex-1 bg-border/60 transition-colors duration-500 rounded-full"
                        initial={{ opacity: 0.1 }}
                        whileInView={{
                          opacity: idx * 7.14 < s.pct ? 0.85 : 0.12,
                          backgroundColor: idx * 7.14 < s.pct ? (s.accentColor || 'var(--text-primary)') : "var(--border-subtle)",
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: idx * 0.02 }}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-1.5 text-[9px] sm:text-[9.5px] font-mono text-muted-foreground/65 tracking-[0.08em] uppercase transition-colors duration-500 leading-normal">
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
