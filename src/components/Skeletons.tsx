"use client";

import React from "react";
import {
  Coins,
  CreditCard,
  Image as ImageIcon,
  Settings,
  Sparkles,
  TrendingUp,
  Video,
  Zap,
  HelpCircle,
  ArrowRight,
  Wand2,
  Clapperboard,
  User,
  Palette,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  BookOpen
} from "lucide-react";

/**
 * Hardware-Accelerated Shimmer Base Component
 * Uses CSS transform (GPU-accelerated) defined in globals.css
 */
export function Skeleton({
  className = "",
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-[#1e1e24]/40 light:bg-black/[0.04] dark:bg-white/[0.02] border border-white/[0.03] light:border-black/[0.05] ${className}`}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] light:via-black/[0.06] to-transparent animate-shimmer" />
    </div>
  );
}

/**
 * Skeleton for user greeting & text content blocks
 */
export function TextSkeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => {
        // Vary widths to look like real paragraphs
        const widthClass = i === lines - 1 ? "w-[60%]" : i === 0 ? "w-[90%]" : "w-[100%]";
        return <Skeleton key={i} className={`h-3.5 rounded-md ${widthClass}`} />;
      })}
    </div>
  );
}

/**
 * Skeleton for Dashboard Page (/dashboard)
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-10 animate-pulse duration-1000">
      {/* Banner / Studio Overview Section */}
      <div
        className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 lg:p-6"
        style={{
          borderColor: "rgba(123,97,255,0.15)",
          background: "linear-gradient(180deg, rgba(18,18,18,0.7) 0%, rgba(10,10,10,0.9) 100%)",
        }}
      >
        <div className="relative grid gap-5 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Greeting & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
            <Skeleton className="h-5 w-32 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-64 rounded-xl" />
              <TextSkeleton lines={2} className="max-w-xl" />
            </div>
            <div className="flex gap-2.5 pt-2">
              <Skeleton className="h-9 w-36 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>

          {/* Right Column: Statistics Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-2">
            {[
              { label: "Credits", icon: Coins, color: "var(--primary-cyan)" },
              { label: "This month", icon: TrendingUp, color: "var(--primary-purple)" },
              { label: "Queue", icon: Zap, color: "var(--accent-pink)" },
              { label: "Plan", icon: Sparkles, color: "var(--primary-cyan)" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-xl border p-3.5"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.05)",
                  background: "rgba(255,255,255,0.01)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                    {stat.label}
                  </span>
                  <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02]">
                    <stat.icon className="h-3.5 w-3.5 opacity-40" style={{ color: stat.color }} />
                  </div>
                </div>
                <Skeleton className="mt-2.5 h-6 w-16 rounded-lg" />
                <Skeleton className="mt-1.5 h-3.5 w-24 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-24 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Image studio", icon: ImageIcon },
            { label: "Video studio", icon: Video },
          ].map((t) => (
            <div
              key={t.label}
              className="relative flex min-h-[170px] flex-col rounded-2xl border p-5.5 sm:min-h-[190px] sm:p-6.5"
              style={{
                borderColor: "rgba(255, 255, 255, 0.05)",
                background: "rgba(10,10,10,0.4)",
              }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-white/[0.01]">
                <t.icon className="h-4.5 w-4.5 opacity-30 text-[var(--text-muted)]" />
              </span>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-3.5 w-full max-w-sm rounded-md" />
              </div>
              <div className="mt-auto pt-4 flex items-center gap-1.5 text-[10px] font-bold text-[var(--primary-cyan)] opacity-50">
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shortcuts Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-4 w-52 rounded-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Credits & plan", icon: Coins },
            { label: "Preferences", icon: Settings },
            { label: "Help & support", icon: HelpCircle },
          ].map((q) => (
            <div
              key={q.label}
              className="flex items-center gap-4 rounded-xl border p-4"
              style={{
                borderColor: "rgba(255, 255, 255, 0.05)",
                background: "rgba(10,10,10,0.4)",
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/[0.01]">
                <q.icon className="h-4.5 w-4.5 opacity-35 text-[var(--primary-cyan)]" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-3 w-40 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-4 w-44 rounded-md" />
        </div>
        <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Skeleton for Billing Page (/dashboard/billing)
 */
export function BillingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse duration-1000">
      <div>
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="mt-2.5 h-9 w-64 rounded-xl" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-2xl rounded-md" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left balance card */}
        <div
          className="rounded-3xl border p-6 sm:p-8 space-y-6"
          style={{
            borderColor: "rgba(123,97,255,0.15)",
            background: "rgba(10,10,10,0.4)",
          }}
        >
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.01] border border-white/5">
              <Coins className="h-7 w-7 opacity-35 text-[var(--primary-cyan)]" />
            </span>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-11 w-36 rounded-2xl" />
            <Skeleton className="h-11 w-36 rounded-2xl" />
          </div>
        </div>

        {/* Right plan card */}
        <div
          className="rounded-3xl border p-6 sm:p-8 space-y-4"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 opacity-40 text-[var(--primary-cyan)]" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-md rounded-md" />
          <ul className="space-y-3 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Settings Page (/dashboard/settings)
 */
