import type { Metadata } from "next";
import { Suspense } from "react";
import { SpotlightPageContent } from "@/components/marketing/SpotlightPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";
import { ContentPageSkeleton } from "@/components/Skeletons";

export const metadata: Metadata = {
  title: "Spotlight — RUHGEN",
  description:
    "Cinematic spotlight for RUHGEN—curated motion and stills you edit from the dashboard, built to feel like a premiere, not a feature list.",
};

async function SpotlightContent() {
  const content = await readSiteContent();
  return <SpotlightPageContent content={content} />;
}

export default function SpotlightPage() {
  return (
    <MarketingShell>
      <main>
        <Suspense fallback={<ContentPageSkeleton />}>
          <SpotlightContent />
        </Suspense>
      </main>
    </MarketingShell>
  );
}
