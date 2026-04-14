"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_LOGO_INTRINSIC, BRAND_LOGO_SRC, BRAND_LOGO_SRC_LIGHT } from "@/lib/constants";
import { useTheme } from "./ThemeProvider";

type Size = "sm" | "md" | "lg" | "xl";

/** Logo height in px; width follows asset aspect via object-contain */
const heightPx: Record<Size, number> = {
  sm: 34,
  md: 42,
  lg: 52,
  xl: 64,
};

type Props = {
  size?: Size;
  showWordmark?: boolean;
  className?: string;
  href?: string;
  priority?: boolean;
  onNavigate?: () => void;
};

export function BrandLogo({
  size = "md",
  showWordmark = false,
  className = "",
  href = "/",
  priority = false,
  onNavigate,
}: Props) {
  const h = heightPx[size];
  const pathname = usePathname();
  const { theme } = useTheme();
  const src = theme === "light" ? BRAND_LOGO_SRC_LIGHT : BRAND_LOGO_SRC;

  const onLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();
    if (href === "/" && pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Link
      href={href}
      onClick={onLogoClick}
      className={`group relative z-[1] inline-flex shrink-0 cursor-pointer items-center gap-2.5 sm:gap-3 ${className}`}
      aria-label="RUHGEN — Home"
    >
      <span
        className="relative inline-flex shrink-0 items-center justify-center"
        style={{ height: h }}
      >
        <Image
          key={src}
          src={src}
          alt=""
          width={BRAND_LOGO_INTRINSIC.width}
          height={BRAND_LOGO_INTRINSIC.height}
          className="h-full w-auto max-h-full max-w-[min(72vw,280px)] object-contain object-left transition-[filter,transform] duration-300 group-hover:brightness-110 sm:max-w-[min(42vw,320px)]"
          priority={priority}
          sizes="(max-width: 640px) 72vw, 280px"
        />
      </span>
      {showWordmark && (
        <span
          className="font-display text-lg font-bold tracking-tight sm:text-xl"
          style={{ color: "var(--text-primary)" }}
        >
          RUHGEN
        </span>
      )}
    </Link>
  );
}
