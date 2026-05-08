"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SITE_CONTAINER } from "@/lib/site-layout";
import { NeuralBackground } from "./NeuralBackground";

type Preview = {
  id: string;
  src: string;
  alt: string;
  prompt: string;
};

const MOBILE_SLIDE_MS = 5200;

function PreviewFrame({
  p,
  priority,
  i,
  reduce,
}: {
  p: Preview;
  priority?: boolean;
  i: number;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduce ? 0 : 0.12 + i * 0.08 }}
      className="group premium-ring relative aspect-video overflow-hidden rounded-xl border md:rounded-2xl"
      style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
    >
      <Image
        src={p.src}
        alt={p.alt}
        fill
        className="object-cover transition-transform duration-1000 ease-out group-active:scale-[1.02] md:group-hover:scale-[1.05]"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        priority={priority}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity duration-700 md:opacity-0 md:group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 right-0 translate-y-0 p-3 opacity-100 transition-all duration-700 sm:p-4 md:p-6 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        <span className="inline-flex rounded-full bg-white/12 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-lg sm:text-[10px] md:text-[11px]">
          Prompt
        </span>
        <span className="mt-2 block line-clamp-2 text-left text-[11px] font-medium leading-relaxed text-white/95 sm:mt-2.5 sm:line-clamp-3 sm:text-sm md:line-clamp-none">
          {p.prompt}
        </span>
      </div>
    </motion.div>
  );
}

