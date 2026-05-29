"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { GitBranch, MessageSquare, Rocket, Wand2, CheckCircle2, ChevronRight, Sparkles, ArrowRight, Zap } from "lucide-react";
import { SITE_CONTAINER } from "@/lib/site-layout";

const journey = [
  {
    phase: "PHASE 01",
    title: "Editorial brief",
    desc: "Prompts, creative references, and project briefs live in a single unified ledger, keeping creative intent pristine and resolving threads.",
    Icon: MessageSquare,
    accent: "#7B61FF"
  },
  {
    phase: "PHASE 02",
    title: "Continuous generate",
    desc: "Lightning-fast visual drafts allow you to steer look, style, and fluid transitions without overnight compilation lag.",
    Icon: Wand2,
    accent: "#00D4FF"
  },
  {
    phase: "PHASE 03",
    title: "Multi-branch options",
    desc: "Parallel style directions are labeled, compared, and branched side-by-side, enabling directors to pick options cleanly.",
    Icon: GitBranch,
    accent: "#FF2E9A"
  },
  {
    phase: "PHASE 04",
    title: "Resolved handoff",
    desc: "VFX-ready plates, ProRes Proxies, EXR layers, or dynamic API endpoints slot perfectly into your final finishing suites.",
    Icon: Rocket,
    accent: "#00FFC4"
  }
];

