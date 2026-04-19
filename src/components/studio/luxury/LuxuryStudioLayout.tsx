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
          tabOn: "color-mix(in srgb, var(--primary-purple) 24%, transparent)",
          tabGlow: "0 0 32px -6px color-mix(in srgb, var(--primary-purple) 50%, transparent)",
          line: "linear-gradient(90deg, var(--primary-purple), var(--primary-cyan))",
          ring: "rgba(123, 97, 255, 0.35)",
        }
      : {
          tabOn: "color-mix(in srgb, var(--primary-cyan) 20%, transparent)",
          tabGlow: "0 0 32px -6px color-mix(in srgb, var(--primary-cyan) 45%, transparent)",
          line: "linear-gradient(90deg, var(--primary-cyan), var(--primary-purple))",
          ring: "rgba(0, 212, 255, 0.32)",
        };

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
          <div
            className="flex items-center gap-2 rounded-2xl border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl sm:gap-3 sm:p-2.5 lg:rounded-xl lg:pl-3"
            style={{
              borderColor: "color-mix(in srgb, white 9%, transparent)",
              background:
                "linear-gradient(165deg, color-mix(in srgb, white 5%, transparent) 0%, color-mix(in srgb, var(--rich-black) 94%, transparent) 100%)",
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ring-1 ring-white/12 sm:h-9 sm:w-9"
              style={{
                background:
                  mode === "image"
                    ? "linear-gradient(135deg, #a78bfa 0%, var(--primary-purple) 50%, #5b21b6 100%)"
                    : "linear-gradient(135deg, #67e8f9 0%, var(--primary-cyan) 50%, #0e7490 100%)",
                boxShadow:
                  mode === "image"
                    ? "0 8px 28px -12px rgba(123, 97, 255, 0.5)"
                    : "0 8px 28px -12px rgba(0, 212, 255, 0.4)",
              }}
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[9px] font-bold uppercase leading-none tracking-[0.22em]" style={{ color: "var(--text-subtle)" }}>
                {eyebrow}
              </p>
              <div className="mt-0.5 flex min-w-0 items-baseline gap-x-2">
                <h1 className="truncate font-display text-[15px] font-bold leading-tight tracking-tight sm:text-lg" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h1>
                <p className="hidden min-w-0 max-w-[min(100%,26rem)] truncate text-[11px] leading-snug lg:block" style={{ color: "var(--text-muted)" }}>
                  {subtitle}
                </p>
              </div>
            </div>

            <nav
              className="ml-auto flex shrink-0 gap-0.5 rounded-xl border p-0.5"
              style={{
                borderColor: "color-mix(in srgb, white 7%, transparent)",
                background: "color-mix(in srgb, var(--deep-black) 72%, transparent)",
              }}
              aria-label="Studio mode"
            >
              <Link
                href="/dashboard/generate/image"
                className={tabBase}
                style={{
                  background: pathname.startsWith("/dashboard/generate/image") ? accent.tabOn : "transparent",
                  color: pathname.startsWith("/dashboard/generate/image") ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: pathname.startsWith("/dashboard/generate/image") ? accent.tabGlow : undefined,
                }}
              >
                <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-90 sm:h-4 sm:w-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Image</span>
              </Link>
              <Link
                href="/dashboard/generate/video"
                className={tabBase}
                style={{
                  background: pathname.startsWith("/dashboard/generate/video") ? accent.tabOn : "transparent",
                  color: pathname.startsWith("/dashboard/generate/video") ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: pathname.startsWith("/dashboard/generate/video") ? accent.tabGlow : undefined,
                }}
              >
                <Video className="h-3.5 w-3.5 shrink-0 opacity-90 sm:h-4 sm:w-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Video</span>
              </Link>
            </nav>

            {topActions ? (
              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">{topActions}</div>
            ) : null}
          </div>
          <div className="pointer-events-none mt-1.5 h-px w-full opacity-70" style={{ background: accent.line }} aria-hidden />
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className="mb-2 flex shrink-0 gap-1.5 rounded-2xl border p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl lg:hidden"
            style={{
              borderColor: "color-mix(in srgb, white 9%, transparent)",
              background: "color-mix(in srgb, var(--deep-black) 78%, transparent)",
            }}
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
                    mobilePane === pane ? `1px solid color-mix(in srgb, white 14%, transparent)` : "1px solid transparent",
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
              className={`flex min-h-0 min-w-0 flex-col overflow-hidden max-lg:min-h-0 lg:min-h-0 ${
                mobilePane === "controls" ? "max-lg:flex max-lg:flex-1" : "max-lg:hidden"
              } ${collapsed ? "lg:hidden" : "lg:flex"}`}
              aria-label="Generation controls"
            >
              <div
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl lg:h-full lg:max-h-full lg:overflow-hidden"
                style={{
                  borderColor: "color-mix(in srgb, white 8%, transparent)",
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, white 4%, transparent) 0%, color-mix(in srgb, var(--deep-black) 88%, transparent) 100%)",
                }}
              >
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
