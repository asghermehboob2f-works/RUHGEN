"use client";

import { useEffect, useRef } from "react";

export function CursorGlow({ disabled = false }: { disabled?: boolean }) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const glowEl = glowRef.current;
    if (!glowEl) return;

    // Start invisible to avoid snap jump on first movement
    glowEl.style.opacity = "0";

    const onMove = (e: MouseEvent) => {
      glowEl.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
      glowEl.style.opacity = "0.13";
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [disabled]);

  if (disabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[2] hidden md:block"
      aria-hidden
    >
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-[420px] w-[420px] rounded-full blur-[90px] transition-[transform,opacity] duration-150 ease-out will-change-transform"
        style={{
          opacity: 0,
          background:
            "radial-gradient(circle, rgba(123,97,255,0.9) 0%, rgba(0,212,255,0.45) 45%, transparent 70%)",
        }}
      />
    </div>
  );
}

