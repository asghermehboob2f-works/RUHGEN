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
      className={`rounded-xl border border-white/10 bg-[#141417] shadow-sm ${className}`}
    >
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03] active:bg-white/[0.06] sm:px-3.5 sm:py-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[13px] font-semibold tracking-tight text-zinc-100 sm:text-sm">{title}</span>
            {badge}
          </div>
          {subtitle ? <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">{subtitle}</p> : null}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-zinc-900 text-zinc-400"
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
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
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-3 pb-3.5 pt-3 sm:px-3.5">{children}</div>
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
}: {
  labels: readonly string[];
  onPick: (text: string) => void;
  disabled?: boolean;
  tone?: "purple" | "cyan";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((t) => (
        <button
          key={t}
          type="button"
          disabled={disabled}
          onClick={() => onPick(t)}
          className="rounded-md border border-white/10 bg-zinc-900 px-2.5 py-1 text-[10px] font-medium tracking-wide text-zinc-300 transition-colors hover:border-white/20 hover:bg-zinc-800 hover:text-white disabled:opacity-40 sm:text-[11px] focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
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
  size = "md",
}: {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "purple" | "cyan";
  size?: "sm" | "md" | "lg" | "icon";
}) {
  const reduce = useReducedMotion();
  const isIcon = size === "icon";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      className={`group relative isolate overflow-hidden font-sans font-bold text-zinc-950 bg-white hover:bg-zinc-100 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-white/50 shadow-[0_4px_14px_rgba(255,255,255,0.12)] hover:shadow-[0_6px_18px_rgba(255,255,255,0.2)] ${
        isIcon
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          : size === "lg"
            ? "inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg px-4 text-xs tracking-wide"
            : size === "sm"
              ? "inline-flex min-h-[30px] w-full items-center justify-center gap-1.5 rounded-md px-3 text-[11px] font-bold tracking-wide"
              : "inline-flex min-h-[34px] w-full items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-bold tracking-wide"
      }`}
    >
      <span className="relative z-[1] flex items-center justify-center gap-1.5 text-zinc-950 font-extrabold tracking-wide [&_*]:text-zinc-950">
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
