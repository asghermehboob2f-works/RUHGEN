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

  const accent = {
    tabOn: "rgba(255, 255, 255, 0.12)",
    tabGlow: "0 1px 4px rgba(0, 0, 0, 0.4)",
    line: "rgba(255, 255, 255, 0.08)",
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
        data-mobile-pane={mobilePane}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-[var(--deep-black)] transition-colors duration-200" aria-hidden />

        <header className="relative z-10 mb-2 shrink-0 lg:mb-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] p-2 shadow-md backdrop-blur-xl sm:gap-3 sm:p-2.5 lg:pl-3.5 transition-colors duration-200">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] sm:h-10 sm:w-10 shadow-sm"
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-primary)]" strokeWidth={2} />
            </span>

            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="font-mono text-[9px] font-bold uppercase leading-none tracking-[0.2em] sm:tracking-[0.26em] text-[var(--text-subtle)] truncate">
                {eyebrow}
              </p>
              <div className="mt-0.5 sm:mt-1 flex min-w-0 items-baseline gap-x-2.5">
                <h1 className="truncate font-display text-[13px] sm:text-lg font-black leading-tight tracking-tight text-[var(--text-primary)] drop-shadow-sm">
                  {title}
                </h1>
                <p className="hidden min-w-0 max-w-[min(100%,28rem)] truncate text-[11px] font-medium leading-snug text-[var(--text-muted)] lg:block">
                  {subtitle}
                </p>
              </div>
            </div>

            <nav
              className="ml-auto flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] p-1"
              aria-label="Studio mode"
            >
              <Link
                href="/dashboard/generate/image"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${pathname.startsWith("/dashboard/generate/image")
                    ? "bg-[var(--soft-black)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
              >
                <ImageIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span className="hidden sm:inline">Image</span>
              </Link>
              <Link
                href="/dashboard/generate/video"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${pathname.startsWith("/dashboard/generate/video")
                    ? "bg-[var(--soft-black)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
          <div className="pointer-events-none mt-1 h-[1px] w-full bg-[var(--border-subtle)]" aria-hidden />
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className="mb-2 flex shrink-0 gap-1 rounded-xl border border-[var(--border-subtle)] p-1 shadow-sm lg:hidden bg-[var(--glass)]"
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
                className={`${mobilePaneTabBase} ${
                  mobilePane === pane
                    ? "border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
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
            className={`relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:grid lg:gap-4 ${collapsed ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(300px,min(38vw,440px))_minmax(0,1fr)] xl:grid-cols-[minmax(320px,min(36vw,460px))_minmax(0,1fr)]"
              }`}
          >
            <motion.aside
              ref={mobileControlsRef}
              id="mobile-studio-controls"
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`studio-scrollbar flex min-h-0 min-w-0 flex-col max-lg:h-full max-lg:w-full max-lg:overflow-y-auto max-lg:overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y lg:overflow-hidden ${mobilePane === "controls" ? "max-lg:flex max-lg:flex-1" : "max-lg:hidden"
                } ${collapsed ? "lg:hidden" : "lg:flex"}`}
              aria-label="Generation controls"
            >
              <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] shadow-md max-lg:min-h-max lg:h-full lg:max-h-full lg:overflow-hidden transition-colors duration-200">
                {leftPanel}
              </div>
            </motion.aside>

            <section
              ref={mobileCanvasRef}
              id="mobile-studio-canvas"
              className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden lg:flex lg:min-h-0 ${mobilePane === "output" ? "max-lg:flex max-lg:flex-1" : "max-lg:hidden"
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
