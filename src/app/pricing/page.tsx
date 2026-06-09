import type { Metadata } from "next";
import { PricingPageContent } from "@/components/marketing/PricingPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";
import { Suspense } from "react";
import { ContentPageSkeleton } from "@/components/Skeletons";

export const metadata: Metadata = {
  title: "Pricing — RUHGEN",
  description:
    "Simple tiers for individuals and studios—credits, concurrency, and support that scale with you.",
};

async function PricingContent() {
  const content = await readSiteContent();
  return <PricingPageContent content={content} />;
}

export default function PricingPage() {
  return (
    <MarketingShell>
      <main className="flex-1">
        <Suspense fallback={<ContentPageSkeleton />}>
          <PricingContent />
        </Suspense>
      </main>
    </MarketingShell>
  );
}
