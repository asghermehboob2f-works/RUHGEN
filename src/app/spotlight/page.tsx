import type { Metadata } from "next";
import { Suspense } from "react";
import { SpotlightPageContent } from "@/components/marketing/SpotlightPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";
import { ContentPageSkeleton } from "@/components/Skeletons";

export const metadata: Metadata = {
  title: "Creator Spotlight — Showcase",
  description:
    "Curated showcase featuring cinematic motion and photorealistic imagery created with the RUHGEN generative suite.",
  alternates: {
    canonical: "/spotlight",
  },
  openGraph: {
    title: "Creator Spotlight — Showcase | RUHGEN",
    description: "Curated showcase featuring cinematic motion and photorealistic imagery created with RUHGEN.",
    url: "/spotlight",
  },
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
