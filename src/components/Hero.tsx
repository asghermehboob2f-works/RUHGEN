"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import Link from "next/link";
import { SITE_CONTAINER } from "@/lib/site-layout";
import { Play } from "lucide-react";

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

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

  const badgeReveal: Variants = {
    hidden: { opacity: 0, scale: 0.9, filter: "blur(5px)" },
    visible: { 
      opacity: 1, 
      scale: 1,
      filter: "blur(0px)",
      transition: { 
        duration: 1, 
        ease: "easeOut"
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]" />
        
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
        className={`relative z-10 ${SITE_CONTAINER} flex flex-col items-center text-center px-6`}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="relative mb-20 inline-flex"
          variants={badgeReveal}
        >
          <div className="relative group flex items-center justify-center rounded-none border border-white/20 bg-white/[0.04] px-8 py-2 backdrop-blur-3xl transition-all duration-1000 hover:border-white/40 hover:bg-white/10">
            {/* Precision corner accents */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/40 transition-all duration-700 group-hover:border-white/70" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/40 transition-all duration-700 group-hover:border-white/70" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/40 transition-all duration-700 group-hover:border-white/70" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/40 transition-all duration-700 group-hover:border-white/70" />
            
            <span className="relative z-10 bg-gradient-to-r from-white/60 via-white to-white/60 bg-clip-text text-[8px] font-medium uppercase tracking-[1em] text-transparent drop-shadow-sm ml-[1em]">
              Ultimate AI Generation
            </span>
          </div>
        </motion.div>

        {/* 1. HERO HEADING - Classic & High-End */}
        <motion.div
          className="mb-24 flex flex-col items-center text-center"
          variants={fadeUpBlur}
        >
          <h1 className="font-display text-[clamp(48px,9vw,110px)] font-light leading-[0.95] tracking-tightest text-white selection:bg-white/10">
            <span className="block bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent drop-shadow-2xl">Where imagination</span>
            <span className="block mt-2 premium-text-shimmer bg-gradient-to-b from-white/90 via-white to-white/30 bg-clip-text text-transparent">becomes reality.</span>
          </h1>
          
          <motion.div 
            className="mt-6 flex items-center justify-center"
            variants={fadeUpBlur}
          >
            <span className="font-shooting-star text-[clamp(18px,2.2vw,24px)] font-normal tracking-[0.15em] text-white/50 lowercase">
              — instantly.
            </span>
          </motion.div>
        </motion.div>

        {/* 3 & 4. FRESH BUTTONS REDESIGN - Simple Clean Gradient */}
        <motion.div
          className="flex flex-col gap-6 sm:flex-row sm:items-center"
          variants={fadeUpBlur}
        >
          {/* PRIMARY: Bluish Gradient */}
          <Link
            href="/sign-up"
            className="group relative"
          >
            <motion.div 
              className="relative z-10 flex items-center justify-center rounded-full px-12 py-4 overflow-hidden transition-all duration-700 btn-gradient"
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
              className="relative z-10 flex items-center justify-center gap-3 rounded-full px-10 py-4 overflow-hidden transition-all duration-700 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 hover:bg-white/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-3.5 h-3.5 text-white fill-white/80" />
              <span className="relative z-20 text-[14px] font-medium tracking-wide text-white/90">
                Watch Demo
              </span>
            </motion.div>
          </Link>
        </motion.div>

        {/* 6. SCROLL INDICATOR - Even More Minimal */}
        <motion.div
          className="mt-28 flex flex-col items-center gap-6"
          variants={fadeUpBlur}
        >
          <div className="relative flex flex-col items-center">
            <div className="h-12 w-px bg-gradient-to-b from-white/20 to-transparent" />
            <motion.div 
              className="absolute top-0 w-px h-6 bg-white/40"
              animate={{
                y: [0, 24, 0],
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
