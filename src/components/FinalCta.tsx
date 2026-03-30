"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

export function FinalCta() {
  const reduce = useReducedMotion();

  return (
    <section
      id="cta"
      className="mesh-section relative scroll-mt-24 overflow-hidden py-14 md:py-28"
    >
      <motion.div
        className="pointer-events-none absolute left-1/4 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-[140px]"
        style={{ background: "#7B61FF", opacity: 0.2 }}
        animate={
          reduce
            ? undefined
            : { scale: [1, 1.05, 1], opacity: [0.15, 0.22, 0.15] }
        }
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 right-1/4 h-[280px] w-[280px] translate-x-1/2 rounded-full blur-[130px]"
        style={{ background: "#00D4FF", opacity: 0.18 }}
        animate={
          reduce
            ? undefined
            : { scale: [1, 1.06, 1], opacity: [0.12, 0.2, 0.12] }
        }
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{ background: "#FF2E9A", opacity: 0.12 }}
        animate={
          reduce
            ? undefined
            : { opacity: [0.08, 0.16, 0.08] }
        }
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-3 text-center sm:px-6">
        <h2 className="font-display text-[clamp(1.65rem,5.5vw,4rem)] font-extrabold leading-tight tracking-tight sm:text-[clamp(2rem,6vw,4rem)]">
          <span className="text-gradient-hero">
            Ready to create your vision?
          </span>
        </h2>
        <p
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:mt-6 sm:text-lg md:text-xl"
          style={{ color: "var(--text-muted)" }}
        >
          Join thousands of creators pushing the boundaries of imagination—with
          cinematic tools that feel like the future.
        </p>
        <div className="mt-8 sm:mt-10">
          <Link
            href="/sign-up"
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl px-8 py-4 text-base font-bold text-white transition-transform hover:scale-105 sm:px-10 sm:py-5 sm:text-lg"
            style={{
              background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
              boxShadow: "0 0 50px rgba(123, 97, 255, 0.8)",
            }}
          >
            Get started free
          </Link>
        </div>
      </div>
    </section>
  );
}
