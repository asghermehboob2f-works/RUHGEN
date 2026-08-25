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
        className={`relative z-10 ${SITE_CONTAINER} flex flex-col items-center justify-center text-center px-6 my-auto`}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* 1. HERO HEADING - High-End & Crisp */}
        <motion.div
          className="mb-10 sm:mb-12 flex flex-col items-center text-center max-w-5xl"
          variants={fadeUp}
        >
          <h1 className="font-display text-[clamp(44px,7.5vw,96px)] font-light leading-[0.98] tracking-tightest text-[var(--text-primary)] selection:bg-[var(--text-primary)]/10 drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
            <span className="block bg-gradient-to-b from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--text-primary)]/80 bg-clip-text text-transparent">Where imagination</span>
            <span className="block mt-2 premium-text-shimmer bg-gradient-to-b from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--text-primary)]/60 bg-clip-text text-transparent">becomes reality.</span>
          </h1>

          <motion.div
            className="mt-5 flex items-center justify-center"
            variants={fadeUp}
          >
            <span className="font-shooting-star text-[clamp(18px,2vw,24px)] font-normal tracking-[0.15em] text-[var(--text-muted)] lowercase">
              — instantly.
            </span>
          </motion.div>
        </motion.div>

        {/* 2. HERO CTA BUTTON SYSTEM - Side-by-Side & Compact Sizing */}
        <motion.div
          className="flex flex-row items-center justify-center gap-2.5 sm:gap-3.5 max-w-full px-2"
          variants={fadeUp}
        >
          {/* PRIMARY CTA: Deep Refined Royal Electric Blue */}
          <Link href="/sign-up" className="group relative inline-flex shrink-0">
            <div 
              className="relative z-10 flex items-center justify-center rounded-full border border-blue-400/20 bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-5 sm:px-7 py-2.5 sm:py-3 text-white font-sans text-[13.5px] sm:text-[14.5px] font-semibold tracking-tight whitespace-nowrap shadow-sm transition-all duration-250 ease-out group-hover:-translate-y-0.5 group-hover:bg-[#2563EB]/90 group-hover:backdrop-blur-sm group-hover:border-blue-400/40 group-active:translate-y-0 cursor-pointer"
            >
              <span className="relative z-10 text-white">
                Start Creating Now
              </span>
            </div>
          </Link>

          {/* SECONDARY CTA: Dark Translucent Charcoal */}
          <Link href="/demo" className="group relative inline-flex shrink-0">
            <div 
              className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-white/12 bg-[#121215]/45 px-5 sm:px-7 py-2.5 sm:py-3 text-white/90 font-sans text-[13.5px] sm:text-[14.5px] font-medium tracking-tight whitespace-nowrap shadow-sm transition-all duration-250 ease-out group-hover:-translate-y-0.5 group-hover:border-white/25 group-hover:bg-white/[0.08] group-hover:backdrop-blur-sm group-hover:text-white group-active:translate-y-0 cursor-pointer"
            >
              <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current text-white/90 transition-transform duration-250 group-hover:scale-105" />
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
