"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ReactNode, TouchEvent } from "react";
import { useCallback, useId, useRef, useState } from "react";

export function StudioCollapsible({
  title,
  subtitle,
  defaultOpen = true,
  badge,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--soft-black)] shadow-sm transition-colors duration-200 ${className}`}
    >
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--glass)] active:bg-[var(--glass-elevated)] sm:px-3.5 sm:py-3 cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[13px] font-bold tracking-tight text-[var(--text-primary)] sm:text-sm">{title}</span>
            {badge}
          </div>
          {subtitle ? <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">{subtitle}</p> : null}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)]"
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-trigger`}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border-subtle)] px-3 pb-3.5 pt-3 sm:px-3.5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function StudioPromptChips({
  labels,
  onPick,
  disabled,
  tone,
}: {
  labels: readonly string[];
  onPick: (text: string) => void;
  disabled?: boolean;
  tone: "purple" | "cyan";
}) {
  const ring = tone === "purple" ? "focus-visible:ring-[#7B61FF]/35" : "focus-visible:ring-[#00D4FF]/35";
  const glow =
    tone === "purple"
      ? "hover:border-[color-mix(in_srgb,var(--primary-purple)_45%,transparent)] hover:shadow-[0_0_20px_-8px_rgba(123,97,255,0.55)]"
      : "hover:border-[color-mix(in_srgb,var(--primary-cyan)_45%,transparent)] hover:shadow-[0_0_20px_-8px_rgba(0,212,255,0.45)]";
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((t) => (
        <button
          key={t}
          type="button"
          disabled={disabled}
          onClick={() => onPick(t)}
          className={`rounded-full border border-border/65 bg-card/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] transition-all hover:bg-card/70 hover:text-[var(--text-primary)] disabled:opacity-40 sm:text-[11px] ${glow} focus:outline-none focus-visible:ring-2 ${ring}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function StudioGlowGenerate({
  disabled,
  onClick,
  children,
  tone,
  size = "md",
}: {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  tone: "purple" | "cyan";
  size?: "md" | "lg" | "icon";
}) {
  const reduce = useReducedMotion();
  const isIcon = size === "icon";

  const bgStyle =
    tone === "purple"
      ? "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)"
      : "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)";

  const glowShadow =
    "0 2px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      whileHover={reduce || disabled ? undefined : { scale: 1.015 }}
      className={`group relative isolate overflow-hidden font-display font-bold text-white transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none border border-white/30 hover:border-white/60 ${isIcon
          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
          : size === "lg"
            ? "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 text-sm tracking-wide shadow-lg"
            : "inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold tracking-wide shadow-md"
        }`}
      style={{
        background: bgStyle,
        boxShadow: disabled ? "none" : glowShadow,
      }}
    >
      {/* High-end Apple glass top light reflection */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      {/* Subtle sweeping specular highlight */}
      <span
        className="pointer-events-none absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:animate-shimmer group-hover:opacity-100"
        aria-hidden
      />

      <span className="relative z-[1] flex items-center justify-center gap-2.5 text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {children}
      </span>
    </motion.button>
  );
}

export function useStudioSwipePane({
  onSwipeLeft,
  onSwipeRight,
  threshold = 72,
  edgeOnly = false,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  /** Minimum horizontal travel (px) before a swipe fires. */
  threshold?: number;
  /**
   * When true, only swipes that start within 28px of the viewport edge are
   * considered. Helps avoid interfering with vertical scrolling inside content.
   */
  edgeOnly?: boolean;
}) {
  const start = useRef<{ x: number; y: number; t: number; edge: boolean } | null>(null);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        start.current = null;
        return;
      }
      const t = e.touches[0];
      const vw =
        typeof window === "undefined" ? 1024 : window.innerWidth || document.documentElement.clientWidth || 1024;
      const edge = t.clientX <= 28 || t.clientX >= vw - 28;
      start.current = { x: t.clientX, y: t.clientY, t: Date.now(), edge };
    },
    [],
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const end = e.changedTouches[0];
      if (!end) return;
      const dx = end.clientX - s.x;
      const dy = end.clientY - s.y;
      const dt = Date.now() - s.t;
      if (Math.abs(dx) < threshold) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.6) return; // require horizontal dominance
      if (dt > 650) return; // must be a quick flick, not a slow drag
      if (edgeOnly && !s.edge) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },
    [onSwipeLeft, onSwipeRight, threshold, edgeOnly],
  );

  return { onTouchStart, onTouchEnd };
}
