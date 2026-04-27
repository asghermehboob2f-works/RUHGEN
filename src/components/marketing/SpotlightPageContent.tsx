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
        <div className="relative min-h-[min(56vh,520px)] sm:min-h-[min(52vh,560px)] lg:min-h-[min(50vh,600px)]">
          <SpotlightHeroGraphic pointer={heroPointer} hovered={heroHovered} />

          <div
            className={`relative z-[2] flex min-h-[inherit] w-full flex-col justify-center pb-12 pt-[max(6rem,calc(env(safe-area-inset-top,0px)+5.5rem))] sm:pb-16 sm:pt-28 lg:pb-20 ${SITE_CONTAINER}`}
          >
            <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
              <motion.div
                className="flex w-full flex-col items-center gap-0 lg:items-start lg:text-left"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="mx-auto inline-flex w-fit max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md sm:px-3.5 sm:py-1.5 sm:text-[11px] lg:mx-0"
                  style={{
                    borderColor: "color-mix(in srgb, var(--border-subtle) 90%, transparent)",
                    color: "var(--text-subtle)",
                    background: "color-mix(in srgb, var(--glass) 50%, transparent)",
                  }}
                  whileHover={
                    reduce
                      ? undefined
                      : {
                          borderColor: "color-mix(in srgb, var(--border-subtle) 70%, rgba(123,97,255,0.35))",
                          transition: { duration: 0.2 },
                        }
                  }
                >
                  <Clapperboard className="h-3.5 w-3.5 shrink-0 text-[#7B61FF]" strokeWidth={1.75} />
                  Motion &amp; light
                </motion.div>

                <motion.h1
                  className="font-display mx-auto mt-3 w-full max-w-[22rem] text-balance text-[clamp(1.9rem,4.2vw+0.5rem,3.1rem)] font-extrabold leading-[1.06] tracking-tight sm:max-w-none lg:mx-0"
                  style={{ color: "var(--text-primary)" }}
                >
                  Spotlight: <span className="text-gradient-hero">the cut that stays</span>
                </motion.h1>

                <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-[var(--text-muted)] sm:mt-5 sm:text-base lg:mx-0">
                  Curated motion and stills in one beam—scroll the reels below, swap them from your dashboard when the story
                  changes. Nothing here reads like a spec sheet; it&apos;s meant to feel like opening night.
                </p>

                <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center lg:mx-0 lg:justify-start">
                  <Link
                    href="/gallery"
                    className="group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold tracking-tight shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[#00D4FF]/50 hover:bg-[color-mix(in_srgb,var(--glass)_55%,rgba(0,212,255,0.06))] hover:shadow-[0_12px_40px_-12px_rgba(0,212,255,0.25)] motion-safe:active:translate-y-0 sm:w-auto"
                    style={{
                      borderColor: "color-mix(in srgb, var(--border-subtle) 82%, rgba(0,212,255,0.28))",
                      color: "var(--text-primary)",
                      background: "color-mix(in srgb, var(--glass) 40%, transparent)",
                    }}
                  >
                    Browse gallery
                    <span
                      className="text-xs opacity-80 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                  <Link
                    href="/demo"
                    className="group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold tracking-tight shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[#7B61FF]/50 hover:bg-[color-mix(in_srgb,var(--glass)_55%,rgba(123,97,255,0.08))] hover:shadow-[0_12px_40px_-12px_rgba(123,97,255,0.28)] motion-safe:active:translate-y-0 sm:w-auto"
                    style={{
                      borderColor: "color-mix(in srgb, var(--border-subtle) 82%, rgba(123,97,255,0.32))",
                      color: "var(--text-primary)",
                      background: "color-mix(in srgb, var(--glass) 40%, transparent)",
                    }}
                  >
                    Live demo
                    <span
                      className="text-xs opacity-80 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    >
                      →
                    </span>
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
