"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Cpu,
  Layers,
  Flame,
  Tag,
  Workflow,
  GraduationCap,
  BookOpen,
  Users,
  Compass,
  HelpCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useReducedMotion } from "framer-motion";

export interface DestinationCard {
  title: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const POPULAR_DESTINATIONS: DestinationCard[] = [
  {
    title: "Home",
    href: "/",
    description: "Creative studio and showcase.",
    icon: Sparkles,
  },
  {
    title: "Live Demo",
    href: "/demo",
    description: "Interactive generation presets.",
    icon: Play,
  },
  {
    title: "Platform",
    href: "/platform",
    description: "Neural inference architecture.",
    icon: Cpu,
  },
  {
    title: "Features",
    href: "/features",
    description: "Tools, styles, and controls.",
    icon: Layers,
  },
  {
    title: "Spotlight",
    href: "/spotlight",
    description: "Curated community showcase.",
    icon: Flame,
  },
  {
    title: "Pricing",
    href: "/pricing",
    description: "Creator and studio plans.",
    icon: Tag,
  },
  {
    title: "Workflow",
    href: "/workflow",
    description: "Visual node pipelines.",
    icon: Workflow,
  },
  {
    title: "Academy",
    href: "/academy",
    description: "Prompt masterclasses.",
    icon: GraduationCap,
  },
  {
    title: "Tutorials",
    href: "/tutorials",
    description: "Techniques and recipes.",
    icon: BookOpen,
  },
  {
    title: "Community",
    href: "/community",
    description: "Creator discussions and feeds.",
    icon: Users,
  },
  {
    title: "About",
    href: "/about",
    description: "Our story and philosophy.",
    icon: Compass,
  },
  {
    title: "FAQ",
    href: "/faq",
    description: "Common questions & support.",
    icon: HelpCircle,
  },
  {
    title: "Contact",
    href: "/contact",
    description: "Support and direct inquiries.",
    icon: Send,
  },
];

export function NotFoundRouteSlider() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const shouldReduceMotion = useReducedMotion();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < maxScroll - 6);
  }, []);

  const scrollByDirection = useCallback((direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardStep = 220;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (direction === "right") {
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardStep, behavior: "smooth" });
      }
    } else {
      if (el.scrollLeft <= 10) {
        el.scrollTo({ left: maxScroll, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -cardStep, behavior: "smooth" });
      }
    }
  }, []);

  // Auto sliding timer
  useEffect(() => {
    if (shouldReduceMotion || isPaused) return;

    const interval = setInterval(() => {
      scrollByDirection("right");
    }, 3200);

    return () => clearInterval(interval);
  }, [isPaused, shouldReduceMotion, scrollByDirection]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  return (
    <div
      className="w-full max-w-4xl mx-auto px-4 sm:px-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {/* Header & Controls */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--text-subtle)" }}
          >
            Explore Directory
          </h2>
        </div>

        {/* Minimal Scroll Arrows */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollByDirection("left")}
            aria-label="Scroll left"
            className="p-1.5 rounded-md border transition-colors cursor-pointer hover:bg-[var(--glass)] focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--primary-purple)]"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByDirection("right")}
            aria-label="Scroll right"
            className="p-1.5 rounded-md border transition-colors cursor-pointer hover:bg-[var(--glass)] focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--primary-purple)]"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Slider Track - Slim Cards */}
      <div
        ref={scrollContainerRef}
        role="region"
        aria-label="Directory routes"
        tabIndex={0}
        className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--primary-purple)] rounded-lg"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {POPULAR_DESTINATIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex-none w-[175px] sm:w-[195px] snap-start rounded-lg border p-3 transition-all duration-150 hover:border-[var(--primary-purple)]/60 hover:bg-[var(--glass-elevated)] focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--primary-purple)] flex flex-col justify-between"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: isLight
                  ? "rgba(0, 0, 0, 0.015)"
                  : "rgba(255, 255, 255, 0.018)",
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded border transition-colors group-hover:border-[var(--primary-purple)]/50"
                    style={{
                      borderColor: "var(--border-subtle)",
                      backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <ArrowUpRight
                    className="h-3 w-3 opacity-30 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[var(--primary-purple)]"
                  />
                </div>

                <h3
                  className="text-xs font-semibold tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[11px] leading-tight mt-1 line-clamp-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono truncate" style={{ color: "var(--text-subtle)" }}>
                {item.href}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
