"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    n: "01",
    title: "Enter prompt",
    description: "Describe your vision in natural language.",
  },
  {
    n: "02",
    title: "AI generates",
    description: "Watch as AI brings your idea to life in real time.",
  },
  {
    n: "03",
    title: "Download & share",
    description: "Export in high resolution and share anywhere.",
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 70%", "end 32%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 0.08, 0.92, 1], [0.04, 1, 1, 1]);
  const lineGlow = useTransform(scrollYProgress, [0, 1], [0.35, 1]);
  const lineBlurOpacity = useTransform(lineGlow, [0.35, 1], [0.3, 0.75]);

  return (
    <section
      ref={sectionRef}
      id="how"
      className="mesh-section relative scroll-mt-24 overflow-hidden py-12 md:py-24"
    >
      <div
        className="pointer-events-none absolute left-[max(0px,calc(50%-380px))] top-1/4 h-80 w-80 rounded-full opacity-[0.2] blur-[100px] md:left-[12%]"
        style={{ background: "#7B61FF" }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-[8%] h-72 w-72 rounded-full opacity-[0.15] blur-[90px]"
        style={{ background: "#00D4FF" }}
      />

      <div className="relative mx-auto max-w-[920px] px-3 sm:px-6 lg:px-10">
        <div className="mb-8 text-center md:mb-14">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            Workflow
          </p>
          <h2
            className="font-display text-[clamp(1.55rem,3.8vw,3rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            How it works
          </h2>
          <p
            className="mx-auto mt-2 max-w-lg text-sm leading-relaxed sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Three simple steps to create magic
          </p>
        </div>

        <div className="relative md:pl-4">
          {/* Rail */}
          <div
            className="absolute left-[22px] top-4 bottom-4 w-[3px] rounded-full md:left-[38px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            }}
            aria-hidden
          />

          {/* Animated flow */}
          <motion.div
            className="absolute left-[22px] top-4 w-[3px] origin-top rounded-full md:left-[38px]"
            style={{
              height: "calc(100% - 32px)",
              scaleY: reduce ? 1 : lineScale,
              opacity: reduce ? 1 : lineGlow,
              background: "linear-gradient(180deg, #7B61FF 0%, #00D4FF 45%, #FF2E9A 100%)",
              boxShadow:
                "0 0 24px rgba(123,97,255,0.6), 0 0 48px rgba(0,212,255,0.25), 210px 0 80px rgba(255,46,154,0.15)",
            }}
            aria-hidden
          />

          <motion.div
            className="pointer-events-none absolute left-[19px] top-4 w-[9px] origin-top rounded-full blur-sm md:left-[35px]"
            style={{
              height: "calc(100% - 32px)",
              scaleY: reduce ? 1 : lineScale,
              opacity: reduce ? 0.5 : lineBlurOpacity,
              background: "linear-gradient(180deg, rgba(123,97,255,0.8), rgba(0,212,255,0.5))",
            }}
            aria-hidden
          />

          <ol className="relative space-y-6 sm:space-y-8 md:space-y-10">
            {steps.map((s, i) => (
              <motion.li
                key={s.n}
                initial={reduce ? false : { opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="relative grid grid-cols-[auto_1fr] gap-4 sm:gap-6 md:gap-10"
              >
                <div className="relative z-10 flex w-11 flex-col items-center pt-0.5 md:w-[4.5rem]">
                  <motion.div
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full md:h-12 md:w-12"
                    style={{
                      background: "linear-gradient(145deg, var(--deep-black), var(--soft-black))",
                      boxShadow:
                        "0 0 0 2px rgba(123,97,255,0.55), 0 0 0 6px rgba(123,97,255,0.12), 0 12px 40px rgba(0,0,0,0.45)",
                    }}
                    whileInView={reduce ? undefined : { scale: [0.92, 1] }}
                    transition={{ duration: 0.35 }}
                    viewport={{ once: true }}
                    aria-hidden
                  >
                    <span className="absolute inset-0 rounded-full opacity-60 blur-md" style={{ background: "#7B61FF" }} />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-gradient-to-br from-white via-[#E8E0FF] to-[#00D4FF]" />
                  </motion.div>
                </div>

                <motion.div
                  className="relative overflow-hidden rounded-2xl border p-5 sm:rounded-[1.35rem] sm:p-7 md:p-8"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background:
                      "linear-gradient(165deg, var(--glass-elevated) 0%, var(--glass) 100%)",
                    backdropFilter: "blur(24px)",
                    boxShadow:
                      "0 24px 60px -20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
                  }}
                  whileHover={reduce ? undefined : { y: -2 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl"
                    style={{ background: i === 1 ? "#00D4FF" : i === 2 ? "#FF2E9A" : "#7B61FF" }}
                  />
                  <p className="relative text-gradient-primary text-[clamp(1.85rem,4.5vw,3.25rem)] font-black leading-none">
                    {s.n}
                  </p>
                  <h3
                    className="relative mt-3 text-lg font-bold capitalize sm:mt-4 sm:text-xl"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="relative mt-2 text-sm leading-relaxed sm:mt-3 sm:text-base"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {s.description}
                  </p>
                </motion.div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
