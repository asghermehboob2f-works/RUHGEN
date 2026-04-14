"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { GitBranch, MessageSquare, Rocket, Wand2 } from "lucide-react";
import { HowItWorks } from "@/components/HowItWorks";
import { SITE_CONTAINER } from "@/lib/site-layout";
const journey = [
  {
    phase: "01 — Brief",
    title: "Intent stays legible",
    body: "Prompts, references, and brand notes live in one place so “what we meant” doesn’t get lost in chat threads.",
    Icon: MessageSquare,
  },
  {
    phase: "02 — Generate",
    title: "Iteration without thrash",
    body: "Fast previews let you steer look and motion while the room is still paying attention—no overnight mystery renders.",
    Icon: Wand2,
  },
  {
    phase: "03 — Branch",
    title: "Options, not chaos",
    body: "Parallel explorations stay labeled and comparable so creative leads can pick a direction without merge confusion.",
    Icon: GitBranch,
  },
  {
    phase: "04 — Ship",
    title: "Exports that match delivery",
    body: "Hand off masters, proxies, or API hooks—whatever your review and finishing stack expects.",
    Icon: Rocket,
  },
];

export function WorkflowPageContent() {
  const reduce = useReducedMotion() === true;

  return (
    <>
      <section className="relative overflow-hidden border-b pt-24 sm:pt-28" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(123,97,255,0.15), transparent 55%)",
          }}
        />
        <div className={`relative ${SITE_CONTAINER} pb-10`}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-14">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: "var(--text-subtle)" }}>
                Operating model
              </p>
              <h1 className="font-display mt-3 text-[clamp(2rem,4.6vw,3.4rem)] font-extrabold leading-[1.06] tracking-tight" style={{ color: "var(--text-primary)" }}>
                From spark to <span className="text-gradient-primary">shipped</span>—on purpose
              </h1>
              <p className="mt-5 text-sm leading-relaxed sm:text-base lg:max-w-xl" style={{ color: "var(--text-muted)" }}>
                Workflow here means fewer dropped handoffs: brief → generate → review → export. The studio UI stays quiet so
                your team can argue about the work—not the tooling.
              </p>
            </div>
            <div
              className="premium-ring rounded-2xl border p-6 sm:p-7"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Outcomes
              </p>
              <ul className="mt-4 space-y-3 text-sm" style={{ color: "var(--text-muted)" }}>
                <li>Aligned briefs and labeled branches</li>
                <li>Review-friendly exports and proxies</li>
                <li>Studio add-ons when production hardens</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-12 md:py-16" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
        <div className={SITE_CONTAINER}>
          <div className="grid gap-4 text-center lg:grid-cols-[1fr_2fr] lg:items-end lg:text-left">
            <h2 className="font-display text-xl font-bold sm:text-2xl" style={{ color: "var(--text-primary)" }}>
              How teams run projects on RUHGEN
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Four phases—each with a clear handoff so creative leads stay in control.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:gap-8 xl:grid-cols-4 xl:gap-6">
            {journey.map((j, i) => (
              <motion.article
                key={j.phase}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: reduce ? 0 : i * 0.05 }}
                className="rounded-2xl border p-6"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
              >
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider" style={{ color: "#7B61FF" }}>
                  {j.phase}
                </p>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
                    <j.Icon className="h-5 w-5 text-[#00D4FF]" strokeWidth={1.6} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                      {j.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {j.body}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/demo" className="text-sm font-semibold text-[#7B61FF] underline-offset-4 hover:underline">
              Try a session in the demo →
            </Link>
          </div>
        </div>
      </section>

      <HowItWorks hideHeading />

      <section className="py-12 sm:py-14" style={{ background: "var(--deep-black)" }}>
        <div className={`${SITE_CONTAINER} grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center`}>
          <p className="text-center text-sm lg:text-left" style={{ color: "var(--text-muted)" }}>
            Need SSO, audit trails, or API automation? That&apos;s the Studio layer—start with workflow clarity, scale
            when production demands it.
          </p>
          <div className="flex justify-center lg:justify-end">
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)", background: "var(--glass)" }}
            >
              Plan a Studio rollout
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
