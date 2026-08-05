"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Server, Radio, ChevronRight, Activity, Terminal, ArrowRight, Sparkles } from "lucide-react";
import { BentoHighlights } from "@/components/BentoHighlights";
import { SecurityAndGuardrails } from "@/components/SecurityAndGuardrails";
import { SITE_CONTAINER } from "@/lib/site-layout";

const nodes = [
  { name: "Seoul GPU Node 09", region: "AP-East", latency: "14ms", status: "Active" },
  { name: "Frankfurt GPU Node 04", region: "EU-Central", latency: "28ms", status: "Active" },
  { name: "Oregon GPU Node 12", region: "US-West", latency: "19ms", status: "Active" }
];

export function PlatformPageContent() {
  const reduce = useReducedMotion() === true;
  const [currentNode, setCurrentNode] = useState(0);
  const [schedulerStep, setSchedulerStep] = useState(0);

  // Cycle through nodes to simulate global edge scheduling
  useEffect(() => {
    const nodeInterval = setInterval(() => {
      setCurrentNode((prev) => (prev + 1) % nodes.length);
    }, 4000);

    const stepInterval = setInterval(() => {
      setSchedulerStep((prev) => (prev + 1) % 4);
    }, 1200);

    return () => {
      clearInterval(nodeInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="relative min-h-screen" style={{ background: "var(--deep-black)" }}>
      {/* Cinematic Ambient lighting — site consistent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-70" style={{ background: "var(--mesh-2)" }} />
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-50" style={{ background: "var(--mesh-1)" }} />
        <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] rounded-full blur-[150px] opacity-40" style={{ background: "var(--mesh-3)" }} />
      </div>

      <section className="relative overflow-hidden pt-32 pb-20 z-10" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className={`relative ${SITE_CONTAINER}`}>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">

            {/* Page Header Intro */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] mb-5"
                style={{
                  borderColor: "rgba(0,212,255,0.3)",
                  background: "rgba(0,212,255,0.05)",
                  color: "#00D4FF",
                  boxShadow: "0 0 12px rgba(0,212,255,0.15)"
                }}
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#00D4FF]" />
                Infrastructure Core
              </div>

              <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
                Calm UI. <br />
                <span className="text-gradient-hero">
                  Serious engine.
                </span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg font-light leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
                Edge routing, multi-pass rendering engines, automatic asset governance, and burst capacities—engineered to manage heavy rendering sequences and client handoff cycles flawlessly.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/platform/engineering"
                  className="group relative inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold transition-colors hover:text-white"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                    background: "var(--glass)"
                  }}
                >
                  Engineering Deep Dive
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                {/* Redesigned "Start Free" button — premium with glow */}
                <Link
                  href="/sign-up"
                  className="btn-gradient group relative inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-8 text-sm font-semibold text-white"
                >
                  <Sparkles className="h-4 w-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                  Start Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>

            {/* Interactive Live Telemetry Console (Tracer) */}
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
              {/* Top Bar Decoration */}
              <div className="flex items-center justify-between pb-4 mb-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>EDGE_ROUTER_CONSOLE</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#00D4FF] px-2 py-0.5 rounded" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.2)" }}>
                  <Activity className="w-3 h-3 animate-pulse" />
                  LIVE SIGNAL
                </div>
              </div>

              <div className="space-y-4">
                {/* Node Status Indicator */}
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "rgba(0,0,0,0.3)" }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-subtle)" }}>
                    Target Processing Cluster
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
                      <div>
                        <div className="text-xs font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                          {nodes[currentNode].name}
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          Region: {nodes[currentNode].region} · Latency: {nodes[currentNode].latency}
                        </div>
                      </div>
                    </div>
                    <Server className="w-5 h-5 shrink-0" style={{ color: "var(--text-subtle)" }} />
                  </div>
                </div>

                {/* Simulated Path Trace */}
                <div className="space-y-2 font-mono text-[10px] pl-1.5" style={{ color: "var(--text-muted)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className={`h-1.5 w-1.5 rounded-full transition-colors ${schedulerStep >= 0 ? "bg-[#00D4FF]" : ""}`} style={{ background: schedulerStep >= 0 ? undefined : "var(--border-subtle)" }} />
                    <span style={{ color: schedulerStep === 0 ? "var(--text-primary)" : undefined }}>
                      [0.0s] Client connection initialized near node
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className={`h-1.5 w-1.5 rounded-full transition-colors ${schedulerStep >= 1 ? "bg-[#00D4FF]" : ""}`} style={{ background: schedulerStep >= 1 ? undefined : "var(--border-subtle)" }} />
                    <span style={{ color: schedulerStep === 1 ? "var(--text-primary)" : undefined }}>
                      [0.2s] Multi-pass compile scheduled: <span className="text-[#7B61FF]">Normal / Depth</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className={`h-1.5 w-1.5 rounded-full transition-colors ${schedulerStep >= 2 ? "bg-[#00D4FF]" : ""}`} style={{ background: schedulerStep >= 2 ? undefined : "var(--border-subtle)" }} />
                    <span style={{ color: schedulerStep === 2 ? "var(--text-primary)" : undefined }}>
                      [0.8s] Syncing security keys & policy allowlists
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className={`h-1.5 w-1.5 rounded-full transition-colors ${schedulerStep >= 3 ? "bg-green-400" : ""}`} style={{ background: schedulerStep >= 3 ? undefined : "var(--border-subtle)", boxShadow: schedulerStep >= 3 ? "0 0 8px rgba(74,222,128,0.5)" : undefined }} />
                    <span style={{ color: schedulerStep === 3 ? "var(--text-primary)" : undefined }}>
                      [1.2s] Output handoff packaging complete
                    </span>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="h-1 w-full rounded-full overflow-hidden mt-2" style={{ background: "var(--glass)" }}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00D4FF] to-[#7B61FF]"
                    animate={{ width: `${(schedulerStep + 1) * 25}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Grid Highlights component */}
      <BentoHighlights hideTitle={false} />

      {/* Security and policy compliance panel */}
      <SecurityAndGuardrails />

      {/* CTA Footer segment — enhanced premium */}
      <section className="relative py-24 z-10" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 55% at 50% 50%, var(--mesh-2), transparent 60%)" }} />

        <div className={SITE_CONTAINER}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[1.5rem] border p-8 sm:p-12"
            style={{
              borderColor: "var(--border-subtle)",
              background: "linear-gradient(135deg, rgba(0,212,255,0.10), rgba(123,97,255,0.08), rgba(255,46,154,0.06))",
              backdropFilter: "blur(24px) saturate(180%)",
              boxShadow: "0 32px 80px -24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: "radial-gradient(ellipse 70% 60% at 100% 0%, rgba(0,212,255,0.3), transparent 55%), radial-gradient(ellipse 50% 50% at 0% 100%, rgba(123,97,255,0.2), transparent 50%)" }} />

            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="text-center lg:text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: "var(--text-subtle)" }}>
                  Enterprise Ready
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                  Need queue visibility and SLAs?
                </h2>
                <p className="max-w-lg mx-auto lg:mx-0 text-sm sm:text-base font-light" style={{ color: "var(--text-muted)" }}>
                  Add our enterprise operations layer: real-time pipeline signals, custom system webhooks, and secure dedicated GPU nodes.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/contact"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border px-8 text-sm font-semibold transition-colors hover:text-white sm:w-auto"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-muted)"
                  }}
                >
                  Talk to us
                </Link>
                <Link
                  href="/pricing"
                  className="btn-gradient inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-8 text-sm font-semibold text-white sm:w-auto"
                >
                  View Pricing
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
