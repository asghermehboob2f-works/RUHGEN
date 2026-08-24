import type { Metadata } from "next";
import { PricingPageContent } from "@/components/marketing/PricingPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";
import { Suspense } from "react";
import { ContentPageSkeleton } from "@/components/Skeletons";

export const metadata: Metadata = {
  title: "Flexible Credit Plans & Pricing",
  description:
    "Transparent pricing and credit packages for creators and studios. Choose Free, Pro, or Studio plans with instant rendering, high concurrency, and dedicated support.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Flexible Credit Plans & Pricing | RUHGEN",
    description:
      "Transparent pricing and credit packages for creators and studios with high concurrency and instant rendering.",
    url: "/pricing",
  },
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
