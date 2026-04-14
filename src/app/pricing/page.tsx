import type { Metadata } from "next";
import { PricingPageContent } from "@/components/marketing/PricingPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Pricing — RUHGEN",
  description:
    "Simple tiers for individuals and studios—credits, concurrency, and support that scale with you.",
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <main className="flex-1">
        <PricingPageContent />
      </main>
    </MarketingShell>
  );
}