export function SettingsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse duration-1000">
      <div>
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="mt-2.5 h-9 w-64 rounded-xl" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-2xl rounded-md" />
      </div>

      {[
        { title: "Account", icon: User, color: "var(--primary-purple)" },
        { title: "Appearance", icon: Palette, color: "var(--primary-cyan)" },
        { title: "Notifications", icon: Bell, color: "var(--accent-pink)" },
        { title: "Session", icon: LogOut, color: "var(--text-muted)" },
      ].map((section, idx) => (
        <section
          key={section.title}
          className="rounded-3xl border p-5 sm:p-6.5 space-y-4"
          style={{
            borderColor: "var(--border-subtle)",
            background: "rgba(18, 18, 18, 0.4)",
          }}
        >
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.04]">
            <section.icon className="h-5 w-5 opacity-45" style={{ color: section.color }} />
            <Skeleton className="h-5 w-36 rounded-md" />
          </div>

          {idx === 0 && (
            <div className="space-y-4 py-2">
              <Skeleton className="h-4 w-64 rounded-md" />
              <Skeleton className="h-12 w-full max-w-lg rounded-2xl" />
            </div>
          )}

          {idx === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-white/[0.03] gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-3 w-52 rounded-md" />
                </div>
                <Skeleton className="h-10 w-40 rounded-2xl shrink-0" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-64 rounded-md" />
                </div>
                <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
              </div>
            </div>
          )}

          {idx === 2 && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full max-w-lg rounded-md" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3 w-64 rounded-md" />
                  </div>
                  <Skeleton className="h-8 w-[52px] rounded-full shrink-0" />
                </div>
              ))}
            </div>
          )}

          {idx === 3 && (
            <div className="space-y-4 pt-2">
              <Skeleton className="h-4 w-full max-w-xl rounded-md" />
              <div className="flex flex-wrap gap-3 pt-2">
                <Skeleton className="h-11 w-64 rounded-2xl" />
                <Skeleton className="h-11 w-36 rounded-2xl" />
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

/**
 * High-Fidelity Studio Layout Skeleton (for Image Studio & Video Studio)
 * Prevents layout shift during loading of complex canvas, panels, and chats.
 */
export function StudioSkeleton({ type }: { type: "image" | "video" }) {
  const isImage = type === "image";
  const accentColor = isImage ? "var(--primary-purple)" : "var(--primary-cyan)";
  const icon = isImage ? Wand2 : Clapperboard;
  const subtitleText = isImage ? "Diffusion pipeline" : "Temporal engine";
  const eyebrowText = isImage ? "Control deck" : "Motion deck";

  return (
    <div className="flex w-full h-[calc(100vh-4rem)] lg:h-[calc(100vh-0px)] overflow-hidden text-[var(--text-primary)] animate-pulse duration-1000">
      {/* 2-Column Grid matching LuxuryStudioLayout */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12 min-h-0 min-w-0">
        
        {/* Left Panel: Control Deck (col-span-4) */}
        <aside className="lg:col-span-4 border-r border-white/[0.08] bg-black/40 flex flex-col min-h-0 min-w-0">
          <div className="studio-scrollbar min-h-0 flex-1 overflow-y-auto p-3 space-y-4">
            
            {/* Themed Control Frame Box */}
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: `color-mix(in srgb, ${accentColor} 20%, rgba(255,255,255,0.06))`,
                background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 6%, var(--deep-black)) 0%, rgba(10,10,10,0.95) 100%)`,
              }}
            >
              {/* Header */}
              <div className="mb-4 flex items-center gap-2 border-b border-white/[0.06] pb-3.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.02] border"
                  style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
                >
                  {React.createElement(icon, { className: "h-4 w-4", style: { color: accentColor } })}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
                    {eyebrowText}
                  </span>
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
              </div>

              {/* Collapsible 1: Canvas & model / Timeline */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-4 w-4 rounded-md" />
                </div>

                {isImage ? (
                  // Image aspects grid (7 sizes)
                  <div className="space-y-3">
                    <Skeleton className="h-3.5 w-12 rounded" />
                    <div className="grid grid-cols-2 gap-1.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-10 rounded-xl border border-white/[0.05] bg-black/20 flex flex-col items-center justify-center space-y-1"
                        >
                          <Skeleton className="h-3.5 w-16 rounded" />
                          <Skeleton className="h-2.5 w-8 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Video length buttons (2 sizes) + modes (2 sizes)
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-16 rounded" />
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="h-14 rounded-xl border border-white/[0.05] bg-black/20" />
                        <div className="h-14 rounded-xl border border-white/[0.05] bg-black/20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-24 rounded" />
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="h-12 rounded-xl border border-white/[0.05] bg-black/20" />
                        <div className="h-12 rounded-xl border border-white/[0.05] bg-black/20" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Render engine selection */}
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>

              {/* Collapsible 2: Prompt Chips */}
              <div className="mt-6 space-y-3 pt-4 border-t border-white/[0.05]">
                <div className="flex justify-between items-center pb-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-4 w-4 rounded-md" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-[70px] sm:w-[90px] rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Collapsible 3: Reference image/negatives */}
              <div className="mt-6 space-y-3 pt-4 border-t border-white/[0.05]">
                <div className="flex justify-between items-center pb-2">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-4 w-4 rounded-md" />
                </div>
              </div>

            </div>
          </div>
        </aside>

        {/* Right Panel: Canvas Output & Chat Feed (col-span-8) */}
        <main className="lg:col-span-8 flex flex-col min-h-0 min-w-0 bg-[#07070a]/90 relative">
          {/* Header tabs row */}
          <header className="h-12 shrink-0 border-b border-white/[0.06] px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </header>

          {/* Chat / Canvas Output Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Assistant message skeleton (Visual output preview) */}
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="h-8 w-8 rounded-lg bg-white/[0.03] border border-white/5 shrink-0 flex items-center justify-center">
                <Sparkles className="h-4 w-4 opacity-30" style={{ color: accentColor }} />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
                {/* Media frame skeleton */}
                <div
                  className="rounded-xl border overflow-hidden relative shadow-lg"
                  style={{
                    borderColor: "rgba(255,255,255,0.06)",
                    background: "rgba(0,0,0,0.3)",
                    aspectRatio: isImage ? "1" : "16/9",
                    maxWidth: isImage ? "400px" : "100%",
                  }}
                >
                  <Skeleton className="absolute inset-0 w-full h-full" />
                </div>
                {/* Image tools skeleton */}
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-24 rounded-lg" />
                  <Skeleton className="h-7 w-20 rounded-lg" />
                  <Skeleton className="h-7 w-8 rounded-lg" />
                </div>
              </div>
            </div>

            {/* User prompt message bubble skeleton */}
            <div className="flex items-start justify-end gap-3.5 max-w-2xl ml-auto">
              <div className="space-y-2 flex-1 text-right flex flex-col items-end">
                <div className="flex items-center gap-2 justify-end">
                  <Skeleton className="h-3 w-12 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-left w-full max-w-md space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-[80%] rounded-md" />
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 shrink-0" />
            </div>

          </div>

          {/* Bottom input composer dock */}
          <footer className="shrink-0 border-t border-white/[0.06] bg-black/60 p-4 space-y-3.5">
            {/* suggestions */}
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
              <Skeleton className="h-6.5 w-32 rounded-lg shrink-0" />
              <Skeleton className="h-6.5 w-24 rounded-lg shrink-0" />
              <Skeleton className="h-6.5 w-40 rounded-lg shrink-0" />
            </div>
            
            {/* composer text area */}
            <div
              className="rounded-xl border p-2 flex items-center gap-2"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(10,10,10,0.8)",
              }}
            >
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <Skeleton className="h-6 w-full rounded-md" />
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" style={{ background: accentColor }} />
            </div>
          </footer>
        </main>

      </div>
    </div>
  );
}

/**
 * Skeleton for standard landing pages and content blocks (About, Pricing, Contact, Academy)
 */
export function ContentPageSkeleton() {
  return (
    <div className="w-full min-h-screen pt-20 px-4 sm:px-6 lg:px-8 space-y-12 max-w-7xl mx-auto animate-pulse duration-1000">
      {/* Header section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="flex justify-center">
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-12 w-3/4 mx-auto rounded-xl" />
        <Skeleton className="h-4 w-full max-w-xl mx-auto rounded-md" />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 md:grid-cols-3 pt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border p-6 space-y-5"
            style={{
              borderColor: "rgba(255, 255, 255, 0.05)",
              background: "rgba(18, 18, 18, 0.4)",
            }}
          >
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/2 rounded-md" />
              <TextSkeleton lines={3} />
            </div>
            <div className="pt-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary large section layout */}
      <div
        className="rounded-2xl border p-6 sm:p-10 grid md:grid-cols-2 gap-8 items-center"
        style={{
          borderColor: "rgba(255, 255, 255, 0.05)",
          background: "rgba(10, 10, 10, 0.5)",
        }}
      >
        <div className="space-y-4">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-2/3 rounded-lg" />
          <TextSkeleton lines={4} />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
