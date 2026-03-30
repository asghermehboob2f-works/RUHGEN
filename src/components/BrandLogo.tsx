import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_SRC } from "@/lib/constants";

type Size = "sm" | "md" | "lg" | "xl";

const px: Record<Size, number> = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 52,
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
  showWordmark = true,
  className = "",
  href = "/",
  priority = false,
  onNavigate,
}: Props) {
  const dim = px[size];

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group inline-flex items-center gap-2.5 sm:gap-3 ${className}`}
    >
      <span
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass)] transition-[box-shadow,transform] duration-300 group-hover:border-[#7B61FF]/35 group-hover:shadow-[0_0_32px_-4px_rgba(123,97,255,0.5)] group-active:scale-[0.98]"
        style={{ width: dim + 8, height: dim + 8 }}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt="RUHGEN"
          width={dim}
          height={dim}
          className="object-contain p-1.5"
          priority={priority}
        />
      </span>
      {showWordmark && (
        <span
          className="font-display text-base font-bold tracking-tight sm:text-lg"
          style={{ color: "var(--text-primary)" }}
        >
          RUHGEN
        </span>
      )}
    </Link>
  );
}
