"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Image as ImageIcon, LayoutGrid, SlidersHorizontal, Sparkles, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useStudioSwipePane } from "@/components/studio/luxury/StudioPremiumUi";
import {
  LuxuryStudioChromeProvider,
  useLuxuryStudioChrome,
  type LuxuryStudioChromeValue,
} from "@/components/studio/luxury/studio-chrome-context";

function RightPanelRenderer({ render }: { render: (ctx: LuxuryStudioChromeValue) => ReactNode }) {
  const ctx = useLuxuryStudioChrome();
  if (!ctx) return null;
  return <>{render(ctx)}</>;
}

export type LuxuryStudioMode = "image" | "video";

const tabBase =
  "relative flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-300 sm:min-h-[40px] sm:gap-2 sm:px-3 sm:text-xs";

const mobilePaneTabBase =
  "relative flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-300 sm:min-h-[42px] sm:text-xs";

export function LuxuryStudioLayout({
  mode,
  eyebrow,
  title,
  subtitle,
  topActions,
  leftPanel,
  rightPanel,
  renderRightPanel,
  mobilePane: mobilePaneControlled,
  onMobilePaneChange,
}: {
  mode: LuxuryStudioMode;
  eyebrow: string;
  title: string;
  subtitle: string;
  topActions?: ReactNode;
  leftPanel: ReactNode;
  rightPanel?: ReactNode;
  renderRightPanel?: (chrome: LuxuryStudioChromeValue) => ReactNode;
  mobilePane?: "output" | "controls";
  onMobilePaneChange?: (pane: "output" | "controls") => void;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const mobileControlsRef = useRef<HTMLElement>(null);
  const mobileCanvasRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobilePaneInternal, setMobilePaneInternal] = useState<"output" | "controls">("output");
  const isMobileControlled = mobilePaneControlled !== undefined && onMobilePaneChange !== undefined;
  const mobilePane = isMobileControlled ? mobilePaneControlled : mobilePaneInternal;
  const setMobilePane = isMobileControlled ? onMobilePaneChange : setMobilePaneInternal;

  const swipe = useStudioSwipePane({
    onSwipeLeft: () => {
      if (mobilePane === "controls") setMobilePane("output");
    },
    onSwipeRight: () => {
      if (mobilePane === "output") setMobilePane("controls");
    },
    threshold: 90,
    edgeOnly: true,
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      if (mq.matches) setMobilePane("output");
    };
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [setMobilePane]);

  const accent =
    mode === "image"
      ? {
          tabOn: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
          tabGlow: "0 4px 16px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          tabBorder: "rgba(165, 180, 252, 0.45)",
          line: "linear-gradient(90deg, rgba(99, 102, 241, 0.7), rgba(124, 58, 237, 0.3), transparent)",
          ring: "rgba(99, 102, 241, 0.4)",
        }
      : {
          tabOn: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
          tabGlow: "0 4px 16px rgba(14, 165, 233, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          tabBorder: "rgba(125, 211, 252, 0.45)",
          line: "linear-gradient(90deg, rgba(14, 165, 233, 0.7), rgba(2, 132, 199, 0.3), transparent)",
          ring: "rgba(14, 165, 233, 0.4)",
        };

  useEffect(() => {
    if (mobilePane === "output" && typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const promptEl = document.getElementById("img-prompt") || document.getElementById("vid-prompt") || mobileCanvasRef.current;
        promptEl?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
      });
    }
  }, [mobilePane, reduce]);

  return (
    <LuxuryStudioChromeProvider collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)}>
      <div
        className="luxury-studio-root font-studio-sans flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-3 max-sm:h-[calc(100dvh-env(safe-area-inset-top,0px)-3.5rem)] sm:px-4 sm:pt-3 lg:h-[calc(100dvh-env(safe-area-inset-top,0px))] lg:max-h-[calc(100dvh-env(safe-area-inset-top,0px))] lg:px-5 lg:pb-4 lg:pt-4"
        data-studio-mode={mode}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <div className="luxury-aurora-layer" aria-hidden>
          <div className="luxury-aurora-blob luxury-aurora-blob--a" />
          <div className="luxury-aurora-blob luxury-aurora-blob--b" />
          <div className="luxury-aurora-blob luxury-aurora-blob--c" />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.035] app-grain" aria-hidden />

        <header className="relative z-10 mb-2 shrink-0 lg:mb-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#0D0F18]/90 p-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.18)] backdrop-blur-3xl sm:gap-3 sm:p-2.5 lg:rounded-2xl lg:pl-3.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ring-1 ring-white/35 sm:h-10 sm:w-10 shadow-lg transition-transform hover:scale-105"
              style={{
                background:
                  mode === "image"
                    ? "linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #3730A3 100%)"
                    : "linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #075985 100%)",
                boxShadow:
                  mode === "image"
                    ? "0 0 24px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
                    : "0 0 24px rgba(14, 165, 233, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
              }}
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-md" strokeWidth={2} />
            </span>

            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="font-mono text-[9px] font-bold uppercase leading-none tracking-[0.2em] sm:tracking-[0.26em] text-indigo-200/90 truncate">
                {eyebrow}
              </p>
              <div className="mt-0.5 sm:mt-1 flex min-w-0 items-baseline gap-x-2.5">
                <h1 className="truncate font-display text-[13px] sm:text-lg font-black leading-tight tracking-tight text-white drop-shadow-sm">
                  {title}
                </h1>
                <p className="hidden min-w-0 max-w-[min(100%,28rem)] truncate text-[11px] font-medium leading-snug text-slate-400 lg:block">
                  {subtitle}
                </p>
              </div>
            </div>

            <nav
              className="ml-auto flex shrink-0 gap-1 rounded-full border border-white/15 bg-black/70 p-1 backdrop-blur-xl shadow-inner"
              aria-label="Studio mode"
            >
              <Link
                href="/dashboard/generate/image"
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  pathname.startsWith("/dashboard/generate/image")
                    ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 border border-white/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span className="hidden sm:inline">Image</span>
              </Link>
              <Link
                href="/dashboard/generate/video"
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  pathname.startsWith("/dashboard/generate/video")
                    ? "bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-600 text-white shadow-lg shadow-sky-500/25 border border-white/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Video className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span className="hidden sm:inline">Video</span>
              </Link>
            </nav>

            {topActions ? (
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{topActions}</div>
            ) : null}
          </div>
          <div className="pointer-events-none mt-1 h-[1px] w-full opacity-30" style={{ background: accent.line }} aria-hidden />
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className="mb-2 flex shrink-0 gap-1.5 rounded-2xl border border-border p-1 shadow-sm backdrop-blur-xl lg:hidden bg-card/60"
            role="tablist"
            aria-label="Studio workspace"
          >
            {(["controls", "output"] as const).map((pane) => (
              <button
                key={pane}
                type="button"
                role="tab"
                aria-selected={mobilePane === pane}
                onClick={() => {
                  setMobilePane(pane);
                  if (typeof window === "undefined") return;
                  window.requestAnimationFrame(() => {
                    const el = pane === "output" ? mobileCanvasRef.current : mobileControlsRef.current;
                    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
                  });
                }}
                className={mobilePaneTabBase}
                style={{
                  background: mobilePane === pane ? accent.tabOn : "transparent",
                  color: mobilePane === pane ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: mobilePane === pane ? accent.tabGlow : undefined,
                  border:
                    mobilePane === pane ? `1px solid var(--border-subtle)` : "1px solid transparent",
                }}
              >
                {pane === "output" ? (
                  <LayoutGrid className="h-4 w-4 shrink-0 opacity-95" strokeWidth={1.75} aria-hidden />
                ) : (
                  <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-95" strokeWidth={1.75} aria-hidden />
                )}
                <span>{pane === "output" ? "Canvas" : "Controls"}</span>
              </button>
            ))}
          </div>

          <div
            className={`relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:grid lg:gap-4 ${
              collapsed ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(300px,min(38vw,440px))_minmax(0,1fr)] xl:grid-cols-[minmax(320px,min(36vw,460px))_minmax(0,1fr)]"
            }`}
          >
            <motion.aside
              ref={mobileControlsRef}
              id="mobile-studio-controls"
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`flex min-h-0 min-w-0 flex-col overflow-hidden ${
                mobilePane === "controls" ? "max-lg:flex max-lg:flex-1 max-lg:h-full" : "max-lg:hidden"
              } ${collapsed ? "lg:hidden" : "lg:flex"}`}
              aria-label="Generation controls"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11131C] shadow-lg backdrop-blur-2xl lg:h-full lg:max-h-full">
                {leftPanel}
              </div>
            </motion.aside>

            <section
              ref={mobileCanvasRef}
              id="mobile-studio-canvas"
              className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden lg:flex lg:min-h-0 ${
                mobilePane === "output" ? "max-lg:flex max-lg:flex-1" : "max-lg:hidden"
              }`}
              aria-label="Output"
            >
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {renderRightPanel ? <RightPanelRenderer render={renderRightPanel} /> : rightPanel}
                </div>
              </div>
            </section>
          </div>
        </div>

      </div>
    </LuxuryStudioChromeProvider>
  );
}
