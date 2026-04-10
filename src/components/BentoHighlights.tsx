"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Globe2, Layers, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

const tiles = [
  {
    title: "Global edge rendering",
    desc: "Jobs route to the nearest GPU cluster so previews feel local—whether you're in Seoul, São Paulo, or Stockholm.",
    icon: Globe2,
    span: "md:col-span-2",
    glow: "#7B61FF",
    tag: "Latency-optimized",
    learnMoreHref: "/platform#global-edge",
  },
  {
    title: "Multi-pass exports",
    desc: "Optional depth, normal, and matte passes for comp—not just a flat PNG.",
    icon: Layers,
    span: "md:col-span-1",
    glow: "#00D4FF",
    tag: "Pipeline-ready",
    learnMoreHref: "/platform#multi-pass",
  },
  {
    title: "Guardrails by default",
    desc: "Team policies, prompt allowlists, and export watermarks when you need client review without leaks.",
    icon: ShieldCheck,
    span: "md:col-span-1",
    glow: "#FF2E9A",
    tag: "Studio-safe",
    learnMoreHref: "/platform#guardrails",
  },
  {
    title: "Burst when it matters",
    desc: "Studio can spike concurrency for launch windows—queue depth visible in the dashboard.",
    icon: Zap,
    span: "md:col-span-2",
    glow: "#7B61FF",
    tag: "Scale on demand",
    learnMoreHref: "/platform#burst",
  },
];

export function BentoHighlights() {
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

      <div className="relative mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <motion.div
          className="mb-8 text-center md:mb-12"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
        >
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
          <p
            className="mx-auto mt-2 max-w-2xl px-1 text-sm leading-relaxed sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            The interface is simple on purpose—the engine underneath is built for real timelines, real
            clients, and real file sizes.
          </p>
        </motion.div>

        <div className="grid auto-rows-fr gap-2.5 sm:gap-3 md:grid-cols-3 md:gap-4">
          {tiles.map((t, i) => (
            <motion.div
              key={t.title}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: reduce ? 0 : i * 0.05, duration: 0.4 }}
              className={`premium-ring group relative flex h-full flex-col overflow-hidden rounded-[1rem] border p-3.5 sm:rounded-2xl sm:p-5 md:p-6 ${t.span}`}
              style={
                {
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  backdropFilter: "blur(20px)",
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
                  background: `radial-gradient(ellipse 70% 55% at 0% 0%, color-mix(in srgb, ${t.glow} 28%, transparent), transparent 60%)`,
                }}
              />
              <div
                className="relative mb-3 flex h-9 w-9 items-center justify-center rounded-lg border sm:mb-4 sm:h-10 sm:w-10"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: `linear-gradient(135deg, color-mix(in srgb, ${t.glow} 24%, transparent) 0%, rgba(255,255,255,0.06) 60%, rgba(0,0,0,0.0) 100%)`,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.06) inset, 0 18px 45px -28px color-mix(in srgb, ${t.glow} 55%, transparent)`,
                }}
              >
                <t.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} style={{ color: t.glow }} />
              </div>
              <h3
                className="font-display relative text-sm font-bold leading-snug sm:text-base md:text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                {t.title}
              </h3>
              <p
                className="relative mt-1.5 text-xs leading-relaxed sm:mt-2 sm:text-[13px] sm:leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {t.desc}
              </p>
              <div className="mt-auto pt-4 sm:pt-5">
                <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="mt-2 flex min-h-[32px] items-center justify-between gap-2 sm:gap-3">
                  <p
                    className="min-w-0 flex-1 text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] sm:text-[11px]"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    {t.tag}
                  </p>
                  <Link
                    href={t.learnMoreHref}
                    className="group/cta relative inline-flex shrink-0 items-center gap-0.5 rounded-md border border-[var(--border-subtle)] px-2 py-1 text-[11px] font-medium leading-tight tracking-wide text-[var(--text-muted)] transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out hover:border-[color:color-mix(in_srgb,var(--tile-glow)_38%,var(--border-subtle))] hover:text-[var(--text-primary)] hover:shadow-[0_1px_0_rgba(255,255,255,0.05)_inset] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:color-mix(in_srgb,var(--tile-glow)_55%,transparent)] sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-xs"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-md opacity-0 transition-opacity duration-200 group-hover/cta:opacity-100"
                      style={{
                        background:
                          "linear-gradient(135deg, color-mix(in srgb, var(--tile-glow) 11%, transparent) 0%, transparent 55%)",
                      }}
                    />
                    <span className="relative whitespace-nowrap">Learn more</span>
                    <ChevronRight
                      className="relative h-3 w-3 shrink-0 opacity-65 transition-[opacity,transform] duration-200 group-hover/cta:translate-x-[1px] group-hover/cta:opacity-100 sm:h-3.5 sm:w-3.5"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <span className="sr-only"> about {t.title}</span>
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
