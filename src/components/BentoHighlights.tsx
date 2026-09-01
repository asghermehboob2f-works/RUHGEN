"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Globe2, Layers, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { SITE_CONTAINER } from "@/lib/site-layout";

const tiles = [
  {
    title: "Global edge rendering",
    desc: "Jobs route to the nearest GPU cluster so previews feel local—whether you're in Seoul, São Paulo, or Stockholm.",
    icon: Globe2,
    span: "md:col-span-2",
    glow: "#7B61FF",
    tag: "Latency-optimized",
    learnMoreHref: "/platform/engineering#global-edge",
  },
  {
    title: "Multi-pass exports",
    desc: "Optional depth, normal, and matte passes for comp—not just a flat PNG.",
    icon: Layers,
    span: "md:col-span-1",
    glow: "#00D4FF",
    tag: "Pipeline-ready",
    learnMoreHref: "/platform/engineering#multi-pass",
  },
  {
    title: "Guardrails by default",
    desc: "Team policies, prompt allowlists, and export watermarks when you need client review without leaks.",
    icon: ShieldCheck,
    span: "md:col-span-1",
    glow: "#FF2E9A",
    tag: "Studio-safe",
    learnMoreHref: "/platform/engineering#guardrails",
  },
  {
    title: "Burst when it matters",
    desc: "Studio can spike concurrency for launch windows—queue depth visible in the dashboard.",
    icon: Zap,
    span: "md:col-span-2",
    glow: "#7B61FF",
    tag: "Scale on demand",
    learnMoreHref: "/platform/engineering#burst",
  },
];

export function BentoHighlights({ hideTitle = false }: { hideTitle?: boolean }) {
  const reduce = useReducedMotion();

  return (
    <section
      id="platform"
      className="relative scroll-mt-24 border-t py-12 md:py-24"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--rich-black)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 10% 20%, rgba(0,212,255,0.12), transparent), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(123,97,255,0.1), transparent)",
        }}
      />

      <div className={`relative ${SITE_CONTAINER}`}>
        {!hideTitle && (
          <motion.div
            className="mb-10 grid gap-8 md:mb-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end lg:gap-12"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
          >
            <div className="text-center lg:text-left">
              <p
                className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
                style={{ color: "var(--text-subtle)" }}
              >
                Platform depth
              </p>
              <h2
                className="font-display text-[clamp(1.55rem,3.8vw,3rem)] font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Built past the demo
              </h2>
            </div>
            <p
              className="text-center text-sm leading-relaxed sm:text-lg lg:text-left"
              style={{ color: "var(--text-muted)" }}
            >
              The interface is simple on purpose—the engine underneath is built for real timelines, real
              clients, and real file sizes.
            </p>
          </motion.div>
        )}

        <div className="grid auto-rows-fr gap-3 sm:gap-4 md:grid-cols-3">
          {tiles.map((t, i) => (
            <motion.div
              key={t.title}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: reduce ? 0 : i * 0.05, duration: 0.4 }}
              className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-xl transition-all duration-500 hover:border-border/80 ${t.span}`}
              style={
                {
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
                  ["--tile-glow" as string]: t.glow,
                } as React.CSSProperties
              }
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                style={{ background: t.glow }}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden
                style={{
                  background: `radial-gradient(ellipse 70% 55% at 0% 0%, color-mix(in srgb, ${t.glow} 24%, transparent), transparent 60%)`,
                }}
              />
              <div
                className="relative mb-4 flex h-9 w-9 items-center justify-center rounded-lg border"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: `linear-gradient(135deg, color-mix(in srgb, ${t.glow} 20%, transparent) 0%, rgba(255,255,255,0.04) 60%, rgba(0,0,0,0.0) 100%)`,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset`,
                }}
              >
                <t.icon className="h-4 w-4" strokeWidth={1.5} style={{ color: t.glow }} />
              </div>
              <h3
                className="font-display relative text-sm font-semibold leading-snug sm:text-base"
                style={{ color: "var(--text-primary)" }}
              >
                {t.title}
              </h3>
              <p
                className="relative mt-2 text-[11.5px] leading-relaxed font-light sm:text-xs sm:leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {t.desc}
              </p>
              <div className="mt-auto pt-5">
                <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p
                    className="min-w-0 flex-1 text-[9px] font-mono font-medium uppercase leading-tight tracking-[0.14em]"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    {t.tag}
                  </p>
                  <Link
                    href={t.learnMoreHref}
                    className="group/cta relative inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--border-subtle)] px-2.5 py-1 text-[10.5px] font-mono tracking-wider uppercase text-[var(--text-muted)] transition-[color,background-color,border-color] duration-200 hover:border-[color:color-mix(in_srgb,var(--tile-glow)_38%,var(--border-subtle))] hover:text-[var(--text-primary)]"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                    }}
                  >
                    <span className="relative whitespace-nowrap">Learn more</span>
                    <ChevronRight
                      className="relative h-3 w-3 shrink-0 opacity-65 transition-transform duration-200 group-hover/cta:translate-x-0.5 group-hover/cta:opacity-100"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
