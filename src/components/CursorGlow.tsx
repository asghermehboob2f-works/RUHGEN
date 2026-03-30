"use client";

import { useEffect, useState } from "react";

type Point = { x: number; y: number };

export function CursorGlow({ disabled = false }: { disabled?: boolean }) {
  const [p, setP] = useState<Point | null>(null);

  useEffect(() => {
    if (disabled) return;
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const onMove = (e: MouseEvent) => {
      setP({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [disabled]);

  if (!p || disabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[2] hidden md:block"
      aria-hidden
    >
      <div
        className="absolute h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.13] blur-[90px] transition-[transform] duration-100 ease-out will-change-transform"
        style={{
          left: p.x,
          top: p.y,
          background:
            "radial-gradient(circle, rgba(123,97,255,0.9) 0%, rgba(0,212,255,0.45) 45%, transparent 70%)",
        }}
      />
    </div>
  );
}
