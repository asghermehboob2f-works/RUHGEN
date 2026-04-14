"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Cable, Layers3, Shield } from "lucide-react";
import { Features } from "@/components/Features";
import { StackStrip } from "@/components/StackStrip";
import { SITE_CONTAINER } from "@/lib/site-layout";
const pillars = [
  {
    title: "Modes that match the job",
    body: "Image and video paths with controls tuned for exploration vs. delivery—no one-size-fits-all modal.",
    Icon: Layers3,
    accent: "#7B61FF",
  },
  {
    title: "Pipeline handoff",
    body: "Exports and formats that slot into comp, editorial, and DAM workflows—not just screenshots.",
    Icon: Cable,
    accent: "#00D4FF",
  },
  {
    title: "Guardrails by design",
    body: "Team policies, shared libraries, and review-safe exports when you’re not flying solo.",
    Icon: Shield,
    accent: "#FF2E9A",
  },
];

export function FeaturesPageContent() {
  const reduce = useReducedMotion() === true;

  return (
    <>
      <section className="relative min-h-[min(72vh,520px)] overflow-hidden border-b pt-24 sm:pt-28" style={{ borderColor: "var(--border-subtle)" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(123,97,255,0.12), transparent 60%)",
          }}
        />
        <div className={`relative ${SITE_CONTAINER} flex flex-col items-center pb-16 text-center`}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: "var(--text-subtle)" }}>
              Capabilities
            </p>
            <h1 className="font-display mt-3 text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.06] tracking-tight" style={{ color: "var(--text-primary)" }}>
              Everything to go from <span className="text-gradient-primary">prompt</span> to{" "}
              <span className="text-gradient-hero">master</span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed sm:text-lg" style={{ color: "var(--text-muted)" }}>
              A focused surface for generation—underpinned by exports, concurrency, and team tools when you’re ready to
              scale beyond experiments.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/demo" className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white btn-gradient">
                Try the demo
              </Link>
              <Link
                href="/platform"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)", background: "var(--glass)" }}
              >
                See infrastructure
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <StackStrip />

      <section className="border-b py-12 md:py-16" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
        <div className={SITE_CONTAINER}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end lg:gap-10">
            <h2 className="font-display text-center text-xl font-bold tracking-tight sm:text-2xl lg:text-left" style={{ color: "var(--text-primary)" }}>
              Built for three pressures at once
            </h2>
            <p className="text-center text-sm font-medium lg:text-left" style={{ color: "var(--text-muted)" }}>
              Speed, fidelity, and accountability—without turning the UI into a cockpit.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6 lg:gap-8">
            {pillars.map((p, i) => (
              <motion.article
                key={p.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: reduce ? 0 : i * 0.06 }}
                className="rounded-2xl border p-6"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{ borderColor: `${p.accent}44`, background: `${p.accent}12` }}
                >
                  <p.Icon className="h-5 w-5" strokeWidth={1.65} style={{ color: p.accent }} />
                </div>
                <h3 className="font-display mt-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {p.body}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <Features hideHeading />
    </>
  );
}
