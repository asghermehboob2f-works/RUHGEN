"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type Props = { reduceMotion: boolean };

/** Deep anchors — pairs with site tokens (--primary-purple / --primary-cyan). */
const DEEP_PURPLE = "99, 44, 101"; // #632c65
const DEEP_TEAL = "0, 77, 77"; // #004d4d
const VIOLET = "123, 97, 255";
const CYAN = "0, 212, 255";
const PINK = "255, 46, 154";

function ParticleField({ reduceMotion }: { reduceMotion: boolean }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        left: `${((i * 17 + 7) * 7) % 100}%`,
        top: `${((i * 23 + 11) * 5) % 100}%`,
        size: 1 + (i % 3),
        delay: (i * 0.31) % 4.2,
        duration: 5 + (i % 7) * 0.35,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            background: `rgba(${CYAN}, ${0.35 + (d.id % 4) * 0.08})`,
            boxShadow: `0 0 ${6 + d.size}px rgba(${VIOLET}, 0.35)`,
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.15, 0.85, 0.2],
                  scale: [1, 1.4, 1],
                  y: [0, -12, 0],
                }
          }
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Ambient “live studio” layer: aurora mesh, liquid blobs, horizon beam, grain.
 * Tuned to site purple / cyan / pink + deep #632c65 / #004d4d anchors.
 */
