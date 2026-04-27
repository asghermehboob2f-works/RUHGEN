"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

export type HeroPointer = { x: number; y: number };

type SpotlightHeroGraphicProps = {
  className?: string;
  pointer: HeroPointer;
  hovered: boolean;
};

/** Snappy cursor follow */
const snap = { type: "spring" as const, stiffness: 68, damping: 18, mass: 0.42 };
/** Slower parallax depth */
const drift = { type: "spring" as const, stiffness: 38, damping: 26, mass: 0.55 };
/** Lagging “mass” layer */
const lag = { type: "spring" as const, stiffness: 22, damping: 28, mass: 0.75 };

/**
 * Hero field: grid + hover-reactive wash; no cursor spotlight orbs.
 * Ink-forward palette (slate / indigo); grid gains opacity on hero hover.
 */
export function SpotlightHeroGraphic({
  className = "",
  pointer,
  hovered,
}: SpotlightHeroGraphicProps) {
  const reduce = useReducedMotion() === true;
  const p = useMemo(() => (reduce ? { x: 0, y: 0 } : pointer), [reduce, pointer.x, pointer.y]);

  const live = hovered && !reduce;
  const lift = hovered ? 1 : 0.34;

  return (
    <div className={`pointer-events-none absolute inset-0 min-h-full overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[#02030a]" aria-hidden />

      {/* Cool lift on hover — still nudges slightly with pointer */}
      <motion.div
        className="absolute inset-0"
        aria-hidden
        animate={
          reduce
            ? { opacity: hovered ? 0.72 : 0.38 }
            : {
                opacity: hovered ? 0.78 : 0.32,
                scale: hovered ? 1.02 : 1,
                x: p.x * 14 * lift,
                y: p.y * 10 * lift,
              }
        }
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], x: drift, y: drift }}
        style={{
          background: `
            linear-gradient(180deg, rgba(15,23,42,0.55) 0%, transparent 18%),
            linear-gradient(125deg, rgba(2,6,23,0.88) 0%, transparent 46%),
            radial-gradient(ellipse 90% 65% at 50% 108%, rgba(30,27,75,0.28), transparent 58%)
          `,
        }}
      />

      {/* Primary jewel wash — heavy pointer parallax */}
      <motion.div
        className="absolute inset-[-25%] mix-blend-soft-light"
        aria-hidden
        animate={
          reduce
            ? { opacity: hovered ? 0.42 : 0.14 }
            : {
                opacity: hovered ? 0.52 : 0.16,
                x: p.x * 72,
                y: p.y * 52,
              }
        }
        transition={{ opacity: { duration: 0.45, ease: "easeOut" }, x: snap, y: snap }}
        style={{
          background: `
            radial-gradient(ellipse 68% 58% at 18% 22%, rgba(49,46,129,0.18), transparent 54%),
            radial-gradient(ellipse 58% 52% at 88% 18%, rgba(30,58,138,0.12), transparent 52%),
            radial-gradient(ellipse 52% 48% at 72% 88%, rgba(15,118,110,0.08), transparent 50%),
            radial-gradient(ellipse 48% 42% at 8% 78%, rgba(30,41,59,0.2), transparent 52%)
          `,
        }}
      />

      {/* Counter-drifting depth — opposite sign = parallax volume */}
      <motion.div
        className="absolute inset-[-18%] mix-blend-soft-light"
        aria-hidden
        animate={
          reduce
            ? { opacity: hovered ? 0.22 : 0.07 }
            : {
                opacity: hovered ? 0.32 : 0.08,
                x: p.x * -48,
                y: p.y * -36,
              }
        }
        transition={{ opacity: { duration: 0.45 }, x: lag, y: lag }}
        style={{
          background: `
            radial-gradient(ellipse 55% 50% at 55% 35%, rgba(51,65,85,0.14), transparent 55%),
            radial-gradient(ellipse 50% 45% at 30% 70%, rgba(30,41,59,0.18), transparent 52%)
          `,
        }}
      />

      {/* Slow chroma — sapphire / indigo / slate (premium, no magenta candy) */}
      {live && (
        <motion.div
          className="absolute inset-[-45%] mix-blend-soft-light"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2, rotate: [0, 360] }}
          transition={{
            opacity: { duration: 0.5, ease: "easeOut" },
            rotate: { duration: 160, repeat: Infinity, ease: "linear" },
          }}
          style={{
            background:
              "conic-gradient(from 220deg at 50% 45%, rgba(15,23,42,0.35), rgba(30,27,75,0.28), rgba(30,58,138,0.12), rgba(15,118,110,0.06), rgba(30,41,59,0.22), rgba(15,23,42,0.35))",
          }}
        />
      )}

      {/* Edge blooms — large motion tied to pointer */}
      {!reduce && (
        <>
          <motion.div
            className="absolute -left-[28%] top-[6%] h-[min(58vh,460px)] w-[min(95vw,680px)] rounded-[100%] blur-3xl"
            style={{
              background:
                "linear-gradient(118deg, rgba(30,27,75,0.32), rgba(30,58,138,0.1), rgba(15,23,42,0.12) 78%, transparent 84%)",
            }}
            animate={{
              x: p.x * -62 + (hovered ? 0 : p.x * 8),
              y: p.y * 44,
              opacity: hovered ? 0.26 : 0.08,
              scale: hovered ? 1.04 : 0.9,
            }}
            transition={{ ...snap, opacity: { duration: 0.45 }, scale: { duration: 0.45 } }}
            aria-hidden
          />
          <motion.div
            className="absolute -right-[22%] bottom-[2%] h-[min(52vh,400px)] w-[min(90vw,640px)] rounded-[100%] blur-3xl"
            style={{
              background:
                "linear-gradient(298deg, rgba(15,23,42,0.35), rgba(30,41,59,0.28), rgba(30,27,75,0.18) 72%, transparent 82%)",
            }}
            animate={{
              x: p.x * 58,
              y: p.y * -40,
              opacity: hovered ? 0.34 : 0.1,
              scale: hovered ? 1.04 : 0.88,
            }}
            transition={{ ...drift, opacity: { duration: 0.45 }, scale: { duration: 0.45 } }}
            aria-hidden
          />
        </>
      )}

      {/* Foil diagonal — rotates with horizontal pointer */}
      <motion.div
        className="absolute inset-[-60%] mix-blend-overlay"
        aria-hidden
        animate={
          reduce
            ? { opacity: hovered ? 0.08 : 0 }
            : {
                opacity: hovered ? 0.12 : 0.03,
                rotate: p.x * 14 - p.y * 6,
                x: p.x * 24,
                y: p.y * 18,
              }
        }
        transition={{ opacity: { duration: 0.4 }, rotate: drift, x: drift, y: drift }}
        style={{
          background:
            "linear-gradient(105deg, transparent 35%, rgba(30,41,59,0.14) 48%, rgba(51,65,85,0.1) 52%, transparent 65%)",
        }}
      />

      {/* Grid — hero hover brightens + pointer parallax */}
      <motion.div
        className="absolute inset-0 bg-[length:52px_52px] will-change-transform max-md:bg-[length:40px_40px]"
        aria-hidden
        animate={
          reduce
            ? { opacity: hovered ? 0.2 : 0.1 }
            : {
                opacity: hovered ? 0.48 : 0.22,
                x: p.x * 22,
                y: p.y * 18,
                rotate: p.x * 1.2 - p.y * 0.6,
                scale: hovered ? 1.01 : 1,
              }
        }
        transition={{ opacity: { duration: 0.4 }, x: drift, y: drift, rotate: drift, scale: { duration: 0.35, ease: "easeOut" } }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(100,116,139,0.9) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,116,139,0.9) 1px, transparent 1px)
          `,
          maskImage: "radial-gradient(ellipse 92% 90% at 50% 32%, black 52%, transparent 86%)",
          WebkitMaskImage: "radial-gradient(ellipse 92% 90% at 50% 32%, black 52%, transparent 86%)",
        }}
      />

      <motion.div
        className="absolute inset-x-0 bottom-0 h-[54%]"
        aria-hidden
        animate={{ opacity: hovered ? 0.92 : 0.62 }}
        transition={{ duration: 0.45 }}
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.55) 48%, rgba(2,6,23,0.88) 100%)",
        }}
      />

      <motion.div
        className="absolute left-[6%] right-[6%] top-0 h-px origin-center max-md:left-[3%] max-md:right-[3%]"
        aria-hidden
        animate={
          reduce
            ? { opacity: hovered ? 0.35 : 0.12, scaleX: hovered ? 1 : 0.72 }
            : {
                opacity: hovered ? 0.32 : 0.1,
                scaleX: hovered ? 1 : 0.62,
                x: p.x * 36,
              }
        }
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], x: drift }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(51,65,85,0.35), rgba(30,58,138,0.2), transparent)",
          boxShadow: hovered ? "0 0 20px rgba(30,58,138,0.08)" : "0 0 10px rgba(2,6,23,0.4)",
        }}
      />

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] origin-center"
        aria-hidden
        animate={{
          opacity: hovered ? 0.55 : 0.22,
          scaleX: hovered ? 1 : 0.82,
          x: reduce ? 0 : p.x * 52,
        }}
        transition={{ duration: 0.45, ease: "easeOut", x: snap }}
        style={{
          background:
            "linear-gradient(90deg, transparent 6%, rgba(30,58,138,0.35) 28%, rgba(49,46,129,0.4) 50%, rgba(15,118,110,0.22) 74%, transparent 96%)",
          boxShadow: hovered ? "0 0 24px rgba(30,27,75,0.35)" : "0 0 10px rgba(2,6,23,0.5)",
        }}
      />

      <motion.div
        className="absolute inset-0 mix-blend-overlay"
        aria-hidden
        animate={{ opacity: reduce ? (hovered ? 0.035 : 0.018) : hovered ? 0.045 : 0.024 }}
        transition={{ duration: 0.35 }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 100% 52% at 50% -8%, rgba(15,23,42,0.45), transparent 42%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.58) 100%)",
        }}
      />
    </div>
  );
}
