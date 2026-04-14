"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { FAQ } from "@/components/FAQ";
import { Pricing } from "@/components/Pricing";
import { GraphicPricingScale } from "@/components/marketing/graphics/MarketingGraphics";
import { MARKETING_FAQS } from "@/lib/marketing-faqs";
import { SITE_CONTAINER } from "@/lib/site-layout";

export function PricingPageContent() {
  const reduce = useReducedMotion() === true;

  return (
    <>
      <section className="relative overflow-hidden border-b pt-24 sm:pt-28" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(123,97,255,0.12), transparent 55%)",
          }}
        />
        <div className={`relative ${SITE_CONTAINER} pb-14 sm:pb-16`}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
            <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: "#7B61FF" }}>
                Plans & credits
              </p>
              <h1 className="font-display mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight" style={{ color: "var(--text-primary)" }}>
                Pay for what you <span className="text-gradient-primary">ship</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
                Start free, move to Pro when you need more output, and add Studio when reviews, seats, and integrations
                matter. No hidden “creative tax”—just tiers that match how teams actually work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}>
                  Custom / Studio quote
                </Link>
                <Link href="/faq" className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-[#00D4FF] underline-offset-4 hover:underline">
                  Billing FAQ →
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="w-full max-w-[360px] rounded-2xl border p-6" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                  Relative scale (illustrative)
                </p>
                <GraphicPricingScale className="mt-4 h-auto w-full" />
                <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Studio scales with seats, concurrency, and support—not just more credits.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Pricing hideHeading />

      <section className="border-t py-10 md:py-12" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}>
        <div className={SITE_CONTAINER}>
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <h2 className="font-display text-center text-lg font-bold sm:text-xl lg:text-left" style={{ color: "var(--text-primary)" }}>
              Common questions before you buy
            </h2>
            <p className="text-center text-sm lg:text-left" style={{ color: "var(--text-muted)" }}>
              Short answers for checkout decisions—the full help center lives on the FAQ page.
            </p>
          </div>
        </div>
      </section>

      <FAQ hideHeading items={MARKETING_FAQS.slice(0, 5)} />

      <section className="mesh-section py-14 md:py-20">
        <div className={`${SITE_CONTAINER} grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12`}>
          <div className="text-center lg:text-left">
            <p className="font-display text-[clamp(1.35rem,3vw,2rem)] font-bold tracking-tight">
              <span className="text-gradient-hero">Still comparing tools?</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base lg:max-w-xl" style={{ color: "var(--text-muted)" }}>
              Run a real session in the demo, then come back—pricing makes more sense once you&apos;ve felt the loop.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Link
              href="/demo"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-8 text-sm font-semibold text-white btn-gradient"
            >
              Open the demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
