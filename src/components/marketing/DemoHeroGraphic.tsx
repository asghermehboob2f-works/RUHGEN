"use client";

import { Fragment, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

type DemoHeroGraphicProps = {
  className?: string;
};

const steps = [
  { n: "01", label: "Compose", accent: "var(--primary-purple)", desc: "Build layouts" },
  { n: "02", label: "Resolve", accent: "var(--primary-cyan)", desc: "Render details" },
  { n: "03", label: "Handoff", accent: "var(--accent-pink)", desc: "Export masters" },
] as const;

export function DemoHeroGraphic({ className = "" }: DemoHeroGraphicProps) {
  const reduce = useReducedMotion() === true;
  const [pipelineStep, setPipelineStep] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setPipelineStep((prev) => (prev + 1) % 3);
    }, 2000);

    return () => {
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* Outer Glow behind the chassis */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--primary-purple)]/10 via-transparent to-[var(--primary-cyan)]/15 opacity-80 blur-3xl rounded-[2.5rem]" />

      {/* Chassis: premium dual-border glass bezel + deep well */}
      <div
        className="relative overflow-hidden rounded-[1.75rem] p-[1.5px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, rgba(123,97,255,0.18) 100%)",
        }}
      >
        <div
          className="relative min-h-[290px] sm:min-h-[320px] overflow-hidden rounded-[1.6875rem] flex flex-col justify-between"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 10% -10%, rgba(123,97,255,0.16), transparent 60%), radial-gradient(ellipse 70% 55% at 105% 110%, rgba(0,212,255,0.12), transparent 55%), radial-gradient(ellipse 45% 40% at 85% 15%, rgba(255,46,154,0.08), transparent 45%), var(--deep-black)",
          }}
        >
          {/* Subtle noise grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />

          {/* Slow aurora field */}
          {!reduce && (
            <motion.div
              className="pointer-events-none absolute -left-1/2 -top-1/2 h-[200%] w-[200%] opacity-[0.4]"
              style={{
                background:
                  "conic-gradient(from 180deg at 50% 50%, rgba(123,97,255,0.15) 0deg, transparent 55deg, rgba(0,212,255,0.1) 120deg, transparent 200deg, rgba(255,46,154,0.08) 280deg, transparent 360deg)",
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
              aria-hidden
            />
          )}

          {/* High-end Vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: "inset 0 0 100px 30px rgba(0,0,0,0.65)",
            }}
            aria-hidden
          />

          {/* Creative Registration Corners */}
          <svg className="pointer-events-none absolute left-4 top-4 h-6 w-6 text-white/30" viewBox="0 0 32 32" fill="none" aria-hidden>
            <path d="M1 12V3a2 2 0 012-2h9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <svg
            className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 text-white/30"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden
          >
            <path d="M31 20v9a2 2 0 01-2 2h-9" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          <div className="relative z-[1] flex h-full flex-col justify-between p-4 sm:p-5 text-white flex-1">
            
            {/* Minimalist Floating Prompt Bar */}
            <div className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-2.5 max-w-[80%]">
                <svg className="h-4 w-4 text-[#00D4FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
                </svg>
                <span className="font-mono text-[10px] text-white/90 font-medium tracking-wide">
                  {pipelineStep === 0 && "PROMPT: \"Initializing latent grid layout...\""}
                  {pipelineStep === 1 && "PROMPT: \"Generating high-fidelity crystal sculpture...\""}
                  {pipelineStep === 2 && "PROMPT: \"Compiling output asset master package...\""}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[#7B61FF]/15 border border-[#7B61FF]/30 px-2.5 py-0.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                <span className="font-mono text-[7px] font-bold uppercase tracking-wider text-[#00D4FF]">active</span>
              </div>
            </div>

            {/* Interactive Glassmorphic Studio Canvas (Centerpiece visual) */}
            <div className="relative my-3 flex flex-1 items-center justify-center min-h-[120px]">
              <div className="relative w-full max-w-[420px] rounded-xl border border-white/10 bg-white/[0.01] backdrop-blur-md overflow-hidden shadow-2xl">
                {/* Sub-Window Header */}
                <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
                  </div>
                  <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/40 select-none truncate">RUHGEN_CORE_RENDER // WORKSPACE</span>
                  <div className="w-10 shrink-0" />
                </div>

                {/* Sub-Window Content Area */}
                <div className="relative h-24 flex items-center justify-center bg-black/45 overflow-hidden">
                  
                  {/* Subtle compiler crosshair grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:10px_10px]" />
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="h-10 w-10 border border-white/10 rounded-full flex items-center justify-center">
                      <div className="h-1 w-1 bg-white/20 rounded-full" />
                    </div>
                    <div className="absolute w-14 h-[0.5px] bg-white/10" />
                    <div className="absolute h-14 w-[0.5px] bg-white/10" />
                  </div>

                  {/* Core High-End Glassmorphic Star Sculpture */}
                  <div className="relative flex items-center justify-center">
                    {/* Ambient backlight glow */}
                    <motion.div 
                      className="absolute h-16 w-16 rounded-full bg-gradient-to-tr from-[var(--primary-purple)] via-[var(--primary-cyan)] to-[var(--accent-pink)] opacity-35 blur-xl"
                      animate={reduce ? {} : {
                        scale: [1, 1.25, 1],
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* High-fidelity geometric SVG overlay */}
                    <motion.svg 
                      className="h-14 w-14 relative z-10" 
                      viewBox="0 0 100 100"
                      animate={reduce ? {} : {
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <defs>
                        <linearGradient id="crystal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7B61FF" />
                          <stop offset="50%" stopColor="#00D4FF" />
                          <stop offset="100%" stopColor="#FF2E9A" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M 50,10 L 58,42 L 90,50 L 58,58 L 50,90 L 42,58 L 10,50 L 42,42 Z" 
                        fill="none" 
                        stroke="url(#crystal-grad)" 
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M 50,22 L 55,45 L 78,50 L 55,55 L 50,78 L 45,55 L 22,50 L 45,45 Z" 
                        fill="none" 
                        stroke="url(#crystal-grad)" 
                        strokeWidth="0.75"
                        strokeDasharray="2, 2"
                      />
                      <circle cx="50" cy="50" r="4.5" fill="white" className="shadow-[0_0_12px_white]" />
                    </motion.svg>
                  </div>

                  {/* Corner indicators */}
                  <div className="absolute top-2 left-3.5 font-mono text-[7px] text-white/20 select-none tracking-wider">
                    GRID_MESH: OK
                  </div>
                  <div className="absolute top-2 right-3.5 font-mono text-[7px] text-[#00D4FF] select-none tracking-wider font-bold">
                    {pipelineStep === 0 && "STATUS: COMPOSE"}
                    {pipelineStep === 1 && "STATUS: RESOLVE"}
                    {pipelineStep === 2 && "STATUS: COMPILING"}
                  </div>
                  
                  <div className="absolute bottom-2 left-3.5 font-mono text-[7px] text-white/20 select-none">
                    ITERATION: 08
                  </div>
                  <div className="absolute bottom-2 right-3.5 font-mono text-[7px] text-white/20 select-none">
                    FPS: 60.0
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Step Navigation Footer Row */}
            <div
              className="flex flex-row items-center justify-between border-t pt-4"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="flex flex-row flex-nowrap items-center">
                {steps.map((s, i) => {
                  const isActive = pipelineStep === i;
                  return (
                    <Fragment key={s.n}>
                      {i > 0 && (
                        <span className="mx-1 sm:mx-2 font-mono text-[9px] text-white/10 select-none" aria-hidden>
                          ·
                        </span>
                      )}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <span 
                          className="font-mono text-[8px] sm:text-[9px] tabular-nums font-bold border rounded px-1 py-0.5 transition-all duration-300"
                          style={{ 
                            borderColor: isActive ? s.accent : "rgba(255,255,255,0.08)", 
                            background: isActive ? `color-mix(in srgb, ${s.accent} 15%, transparent)` : "rgba(255,255,255,0.02)",
                            color: isActive ? s.accent : "var(--text-subtle)"
                          }}
                        >
                          {s.n}
                        </span>
                        <span 
                          className="font-display text-[9.5px] sm:text-xs font-bold tracking-wide transition-colors duration-300" 
                          style={{ color: isActive ? s.accent : "var(--text-muted)" }}
                        >
                          {s.label}
                        </span>
                      </div>
                    </Fragment>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-1.5 font-mono text-[7px] sm:text-[7.5px] uppercase tracking-[0.15em] text-[var(--text-subtle)] shrink-0 pl-2 translate-y-[2px]">
                <span className="inline-flex h-1 w-1 rounded-full bg-[#10B981] animate-pulse" />
                <span className="hidden xs:inline">Live Output</span>
                <span className="xs:hidden">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
