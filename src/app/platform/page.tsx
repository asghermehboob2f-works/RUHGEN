import type { Metadata } from "next";
import { PlatformPageContent } from "@/components/marketing/PlatformPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "AI Generation Platform Architecture",
  description:
    "Edge routing, multi-pass exports, guardrails, and burst capacity—built for real production timelines, not just demos.",
  alternates: {
    canonical: "/platform",
  },
  openGraph: {
    title: "AI Generation Platform Architecture | RUHGEN",
    description: "Edge routing, multi-pass exports, guardrails, and burst capacity built for production timelines.",
    url: "/platform",
  },
};

export default function PlatformPage() {
  return (
    <MarketingShell>
      <main>
        <PlatformPageContent />
      </main>
    </MarketingShell>
  );
}
