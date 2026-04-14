/** Primary marketing site navigation — single source for header/footer. */
export const MARKETING_NAV_PRIMARY = [
  { href: "/demo", label: "Demo" },
  { href: "/spotlight", label: "Spotlight" },
  { href: "/features", label: "Features" },
  { href: "/platform", label: "Platform" },
  { href: "/gallery", label: "Gallery" },
  { href: "/workflow", label: "Workflow" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
] as const;

/** Shown as a distinct group in the header so About/Contact are never clipped. */
export const MARKETING_NAV_SECONDARY = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const MARKETING_NAV = [
  ...MARKETING_NAV_PRIMARY,
  ...MARKETING_NAV_SECONDARY,
] as const;
