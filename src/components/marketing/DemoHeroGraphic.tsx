"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";

type DemoHeroGraphicProps = {
  className?: string;
};

const steps = [
  { n: "01", label: "Still", accent: "var(--primary-purple)" },
  { n: "02", label: "Motion", accent: "var(--primary-cyan)" },
  { n: "03", label: "Ship", accent: "var(--accent-pink)" },
] as const;

export function DemoHeroGraphic({ className = "" }: DemoHeroGraphicProps) {
  const reduce = useReducedMotion() === true;

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* Chassis: gradient bezel + deep well */}
      <div
        className="relative overflow-hidden rounded-[1.75rem] p-px shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)_inset]"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 42%, rgba(123,97,255,0.12) 100%)",
        }}
      >
        <div
          className="relative aspect-[20/12] min-h-[200px] overflow-hidden rounded-[1.6875rem]"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 10% -10%, rgba(123,97,255,0.14), transparent 55%), radial-gradient(ellipse 70% 55% at 105% 110%, rgba(0,212,255,0.1), transparent 50%), radial-gradient(ellipse 45% 40% at 85% 15%, rgba(255,46,154,0.06), transparent 45%), var(--deep-black)",
          }}
        >
          {/* Film grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />

          {/* Slow aurora field */}
          {!reduce && (
            <motion.div
              className="pointer-events-none absolute -left-1/2 -top-1/2 h-[200%] w-[200%] opacity-[0.35]"
              style={{
                background:
                  "conic-gradient(from 180deg at 50% 50%, rgba(123,97,255,0.12) 0deg, transparent 55deg, rgba(0,212,255,0.08) 120deg, transparent 200deg, rgba(255,46,154,0.07) 280deg, transparent 360deg)",
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              aria-hidden
            />
          )}

          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: "inset 0 0 120px 40px rgba(0,0,0,0.55)",
            }}
            aria-hidden
          />

          {/* Registration corners */}
          <svg className="pointer-events-none absolute left-4 top-4 h-8 w-8 text-white/25" viewBox="0 0 32 32" fill="none" aria-hidden>
            <path d="M1 12V3a2 2 0 012-2h9" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg
            className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 text-white/25"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden
          >
            <path d="M31 20v9a2 2 0 01-2 2h-9" stroke="currentColor" strokeWidth="1" />
          </svg>

          {/* Specular sweep */}
          {!reduce && (
            <motion.div
              className="pointer-events-none absolute -inset-px opacity-30"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.09) 49.5%, rgba(255,255,255,0.02) 51%, transparent 58%)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 11, repeat: Infinity, repeatDelay: 4, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden
            />
          )}

          <div className="relative z-[1] flex h-full flex-col p-5 sm:p-6">
            <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-stretch sm:gap-6">
              {/* Canvas cell — “output” without fake skeleton UI */}
              <div className="relative flex-[1.05] sm:max-w-[46%]">
                <div
                  className="relative h-full min-h-[112px] overflow-hidden rounded-2xl sm:min-h-[128px]"
                  style={{
                    boxShadow:
                      "0 0 0 1px rgba(255,255,255,0.08), 0 24px 48px -24px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.12)",
                    background:
                      "linear-gradient(165deg, #12101a 0%, #0a090e 100%), radial-gradient(ellipse 100% 80% at 30% 20%, rgba(123,97,255,0.2), transparent 60%), radial-gradient(ellipse 80% 70% at 85% 90%, rgba(0,212,255,0.12), transparent 55%)",
                  }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
                  {/* Abstract horizon — photographic calm, not chart junk */}
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <motion.div
                    className="absolute bottom-6 left-5 right-5 h-px rounded-full sm:bottom-7 sm:left-6 sm:right-6"
                    style={{
                      transformOrigin: "0% 50%",
                      background: "linear-gradient(90deg, var(--primary-purple), var(--primary-cyan), var(--accent-pink))",
                      opacity: 0.55,
                    }}
                    animate={reduce ? {} : { scaleX: [0.35, 1, 0.35] }}
                    transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden
                  />
                  <p className="absolute left-5 top-4 font-mono text-[9px] font-medium uppercase tracking-[0.35em] text-white/35 sm:left-6 sm:top-5 sm:text-[10px]">
                    Preview
                  </p>
                  <p className="absolute bottom-2 right-5 font-mono text-[9px] tabular-nums tracking-wider text-white/25 sm:bottom-2.5 sm:right-6 sm:text-[10px]">
                    16∶9
                  </p>
                </div>
              </div>

              {/* Copy column — real type hierarchy */}
              <div className="flex flex-[1] flex-col justify-center gap-3 sm:pl-1">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--primary-cyan)]/90">
                  Session
                </p>
                <p className="font-display text-[clamp(1.25rem,2.8vw,1.75rem)] font-semibold leading-[1.15] tracking-tight text-[var(--text-primary)]">
                  Compose
                  <span className="font-light text-[var(--text-muted)]">, </span>
                  <span className="bg-gradient-to-r from-[var(--primary-purple)] via-[var(--primary-cyan)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                    resolve
                  </span>
                  <span className="font-light text-[var(--text-muted)]">, </span>
                  hand off.
                </p>
              </div>
            </div>

            {/* Footer rail — dial / editorial steps */}
            <div
              className="mt-5 flex flex-col gap-3 border-t pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-5"
              style={{ borderColor: "color-mix(in srgb, var(--border-subtle) 80%, transparent)" }}
            >
              <div className="flex flex-wrap items-center gap-x-1 gap-y-2 sm:gap-x-2">
                {steps.map((s, i) => (
                  <Fragment key={s.n}>
                    {i > 0 && (
                      <span className="mx-2 font-mono text-[10px] text-[var(--text-subtle)]/40 sm:mx-3" aria-hidden>
                        ·
                      </span>
                    )}
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-mono text-[10px] tabular-nums text-[var(--text-subtle)]">{s.n}</span>
                      <span className="font-display text-xs font-semibold tracking-wide sm:text-sm" style={{ color: s.accent }}>
                        {s.label}
                      </span>
                    </div>
                  </Fragment>
                ))}
              </div>
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-subtle)] sm:text-[10px]">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--primary-cyan)] shadow-[0_0_10px_var(--primary-cyan)]" />
                Ready
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
