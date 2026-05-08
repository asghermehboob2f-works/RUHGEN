"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number };

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let nodes: Node[] = [];
    let animationId: number;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(35, Math.floor((w * h) / 35000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
      }));
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (!prefersReduced) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      }

      const maxDist = Math.min(w, h) * 0.15;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            const alpha = (1 - d / maxDist) * 0.12;
            ctx.strokeStyle = `rgba(123, 97, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = "rgba(0, 212, 255, 0.4)";
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    init();
    if (prefersReduced) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        ctx.fillStyle = "rgba(123, 97, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    draw();
    const onResize = () => {
      cancelAnimationFrame(animationId);
      init();
      draw();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.82] md:opacity-[0.88]"
      aria-hidden
    />
  );
}