export function LiveStudioBackdrop({ reduceMotion }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Void + deep color anchors */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 85% at 50% 120%, #000000 0%, #030308 45%, transparent 72%),
            radial-gradient(ellipse 80% 70% at -5% 20%, rgba(${DEEP_PURPLE}, 0.55), transparent 58%),
            radial-gradient(ellipse 75% 65% at 105% 75%, rgba(${DEEP_TEAL}, 0.5), transparent 55%),
            radial-gradient(ellipse 55% 50% at 50% -10%, rgba(${DEEP_PURPLE}, 0.2), transparent 50%),
            #000000
          `,
        }}
      />

      {/* Slow dual conic — interference / “portal” feel */}
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[min(220%,1600px)] -translate-x-1/2 -translate-y-[42%]"
        style={{
          background: `conic-gradient(
            from 0deg at 50% 50%,
            rgba(${VIOLET}, 0.14) 0deg,
            transparent 42deg,
            rgba(${CYAN}, 0.12) 95deg,
            transparent 155deg,
            rgba(${PINK}, 0.1) 210deg,
            transparent 275deg,
            rgba(${VIOLET}, 0.11) 360deg
          )`,
          filter: "blur(3px)",
        }}
        animate={reduceMotion ? undefined : { rotate: [0, 360] }}
        transition={{ duration: 52, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-1/2 top-[58%] aspect-square w-[min(180%,1200px)] -translate-x-1/2 -translate-y-1/2 opacity-70"
        style={{
          background: `conic-gradient(
            from 180deg at 50% 50%,
            transparent 0deg,
            rgba(${CYAN}, 0.16) 70deg,
            transparent 130deg,
            rgba(${VIOLET}, 0.14) 200deg,
            transparent 270deg,
            rgba(${CYAN}, 0.1) 360deg
          )`,
          filter: "blur(4px)",
        }}
        animate={reduceMotion ? undefined : { rotate: [0, -360] }}
        transition={{ duration: 72, repeat: Infinity, ease: "linear" }}
      />

      {/* Aurora ribbons — sweeping light */}
      {!reduceMotion && (
        <>
          <motion.div
            className="absolute -left-1/4 top-[8%] h-[min(90%,620px)] w-[140%] -rotate-[12deg] opacity-45"
            style={{
              background: `linear-gradient(
                105deg,
                transparent 0%,
                rgba(${VIOLET}, 0) 25%,
                rgba(${VIOLET}, 0.22) 48%,
                rgba(${CYAN}, 0.18) 55%,
                rgba(${VIOLET}, 0) 78%,
                transparent 100%
              )`,
              filter: "blur(38px)",
            }}
            animate={{ x: ["-8%", "12%", "-8%"], opacity: [0.32, 0.5, 0.32] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-1/4 bottom-[5%] h-[min(75%,520px)] w-[130%] rotate-[8deg] opacity-40"
            style={{
              background: `linear-gradient(
                285deg,
                transparent,
                rgba(${DEEP_TEAL}, 0.35) 35%,
                rgba(${CYAN}, 0.2) 52%,
                rgba(${PINK}, 0.12) 65%,
                transparent
              )`,
              filter: "blur(44px)",
            }}
            animate={{ x: ["6%", "-14%", "6%"], y: [0, 18, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
        </>
      )}

      {/* Organic liquid blobs */}
      {!reduceMotion ? (
        <>
          <motion.div
            className="absolute -left-[25%] top-[5%] h-[min(480px,58vw)] w-[min(520px,62vw)]"
            style={{
              background: `radial-gradient(
                ellipse 75% 65% at 40% 45%,
                rgba(${VIOLET}, 0.42) 0%,
                rgba(${DEEP_PURPLE}, 0.15) 42%,
                transparent 70%
              )`,
              filter: "blur(52px)",
              borderRadius: "38% 62% 72% 28% / 44% 38% 62% 56%",
            }}
            animate={{
              x: [0, 45, 10, 0],
              y: [0, 22, -8, 0],
              scale: [1, 1.07, 0.98, 1],
              rotate: [0, 6, -4, 0],
            }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-[18%] top-[28%] h-[min(420px,52vw)] w-[min(460px,55vw)]"
            style={{
              background: `radial-gradient(
                circle at 55% 40%,
                rgba(${CYAN}, 0.38) 0%,
                rgba(${DEEP_TEAL}, 0.22) 38%,
                transparent 68%
              )`,
              filter: "blur(48px)",
              borderRadius: "60% 40% 30% 70% / 55% 45% 55% 45%",
            }}
            animate={{
              x: [0, -38, -12, 0],
              y: [0, 28, 8, 0],
              scale: [1, 1.09, 1.02, 1],
            }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
          <motion.div
            className="absolute left-[18%] bottom-[8%] h-[min(360px,48vw)] w-[min(400px,50vw)]"
            style={{
              background: `radial-gradient(
                circle,
                rgba(${PINK}, 0.22) 0%,
                rgba(${VIOLET}, 0.12) 45%,
                transparent 70%
              )`,
              filter: "blur(46px)",
              borderRadius: "45% 55% 48% 52% / 52% 48% 58% 42%",
            }}
            animate={{
              opacity: [0.55, 0.95, 0.6],
              scale: [0.95, 1.08, 0.98],
              x: [0, 20, -15, 0],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
          <motion.div
            className="absolute right-[12%] top-[12%] h-[min(280px,38vw)] w-[min(320px,40vw)] opacity-80"
            style={{
              background: `radial-gradient(circle, rgba(${CYAN}, 0.35) 0%, transparent 65%)`,
              filter: "blur(36px)",
            }}
            animate={{ opacity: [0.4, 0.75, 0.45], y: [0, -24, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute -left-[10%] top-[15%] h-80 w-80 opacity-30 blur-[68px]"
            style={{
              background: `radial-gradient(circle, rgba(${VIOLET}, 0.5), transparent 70%)`,
            }}
          />
          <div
            className="absolute -right-[8%] bottom-[12%] h-72 w-72 opacity-25 blur-[64px]"
            style={{
              background: `radial-gradient(circle, rgba(${CYAN}, 0.45), transparent 70%)`,
            }}
          />
          <div
            className="absolute left-1/3 bottom-[20%] h-56 w-56 opacity-20 blur-[56px]"
            style={{
              background: `radial-gradient(circle, rgba(${PINK}, 0.35), transparent 70%)`,
            }}
          />
        </>
      )}

      {/* Horizon glow — stage lighting */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[45%]"
        style={{
          background: `linear-gradient(
            to top,
            rgba(${DEEP_TEAL}, 0.35) 0%,
            rgba(${CYAN}, 0.08) 35%,
            transparent 100%
          )`,
          mixBlendMode: "screen",
        }}
        animate={reduceMotion ? undefined : { opacity: [0.5, 0.72, 0.52] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <ParticleField reduceMotion={reduceMotion} />

      {/* Perspective grid — depth */}
      <motion.div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          transformOrigin: "50% 100%",
          transform: "perspective(420px) rotateX(68deg) scale(1.15)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 35%, black 75%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 35%, black 75%, transparent 100%)",
        }}
        animate={reduceMotion ? undefined : { backgroundPosition: ["0px 0px", "56px 56px"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      />

      {/* Secondary fine grid drift */}
      <motion.div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
        animate={reduceMotion ? undefined : { backgroundPosition: ["0px 0px", "-32px -32px"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      {/* Soft caustic veil */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: 0.5,
          background: `radial-gradient(ellipse 65% 50% at 25% 20%, rgba(${VIOLET}, 0.14), transparent 55%),
            radial-gradient(ellipse 55% 48% at 78% 82%, rgba(${CYAN}, 0.12), transparent 52%),
            radial-gradient(ellipse 45% 38% at 55% 108%, rgba(${PINK}, 0.08), transparent 58%)`,
          mixBlendMode: "screen",
        }}
        animate={reduceMotion ? undefined : { opacity: [0.42, 0.58, 0.44] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Film grain / texture */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Specular sweep */}
      {!reduceMotion && (
        <motion.div
          className="absolute -left-1/3 top-[20%] h-[120%] w-[55%] opacity-[0.09]"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
            transform: "rotate(18deg)",
            mixBlendMode: "soft-light",
          }}
          animate={{ x: ["-20%", "140%"] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
        />
      )}

      {/* Edge vignette — focus on center card */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 72% 65% at 50% 45%, transparent 0%, rgba(0,0,0,0.45) 88%, rgba(0,0,0,0.78) 100%)",
        }}
      />
    </div>
  );
}
