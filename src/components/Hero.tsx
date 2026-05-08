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
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden pt-16 pb-20"
    >
      {/* Background glowing blobs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <motion.div
          className="absolute -left-[10%] -top-[5%] h-[min(600px,80vw)] w-[min(600px,80vw)] rounded-full blur-[80px]"
          style={{ background: "#7B61FF", opacity: 0.12 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.12, rotate: 360 }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" as const }}
        />
        <motion.div
          className="absolute -right-[5%] bottom-[5%] h-[min(540px,75vw)] w-[min(540px,75vw)] rounded-full blur-[70px]"
          style={{ background: "#00D4FF", opacity: 0.1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1, rotate: -360 }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" as const }}
        />
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
          className="mb-8"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="font-display text-[clamp(48px,6vw,90px)] font-extrabold leading-[0.95] text-transparent bg-clip-text tracking-[-0.03em]"
            style={{
              backgroundImage: "linear-gradient(90deg, #00CFFF, #8B5CF6, #FF2DAF)",
              backgroundSize: "200%",
              animation: "gradientShift 8s ease infinite",
            }}
            variants={fadeUp()}
          >
            Where imagination
          </motion.h1>
          <motion.h1
            className="font-display text-[clamp(48px,6vw,90px)] font-extrabold leading-[0.95] text-transparent bg-clip-text tracking-[-0.03em]"
            style={{
              backgroundImage: "linear-gradient(90deg, #00CFFF, #8B5CF6, #FF2DAF)",
              backgroundSize: "200%",
              animation: "gradientShift 8s ease infinite",
            }}
            variants={fadeUp()}
          >
            becomes
          </motion.h1>
          <motion.h1
            className="font-display text-[clamp(56px,8vw,110px)] font-black leading-[1] text-transparent bg-clip-text tracking-[-0.04em]"
            style={{
              backgroundImage: "linear-gradient(90deg, #00CFFF, #8B5CF6, #FF2DAF)",
              backgroundSize: "200%",
              animation: "gradientShift 8s ease infinite",
            }}
            variants={fadeUp()}
          >
            reality
          </motion.h1>
          <motion.h2
            className="mt-4 font-sans text-[clamp(18px,2vw,22px)] font-medium tracking-tight text-white/50"
            variants={fadeUp()}
          >
            — instantly.
          </motion.h2>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="max-w-[480px] font-sans text-[clamp(15px,1.8vw,19px)] leading-[1.7] text-white/65 tracking-[0.01em]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          initial="hidden"
          animate="visible"
          variants={fadeUp(1.1)}
        >
          Cinematic AI. Real-time. Built for creators who refuse to compromise.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center"
          initial="hidden"
          animate="visible"
          variants={springIn(1.4)}
        >
          <Link
            href="/sign-up"
            className="group relative inline-flex items-center justify-center rounded-full px-10 py-4 text-[15px] font-bold text-white transition-all duration-300 hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #00CFFF, #8B5CF6, #FF2DAF)",
              backgroundSize: "200%",
              animation: "gradientShift 8s ease infinite",
              boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.5)",
            }}
          >
            Start Creating Free
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-full border px-10 py-4 text-[15px] font-bold text-white bg-white/5 border-white/15 backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:bg-white/10 hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Watch the Demo
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

