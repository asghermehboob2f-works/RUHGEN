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
      className={`rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl ${className}`}
    >
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03] active:bg-white/[0.05] sm:px-3.5 sm:py-3"
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
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-[var(--text-muted)]"
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
            <div className="border-t border-white/[0.06] px-3 pb-3.5 pt-3 sm:px-3.5">{children}</div>
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
          className={`rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] transition-all hover:bg-white/[0.06] hover:text-[var(--text-primary)] disabled:opacity-40 sm:text-[11px] ${glow} focus:outline-none focus-visible:ring-2 ${ring}`}
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
  const grad =
    tone === "purple"
      ? "linear-gradient(135deg, #a78bfa 0%, var(--primary-purple) 42%, #00d4ff 100%)"
      : "linear-gradient(135deg, #67e8f9 0%, var(--primary-cyan) 45%, var(--primary-purple) 100%)";
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={reduce || disabled ? undefined : { scale: 0.97 }}
      className={`relative isolate overflow-hidden font-bold text-white shadow-lg transition-[box-shadow,opacity] disabled:opacity-40 ${
        isIcon
          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
          : size === "lg"
            ? "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm sm:text-[15px]"
            : "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 text-sm"
      }`}
      style={{
        background: grad,
        boxShadow:
          tone === "purple"
            ? "0 0 48px -10px rgba(123,97,255,0.65), 0 12px 40px -18px rgba(0,212,255,0.35), inset 0 1px 0 rgba(255,255,255,0.22)"
            : "0 0 48px -10px rgba(0,212,255,0.55), 0 12px 40px -18px rgba(123,97,255,0.3), inset 0 1px 0 rgba(255,255,255,0.22)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen"
        style={{
          background: "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)",
          animation: reduce ? "none" : "studio-gen-shimmer 3.2s ease-in-out infinite",
        }}
        aria-hidden
      />
      <span className="relative z-[1] flex items-center justify-center gap-2">{children}</span>
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
