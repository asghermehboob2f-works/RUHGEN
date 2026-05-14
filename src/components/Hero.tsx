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
        {/* 2. TOP BADGE - Ultra-Luxury Minimalist */}
        <motion.div
          className="relative mb-20 group"
          variants={badgeReveal}
        >
          {/* Subtle flare effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-8 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
          
          <div className="relative px-8 py-3 flex items-center justify-center overflow-hidden">
            {/* Minimalist Corner Accents */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/30 transition-all duration-500 group-hover:w-4 group-hover:h-4 group-hover:border-white/60" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/30 transition-all duration-500 group-hover:w-4 group-hover:h-4 group-hover:border-white/60" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-white/30 transition-all duration-500 group-hover:w-4 group-hover:h-4 group-hover:border-white/60" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/30 transition-all duration-500 group-hover:w-4 group-hover:h-4 group-hover:border-white/60" />
            
            {/* Fine Shimmer Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <span className="text-[10px] font-medium uppercase tracking-[0.6em] text-white/50 group-hover:text-white/90 transition-all duration-700 ml-[0.6em]">
              Ultimate AI Generation
            </span>
          </div>
        </motion.div>

        {/* 1. HERO HEADING - Refined Alignment */}
        <motion.div
          className="mb-14 flex flex-col items-center"
          variants={fadeUpBlur}
        >
          <h1 className="font-display text-[clamp(48px,10vw,110px)] font-bold leading-[1] tracking-tighter text-white/60 selection:bg-white/10">
            <span className="block">Where imagination</span>
            <span className="block mt-1">becomes reality.</span>
          </h1>
          
          <motion.span 
            className="mt-4 font-shooting-star text-[clamp(14px,2vw,22px)] tracking-[0.3em] font-extralight text-white/50 opacity-80"
            variants={fadeUpBlur}
          >
            — instantly.
          </motion.span>
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
              className="relative z-10 flex items-center justify-center rounded-full px-10 py-3.5 overflow-hidden transition-all duration-500 btn-gradient"
              whileHover={{ y: -3, scale: 1.02 }}
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
              className="relative z-10 flex items-center justify-center gap-2.5 rounded-full px-9 py-3.5 overflow-hidden transition-all duration-500 bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-[#00D4FF]/40 hover:bg-white/[0.06]"
              whileHover={{ y: -3, scale: 1.02 }}
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
