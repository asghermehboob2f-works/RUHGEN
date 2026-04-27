"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Download, ImageIcon, Sparkles, Wand2 } from "lucide-react";
import { LivePreview } from "@/components/LivePreview";
import { DemoHeroGraphic } from "@/components/marketing/DemoHeroGraphic";
import { SITE_CONTAINER } from "@/lib/site-layout";

const sessionPoints = [
  {
    title: "Image mode",
    body: "Flux-style stills with aspect presets, look chips, and detail levels—see output beside controls.",
    Icon: ImageIcon,
    tint: "#7B61FF",
  },
  {
    title: "Video handoff",
    body: "Frame your clip, then continue in the workspace with your choices carried forward.",
    Icon: Sparkles,
    tint: "#00D4FF",
  },
  {
    title: "Export",
    body: "Download stills or prep motion for the full pipeline—no account required for the image tryout.",
    Icon: Download,
    tint: "#FF2E9A",
  },
];

export function DemoPageContent() {
  const reduce = useReducedMotion() === true;

  return (
    <>
      <section className="relative overflow-hidden border-b pt-24 sm:pt-28" style={{ borderColor: "var(--border-subtle)" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(123,97,255,0.18), transparent 50%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(0,212,255,0.1), transparent 55%)",
          }}
        />
        <div className={`relative ${SITE_CONTAINER} grid gap-10 pb-14 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14 lg:pb-16`}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-[#00D4FF]">Live sandbox</p>
            <h1 className="font-display mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.05] tracking-tight" style={{ color: "var(--text-primary)" }}>
              Try generation <span className="text-gradient-primary">without leaving the page</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
              This is a hands-on preview: tune prompts, frames, and looks—then generate a still or jump into video with your settings
              preserved.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white btn-gradient"
              >
                Open full studio
              </Link>
              <Link
                href="/workflow"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold transition-colors hover:border-[#7B61FF]/45"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)", background: "var(--glass)" }}
              >
                See end-to-end workflow
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="relative flex justify-center lg:justify-end"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.06 }}
          >
            <div className="relative w-full max-w-[440px]">
              <DemoHeroGraphic className="h-auto w-full drop-shadow-[0_28px_80px_rgba(123,97,255,0.22)]" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b py-10 sm:py-14" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
        <div className={SITE_CONTAINER}>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: "var(--text-subtle)" }}>
                In this session
              </p>
              <h2 className="font-display mt-2 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>
                What you&apos;ll explore
              </h2>
            </div>
            <Wand2 className="hidden h-8 w-8 shrink-0 text-[#7B61FF]/45 sm:block" strokeWidth={1.25} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {sessionPoints.map((p, i) => (
              <motion.div
                key={p.title}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: reduce ? 0 : i * 0.06 }}
                className="rounded-2xl border p-5"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{ borderColor: `${p.tint}44`, background: `${p.tint}14` }}
                >
                  <p.Icon className="h-5 w-5" strokeWidth={1.6} style={{ color: p.tint }} />
                </div>
                <h3 className="font-display mt-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {p.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed sm:text-sm" style={{ color: "var(--text-muted)" }}>
                  {p.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mesh-section relative">
        <div className={`${SITE_CONTAINER} pb-12 sm:pb-16`}>
          <LivePreview hideHeading />
        </div>
      </section>

      <section className="border-t py-12 sm:py-16" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}>
        <div className={`${SITE_CONTAINER} grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center`}>
          <div className="text-center lg:text-left">
            <p className="font-display text-lg font-semibold sm:text-xl" style={{ color: "var(--text-primary)" }}>
              Ready for timelines, libraries, and team seats?
            </p>
            <p className="mt-2 text-sm leading-relaxed sm:text-base lg:max-w-xl" style={{ color: "var(--text-muted)" }}>
              The demo stays lightweight on purpose; the full product adds history, collaboration, and production-grade exports.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Link
              href="/pricing"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-8 text-sm font-semibold text-white btn-gradient"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