export function WorkflowPageContent() {
  const reduce = useReducedMotion() === true;
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="relative min-h-screen text-white" style={{ background: "var(--deep-black)" }}>
      {/* Cinematic Background Mesh — unified with site theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: "var(--mesh-1)" }} />
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: "var(--mesh-2)" }} />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full blur-[150px]" style={{ background: "var(--mesh-3)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 0%, var(--deep-black) 80%)" }} />
        {/* Refined grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: "linear-gradient(rgba(123,97,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(123,97,255,0.2) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        />
      </div>

      {/* Hero Section — heading on left, consistent with site */}
      <section className="relative overflow-hidden pt-32 pb-20 z-10" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className={`relative ${SITE_CONTAINER}`}>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">

            {/* Left intro copy */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] mb-5"
                style={{
                  borderColor: "rgba(255,46,154,0.3)",
                  background: "rgba(255,46,154,0.05)",
                  color: "#FF2E9A",
                  boxShadow: "0 0 12px rgba(255,46,154,0.15)"
                }}
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: "#FF2E9A" }} />
                Creative Operating Model
              </div>

              <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
                From spark to <br />
                <span className="text-gradient-hero">
                  shipped
                </span>{" "}
                on purpose.
              </h1>

              <p className="max-w-xl text-base sm:text-lg font-light leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
                RUHGEN brings surgical organization to generation. Aligned briefs, branched assets, and verified pipeline exports that resolve tooling friction so your team can focus wholly on the art.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/demo" className="btn-gradient inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white">
                  Launch Free Session
                </Link>
                <Link
                  href="/contact"
                  className="group relative inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold transition-colors hover:text-white"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-muted)"
                  }}
                >
                  Contact Studio Team
                </Link>
              </div>
            </motion.div>

            {/* Right side live milestone tracker widget */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="premium-ring rounded-3xl border p-6 sm:p-8 relative overflow-hidden"
              style={{
                borderColor: "var(--border-subtle)",
                background: "linear-gradient(165deg, var(--glass-elevated), var(--glass))",
                backdropFilter: "blur(24px) saturate(180%)",
                boxShadow: "0 32px 60px -16px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)"
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl" style={{ background: "rgba(255,46,154,0.1)" }} />

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#FF2E9A" }}>
                Active Project Milestones
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3.5 border p-3 rounded-2xl" style={{ background: "var(--glass)", borderColor: "var(--border-subtle)" }}>
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" style={{ filter: "drop-shadow(0 0 8px rgba(74,222,128,0.3))" }} />
                  <div>
                    <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Creative Brief Locked</div>
                    <div className="text-[9px] font-mono" style={{ color: "var(--text-subtle)" }}>AP-East Node Verified</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 border p-3 rounded-2xl" style={{ background: "var(--glass)", borderColor: "var(--border-subtle)" }}>
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" style={{ filter: "drop-shadow(0 0 8px rgba(74,222,128,0.3))" }} />
                  <div>
                    <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Visual Style Branched</div>
                    <div className="text-[9px] font-mono" style={{ color: "var(--text-subtle)" }}>3 distinct styles comparable</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 border p-3 rounded-2xl" style={{ borderColor: "rgba(255,46,154,0.2)", background: "rgba(255,46,154,0.05)" }}>
                  <div className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: "#FF2E9A" }}>
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ background: "#FF2E9A" }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Export Assembly Complete</div>
                    <div className="text-[9px] font-mono" style={{ color: "#FF2E9A" }}>Compiling ProRes proxy...</div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Editorial Timeline journey section — premium redesign */}
      <section className="relative py-24 sm:py-28 z-10" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--rich-black)" }}>
        {/* Ambient light wash */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 20% 0%, var(--mesh-1), transparent 55%), radial-gradient(ellipse 60% 50% at 90% 100%, var(--mesh-2), transparent 50%)" }} />

        <div className={`relative ${SITE_CONTAINER}`}>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.8fr] lg:items-start mb-16 sm:mb-24">
            <div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Surgical Project Handoff
              </h2>
            </div>
            <div>
              <p className="text-sm sm:text-base font-light leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Four resolves segments—each with a crystal-clear pass validation so producers and creative directors maintain pristine control over every deliverable.
              </p>
              <div className="mt-5 h-px w-20" style={{ background: "linear-gradient(90deg, transparent, var(--primary-purple), var(--primary-cyan), transparent)" }} />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {journey.map((j, i) => (
              <motion.article
                key={j.phase}
                initial={reduce ? false : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: reduce ? 0 : i * 0.06, duration: 0.4 }}
                onHoverStart={() => setActiveStep(i)}
                className="premium-ring group rounded-3xl border p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between min-h-[240px] cursor-default"
                style={{
                  borderColor: activeStep === i ? `${j.accent}40` : "var(--border-subtle)",
                  background: activeStep === i
                    ? `linear-gradient(165deg, ${j.accent}08, var(--glass))`
                    : "var(--glass)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  boxShadow: activeStep === i
                    ? `0 20px 50px -20px ${j.accent}30, inset 0 1px 0 rgba(255,255,255,0.06)`
                    : "0 4px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
                }}
              >
                <div
                  className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-20 group-hover:opacity-50 transition-opacity duration-500"
                  style={{ backgroundColor: j.accent }}
                />

                <div>
                  <div className="flex justify-between items-center mb-5">
                    <span
                      className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] border rounded-full px-2.5 py-0.5"
                      style={{ color: j.accent, borderColor: `${j.accent}30`, background: `${j.accent}08` }}
                    >
                      {j.phase}
                    </span>
                    <j.Icon className="h-4.5 w-4.5" strokeWidth={1.5} style={{ color: "var(--text-subtle)" }} />
                  </div>

                  <h3 className="font-display text-lg font-bold mb-2 group-hover:text-white transition-colors" style={{ color: "var(--text-primary)" }}>
                    {j.title}
                  </h3>
                  <p className="text-xs leading-relaxed font-light" style={{ color: "var(--text-muted)" }}>
                    {j.desc}
                  </p>
                </div>

                {/* Bottom accent bar */}
                <div className="mt-6 h-[2px] w-full rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: j.accent }}
                    initial={{ width: "0%" }}
                    whileInView={{ width: activeStep === i ? "100%" : "30%" }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/demo" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: "#FF2E9A" }}>
              Try a dynamic session in the demo
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Rollout CTA — premium glassmorphism */}
      <section className="relative py-24 z-10" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 55% at 50% 50%, var(--mesh-1), transparent 60%)" }} />

        <div className={SITE_CONTAINER}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[1.5rem] border p-8 sm:p-12"
            style={{
              borderColor: "var(--border-subtle)",
              background: "linear-gradient(135deg, rgba(123,97,255,0.12), rgba(0,212,255,0.08), rgba(255,46,154,0.06))",
              backdropFilter: "blur(24px) saturate(180%)",
              boxShadow: "0 32px 80px -24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: "radial-gradient(ellipse 70% 60% at 100% 0%, rgba(123,97,255,0.3), transparent 55%), radial-gradient(ellipse 50% 50% at 0% 100%, rgba(0,212,255,0.2), transparent 50%)" }} />

            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="text-center lg:text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: "var(--text-subtle)" }}>
                  Enterprise Ready
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                  SSO, Audit Trails, and System Automation?
                </h2>
                <p className="max-w-lg mx-auto lg:mx-0 text-sm sm:text-base font-light" style={{ color: "var(--text-muted)" }}>
                  Start with pristine workflows and easily scale into custom pipelines when professional deliverables demand it.
                </p>
              </div>
              <div className="flex justify-center lg:justify-end">
                <Link
                  href="/contact"
                  className="btn-gradient inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-8 text-sm font-semibold text-white sm:w-auto"
                >
                  Plan a Studio Rollout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