export function Hero({ previews }: { previews: Preview[] }) {
  // Defer reduced-motion until after mount: useReducedMotion() returns the
  // real value on the first client render, but `false` during SSR. If a user
  // has prefers-reduced-motion enabled this would cause a hydration mismatch
  // because the conditional branches below render different elements.
  const reducedRaw = useReducedMotion() === true;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const reduce = mounted ? reducedRaw : false;
  const [mobileIdx, setMobileIdx] = useState(0);
  const n = previews.length;

  const goNext = useCallback(() => {
    if (n <= 0) return;
    setMobileIdx((i) => (i + 1) % n);
  }, [n]);

  useEffect(() => {
    if (n <= 1 || reduce) return;
    const id = window.setInterval(goNext, MOBILE_SLIDE_MS);
    return () => clearInterval(id);
  }, [n, reduce, goNext]);

  const current = n > 0 ? previews[Math.min(mobileIdx, n - 1)] : null;

  return (
    <section
      id="hero"
      className="mesh-section relative flex min-h-[100dvh] flex-col overflow-hidden overflow-x-hidden pb-8 pt-[max(4.5rem,env(safe-area-inset-top,0px)+3rem)] sm:pb-12 sm:pt-20 md:h-screen md:min-h-[720px] md:pb-8 md:pt-24"
    >
      {!reduce ? (
        <>
          <motion.div
            className="pointer-events-none absolute -left-[10%] -top-[5%] h-[min(600px,80vw)] w-[min(600px,80vw)] rounded-full blur-[140px]"
            style={{ background: "#7B61FF", opacity: 0.16 }}
            animate={{ 
              scale: [1, 1.1, 1], 
              opacity: [0.12, 0.2, 0.12],
              x: [0, 15, 0],
              y: [0, 5, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -right-[5%] bottom-[5%] h-[min(540px,75vw)] w-[min(540px,75vw)] rounded-full blur-[130px]"
            style={{ background: "#00D4FF", opacity: 0.14 }}
            animate={{ 
              scale: [1, 1.08, 1], 
              opacity: [0.1, 0.16, 0.1],
              x: [0, -20, 0],
              y: [0, -5, 0]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </>
      ) : (
        <>
          <div
            className="pointer-events-none absolute -left-40 top-12 h-[440px] w-[440px] rounded-full blur-[140px]"
            style={{ background: "#7B61FF", opacity: 0.1 }}
          />
          <div
            className="pointer-events-none absolute -right-36 bottom-20 h-[400px] w-[400px] rounded-full blur-[130px]"
            style={{ background: "#00D4FF", opacity: 0.08 }}
          />
        </>
      )}

      <div className="absolute inset-0 z-[1]">
        <NeuralBackground />
      </div>

      <div className={`relative z-10 ${SITE_CONTAINER} flex flex-1 flex-col`}>
        <div className="mx-auto flex w-full max-w-4xl shrink-0 flex-col items-center text-center sm:px-0 md:flex-1 md:justify-start md:pt-[4vh]">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] shadow-[0_0_40px_-12px_rgba(123,97,255,0.4)] sm:mb-12 sm:px-4 sm:py-1.5 sm:text-[0.75rem] sm:tracking-[0.22em] md:mb-16"
            style={{
              color: "var(--text-muted)",
              background:
                "linear-gradient(var(--glass), var(--glass)) padding-box, linear-gradient(135deg, rgba(123,97,255,0.4), rgba(0,212,255,0.22)) border-box",
              border: "1px solid transparent",
              backdropFilter: "blur(20px)",
            }}
          >
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#00D4FF]" />
            Ultimate AI generation
          </motion.p>
          <motion.h1
            className="font-display text-hero-title font-extrabold leading-[1.1] tracking-[-0.035em] sm:leading-[1.05]"
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
          >
            <span className="text-gradient-hero block px-0.5">
              Where imagination becomes reality
            </span>
            <span
              className="mt-2 block font-display text-hero-subtitle font-semibold tracking-tight sm:mt-2.5 md:mt-3"
              style={{ color: "var(--text-muted)" }}
            >
              — instantly.
            </span>
          </motion.h1>
          <motion.p
            className="font-premium mx-auto mt-4 max-w-[30rem] px-2 text-[clamp(0.8rem,2vw,0.95rem)] leading-[1.6] sm:mt-5 sm:max-w-2xl md:mt-6"
            style={{ color: "var(--text-muted)" }}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
          >
            RUHGEN is your creative engine for images and video—cinematic quality,
            real-time feedback, built for studios and solo creators alike.
          </motion.p>
          <motion.div
            className="mx-auto mt-7 flex w-full max-w-[15rem] flex-col items-stretch gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4 md:mt-8"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
          >
            <Link
              href="/sign-up"
              className="inline-flex min-h-[36px] w-full items-center justify-center rounded-lg px-3.5 py-1.5 text-[0.68rem] font-bold text-white btn-gradient sm:min-h-[50px] sm:w-auto sm:min-w-[180px] sm:rounded-[14px] sm:px-7 sm:text-[0.9rem]"
            >
              Start creating free
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-[36px] w-full items-center justify-center rounded-lg border px-3.5 py-1.5 text-[0.68rem] font-bold transition-all hover:border-[#7B61FF]/60 hover:bg-white/[0.03] sm:min-h-[50px] sm:w-auto sm:min-w-[180px] sm:rounded-[14px] sm:px-7 sm:text-[0.9rem]"
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

        {/* Phone: carousel in document flow */}
        {current && (
          <div className="relative z-[11] mx-auto mt-8 flex w-full max-w-[340px] shrink-0 flex-col items-center pb-2 sm:hidden">
            <div
              className="relative w-full overflow-hidden rounded-2xl border shadow-[0_24px_80px_-24px_rgba(123,97,255,0.4)] ring-1 ring-white/[0.05]"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            >
              <div className="relative aspect-video w-full bg-black/40">
                <AnimatePresence initial={false} mode="sync">
                  <motion.div
                    key={current.id}
                    className="absolute inset-0 h-full w-full overflow-hidden"
                    style={{ top: 0, left: 0, right: 0, bottom: 0, willChange: "opacity" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: "tween",
                      duration: reduce ? 0.12 : 0.4,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <Image
                      src={current.src}
                      alt={current.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 400px"
                      priority
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                      <span className="inline-flex rounded-full bg-white/12 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-lg">
                        Prompt
                      </span>
                      <p className="mt-2 text-left text-[11px] font-medium leading-relaxed text-white/95">
                        {current.prompt}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {n > 1 && (
              <div className="mt-3.5 flex items-center justify-center gap-2">
                {previews.map((p, i) => {
                  const on = i === mobileIdx;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-label={`Go to preview ${i + 1}`}
                      aria-current={on}
                      onClick={() => setMobileIdx(i)}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: on ? 24 : 6,
                        background: on
                          ? "linear-gradient(90deg, #7B61FF, #00D4FF)"
                          : "rgba(255,255,255,0.18)",
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Gallery grid (sm+) */}
        <div className="mx-auto mt-10 hidden w-full max-w-7xl pb-6 sm:block md:mt-auto md:pb-12">
          <motion.div
            className="grid w-full grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.28 }}
          >
            {previews.map((p, i) => (
              <PreviewFrame key={p.id} p={p} priority={i < 2} i={i} reduce={reduce} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
