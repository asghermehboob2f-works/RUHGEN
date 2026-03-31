import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_INTRINSIC, BRAND_LOGO_SRC } from "@/lib/constants";

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

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group inline-flex items-center gap-2.5 sm:gap-3 ${className}`}
    >
      <span
        className="relative inline-flex shrink-0 items-center justify-center"
        style={{ height: h }}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt="RUHGEN"
          width={BRAND_LOGO_INTRINSIC.width}
          height={BRAND_LOGO_INTRINSIC.height}
          className="h-full w-auto max-h-full max-w-[min(72vw,280px)] object-contain object-left transition-[filter,transform] duration-300 group-hover:brightness-110 sm:max-w-[min(42vw,320px)]"
          priority={priority}
          sizes="(max-width: 640px) 72vw, 280px"
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
