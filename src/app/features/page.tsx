import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturesPageContent } from "@/components/marketing/FeaturesPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";
import { ContentPageSkeleton } from "@/components/Skeletons";

export const metadata: Metadata = {
  title: "Features — RUHGEN",
  description:
    "Generation modes, pipelines, collaboration, and delivery—everything you need to ship visuals faster.",
};

async function FeaturesContent() {
  const content = await readSiteContent();
  return <FeaturesPageContent content={content} />;
}

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <main className="flex-1">
        <Suspense fallback={<ContentPageSkeleton />}>
          <FeaturesContent />
        </Suspense>
      </main>
    </MarketingShell>
  );
}

