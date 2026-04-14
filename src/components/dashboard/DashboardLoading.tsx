"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  label?: string;
  className?: string;
};

export function DashboardLoading({ label = "Loading…", className = "" }: Props) {
  const reduce = useReducedMotion();
  return (
    <div
      className={`flex min-h-[45vh] flex-col items-center justify-center gap-4 ${className}`}
      style={{ color: "var(--text-muted)" }}
    >
      <motion.span
        className="h-11 w-11 rounded-full border-2 border-t-transparent"
        style={{ borderColor: "var(--primary-purple)", borderTopColor: "transparent" }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        aria-hidden
      />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
