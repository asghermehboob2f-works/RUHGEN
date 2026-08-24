import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturesPageContent } from "@/components/marketing/FeaturesPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";
import { ContentPageSkeleton } from "@/components/Skeletons";

export const metadata: Metadata = {
  title: "AI Generation Features & Creative Tools",
  description:
    "Explore RUHGEN's AI generation capabilities: ultra-fast image synthesis, cinematic video rendering, custom aspect ratios, style presets, and team workflows.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "AI Generation Features & Creative Tools | RUHGEN",
    description:
      "Ultra-fast image synthesis, cinematic video rendering, custom aspect ratios, style presets, and team workflows.",
    url: "/features",
  },
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

