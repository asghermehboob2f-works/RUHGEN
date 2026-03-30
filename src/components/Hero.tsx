"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { NeuralBackground } from "./NeuralBackground";

const previews = [
  {
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
    alt: "Abstract fluid art",
    prompt: "Neon liquid glass, 8k",
  },
  {
    src: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&q=80",
    alt: "Sci-fi corridor",
    prompt: "Brutalist sci-fi atrium",
  },
  {
    src: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80",
    alt: "Portrait concept",
    prompt: "Cinematic portrait, fog",
  },
  {
    src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    alt: "Neon city",
    prompt: "Cyberpunk skyline dusk",
  },
];

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      id="hero"
      className="mesh-section relative flex min-h-[100dvh] flex-col justify-end overflow-hidden pb-12 pt-[max(6rem,env(safe-area-inset-top,0px)+5rem)] sm:justify-center sm:pb-20 sm:pt-28 md:pt-32"
    >
      {!reduce ? (
        <>
          <motion.div
            className="pointer-events-none absolute -left-48 top-16 h-[min(480px,50vw)] w-[min(480px,50vw)] rounded-full blur-[160px]"
            style={{ background: "#7B61FF", opacity: 0.22 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.26, 0.18] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -right-40 bottom-24 h-[min(440px,48vw)] w-[min(440px,48vw)] rounded-full blur-[150px]"
            style={{ background: "#00D4FF", opacity: 0.2 }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.16, 0.24, 0.16] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </>
      ) : (
        <>
          <div
            className="pointer-events-none absolute -left-48 top-16 h-[420px] w-[420px] rounded-full blur-[160px]"
            style={{ background: "#7B61FF", opacity: 0.18 }}
          />
          <div
            className="pointer-events-none absolute -right-40 bottom-24 h-[400px] w-[400px] rounded-full blur-[150px]"
            style={{ background: "#00D4FF", opacity: 0.16 }}
          />
        </>
      )}

      <div className="absolute inset-0 z-[1]">
        <NeuralBackground />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm"
            style={{
              color: "var(--text-muted)",
              borderColor: "var(--border-subtle)",
              background: "var(--glass)",
            }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00D4FF]" />
            Ultimate AI generation
          </motion.p>
          <motion.h1
            className="font-display text-[clamp(2rem,6.8vw,5.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em]"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06 }}
          >
            <span className="text-gradient-hero block">
              Where imagination becomes reality
            </span>
            <span
              className="mt-2 block font-display text-[clamp(1.15rem,3.4vw,2.35rem)] font-semibold tracking-tight sm:mt-3"
              style={{ color: "var(--text-muted)" }}
            >
              — instantly.
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed sm:mt-7 sm:text-lg md:text-xl"
            style={{ color: "var(--text-muted)" }}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            RUHGEN is your creative engine for images and video—cinematic quality,
            real-time feedback, built for studios and solo creators alike.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4"
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/sign-up"
              className="inline-flex min-h-[52px] min-w-[min(100%,220px)] items-center justify-center rounded-2xl px-8 py-3.5 text-base font-semibold text-white btn-gradient sm:min-w-[200px]"
            >
              Start creating free
            </Link>
            <Link
              href="/#preview"
              className="inline-flex min-h-[52px] min-w-[min(100%,220px)] items-center justify-center rounded-2xl border px-8 py-3.5 text-base font-semibold transition-colors hover:border-[#7B61FF]/50"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                background: "var(--glass)",
              }}
            >
              Watch the demo
            </Link>
          </motion.div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:mt-20 sm:gap-4 lg:grid-cols-4">
          {previews.map((p, i) => (
            <div
              key={p.src}
              className="group premium-ring relative aspect-[4/5] overflow-hidden rounded-xl border sm:aspect-video sm:rounded-2xl lg:aspect-[4/3]"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                sizes="(max-width: 1024px) 50vw, 25vw"
                priority={i < 2}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-3 p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:p-5">
                <span className="inline-flex rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/95 backdrop-blur-md sm:text-xs">
                  Prompt
                </span>
                <span className="mt-2 block text-sm font-medium leading-snug text-white">
                  {p.prompt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
