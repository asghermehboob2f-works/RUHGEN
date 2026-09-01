"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import Link from "next/link";
import { SITE_CONTAINER } from "@/lib/site-layout";
import { Play } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden pt-24 pb-20"
    >
      {/* Cinematic Background Atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: isLight
              ? "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, rgba(0,0,0,0.02) 100%)"
              : "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)"
          }}
        />
      </div>

      <motion.div
        className={`relative z-10 ${SITE_CONTAINER} flex flex-col items-center justify-center text-center px-3 sm:px-6 my-auto`}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* 1. HERO HEADING - Dominant Responsive Typography & Perfect Optical Alignment */}
        <motion.div
          className="mb-6 sm:mb-12 flex flex-col items-center text-center max-w-5xl w-full px-3 sm:px-6"
          variants={fadeUp}
        >
          <h1 className="flex flex-col items-center justify-center text-center selection:bg-white/20 w-full">
            <span
              className={`block font-toqsi text-[clamp(25px,6.2vw,62px)] leading-[1.15] tracking-[0.05em] whitespace-nowrap transition-colors duration-300 ${
                isLight ? "text-black" : "text-white"
              }`}
            >
              Where imagination
            </span>
            <span
              className={`block mt-1 sm:mt-2.5 font-nareko text-[clamp(32px,9vw,90px)] leading-[1.08] tracking-tight whitespace-nowrap transition-colors duration-300 ${
                isLight ? "text-black" : "text-white"
              }`}
            >
              becomes{" "}
              <span
                className="bg-clip-text text-transparent inline-block"
                style={{
                  backgroundImage: isLight
                    ? "linear-gradient(90deg, #E69D00 0%, #C47F00 35%, #8C5200 70%, #593300 100%)"
                    : "linear-gradient(90deg, #FFF4BA 0%, #FFCC00 30%, #E68A00 70%, #B35900 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                reality.
              </span>
            </span>
          </h1>

          <motion.div
            className="mt-3.5 sm:mt-6 flex items-center justify-center"
            variants={fadeUp}
          >
            <span
              className={`font-shooting-star text-[clamp(14px,3.2vw,22px)] font-normal tracking-[0.18em] lowercase transition-colors duration-300 ${
                isLight ? "text-black" : "text-[var(--text-muted)]"
              }`}
            >
              — instantly.
            </span>
          </motion.div>
        </motion.div>

        {/* 2. HERO CTA BUTTON SYSTEM - Sleek & Premium Refined Buttons */}
        <motion.div
          className="flex flex-row items-center justify-center gap-2 sm:gap-3.5 max-w-full px-1"
          variants={fadeUp}
        >
          {/* PRIMARY CTA */}
          <Link href="/sign-up" className="group relative inline-flex shrink-0">
            <div
              className={`relative z-10 flex items-center justify-center rounded-full px-4 sm:px-8 py-2.5 sm:py-3.5 font-sans text-[12px] sm:text-[14.5px] font-semibold tracking-tight whitespace-nowrap shadow-md transition-all duration-200 group-hover:-translate-y-0.5 group-hover:opacity-90 active:translate-y-0 cursor-pointer ${
                isLight ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              <span className="relative z-10">
                Start Creating Now
              </span>
            </div>
          </Link>

          {/* SECONDARY CTA */}
          <Link href="/demo" className="group relative inline-flex shrink-0">
            <div
              className={`relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border px-4 sm:px-8 py-2.5 sm:py-3.5 font-sans text-[12px] sm:text-[14.5px] font-medium tracking-tight whitespace-nowrap shadow-sm backdrop-blur-md transition-all duration-200 group-hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                isLight
                  ? "bg-white/80 border-black/15 text-black group-hover:bg-white group-hover:border-black/30"
                  : "border-border bg-card/60 text-foreground group-hover:bg-card/90 group-hover:border-border/80"
              }`}
            >
              <Play className={`h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current transition-transform duration-200 group-hover:scale-105 ${isLight ? "text-black" : "text-foreground"}`} />
              <span>Watch Demo</span>
            </div>
          </Link>
        </motion.div>

        {/* 3. SCROLL INDICATOR - Pushed down slightly relative to buttons */}
        <motion.div
          className="mt-16 sm:mt-24 flex flex-col items-center gap-4"
          variants={fadeUp}
        >
          <div className="relative flex flex-col items-center">
            <div className="h-10 w-px bg-gradient-to-b from-[var(--border-subtle)] to-transparent" />
            <motion.div
              className="absolute top-0 w-px h-5 bg-[var(--text-muted)]"
              animate={{
                y: [0, 20, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;
