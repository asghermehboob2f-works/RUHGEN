"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Cpu, Film, Zap } from "lucide-react";
import type { PillarItem } from "@/backend/site-content/types";

const defaultPillars: PillarItem[] = [
  {
    id: "pil-1",
    title: "Iterate at the speed of thought",
    body: "Tight feedback loops from prompt to pixel—so you stay in flow instead of waiting on renders.",
    accent: "#00D4FF",
    glowColor: "rgba(0, 212, 255, 0.04)",
    cap1: "Core latency: 14ms",
    cap2: "Edge rendering",
  },
  {
    id: "pil-2",
    title: "Cinematic fidelity, production discipline",
    body: "HDR-aware looks, consistent aspect pipelines, and exports that slot into review and finishing.",
    accent: "#7B61FF",
    glowColor: "rgba(123, 97, 255, 0.04)",
    cap1: "10-bit HDR color",
    cap2: "DAM Export Ready",
  },
  {
    id: "pil-3",
    title: "Built for teams, not just tabs",
    body: "Policies, audit trails, and burst capacity when launch week refuses to be predictable.",
    accent: "#FF2E9A",
    glowColor: "rgba(255, 46, 154, 0.04)",
    cap1: "Concurrence: Unlimited",
    cap2: "SLA-backed",
  },
];

const iconMap = [Zap, Film, Cpu];

export function ValueProposition({ pillars }: { pillars?: PillarItem[] }) {
  const reduce = useReducedMotion();
  const activePillars = pillars && pillars.length > 0 ? pillars : defaultPillars;

  return (
    <section
      id="value"
      className="relative scroll-mt-24 overflow-hidden border-y py-16 sm:py-20 md:py-28"
      style={{
        borderColor: "var(--border-subtle)",
        background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(123, 97, 255, 0.02), transparent 70%), var(--deep-black)",
      }}
    >
      {/* Precision grid backdrop (Minimal & Subtle) */}
      <div 
        className="absolute inset-0 opacity-[0.008] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--text-primary) 1px, transparent 1px),
            linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)
          `,
          backgroundSize: "120px 120px",
        }}
      />

      <div className="mx-auto max-w-full px-6 sm:px-12 lg:px-20 xl:px-32 relative z-10">
        
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(5px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Elegant Badge */}
          <div className="relative mb-5 inline-flex items-center justify-center rounded-full border border-border/60 bg-card/10 px-5 py-1.5 backdrop-blur-2xl transition-all duration-500 hover:border-brand-purple/20">
            <span className="text-[8px] font-semibold uppercase tracking-[0.4em] text-muted-foreground/60 ml-[0.4em]">
              Platform Architecture
            </span>
          </div>

          {/* display heading with clean, confident typography */}
          <h2
            className="font-display text-[clamp(2rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground"
          >
            One engine. <br className="md:hidden" />
            <span className="text-foreground">Infinite vision.</span>
          </h2>
          
          <p
            className="mx-auto mt-5 max-w-lg text-xs sm:text-sm leading-relaxed font-normal tracking-wide text-muted-foreground"
          >
            A cohesive creation space backed by high-fidelity infrastructure—so your creative direction leads, and the tooling follows.
          </p>
        </motion.div>

        {/* Pillars Grid with soft roundness and unified brand colors */}
        <div className="mt-12 sm:mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {activePillars.map((p, i) => {
            const IconComponent = iconMap[i % iconMap.length];
            return (
              <motion.article
                key={p.id || p.title}
                initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(2px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: reduce ? 0 : i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="group relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 sm:p-8 backdrop-blur-2xl transition-all duration-700 hover:border-border/80 hover:bg-card/40 flex flex-col justify-between"
              >
                {/* Soft, minimal ambient glow behind cards on hover (Brand integrated) */}
                <div 
                  className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${p.glowColor || 'rgba(255, 255, 255, 0.02)'}, transparent 60%)`,
                  }}
                />

                {/* Dynamic top gradient line that shines on hover (Brand integrated) */}
                <div 
                  className="absolute top-0 inset-x-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(to right, transparent, ${p.accent || '#ffffff'}, transparent)`
                  }}
                />

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    
                    {/* Glowing Iconic Container (Brand integrated) */}
                    <div
                      className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-border/50 bg-card/10 transition-all duration-700 group-hover:border-border"
                    >
                      <IconComponent className="h-5 w-5 transition-colors duration-500" strokeWidth={1.5} style={{ color: p.accent || '#ffffff' }} />
                    </div>
                    
                    {/* BOLD Pillar Title */}
                    <h3
                      className="font-display text-sm font-semibold tracking-tight text-foreground transition-colors duration-500"
                    >
                      {p.title}
                    </h3>
                    
                    {/* Slimmed description text */}
                    <p
                      className="mt-3 text-[11.5px] sm:text-xs leading-relaxed font-normal tracking-wide text-muted-foreground/60 transition-colors duration-500 group-hover:text-muted-foreground"
                    >
                      {p.body}
                    </p>
                  </div>

                  {/* Elegant dynamic capability indicators visible at all times */}
                  <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between text-[8px] font-mono tracking-wider text-muted-foreground/75 transition-colors duration-500 group-hover:text-muted-foreground/90">
                    <span className="uppercase">{p.cap1}</span>
                    <span className="uppercase px-2 py-0.5 rounded border border-border bg-card/20" style={{ borderColor: `${p.accent || '#ffffff'}20`, color: p.accent || '#ffffff' }}>{p.cap2}</span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
