"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Clapperboard, Quote } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { SpotlightHeroGraphic } from "@/components/marketing/SpotlightHeroGraphic";
import type { SiteContent } from "@/backend/site-content/types";
import { SITE_CONTAINER } from "@/lib/site-layout";

const POINTER_ZERO = { x: 0, y: 0 };

const directorsNote = {
  quote:
    "The best reels aren’t the loudest—they’re the ones that survive the Monday-morning review. We built Spotlight to show motion and messaging that still makes sense after the hype fades.",
  attribution: "Product narrative, RUHGEN",
};

export function SpotlightPageContent({ content }: { content: SiteContent }) {
  const reduce = useReducedMotion() === true;
  const [heroPointer, setHeroPointer] = useState(POINTER_ZERO);
  const [heroHovered, setHeroHovered] = useState(false);
  const finePointerRef = useRef(false);
  const pointerRafRef = useRef<number | null>(null);
  const pendingPointerRef = useRef(POINTER_ZERO);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => {
      finePointerRef.current = mq.matches;
      if (!mq.matches) setHeroPointer(POINTER_ZERO);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const queueHeroPointer = useCallback((clientX: number, clientY: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const w = r.width || 1;
    const h = r.height || 1;
    pendingPointerRef.current = {
      x: ((clientX - r.left) / w) * 2 - 1,
      y: ((clientY - r.top) / h) * 2 - 1,
    };
    if (pointerRafRef.current != null) return;
    pointerRafRef.current = window.requestAnimationFrame(() => {
      pointerRafRef.current = null;
      setHeroPointer(pendingPointerRef.current);
    });
  }, []);

  const onHeroPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!finePointerRef.current) return;
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    queueHeroPointer(e.clientX, e.clientY, e.currentTarget);
  }, [queueHeroPointer]);

  const onHeroPointerEnter = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      setHeroHovered(true);
      if (!finePointerRef.current) return;
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      queueHeroPointer(e.clientX, e.clientY, e.currentTarget);
    },
    [queueHeroPointer],
  );

  const onHeroPointerLeave = useCallback(() => {
    setHeroHovered(false);
    if (pointerRafRef.current != null) {
      window.cancelAnimationFrame(pointerRafRef.current);
      pointerRafRef.current = null;
    }
    setHeroPointer(POINTER_ZERO);
    pendingPointerRef.current = POINTER_ZERO;
  }, []);

  return (
    <>
      <section
        className="group/spotHero relative cursor-default overflow-x-hidden border-b"
        style={{ borderColor: "var(--border-subtle)" }}
        onPointerEnter={onHeroPointerEnter}
        onPointerMove={onHeroPointerMove}
        onPointerLeave={onHeroPointerLeave}
      >
        <div className="relative min-h-[min(52svh,480px)] sm:min-h-[min(50svh,520px)]">
          <SpotlightHeroGraphic pointer={heroPointer} hovered={heroHovered} />

          <div
            className={`relative z-[2] flex min-h-[min(52svh,480px)] flex-col justify-start pb-8 pt-[max(5rem,calc(env(safe-area-inset-top,0px)+3.5rem+2px))] sm:min-h-[min(50svh,520px)] sm:justify-center sm:pb-12 sm:pt-[max(9rem,calc(env(safe-area-inset-top,0px)+4rem+2px))] md:pt-[max(11rem,calc(env(safe-area-inset-top,0px)+4rem+2px))] lg:pb-12 lg:pt-[max(12rem,calc(env(safe-area-inset-top,0px)+4rem+2px))] ${SITE_CONTAINER}`}
          >
            <div className="w-full max-w-6xl lg:mx-0 lg:max-w-none">
              <motion.div
                className="mx-auto w-full max-w-xl px-0 text-center sm:max-w-xl md:max-w-xl md:text-left lg:mx-0 lg:text-left"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                whileHover={
                  reduce
                    ? undefined
                    : {
                        y: -3,
                        transition: { type: "spring", stiffness: 320, damping: 28 },
                      }
                }
              >
                <motion.div
                  className="mx-auto inline-flex w-fit max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md sm:text-[11px] md:mx-0"
                  style={{
                    borderColor: "color-mix(in srgb, var(--border-subtle) 85%, transparent)",
                    color: "var(--text-subtle)",
                    background: "color-mix(in srgb, var(--glass) 55%, transparent)",
                  }}
                  whileHover={
                    reduce
                      ? undefined
                      : {
                          scale: 1.03,
                          borderColor: "color-mix(in srgb, var(--border-subtle) 65%, rgba(123,97,255,0.45))",
                          boxShadow: "0 0 24px rgba(123,97,255,0.15)",
                          transition: { type: "spring", stiffness: 400, damping: 22 },
                        }
                  }
                >
                  <Clapperboard className="h-3 w-3 shrink-0 text-[#7B61FF]" strokeWidth={1.75} />
                  Motion &amp; light
                </motion.div>

                <motion.h1
                  className="font-display mx-auto mt-3 w-full max-w-[20rem] text-[clamp(1.5rem,5vw,3.25rem)] font-extrabold leading-[1.12] tracking-tight text-balance sm:mt-5 sm:max-w-2xl md:mx-0 md:max-w-xl"
                  style={{ color: "var(--text-primary)" }}
                  whileHover={
                    reduce
                      ? undefined
                      : {
                          scale: 1.01,
                          textShadow: "0 0 40px rgba(123,97,255,0.12)",
                          transition: { type: "spring", stiffness: 280, damping: 26 },
                        }
                  }
                >
                  Spotlight: <span className="text-gradient-hero">the cut that stays</span>
                </motion.h1>

                <p className="mx-auto mt-3 max-w-xl text-pretty text-[13px] leading-relaxed text-[var(--text-muted)] sm:mt-5 sm:text-[15px] md:mx-0">
                  Curated motion and stills in one beam—scroll the reels below, swap them from your dashboard when the story
                  changes. Nothing here reads like a spec sheet; it&apos;s meant to feel like opening night.
                </p>

                <div className="mx-auto mt-5 flex w-full max-w-xl flex-col items-stretch gap-2 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-4 sm:gap-y-2 md:mx-0 md:justify-start">
                  <Link
                    href="/gallery"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-transparent px-2 text-sm font-semibold text-[#00D4FF] underline-offset-4 hover:border-white/10 hover:underline sm:min-h-0 sm:justify-center sm:px-0 md:justify-start"
                  >
                    Browse the still gallery →
                  </Link>
                  <span className="hidden text-sm text-[var(--text-subtle)] sm:inline">|</span>
                  <Link
                    href="/demo"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-transparent px-2 text-sm font-semibold text-[#7B61FF] underline-offset-4 hover:border-white/10 hover:underline sm:min-h-0 sm:justify-center sm:px-0 md:justify-start"
                  >
                    Run the live demo →
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="mesh-section border-b py-8 sm:py-12" style={{ borderColor: "var(--border-subtle)" }}>
        <div className={SITE_CONTAINER}>
          <div className="grid gap-5 rounded-2xl border p-5 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-8 lg:items-start" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
            <Quote className="mx-auto h-10 w-10 shrink-0 text-[#7B61FF]/45 sm:mx-0 sm:h-12 sm:w-12" strokeWidth={1.2} />
            <div className="text-center sm:text-left">
              <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-primary)" }}>
                {directorsNote.quote}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                {directorsNote.attribution}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="pb-4">
        <FeatureShowcase slides={content.showcase.slides} hideHeading />
      </div>

      <section className="border-t py-10 sm:py-16" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
        <div
          className={`${SITE_CONTAINER} flex flex-col items-stretch gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between`}
        >
          <div className="text-center lg:max-w-xl lg:text-left">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Want these workflows in your workspace?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed sm:text-base lg:mx-0" style={{ color: "var(--text-muted)" }}>
              Spotlight content is editable from your dashboard—swap clips and copy as your product story evolves.
            </p>
          </div>
          <div className="flex w-full shrink-0 justify-center lg:w-auto lg:justify-end">
            <Link
              href="/sign-up"
              className="inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl px-8 text-sm font-semibold text-white btn-gradient sm:w-auto sm:max-w-none sm:min-w-[200px]"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
