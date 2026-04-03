"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Globe2, Layers, ShieldCheck, Zap } from "lucide-react";

const tiles = [
  {
    title: "Global edge rendering",
    desc: "Jobs route to the nearest GPU cluster so previews feel local—whether you're in Seoul, São Paulo, or Stockholm.",
    icon: Globe2,
    span: "md:col-span-2",
    glow: "#7B61FF",
  },
  {
    title: "Multi-pass exports",
    desc: "Optional depth, normal, and matte passes for comp—not just a flat PNG.",
    icon: Layers,
    span: "md:col-span-1",
    glow: "#00D4FF",
  },
  {
    title: "Guardrails by default",
    desc: "Team policies, prompt allowlists, and export watermarks when you need client review without leaks.",
    icon: ShieldCheck,
    span: "md:col-span-1",
    glow: "#FF2E9A",
  },
  {
    title: "Burst when it matters",
    desc: "Studio can spike concurrency for launch windows—queue depth visible in the dashboard.",
    icon: Zap,
    span: "md:col-span-2",
    glow: "#7B61FF",
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
              className={`premium-ring group relative overflow-hidden rounded-[1.1rem] border p-4 sm:rounded-2xl sm:p-6 md:p-7 ${t.span}`}
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                style={{ background: t.glow }}
              />
              <div
                className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl border sm:mb-5 sm:h-12 sm:w-12"
                style={{
                  borderColor: "var(--border-subtle)",
                  background:
                    "linear-gradient(135deg, rgba(123,97,255,0.22) 0%, rgba(0,212,255,0.14) 100%)",
                }}
              >
                <t.icon className="h-5 w-5 text-[#00D4FF] sm:h-6 sm:w-6" strokeWidth={1.75} />
              </div>
              <h3
                className="font-display relative text-base font-bold sm:text-lg md:text-xl"
                style={{ color: "var(--text-primary)" }}
              >
                {t.title}
              </h3>
              <p
                className="relative mt-2 text-sm leading-relaxed sm:mt-2.5 sm:text-[15px]"
                style={{ color: "var(--text-muted)" }}
              >
                {t.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
