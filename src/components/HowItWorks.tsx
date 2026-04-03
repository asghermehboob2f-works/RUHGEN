"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Cpu, Download, Wand2 } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Enter prompt",
    description: "Describe your vision in natural language — we keep the interface quiet so your intent stays center stage.",
    tint: "#7B61FF",
    Icon: Wand2,
  },
  {
    n: "02",
    title: "AI generates",
    description: "Models spin up on edge GPUs; you get live previews and crisp iterations without babysitting a queue.",
    tint: "#00D4FF",
    Icon: Cpu,
  },
  {
    n: "03",
    title: "Download & share",
    description: "Export in the resolution your deliverable demands — HDR stills, mastered motion, or client-safe proxies.",
    tint: "#FF2E9A",
    Icon: Download,
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion() === true;

  return (
    <section
      id="how"
      className="relative scroll-mt-24 overflow-hidden border-t py-12 sm:py-16 md:py-24 lg:py-28"
      style={{
        borderColor: "var(--border-subtle)",
        background:
          "linear-gradient(180deg, var(--rich-black) 0%, var(--deep-black) 35%, var(--deep-black) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 0% 0%, rgba(123,97,255,0.14), transparent 50%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(0,212,255,0.1), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
        <motion.div
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.32em] sm:text-xs sm:tracking-[0.26em]"
            style={{ color: "var(--text-subtle)" }}
          >
            Workflow
          </p>
          <h2
            className="font-display text-[clamp(1.5rem,5vw,3rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            How it works
          </h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
            Three calm steps — no timelines, no rails. Just clarity from prompt to pixel.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {steps.map((s, i) => (
            <motion.article
              key={s.n}
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduce ? undefined : { y: -4 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border p-5 sm:rounded-[1.35rem] sm:p-6 lg:min-h-[320px] lg:p-8"
              style={{
                borderColor: "var(--border-subtle)",
                background:
                  "linear-gradient(165deg, rgba(255,255,255,0.06) 0%, var(--glass) 42%, var(--soft-black) 100%)",
                backdropFilter: "blur(24px)",
                boxShadow:
                  "0 24px 64px -28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
                style={{ background: s.tint }}
              />

              <div className="relative mb-5 flex items-start justify-between gap-3">
                <span
                  className="font-display text-4xl font-black leading-none tabular-nums sm:text-5xl"
                  style={{
                    background: `linear-gradient(135deg, ${s.tint} 0%, #ffffff 55%)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {s.n}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:h-12 sm:w-12"
                  style={{
                    borderColor: `${s.tint}44`,
                    background: `linear-gradient(145deg, ${s.tint}22, transparent)`,
                    boxShadow: `0 0 24px ${s.tint}33`,
                  }}
                >
                  <s.Icon className="h-5 w-5 text-white/95 sm:h-5 sm:w-5" strokeWidth={1.65} />
                </div>
              </div>

              <h3
                className="relative font-display text-lg font-bold tracking-tight sm:text-xl"
                style={{ color: "var(--text-primary)" }}
              >
                {s.title}
              </h3>
              <p
                className="relative mt-2 flex-1 text-sm leading-relaxed sm:mt-3 sm:text-[15px]"
                style={{ color: "var(--text-muted)" }}
              >
                {s.description}
              </p>

              <div
                className="relative mt-4 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider sm:mt-5 sm:text-xs"
                style={{ color: s.tint, opacity: 0.9 }}
              >
                Step {s.n}
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
