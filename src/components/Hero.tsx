"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
      transition={{ duration: 0.45, delay: reduce ? 0 : 0.12 + i * 0.06 }}
      className="group premium-ring relative aspect-video overflow-hidden rounded-xl border md:rounded-2xl"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <Image
        src={p.src}
        alt={p.alt}
        fill
        className="object-cover transition-transform duration-700 ease-out group-active:scale-[1.03] md:group-hover:scale-[1.06]"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        priority={priority}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 right-0 translate-y-0 p-3 opacity-100 transition-all duration-500 sm:p-4 md:p-5 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        <span className="inline-flex rounded-full bg-white/14 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/95 backdrop-blur-md sm:px-2.5 sm:py-1 sm:text-[10px] md:text-xs">
          Prompt
        </span>
        <span className="mt-1.5 block line-clamp-2 text-left text-[11px] font-medium leading-snug text-white sm:mt-2 sm:line-clamp-3 sm:text-sm md:line-clamp-none">
          {p.prompt}
        </span>
      </div>
    </motion.div>
  );
}

export function Hero({ previews }: { previews: Preview[] }) {
  const reduce = useReducedMotion() === true;
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
      className="mesh-section relative flex min-h-[100dvh] flex-col justify-start overflow-x-hidden pb-10 pt-[max(5.25rem,env(safe-area-inset-top,0px)+4.5rem)] sm:pb-14 sm:pt-28 md:pt-32"
    >
      {!reduce ? (
        <>
          <motion.div
            className="pointer-events-none absolute -left-40 top-12 h-[min(420px,70vw)] w-[min(420px,70vw)] rounded-full blur-[140px] sm:-left-48 sm:top-16 sm:h-[min(480px,50vw)] sm:w-[min(480px,50vw)] sm:blur-[160px]"
            style={{ background: "#7B61FF", opacity: 0.2 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.16, 0.24, 0.16] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -right-36 bottom-20 h-[min(380px,65vw)] w-[min(380px,65vw)] rounded-full blur-[130px] sm:-right-40 sm:bottom-24 sm:h-[min(440px,48vw)] sm:w-[min(440px,48vw)] sm:blur-[150px]"
            style={{ background: "#00D4FF", opacity: 0.18 }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.14, 0.22, 0.14] }}
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
            className="pointer-events-none absolute -left-40 top-12 h-[min(380px,70vw)] w-[min(380px,70vw)] rounded-full blur-[140px] sm:-left-48 sm:h-[420px] sm:w-[420px]"
            style={{ background: "#7B61FF", opacity: 0.16 }}
          />
          <div
            className="pointer-events-none absolute -right-36 bottom-20 h-[min(360px,65vw)] w-[min(360px,65vw)] rounded-full blur-[130px] sm:-right-40 sm:h-[400px] sm:w-[400px]"
            style={{ background: "#00D4FF", opacity: 0.14 }}
          />
        </>
      )}

      <div className="absolute inset-0 z-[1]">
        <NeuralBackground />
      </div>

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-4 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-4xl shrink-0 text-center sm:px-0">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-[0_0_40px_-12px_rgba(123,97,255,0.45)] sm:mb-5 sm:px-4 sm:text-xs sm:tracking-[0.22em] md:text-sm"
            style={{
              color: "var(--text-muted)",
              background:
                "linear-gradient(var(--glass), var(--glass)) padding-box, linear-gradient(135deg, rgba(123,97,255,0.35), rgba(0,212,255,0.18)) border-box",
              border: "1px solid transparent",
              backdropFilter: "blur(16px)",
            }}
          >
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#00D4FF]" />
            Ultimate AI generation
          </motion.p>
          <motion.h1
            className="font-display text-[clamp(1.85rem,6.2vw,5.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em] sm:leading-[1.02]"
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
          >
            <span className="text-gradient-hero block px-0.5">
              Where imagination becomes reality
            </span>
            <span
              className="mt-1.5 block font-display text-[clamp(1.05rem,3.2vw,2.35rem)] font-semibold tracking-tight sm:mt-2 sm:mt-3"
              style={{ color: "var(--text-muted)" }}
            >
              — instantly.
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-4 max-w-[34rem] px-1 text-[13px] leading-relaxed sm:mt-6 sm:max-w-2xl sm:text-sm md:mt-7 md:text-lg lg:text-xl"
            style={{ color: "var(--text-muted)" }}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
          >
            RUHGEN is your creative engine for images and video—cinematic quality,
            real-time feedback, built for studios and solo creators alike.
          </motion.p>
          <motion.div
            className="mx-auto mt-10 flex w-full max-w-[20rem] flex-col items-stretch gap-2.5 sm:mt-12 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
          >
            <Link
              href="/sign-up"
              className="inline-flex min-h-[50px] w-full items-center justify-center rounded-xl px-6 py-3 text-[15px] font-semibold text-white btn-gradient sm:min-h-[52px] sm:w-auto sm:min-w-[200px] sm:rounded-2xl sm:px-8 sm:py-3.5 sm:text-base"
            >
              Start creating free
            </Link>
            <Link
              href="/#preview"
              className="inline-flex min-h-[50px] w-full items-center justify-center rounded-xl border px-6 py-3 text-[15px] font-semibold transition-colors hover:border-[#7B61FF]/50 sm:min-h-[52px] sm:w-auto sm:min-w-[200px] sm:rounded-2xl sm:px-8 sm:py-3.5 sm:text-base"
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

        {/* Phone: carousel in document flow (mt-auto was pushing it below the fold). */}
        {current && (
          <div className="relative z-[11] mx-auto mt-14 flex w-full max-w-lg shrink-0 flex-col items-center pb-2 sm:hidden">
            <div
              className="relative w-full overflow-hidden rounded-2xl border shadow-[0_24px_80px_-24px_rgba(123,97,255,0.4)] ring-1 ring-white/[0.07]"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="relative aspect-video w-full bg-black/20">
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
                      duration: reduce ? 0.12 : 0.26,
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
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
                      <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                        Prompt
                      </span>
                      <p className="mt-2 text-left text-sm font-medium leading-snug text-white">
                        {current.prompt}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {n > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {previews.map((p, i) => {
                  const on = i === mobileIdx;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-label={`Go to preview ${i + 1}`}
                      aria-current={on}
                      onClick={() => setMobileIdx(i)}
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: on ? 28 : 8,
                        background: on
                          ? "linear-gradient(90deg, #7B61FF, #00D4FF)"
                          : "rgba(255,255,255,0.14)",
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* sm+: grid — keep responsive display off motion.* (Framer can set inline display and break sm:grid). */}
        <div className="mx-auto mt-auto hidden w-full pt-12 pb-1 sm:block">
          <motion.div
            className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: reduce ? 0 : 0.28 }}
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
