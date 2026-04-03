"use client";

import { motion } from "framer-motion";

type Props = { reduceMotion: boolean };

/**
 * Continuous ambient layer for Live studio — sits behind the glass panel.
 */
export function LiveStudioBackdrop({ reduceMotion }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Slow conic wash */}
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[min(200%,1400px)] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(123,97,255,0.22) 0deg, transparent 55deg, rgba(0,212,255,0.18) 120deg, transparent 185deg, rgba(255,46,154,0.14) 250deg, transparent 310deg, rgba(123,97,255,0.2) 360deg)",
          filter: "blur(2px)",
        }}
        animate={reduceMotion ? undefined : { rotate: [0, 360] }}
        transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
      />

      {/* Drifting orbs */}
      {!reduceMotion && (
        <>
          <motion.div
            className="absolute -left-[20%] top-[15%] h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(123,97,255,0.35) 0%, transparent 68%)", filter: "blur(48px)" }}
            animate={{ x: [0, 40, 0], y: [0, 24, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-[15%] bottom-[10%] h-[min(380px,50vw)] w-[min(380px,50vw)] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,212,255,0.28) 0%, transparent 70%)", filter: "blur(44px)" }}
            animate={{ x: [0, -36, 0], y: [0, -20, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute left-[30%] bottom-[25%] h-[min(280px,40vw)] w-[min(280px,40vw)] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,46,154,0.2) 0%, transparent 72%)", filter: "blur(40px)" }}
            animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
        </>
      )}
      {reduceMotion && (
        <>
          <div
            className="absolute -left-[10%] top-[20%] h-72 w-72 rounded-full opacity-30 blur-[60px]"
            style={{ background: "#7B61FF" }}
          />
          <div
            className="absolute -right-[10%] bottom-[15%] h-64 w-64 rounded-full opacity-25 blur-[56px]"
            style={{ background: "#00D4FF" }}
          />
        </>
      )}

      {/* Fine moving grid */}
      <motion.div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
        animate={reduceMotion ? undefined : { backgroundPosition: ["0px 0px", "48px 48px"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />

      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(123,97,255,0.12), transparent 55%), radial-gradient(ellipse 70% 50% at 80% 100%, rgba(0,212,255,0.1), transparent 50%)",
        }}
      />
    </div>
  );
}
