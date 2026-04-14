import type { Metadata } from "next";
import { PlatformPageContent } from "@/components/marketing/PlatformPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Platform — RUHGEN",
  description:
    "Edge routing, multi-pass exports, guardrails, and burst capacity—built for real production timelines, not just demos.",
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
