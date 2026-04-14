"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { BentoHighlights } from "@/components/BentoHighlights";
import { SecurityAndGuardrails } from "@/components/SecurityAndGuardrails";
import { SITE_CONTAINER } from "@/lib/site-layout";
export function PlatformPageContent() {
  const reduce = useReducedMotion() === true;

  return (
    <>
      <section className="relative overflow-hidden border-b pt-24 sm:pt-28" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 0% 0%, rgba(0,212,255,0.12), transparent 55%)",
          }}
        />
        <div className={`relative ${SITE_CONTAINER} pb-14 sm:pb-16`}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-12">
            <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: "#00D4FF" }}>
                Infrastructure
              </p>
              <h1 className="font-display mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight" style={{ color: "var(--text-primary)" }}>
                Calm UI. <span className="text-gradient-primary">Serious engine.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
                Edge routing, multi-pass exports, policy, and burst capacity—built for client deadlines and real file sizes,
                not benchmark screenshots.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/platform/engineering"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold transition-colors hover:border-[#7B61FF]/45"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}
                >
                  Engineering deep dive
                </Link>
                <Link href="/sign-up" className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white btn-gradient">
                  Start free
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="rounded-3xl border p-6 sm:p-8"
              style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Request path (simplified)
              </p>
              <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Your job is scheduled near users, executed with the passes you need, then delivered with policies your team
                defines.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <BentoHighlights hideTitle />

      <SecurityAndGuardrails />

      <section className="mesh-section-muted border-t py-14 md:py-20" style={{ borderColor: "var(--border-subtle)" }}>
        <div className={`${SITE_CONTAINER} grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center`}>
          <div className="text-center lg:text-left">
            <p className="font-display text-lg font-semibold sm:text-xl" style={{ color: "var(--text-primary)" }}>
              Need queue visibility and SLAs?
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm sm:text-base lg:mx-0" style={{ color: "var(--text-muted)" }}>
              Studio adds the operational layer—dashboard signals, webhooks, and integrations for real production floors.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-end sm:gap-4">
            <Link href="/contact" className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border px-8 text-sm font-semibold sm:w-auto sm:text-base" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)", background: "var(--glass)" }}>
              Talk to us
            </Link>
            <Link href="/pricing" className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-8 text-sm font-semibold text-white btn-gradient sm:w-auto sm:text-base">
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
