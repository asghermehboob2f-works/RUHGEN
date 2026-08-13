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
          className="flex flex-col gap-5 sm:flex-row sm:items-center justify-center"
          variants={fadeUpBlur}
        >
          {/* PRIMARY: Bluish Gradient */}
          <Link
            href="/sign-up"
            className="group relative"
          >
            <motion.div 
              className="relative z-10 flex items-center justify-center rounded-full px-10 py-3.5 overflow-hidden transition-all duration-700 btn-gradient"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-20 text-[14px] font-semibold tracking-wide text-white">
                Start Creating Now
              </span>
            </motion.div>
          </Link>

          {/* SECONDARY: Glass with refined border */}
          <Link
            href="/demo"
            className="group relative"
          >
            <motion.div 
              className="relative z-10 flex items-center justify-center gap-3 rounded-full px-9 py-3.5 overflow-hidden transition-all duration-700 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border-subtle)] hover:border-[var(--text-primary)]/30 hover:bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-3.5 h-3.5 text-[var(--text-primary)] fill-[var(--text-primary)]/80" />
              <span className="relative z-20 text-[14px] font-medium tracking-wide text-[var(--text-primary)]/90">
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
