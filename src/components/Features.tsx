"use client";

import { motion, useReducedMotion } from "framer-motion";

const features = [
  {
    title: "Text-to-image generation",
    description: "Transform words into stunning visuals in seconds.",
    bar: "linear-gradient(180deg, #7B61FF 0%, #5080ff 100%)",
    wash: "rgba(123,97,255,0.14)",
  },
  {
    title: "Text-to-video generation",
    description: "Create cinematic motion sequences from a single prompt.",
    bar: "linear-gradient(180deg, #00D4FF 0%, #7B61FF 100%)",
    wash: "rgba(0,212,255,0.1)",
  },
  {
    title: "Style control",
    description: "Choose from multiple artistic styles and brand-safe looks.",
    bar: "linear-gradient(180deg, #FF2E9A 0%, #7B61FF 100%)",
    wash: "rgba(255,46,154,0.1)",
  },
  {
    title: "Real-time rendering",
    description: "See results in seconds—not minutes—with live previews.",
    bar: "linear-gradient(180deg, #7B61FF 0%, #00D4FF 100%)",
    wash: "rgba(123,97,255,0.12)",
  },
  {
    title: "Ultra HD output",
    description: "Up to 8K resolution support for print and screens.",
    bar: "linear-gradient(180deg, #00c4ef 0%, #6366f1 100%)",
    wash: "rgba(0,196,239,0.1)",
  },
  {
    title: "Advanced controls",
    description: "Fine-tune every detail with pro-grade parameters.",
    bar: "linear-gradient(180deg, #a855f7 0%, #FF2E9A 100%)",
    wash: "rgba(168,85,247,0.12)",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Features() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="mesh-section relative scroll-mt-24 py-12 md:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(123,97,255,0.5), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <motion.div
          className="mb-7 text-center md:mb-11"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] sm:text-xs"
            style={{ color: "var(--text-subtle)" }}
          >
            Capabilities
          </p>
          <h2
            className="font-display text-[clamp(1.6rem,4vw,3.1rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Limitless creativity
          </h2>
          <p
            className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed sm:mt-3 sm:text-base"
            style={{ color: "var(--text-muted)" }}
          >
            Powered by cutting-edge AI technology — tuned for prod pipelines, not toy demos.
          </p>
          <div
            className="mx-auto mt-5 h-px w-20 rounded-full sm:mt-6"
            style={{
              background: "linear-gradient(90deg, transparent, #7B61FF, #00D4FF, transparent)",
            }}
          />
        </motion.div>

        <motion.div
          className="mx-auto grid max-w-5xl gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3"
          variants={reduce ? undefined : container}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((f) => (
            <motion.article
              key={f.title}
              variants={reduce ? undefined : item}
              className="group premium-ring relative overflow-hidden rounded-xl border px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7B61FF]/30 hover:shadow-[0_16px_40px_-16px_rgba(123,97,255,0.22)] sm:rounded-[1.05rem] sm:px-4 sm:py-4 md:py-[0.95rem] md:pl-5"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full opacity-95 shadow-[0_0_12px_rgba(123,97,255,0.45)] transition-all duration-300 group-hover:shadow-[0_0_18px_rgba(123,97,255,0.55)]"
                style={{ background: f.bar }}
              />
              <div
                className="pointer-events-none absolute -right-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: f.wash }}
              />
              <h3
                className="relative pl-2.5 font-display text-[0.9375rem] font-bold leading-snug tracking-tight sm:pl-3 sm:text-base"
                style={{ color: "var(--text-primary)" }}
              >
                {f.title}
              </h3>
              <p
                className="relative mt-1.5 pl-2.5 text-xs leading-relaxed sm:mt-2 sm:pl-3 sm:text-[13px] sm:leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {f.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
