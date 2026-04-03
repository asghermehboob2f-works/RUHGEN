"use client";

import { Clapperboard, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ShowcaseSlide } from "@/lib/site-content-types";

type Props = { slides: ShowcaseSlide[] };

const AUTO_MS = 6000;

export function FeatureShowcase({ slides }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const goToIndex = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el || slides.length === 0) return;
    const clamped = ((i % slides.length) + slides.length) % slides.length;
    const w = el.offsetWidth;
    el.scrollTo({ left: clamped * w, behavior: "smooth" });
    idxRef.current = clamped;
    setIdx(clamped);
  }, [slides.length]);

  const onScrollSnap = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.offsetWidth || 1;
    const next = Math.round(el.scrollLeft / w);
    idxRef.current = next;
    setIdx(next);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      const cur = idxRef.current;
      const next = cur >= slides.length - 1 ? 0 : cur + 1;
      el.scrollTo({ left: next * w, behavior: "smooth" });
      idxRef.current = next;
      setIdx(next);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [slides.length, paused]);

  useEffect(() => {
    const onResize = () => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollLeft = idxRef.current * el.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!slides.length) return null;

  return (
    <section
      id="showcase"
      className="relative scroll-mt-24 overflow-hidden border-y py-10 sm:py-14 md:py-20"
      style={{
        borderColor: "var(--border-subtle)",
        background:
          "linear-gradient(180deg, var(--soft-black) 0%, var(--deep-black) 45%, var(--deep-black) 100%)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 30%, rgba(123,97,255,0.2), transparent), radial-gradient(ellipse 60% 45% at 85% 70%, rgba(0,212,255,0.12), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <div className="mb-6 sm:mb-8">
          <div>
            <p
              className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-subtle)",
                background: "var(--glass)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#7B61FF]" strokeWidth={1.75} />
              Product spotlight
            </p>
            <h2
              className="font-display text-[clamp(1.45rem,3.5vw,2.65rem)] font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              What RUHGEN can do
            </h2>
            <p
              className="mt-2 max-w-xl text-sm leading-relaxed sm:text-base"
              style={{ color: "var(--text-muted)" }}
            >
              Short trial clips (16∶9) and copy you control from the content editor—pauses on hover for easy reading.
            </p>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onScroll={onScrollSnap}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {slides.map((slide, i) => (
            <article
              key={slide.id}
              className="premium-ring w-full min-w-full shrink-0 snap-center rounded-[1.35rem] border"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass-elevated)",
                backdropFilter: "blur(28px) saturate(160%)",
                boxShadow:
                  "0 28px 80px -24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <div className="grid overflow-hidden rounded-[calc(1.35rem-1px)] md:grid-cols-2 md:items-stretch">
                {/* Strict 16:9 (1920×1080) frame — object-cover fills without stretching */}
                <div
                  className="relative aspect-video w-full max-h-[min(70vw,420px)] bg-black sm:max-h-none"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(123,97,255,0.12) 0%, rgba(0,212,255,0.08) 100%)",
                  }}
                >
                  {slide.videoSrc ? (
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      src={slide.videoSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex absolute inset-0 flex-col items-center justify-center gap-3 p-8 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7B61FF]/35 to-[#00D4FF]/25 shadow-[0_0_40px_rgba(123,97,255,0.3)]">
                        <Clapperboard className="h-8 w-8 text-white/90" strokeWidth={1.5} />
                      </div>
                      <p className="max-w-[240px] text-sm" style={{ color: "var(--text-muted)" }}>
                        Upload a ~3s <span className="whitespace-nowrap">16∶9</span> clip in{" "}
                        <span className="font-semibold text-[#00D4FF]">Dashboard → Content</span>
                      </p>
                    </div>
                  )}
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent"
                    aria-hidden
                  />
                  <span
                    className="absolute bottom-3 left-3 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "rgba(0,0,0,0.5)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </span>
                  <span
                    className="absolute right-3 top-3 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90"
                    style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.15)" }}
                  >
                    16∶9
                  </span>
                </div>

                <div className="flex flex-col justify-center border-t p-6 sm:p-8 md:border-l md:border-t-0" style={{ borderColor: "var(--border-subtle)" }}>
                  <h3
                    className="font-display text-xl font-bold tracking-tight sm:text-2xl"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {slide.title}
                  </h3>
                  <p
                    className="mt-3 text-sm leading-relaxed sm:text-[15px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {slide.caption}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span
                      className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                      style={{
                        borderColor: "rgba(123,97,255,0.35)",
                        color: "#a99cff",
                        background: "rgba(123,97,255,0.08)",
                      }}
                    >
                      Coming on your roadmap
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === idx}
              onClick={() => goToIndex(i)}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === idx ? 32 : 8,
                background:
                  i === idx
                    ? "linear-gradient(90deg, #7B61FF, #00D4FF)"
                    : "var(--border-subtle)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
