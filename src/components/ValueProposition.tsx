"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Cpu, Film, Zap } from "lucide-react";

const pillars = [
  {
    icon: Zap,
    title: "Iterate at the speed of thought",
    body: "Tight feedback loops from prompt to pixel—so you stay in flow instead of waiting on renders.",
    accent: "#00D4FF",
  },
  {
    icon: Film,
    title: "Cinematic fidelity, production discipline",
    body: "HDR-aware looks, consistent aspect pipelines, and exports that slot into review and finishing.",
    accent: "#7B61FF",
  },
  {
    icon: Cpu,
    title: "Built for teams, not just tabs",
    body: "Policies, audit trails, and burst capacity when launch week refuses to be predictable.",
    accent: "#FF2E9A",
  },
];

export function ValueProposition() {
  const reduce = useReducedMotion();

  return (
    <section
      id="value"
      className="relative scroll-mt-24 border-y py-14 md:py-20"
      style={{
        borderColor: "var(--border-subtle)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--rich-black) 88%, transparent) 0%, var(--deep-black) 45%, var(--deep-black) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7B61FF]/35 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            Why teams choose RUHGEN
          </p>
          <h2
            className="font-display mt-3 text-[clamp(1.45rem,3.5vw,2.75rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            One engine for stills, motion, and momentum
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:mt-4 sm:text-base"
            style={{ color: "var(--text-muted)" }}
          >
            A focused surface with serious infrastructure underneath—so creative direction leads, and
            tooling gets out of the way.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-1 sm:gap-5 md:grid-cols-3 md:gap-6">
          {pillars.map((p, i) => (
            <motion.article
              key={p.title}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.06 }}
              className="premium-ring relative overflow-hidden rounded-[1.15rem] border p-5 sm:rounded-2xl sm:p-7"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25 blur-3xl"
                style={{ background: p.accent }}
              />
              <div
                className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl border"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: `linear-gradient(135deg, color-mix(in srgb, ${p.accent} 22%, transparent), rgba(255,255,255,0.04))`,
                }}
              >
                <p.icon className="h-5 w-5" strokeWidth={1.75} style={{ color: p.accent }} />
              </div>
              <h3
                className="font-display relative text-base font-semibold leading-snug sm:text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                {p.title}
              </h3>
              <p
                className="relative mt-2 text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {p.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
