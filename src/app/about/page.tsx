import type { Metadata } from "next";
import { AboutPageContent } from "@/components/AboutPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "About Us — Generative AI Platform",
  description:
    "Learn why RUHGEN was engineered: a high-performance generative AI studio empowering creators and agencies with ownership, precision, and speed.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us — RUHGEN Generative AI Studio",
    description:
      "A high-performance generative AI studio empowering creators and agencies with ownership, precision, and speed.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <AboutPageContent />
    </MarketingShell>
  );
}
