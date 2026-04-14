import type { Metadata } from "next";
import { AboutPageContent } from "@/components/AboutPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "About — RUHGEN",
  description:
    "Why we built RUHGEN: a creative engine for teams who care about craft, speed, and ownership.",
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <AboutPageContent />
    </MarketingShell>
  );
}
