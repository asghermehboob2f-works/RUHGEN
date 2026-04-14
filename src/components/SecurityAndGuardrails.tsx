"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FileLock2, ShieldCheck, SlidersHorizontal, UserRoundCheck } from "lucide-react";
import { SITE_CONTAINER } from "@/lib/site-layout";

const items = [
  {
    title: "Client-safe reviews",
    desc: "Watermarks, proxy exports, and controlled sharing when work isn’t ready for the world.",
    Icon: ShieldCheck,
    glow: "#7B61FF",
  },
  {
    title: "Prompt libraries",
    desc: "Reusable looks and starting points so teams stay consistent across deliverables.",
    Icon: SlidersHorizontal,
    glow: "#00D4FF",
  },
  {
    title: "Access & ownership",
    desc: "Clear separation between personal experiments and team workspaces—keep ownership tidy.",
    Icon: UserRoundCheck,
    glow: "#FF2E9A",
  },
  {
    title: "Retention-ready",
    desc: "Encryption in transit, configurable retention, and sane defaults for production workflows.",
    Icon: FileLock2,
    glow: "#00D4FF",
  },
] as const;

export function SecurityAndGuardrails() {
  const reduce = useReducedMotion() === true;

  return (
    <section className="relative border-t py-12 md:py-24" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(123,97,255,0.14), transparent 60%), radial-gradient(ellipse 65% 45% at 0% 100%, rgba(0,212,255,0.10), transparent 60%)",
        }}
      />
      <div className={`relative ${SITE_CONTAINER}`}>
        <motion.div
          className="mb-10 grid gap-8 md:mb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-12"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
        >
          <div className="text-center lg:text-left">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] sm:text-xs" style={{ color: "var(--text-subtle)" }}>
              Studio-grade
            </p>
            <h2 className="font-display text-[clamp(1.65rem,3.8vw,3rem)] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Guardrails without friction
            </h2>
          </div>
          <p className="text-center text-sm leading-relaxed sm:text-base lg:text-left" style={{ color: "var(--text-muted)" }}>
            Built for client work: policies, sharing, and exports that keep teams fast and confident.
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {items.map((c, i) => (
            <motion.article
              key={c.title}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.04 }}
              className="premium-ring group relative overflow-hidden rounded-[1.35rem] border p-6"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45" style={{ background: c.glow }} />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border" style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.04)" }}>
                <c.Icon className="h-5 w-5" strokeWidth={1.75} style={{ color: c.glow }} />
              </div>
              <h3 className="font-display mt-4 text-base font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {c.desc}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center">
          <Link
            href="/contact"
            className="group inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-6 text-sm font-semibold transition-colors hover:border-[#7B61FF]/45"
            style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}
          >
            Ask about Studio guardrails
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

