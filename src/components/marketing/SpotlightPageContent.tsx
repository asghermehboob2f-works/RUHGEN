"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Clapperboard, Quote } from "lucide-react";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { GraphicFilmStrip } from "@/components/marketing/graphics/MarketingGraphics";
import type { SiteContent } from "@/backend/site-content/types";
import { SITE_CONTAINER } from "@/lib/site-layout";

const directorsNote = {
  quote:
    "The best reels aren’t the loudest—they’re the ones that survive the Monday-morning review. We built Spotlight to show motion and messaging that still makes sense after the hype fades.",
  attribution: "Product narrative, RUHGEN",
};

export function SpotlightPageContent({ content }: { content: SiteContent }) {
  const reduce = useReducedMotion() === true;

  return (
    <>
      <section className="relative overflow-hidden border-b pt-24 sm:pt-28" style={{ borderColor: "var(--border-subtle)" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, var(--deep-black) 100%), radial-gradient(ellipse 90% 70% at 50% -20%, rgba(123,97,255,0.14), transparent 55%)",
          }}
        />
        <div className={`relative ${SITE_CONTAINER} pb-12 sm:pb-16`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
            <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}>
                <Clapperboard className="h-3.5 w-3.5 text-[#7B61FF]" strokeWidth={1.75} />
                Motion & craft
              </div>
              <h1 className="font-display mt-5 text-[clamp(2rem,4.8vw,3.5rem)] font-extrabold leading-[1.08] tracking-tight" style={{ color: "var(--text-primary)" }}>
                Spotlight: <span className="text-gradient-hero">work that survives review</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
                Curated clips and captions—each slide is a short story about a workflow you can actually ship: identity-aware
                blends, environment swaps, and motion that stays readable on a grading monitor.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/gallery" className="text-sm font-semibold text-[#00D4FF] underline-offset-4 hover:underline">
                  Browse the still gallery →
                </Link>
                <span className="text-sm" style={{ color: "var(--text-subtle)" }}>
                  |
                </span>
                <Link href="/demo" className="text-sm font-semibold text-[#7B61FF] underline-offset-4 hover:underline">
                  Run the live demo →
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="flex justify-center lg:justify-end"
            >
              <GraphicFilmStrip className="h-auto w-full max-w-[400px]" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mesh-section border-b py-10 sm:py-12" style={{ borderColor: "var(--border-subtle)" }}>
        <div className={SITE_CONTAINER}>
          <div className="grid gap-6 rounded-2xl border p-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-8 lg:items-start" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
            <Quote className="mx-auto h-10 w-10 shrink-0 text-[#7B61FF]/45 sm:mx-0 sm:h-12 sm:w-12" strokeWidth={1.2} />
            <div className="text-center sm:text-left">
              <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-primary)" }}>
                {directorsNote.quote}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                {directorsNote.attribution}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="pb-4">
        <FeatureShowcase slides={content.showcase.slides} hideHeading />
      </div>

      <section className="border-t py-12 sm:py-16" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
        <div className={`${SITE_CONTAINER} grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center`}>
          <div className="text-center lg:text-left">
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>
              Want these workflows in your workspace?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm sm:text-base lg:mx-0" style={{ color: "var(--text-muted)" }}>
              Spotlight content is editable from your dashboard—swap clips and copy as your product story evolves.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Link
              href="/sign-up"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-8 text-sm font-semibold text-white btn-gradient"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
