"use client";

import { DashboardSkeleton, StudioSkeleton } from "@/components/Skeletons";

type Props = {
  label?: string;
  className?: string;
};

export function DashboardLoading({ label = "Loading…", className = "" }: Props) {
  const text = label.toLowerCase();
  
  if (text.includes("image")) {
    return <StudioSkeleton type="image" />;
  }
  
  if (text.includes("video")) {
    return <StudioSkeleton type="video" />;
  }
  
  if (text.includes("studio") || text.includes("dashboard") || text.includes("overview")) {
    return <DashboardSkeleton />;
  }

  // Fallback for general loadings
  return (
    <div
      className={`flex min-h-[45vh] flex-col items-center justify-center gap-4 ${className}`}
      style={{ color: "var(--text-muted)" }}
    >
      <div className="relative flex h-11 w-11 items-center justify-center">
        {/* Premium rotating dual-ring loader */}
        <span className="absolute h-full w-full rounded-full border-2 border-dashed border-t-transparent border-[var(--primary-purple)] animate-spin" style={{ animationDuration: '2.5s' }} />
        <span className="absolute h-8 w-8 rounded-full border border-t-transparent border-[var(--primary-cyan)] animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
      </div>
      <p className="text-xs font-semibold tracking-wider uppercase opacity-80" style={{ color: "var(--text-primary)" }}>{label}</p>
    </div>
  );
}

