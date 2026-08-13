"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  Sparkles,
  Check,
  Copy,
  SlidersHorizontal,
  Code2,
  ShieldCheck,
  Globe
} from "lucide-react";
import { BentoHighlights } from "@/components/BentoHighlights";
import { SecurityAndGuardrails } from "@/components/SecurityAndGuardrails";
import { SITE_CONTAINER } from "@/lib/site-layout";

const CONFIG_CODE = `// ruhgen.config.ts
import { defineConfig } from "@ruhgen/sdk";

export default defineConfig({
  region: "auto-edge",
  cluster: "h100-sxm5",
  concurrency: 100,
  webhooks: {
    onComplete: "https://api.domain.com/webhooks/ruhgen",
  },
  governance: {
    signedUrls: true,
    retentionDays: 30,
    contentSafety: "strict",
  },
});`;

const CAPABILITIES = [
  {
    title: "Global Edge Routing",
    desc: "Intelligent request dispatching to the nearest available GPU region."
  },
  {
    title: "Asset Governance",
    desc: "Enterprise policy allowlists, signed URLs, and automatic asset retention."
  },
  {
    title: "Event-Driven Webhooks",
    desc: "Real-time callback notifications for generation completion and error handling."
  }
];

export function PlatformPageContent() {
  const reduce = useReducedMotion() === true;
  const [activeTab, setActiveTab] = useState<"config" | "overview">("overview");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CONFIG_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen" style={{ background: "var(--deep-black)" }}>
      {/* Subtle Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-0 right-1/4 w-[600px] h-[500px] rounded-full blur-[140px] opacity-20"
          style={{ background: "radial-gradient(ellipse at center, var(--mesh-2), var(--mesh-1) 50%, transparent 80%)" }}
        />
      </div>

      {/* ── Sleek, Theme-Aware Platform Hero Section ── */}
      <section className="relative overflow-hidden pt-32 pb-24 z-10" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className={`relative ${SITE_CONTAINER}`}>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">

            {/* ── LEFT: Clean, Real Heading & Platform Copy ── */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center"
            >
              {/* Simple Eyebrow Badge */}
              <div
                className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  color: "var(--text-muted)"
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>RUHGEN Platform Infrastructure</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
                Global infrastructure for <br />
                <span className="text-gradient-hero">
                  generative AI.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg font-light leading-relaxed mb-8 max-w-xl" style={{ color: "var(--text-muted)" }}>
                Deploy, scale, and manage high-throughput image and video models across enterprise GPU clusters with built-in governance and edge routing.
              </p>

              {/* Real Platform Capabilities List */}
              <div className="space-y-4 mb-9">
                {CAPABILITIES.map((cap) => (
                  <div key={cap.title} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--glass)",
                        color: "var(--text-muted)"
                      }}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{cap.title}</div>
                      <div className="text-xs font-light mt-0.5" style={{ color: "var(--text-muted)" }}>{cap.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/sign-up"
                  className="btn-gradient group relative inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-7 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95"
                >
                  <Sparkles className="h-4 w-4 opacity-80" />
                  Start Building
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/platform/engineering"
                  className="group relative inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-6 text-sm font-medium transition-colors"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-muted)"
                  }}
                >
                  Documentation
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>

            {/* ── RIGHT: Theme-Aware Sleek & Slim Product Console Card ── */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="rounded-2xl border p-5 sm:p-6 relative overflow-hidden shadow-xl"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass-elevated)",
                backdropFilter: "blur(24px) saturate(180%)",
                boxShadow: "0 24px 60px -16px rgba(0,0,0,0.25)"
              }}
            >
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400/50" />
                  </div>
                  <span className="text-xs font-medium ml-1" style={{ color: "var(--text-muted)" }}>Platform Control Deck</span>
                </div>

                {/* Quiet View Switcher */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg border" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
                  <button
                    onClick={() => setActiveTab("config")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activeTab === "config"
                        ? "bg-emerald-500/15 font-semibold text-emerald-400 border border-emerald-500/20"
                        : "hover:text-foreground text-slate-400"
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Config</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activeTab === "overview"
                        ? "bg-emerald-500/15 font-semibold text-emerald-400 border border-emerald-500/20"
                        : "hover:text-foreground text-slate-400"
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Overview</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Real Configuration Code */}
              {activeTab === "config" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs px-1" style={{ color: "var(--text-muted)" }}>
                    <span className="font-mono text-[11px]">ruhgen.config.ts</span>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-[11px] transition-colors hover:text-emerald-400"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-xl border overflow-x-auto" style={{ background: "var(--rich-black)", borderColor: "var(--border-subtle)" }}>
                    <pre className="font-mono text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      <code>{CONFIG_CODE}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab 2: Authentic Platform Overview Settings */}
              {activeTab === "overview" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ background: "var(--glass)", borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <div>
                        <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Edge Routing Mode</div>
                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Nearest GPU Region</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ background: "var(--glass)", borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <div>
                        <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Security & Allowlist</div>
                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>TLS 1.3 & Signed Delivery</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded border" style={{ color: "var(--text-muted)", borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
                      Enforced
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ background: "var(--glass)", borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-3">
                      <SlidersHorizontal className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <div>
                        <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Concurrency SLA</div>
                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>100 Parallel Requests</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded border" style={{ color: "var(--text-muted)", borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
                      Configured
                    </span>
                  </div>
                </div>
              )}

              {/* Simple Bottom Status Bar */}
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[11px]" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>SDK v4.2 Ready</span>
                </div>
                <span>Enterprise SLA</span>
              </div>

            </motion.div>

          </div>
        </div>
      </section>

      {/* Grid Highlights component */}
      <BentoHighlights hideTitle={false} />

      {/* Security and policy compliance panel */}
      <SecurityAndGuardrails />

      {/* CTA Footer segment */}
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
              boxShadow: "0 32px 80px -24px rgba(0,0,0,0.6), inset 0 1px 0 var(--border-subtle)"
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
