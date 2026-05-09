"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SITE_CONTAINER } from "@/lib/site-layout";

export function Hero() {
  // Animation variants for staggered entry
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.12, 
        delayChildren: 0.5 
      },
    },
  };

  const fadeUp = (delay: number = 0) => ({
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: "easeOut" as const,
        delay 
      } 
    },
  });

  const springIn = (delay: number = 0) => ({
    hidden: { opacity: 0, scale: 0.92 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.8, 
        ease: [0.34, 1.56, 0.64, 1] as const,
        delay 
      } 
    },
  });

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden pt-24 pb-12"
    >
      {/* Background glowing blobs (removed to let cinematic background shine) */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div className="absolute h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      <div className={`relative z-10 ${SITE_CONTAINER} flex flex-col items-center text-center px-4`}>
        {/* Badge */}
        <motion.div
          className="mb-6 flex items-center gap-3 rounded-full px-5 py-2 backdrop-blur-2xl border"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            background: "linear-gradient(90deg, rgba(59, 51, 115, 0.7) 0%, rgba(21, 58, 71, 0.7) 100%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)",
          }}
          initial="hidden"
          animate="visible"
          variants={fadeUp(0.3)}
        >
          <div className="relative flex h-2 w-2 items-center justify-center">
            <div className="absolute h-full w-full rounded-full bg-[#00D4FF] shadow-[0_0_10px_#00D4FF]" />
            <motion.div 
              className="absolute h-full w-full rounded-full bg-[#00D4FF]" 
              animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">
            ULTIMATE AI GENERATION
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="mb-8 flex flex-col items-center"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="font-display text-[clamp(36px,8vw,90px)] font-bold leading-[1.05] tracking-tight text-white drop-shadow-2xl"
            variants={fadeUp()}
          >
            Where imagination
          </motion.h1>
          <motion.h1
            className="font-display text-[clamp(36px,8vw,90px)] font-bold leading-[1.05] tracking-tight text-white/90 drop-shadow-2xl"
            variants={fadeUp()}
          >
            becomes{' '}
            <span 
              className="text-transparent bg-clip-text" 
              style={{
                backgroundImage: "linear-gradient(to right, #A855F7, #06B6D4, #A855F7)",
                backgroundSize: "200% auto",
                animation: "gradientShift 8s linear infinite",
              }}
            >
              reality.
            </span>
          </motion.h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="mt-6 max-w-[600px] font-sans text-[clamp(16px,4vw,20px)] font-medium leading-[1.6] text-white/60 tracking-tight"
          initial="hidden"
          animate="visible"
          variants={fadeUp(1.1)}
        >
          Cinematic real-time AI generation. Built for creators who refuse to compromise.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center w-full sm:w-auto"
          initial="hidden"
          animate="visible"
          variants={springIn(1.4)}
        >
          {/* Modern Clean Theme-Gradient Primary Button */}
          <Link
            href="/sign-up"
            className="group relative inline-flex items-center justify-center rounded-full px-8 py-3.5 sm:px-10 sm:py-4 text-[15px] sm:text-[16px] font-bold text-white transition-all duration-300 hover:scale-[1.03] shadow-[0_8px_30px_rgba(139,92,246,0.2)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.4)] overflow-hidden border-0"
            style={{
              background: "linear-gradient(135deg, #00CFFF, #8B5CF6, #FF2DAF)",
              backgroundSize: "200% auto",
              animation: "gradientShift 6s linear infinite",
            }}
          >
            {/* Sweeping Shimmer Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
              transform: "skewX(-20deg)",
              animation: "shimmer-move 2s infinite ease-in-out"
            }} />
            
            <span className="relative z-10 drop-shadow-sm tracking-wide">Start Creating Free</span>
          </Link>

          {/* Ultra-Premium Secondary Button */}
          <Link
            href="/demo"
            className="group relative inline-flex items-center justify-center rounded-full px-8 py-3.5 sm:px-10 sm:py-4 text-[15px] sm:text-[16px] font-medium text-white transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20" />
            <span className="relative z-10">Watch the Demo</span>
          </Link>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-2 text-[10px] tracking-[0.2em] text-white/40 uppercase"
          initial="hidden"
          animate="visible"
          variants={fadeUp(1.8)}
        >
          <motion.span 
            className="block h-10 w-[1px] bg-gradient-to-b from-white/60 to-transparent"
            animate={{ 
              scaleY: [0, 1, 0],
              y: [0, 10, 20],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut" as const
            }}
          />
          <span>Scroll to explore</span>
        </motion.div>
      </div>
    </section>
  );
}

/* Add the following CSS to globals.css or a dedicated module */
/*
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
*/
export default Hero;

