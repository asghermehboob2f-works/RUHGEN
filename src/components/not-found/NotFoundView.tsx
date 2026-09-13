"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { NotFoundRouteSlider } from "./NotFoundRouteSlider";

export function NotFoundView() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <main className="relative flex-1 flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-6">
      <div className="w-full max-w-2xl mx-auto text-center space-y-4 mb-10 sm:mb-14">
        {/* Subtle Classic Kicker */}
        <p
          className="text-xs font-mono font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--text-subtle)" }}
        >
          404 &mdash; Page Not Found
        </p>

        {/* Classic Headline */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-display"
          style={{ color: "var(--text-primary)" }}
        >
          You took a wrong turn.
        </h1>

        {/* Refined & Mature Subtitle */}
        <p
          className="text-sm sm:text-base leading-relaxed max-w-md mx-auto"
          style={{ color: "var(--text-muted)" }}
        >
          The page you are looking for doesn’t exist or may have moved. Explore the directory below or return to the main studio.
        </p>

        {/* Classic Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-4.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: "var(--primary-purple)",
            }}
          >
            <Home className="h-3.5 w-3.5" />
            Back to Home
          </Link>

          <button
            type="button"
            onClick={handleGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border px-4.5 py-2 text-xs font-medium transition-all duration-150 hover:bg-[var(--glass)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 cursor-pointer"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous Page
          </button>
        </div>
      </div>

      {/* Slim Auto-Sliding Directory */}
      <NotFoundRouteSlider />
    </main>
  );
}
