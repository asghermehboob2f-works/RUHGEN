"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Clapperboard, Compass, ArrowRight, Play, Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { SpotlightHeroGraphic } from "@/components/marketing/SpotlightHeroGraphic";
import type { SiteContent } from "@/backend/site-content/types";
import { SITE_CONTAINER } from "@/lib/site-layout";

const POINTER_ZERO = { x: 0, y: 0 };

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
                  className="font-display mx-auto mt-3 w-full max-w-[22rem] text-balance text-hero-title font-extrabold leading-[1.1] tracking-tight sm:max-w-none lg:mx-0"
                  style={{ color: "var(--text-primary)" }}
                >
                  Spotlight: <span>the cut that stays</span>
                </motion.h1>

                <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-[var(--text-muted)] sm:mt-5 sm:text-base lg:mx-0">
                  Curated motion and stills in one beam—scroll the reels below, swap them from your dashboard when the story
                  changes. Nothing here reads like a spec sheet; it&apos;s meant to feel like opening night.
                </p>

                <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center lg:mx-0 lg:justify-start">
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

      <div className="pb-4">
        <FeatureShowcase slides={content.showcase.slides} hideHeading />
      </div>

      {/* 1. Templates Grid */}
      <section className="py-20 border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
        <div className={SITE_CONTAINER}>
          <header className="mb-14 max-w-3xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/30 bg-gradient-to-r from-[#00D4FF]/10 to-transparent px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] mb-4 text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.05)]">
              <Compass className="h-4 w-4 text-[#00D4FF] animate-pulse" />
              Workspace Templates
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--text-primary)]">
              Ignite your timeline with <span>Cinematic Presets</span>
            </h2>
            <p className="mt-4 text-sm max-w-xl mx-auto leading-relaxed text-[var(--text-muted)]">
              Pre-configured stylistic structures, custom camera presets, and dramatic pacing frameworks optimized for instant narrative impact.
            </p>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {content.spotlightTemplates?.map((tmpl, i) => (
              <motion.div
                key={tmpl.id}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="premium-ring group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:border-[#00D4FF]/40 hover:-translate-y-1.5"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  boxShadow: "0 10px 30px -15px rgba(0,0,0,0.7)"
                }}
              >
                {/* Visual top */}
                <div className="relative aspect-video w-full shrink-0 bg-card overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#7B61FF]/10 to-[#00D4FF]/10 opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.08)_0%,transparent_70%)]" />
                  
                  {/* Abstract design elements or placeholder based on category */}
                  <div className="flex h-full w-full items-center justify-center opacity-30 group-hover:scale-110 transition-transform duration-500">
                    <Clapperboard className="h-10 w-10 text-[#00D4FF]" strokeWidth={1.5} />
                  </div>

                  {/* Floating Category tag */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-block rounded border border-[#00D4FF]/30 bg-card/70 backdrop-blur-sm px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[#00D4FF]">
                      {tmpl.category}
                    </span>
                  </div>

                  {/* Slide/Try Overlay on hover */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/60 backdrop-blur-[2px]">
                    <Link
                      href={tmpl.demoUrl || "/demo"}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#00D4FF]/30 bg-card/85 text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black transition-all duration-300 hover:scale-110"
                    >
                      <Play className="h-4.5 w-4.5 translate-x-[1px]" fill="currentColor" />
                    </Link>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[var(--text-primary)] tracking-tight group-hover:text-[#00D4FF] transition-colors">
                      {tmpl.title}
                    </h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)] line-clamp-3">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[var(--text-subtle)] uppercase tracking-widest">
                      Ready
                    </span>
                    <Link
                      href={tmpl.demoUrl || "/demo"}
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#00D4FF] hover:text-white transition-colors"
                    >
                      Use Now <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Upcoming Features (Roadmap) */}
      <section className="py-20 border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}>
        <div className={SITE_CONTAINER}>
          <header className="mb-12 max-w-2xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)", background: "var(--glass)" }}>
              <Clock className="h-3.5 w-3.5" style={{ color: "#FF2E9A" }} />
              Product Roadmap
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Upcoming Innovations
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              The engine is constantly evolving. Here is a look at what our research labs are composing.
            </p>
          </header>

          <div className="relative mx-auto mt-14 max-w-4xl">
            <div className="space-y-12">
              {content.upcomingFeatures?.map((item, i) => {
                const color = item.status === "released" ? "#00D4FF" : item.status === "in-progress" ? "#7B61FF" : "#FF2E9A";
                const isEven = i % 2 === 0;
                return (
                  <motion.div
                    key={item.id}
                    initial={reduce ? false : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: i * 0.1 }}
                    className="relative flex flex-col md:flex-row md:justify-between group"
                  >
                    {/* Well-defined bullet dot */}
                    <div 
                      className="absolute left-2.5 top-2 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-[var(--deep-black)] md:left-1/2 md:-ml-[7px] transition-transform duration-300 group-hover:scale-125 z-10"
                      style={{ 
                        background: color,
                        boxShadow: `0 0 12px ${color}80` 
                      }}
                    >
                      <span className="h-1 w-1 rounded-full bg-[var(--text-primary)] animate-ping" />
                    </div>

                    {/* Precise Vertical Line Segment connecting to the next dot only */}
                    {i < (content.upcomingFeatures?.length ?? 0) - 1 && (
                      <div 
                        className="absolute left-[17px] top-[15px] w-[1px] bg-border md:left-1/2 md:-ml-[0.5px] -z-0" 
                        style={{ height: "calc(100% + 3rem)" }}
                      />
                    )}

                    {isEven ? (
                      <>
                        <div className="pl-10 md:w-[45%] md:pl-0 md:text-right">
                          <div className="flex flex-wrap items-baseline gap-3 md:justify-end">
                            <span className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color }}>
                              {item.timeline}
                            </span>
                            <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ borderColor: `${color}35`, color: color, background: `${color}05` }}>
                              {item.status}
                            </span>
                          </div>
                          <h3 className="font-display mt-2 text-xl font-bold text-[var(--text-primary)] tracking-tight">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            {item.description}
                          </p>
                        </div>
                        <div className="hidden md:block md:w-[45%]" />
                      </>
                    ) : (
                      <>
                        <div className="hidden md:block md:w-[45%]" />
                        <div className="pl-10 md:w-[45%] md:pl-0">
                          <div className="flex flex-wrap items-baseline gap-3">
                            <span className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color }}>
                              {item.timeline}
                            </span>
                            <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ borderColor: `${color}35`, color: color, background: `${color}05` }}>
                              {item.status}
                            </span>
                          </div>
                          <h3 className="font-display mt-2 text-xl font-bold text-[var(--text-primary)] tracking-tight">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            {item.description}
                          </p>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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
