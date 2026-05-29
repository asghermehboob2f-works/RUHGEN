"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Cable, Layers3, Shield, Cpu, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { SITE_CONTAINER } from "@/lib/site-layout";

// Custom tool config with color accents for the stack strip
const toolsList = [
  { name: "Unreal Engine", color: "#FF9900" },
  { name: "Blender", color: "#E87D0D" },
  { name: "After Effects", color: "#CF9BFF" },
  { name: "Figma", color: "#F24E1E" },
  { name: "DaVinci Resolve", color: "#00C4FF" },
  { name: "Houdini", color: "#FF6100" },
  { name: "Unity", color: "#FFFFFF" },
  { name: "Photoshop", color: "#31A8FF" },
  { name: "Nuke", color: "#F92672" },
  { name: "Webhooks & API", color: "#00FFC4" }
];

export function FeaturesPageContent() {
  const reduce = useReducedMotion() === true;
  const [activeMode, setActiveMode] = useState<"exploration" | "delivery">("exploration");
  const [exportStep, setExportStep] = useState<"idle" | "compiling" | "completed">("idle");

  const runSimulation = () => {
    if (exportStep !== "idle") return;
    setExportStep("compiling");
    setTimeout(() => {
      setExportStep("completed");
      setTimeout(() => {
        setExportStep("idle");
      }, 3000);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen text-white" style={{ background: "var(--deep-black)" }}>
      {/* Decorative Cinematic Background Mesh — site-consistent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: "var(--mesh-1)" }} />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: "var(--mesh-2)" }} />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] rounded-full blur-[150px]" style={{ background: "var(--mesh-3)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 0%, var(--deep-black) 80%)" }} />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />
      </div>

      {/* Hero Section — heading on left */}
      <section className="relative pt-32 pb-20 overflow-hidden z-10" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className={`${SITE_CONTAINER}`}>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] mb-5"
                style={{
                  borderColor: "rgba(123,97,255,0.3)",
                  background: "rgba(123,97,255,0.05)",
                  color: "#00D4FF",
                  boxShadow: "0 0 15px rgba(123,97,255,0.15)"
                }}
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Next-Gen Creative Engine
              </div>

              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
                Everything to go from <br className="hidden sm:inline" />
                <span className="text-gradient-hero">
                  prompt
                </span>{" "}
                to{" "}
                <span className="text-gradient-hero">
                  master
                </span>
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed font-light mb-8" style={{ color: "var(--text-muted)" }}>
                A high-fidelity pipeline for enterprise graphics, dynamic visual workflows, and resolution-agnostic assets—engineered to scale far beyond quick experiments.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/demo" className="btn-gradient group relative inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white">
                  Try the Demo
                  <ChevronRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/platform"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold transition-colors hover:text-white"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                    background: "var(--glass)"
                  }}
                >
                  See Infrastructure
                </Link>
              </div>
            </motion.div>

            {/* Right side decorative element */}
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="hidden lg:flex items-center justify-center relative"
            >
              <div className="relative w-72 h-72">
                <div className="absolute inset-0 rounded-full blur-[60px] opacity-40" style={{ background: "radial-gradient(circle, rgba(123,97,255,0.4), rgba(0,212,255,0.2), transparent)" }} />
                <div className="absolute inset-4 rounded-full border border-[#7B61FF]/20" />
                <div className="absolute inset-10 rounded-full border border-[#00D4FF]/15" />
                <div className="absolute inset-16 rounded-full border border-[#FF2E9A]/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl border flex items-center justify-center" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", backdropFilter: "blur(20px)", boxShadow: "0 0 40px rgba(123,97,255,0.3)" }}>
                    <Sparkles className="w-8 h-8 text-[#7B61FF]" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pipeline Strip / Integration Ecosystem */}
      <section className="relative py-12 z-10" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--rich-black)" }}>
        <div className={SITE_CONTAINER}>
          <div className="flex flex-col items-center gap-6 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "#7B61FF" }}>
                Pipeline Integration
              </p>
              <h2 className="font-display mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Native Compatibility & Exports
              </h2>
            </div>

            <div className="flex max-w-4xl flex-wrap justify-center gap-2.5">
              {toolsList.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all hover:text-white"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-muted)"
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: t.color,
                      boxShadow: `0 0 8px ${t.color}`
                    }}
                  />
                  {t.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Interactive Bento Section */}
      <section className="relative py-20 sm:py-28 z-10" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 30% 20%, var(--mesh-1), transparent 55%)" }} />

        <div className={SITE_CONTAINER}>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.8fr] lg:items-start mb-16 sm:mb-24">
            <div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Dynamic Studio Capabilities
              </h2>
            </div>
            <div>
              <p className="font-light" style={{ color: "var(--text-muted)" }}>
                Real-time workspace modes, production-grade output filters, and granular team policies resolved in one resolving handoff.
              </p>
              <div className="mt-5 h-px w-20" style={{ background: "linear-gradient(90deg, transparent, var(--primary-purple), var(--primary-cyan), transparent)" }} />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Bento Card 1: Exploration vs Delivery Modes */}
            <div className="lg:col-span-1 premium-ring rounded-3xl border p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group"
              style={{
                borderColor: "var(--border-subtle)",
                background: "linear-gradient(165deg, var(--glass-elevated), var(--glass))",
                backdropFilter: "blur(24px) saturate(180%)"
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(123,97,255,0.1)" }} />

              <div>
                <div className="h-11 w-11 rounded-xl border flex items-center justify-center mb-6" style={{ borderColor: "rgba(123,97,255,0.3)", background: "rgba(123,97,255,0.1)" }}>
                  <Layers3 className="w-5.5 h-5.5 text-[#7B61FF]" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                  Modes that match the job
                </h3>
                <p className="text-sm leading-relaxed mb-6 font-light" style={{ color: "var(--text-muted)" }}>
                  Tailor rendering engines to your immediate intent. Shift seamlessly between zero-latency layout exploration and high-fidelity product handoff.
                </p>
              </div>

              {/* Interactive Widget */}
              <div className="rounded-2xl border p-4 relative overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "rgba(0,0,0,0.3)" }}>
                <div className="flex gap-2 mb-4 p-1 rounded-xl" style={{ background: "var(--glass)", border: "1px solid var(--border-subtle)" }}>
                  <button
                    onClick={() => setActiveMode("exploration")}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      activeMode === "exploration"
                        ? "bg-[#7B61FF] text-white shadow-md shadow-[#7B61FF]/20"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Exploration
                  </button>
                  <button
                    onClick={() => setActiveMode("delivery")}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      activeMode === "delivery"
                        ? "bg-[#00D4FF] text-black shadow-md shadow-[#00D4FF]/20"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Delivery
                  </button>
                </div>

                <div className="space-y-3 font-mono text-[11px]">
                  <div className="flex justify-between items-center">
                    <span style={{ color: "var(--text-subtle)" }}>Latency:</span>
                    <span className={activeMode === "exploration" ? "text-green-400" : "text-yellow-400"}>
                      {activeMode === "exploration" ? "12ms (Instant)" : "850ms (Deep)"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: "var(--text-subtle)" }}>Model Depth:</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {activeMode === "exploration" ? "Lightweight Draft" : "Ultra 32-bit float"}
                    </span>
                  </div>
                  <div className="space-y-1 pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <div className="flex justify-between text-[9px]" style={{ color: "var(--text-subtle)" }}>
                      <span>EXPLORATION LATENCY</span>
                      <span>{activeMode === "exploration" ? "Minimal" : "Standard"}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--glass)" }}>
                      <motion.div
                        className="h-full bg-[#7B61FF]"
                        animate={{ width: activeMode === "exploration" ? "15%" : "85%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Interactive Pipeline Handoff */}
            <div className="lg:col-span-1 premium-ring rounded-3xl border p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group"
              style={{
                borderColor: "var(--border-subtle)",
                background: "linear-gradient(165deg, var(--glass-elevated), var(--glass))",
                backdropFilter: "blur(24px) saturate(180%)"
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,212,255,0.1)" }} />

              <div>
                <div className="h-11 w-11 rounded-xl border flex items-center justify-center mb-6" style={{ borderColor: "rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.1)" }}>
                  <Cable className="w-5.5 h-5.5 text-[#00D4FF]" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                  Pipeline handoff
                </h3>
                <p className="text-sm leading-relaxed mb-6 font-light" style={{ color: "var(--text-muted)" }}>
                  Exports and metadata bundles structured directly for professional editors, Nuke composites, and VFX studios.
                </p>
              </div>

              {/* Interactive Widget: Export Engine Simulation */}
              <div className="rounded-2xl border p-4 relative overflow-hidden flex flex-col gap-3" style={{ borderColor: "var(--border-subtle)", background: "rgba(0,0,0,0.3)" }}>
                <div className="flex items-center justify-between text-[10px] font-mono pb-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)" }}>PIPELINE EXPORT</span>
                  <span className="text-[#00D4FF] uppercase tracking-wider font-bold">
                    {exportStep === "idle" && "Ready"}
                    {exportStep === "compiling" && "Assembling EXR..."}
                    {exportStep === "completed" && "Completed!"}
                  </span>
                </div>

                <div className="relative h-12 border rounded-xl flex items-center px-3 overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
                  {exportStep === "compiling" && (
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: "rgba(0,212,255,0.05)" }}
                      animate={{ opacity: [0.2, 0.6, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                  <div className="flex items-center gap-2.5 z-10 w-full">
                    <Cpu className={`w-4 h-4 ${exportStep === "compiling" ? "animate-spin text-[#00D4FF]" : ""}`} style={{ color: exportStep === "compiling" ? undefined : "var(--text-muted)" }} />
                    <div className="flex-1">
                      <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>hero_sequence_v4.exr</div>
                      <div className="text-[8px] font-mono" style={{ color: "var(--text-subtle)" }}>EXR Layers · Deep Data · ProRes 4444</div>
                    </div>
                    {exportStep === "completed" && (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                  </div>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={exportStep !== "idle"}
                  className="w-full py-2 border rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 hover:text-white"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-muted)"
                  }}
                >
                  {exportStep === "idle" && "Trigger Build Pipeline"}
                  {exportStep === "compiling" && "Packaging Bundles..."}
                  {exportStep === "completed" && "Done · Syncing to Storage"}
                </button>
              </div>
            </div>

            {/* Bento Card 3: Enterprise Workspace Guardrails */}
            <div className="lg:col-span-1 premium-ring rounded-3xl border p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group"
              style={{
                borderColor: "var(--border-subtle)",
                background: "linear-gradient(165deg, var(--glass-elevated), var(--glass))",
                backdropFilter: "blur(24px) saturate(180%)"
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(255,46,154,0.1)" }} />

              <div>
                <div className="h-11 w-11 rounded-xl border flex items-center justify-center mb-6" style={{ borderColor: "rgba(255,46,154,0.3)", background: "rgba(255,46,154,0.1)" }}>
                  <Shield className="w-5.5 h-5.5 text-[#FF2E9A]" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                  Guardrails by design
                </h3>
                <p className="text-sm leading-relaxed mb-6 font-light" style={{ color: "var(--text-muted)" }}>
                  Govern access, manage asset licenses, and secure review-safe workflows across enterprise nodes.
                </p>
              </div>

              {/* Interactive Widget: Guardrails Security status */}
              <div className="rounded-2xl border p-4 relative overflow-hidden flex flex-col gap-2.5" style={{ borderColor: "var(--border-subtle)", background: "rgba(0,0,0,0.3)" }}>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span style={{ color: "var(--text-muted)" }}>POLICY MATRIX</span>
                  <span className="text-[#FF2E9A] uppercase tracking-wider font-bold">Secure Node</span>
                </div>

                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex items-center justify-between border p-2 rounded-xl" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
                    <span style={{ color: "var(--text-muted)" }}>1. Brand Guardrails</span>
                    <span className="text-xs text-green-400 font-bold">Active</span>
                  </div>
                  <div className="flex items-center justify-between border p-2 rounded-xl" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
                    <span style={{ color: "var(--text-muted)" }}>2. Shared Asset Library</span>
                    <span className="text-xs text-green-400 font-bold">Synced</span>
                  </div>
                  <div className="flex items-center justify-between border p-2 rounded-xl" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
                    <span style={{ color: "var(--text-muted)" }}>3. Workspace Security</span>
                    <span className="text-xs text-[#FF2E9A] font-bold">Locked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
