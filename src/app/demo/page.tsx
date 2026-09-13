import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoPageContent } from "@/components/marketing/DemoPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";
import { ContentPageSkeleton } from "@/components/Skeletons";

export const metadata: Metadata = {
  title: "Interactive Studio Demo",
  description:
    "Interactive image and video generation preview—aspect presets, looks, and exports in one flow.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Interactive Studio Demo | RUHGEN",
    description: "Interactive image and video generation preview—aspect presets, looks, and exports in one flow.",
    url: "/demo",
  },
};

async function DemoContent() {
  const content = await readSiteContent();
  return <DemoPageContent content={content} />;
}

export default function DemoPage() {
  return (
    <MarketingShell>
      <main>
        <Suspense fallback={<ContentPageSkeleton />}>
          <DemoContent />
        </Suspense>
      </main>
    </MarketingShell>
  );
}

