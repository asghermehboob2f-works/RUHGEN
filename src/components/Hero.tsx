"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import Link from "next/link";
import { SITE_CONTAINER } from "@/lib/site-layout";
import { Play, Sparkles, ArrowRight } from "lucide-react";
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
        staggerChildren: 0.25,
        delayChildren: 0.4
      },
    },
  };

  const fadeUpBlur: Variants = {
    hidden: { opacity: 0, y: 40, filter: "blur(15px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 1.4,
        ease: [0.16, 1, 0.3, 1]
      }
    },
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden pt-24 pb-20"
    >
      {/* Cinematic Background Atmosphere - Maximum Visibility */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: isLight
              ? "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 100%)"
              : "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)"
          }}
        />

        {/* Animated Light Leaks/Glows (Softer) */}
        <motion.div
          className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className={`relative z-10 ${SITE_CONTAINER} flex flex-col items-center justify-center text-center px-6 my-auto`}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* 1. HERO HEADING - Classic & High-End */}
        <motion.div
          className="mb-10 sm:mb-12 flex flex-col items-center text-center max-w-5xl"
          variants={fadeUpBlur}
        >
          <h1 className="font-display text-[clamp(44px,7.5vw,96px)] font-light leading-[0.98] tracking-tightest text-[var(--text-primary)] selection:bg-[var(--text-primary)]/10 drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
            <span className="block bg-gradient-to-b from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--text-primary)]/80 bg-clip-text text-transparent">Where imagination</span>
            <span className="block mt-2 premium-text-shimmer bg-gradient-to-b from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--text-primary)]/60 bg-clip-text text-transparent">becomes reality.</span>
          </h1>

          <motion.div
            className="mt-5 flex items-center justify-center"
            variants={fadeUpBlur}
          >
            <span className="font-shooting-star text-[clamp(18px,2vw,24px)] font-normal tracking-[0.15em] text-[var(--text-muted)] lowercase">
              — instantly.
            </span>
          </motion.div>
        </motion.div>

        {/* 2. BUTTONS - Centered Action Deck */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center justify-center"
          variants={fadeUpBlur}
        >
          {/* PRIMARY CTA BUTTON: Vibrant Gradient with Subtle Glow & Icon */}
          <Link href="/sign-up" className="group relative inline-flex">
            {/* Outer ambient glow */}
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#7B61FF] via-[#00D4FF] to-[#7B61FF] opacity-70 blur-md transition-all duration-500 group-hover:opacity-100 group-hover:blur-lg" />
            
            <motion.div 
              className="relative z-10 flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#7B61FF] via-[#258EFF] to-[#00D4FF] px-8 py-3.5 text-white shadow-xl transition-all duration-300 group-hover:brightness-110 active:scale-95 cursor-pointer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Sparkles className="h-4 w-4 text-cyan-200 animate-pulse" />
              <span className="font-display text-[15px] font-bold tracking-wide text-white drop-shadow">
                Start Creating Now
              </span>
              <ArrowRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.2} />
            </motion.div>
          </Link>

          {/* SECONDARY CTA BUTTON: Refined Glassmorphism with Hover Glow */}
          <Link href="/demo" className="group relative inline-flex">
            <motion.div 
              className="relative z-10 flex items-center justify-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--soft-black)] px-7 py-3.5 backdrop-blur-xl shadow-md transition-all duration-300 group-hover:border-[var(--primary-cyan)]/50 group-hover:bg-[var(--glass-hover)] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] active:scale-95 cursor-pointer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-cyan)]/15 text-[var(--primary-cyan)] transition-colors group-hover:bg-[var(--primary-cyan)] group-hover:text-black">
                <Play className="h-3 w-3 fill-current ml-0.5" />
              </div>
              <span className="font-display text-[15px] font-semibold tracking-wide text-[var(--text-primary)]">
                Watch Demo
              </span>
            </motion.div>
          </Link>
        </motion.div>

        {/* 3. SCROLL INDICATOR */}
        <motion.div
          className="mt-14 sm:mt-16 flex flex-col items-center gap-4"
          variants={fadeUpBlur}
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
