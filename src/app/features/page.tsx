import type { Metadata } from "next";
import { FeaturesPageContent } from "@/components/marketing/FeaturesPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";

export const metadata: Metadata = {
  title: "Features — RUHGEN",
  description:
    "Generation modes, pipelines, collaboration, and delivery—everything you need to ship visuals faster.",
};

export default async function FeaturesPage() {
  const content = await readSiteContent();
  return (
    <MarketingShell>
      <main className="flex-1">
        <FeaturesPageContent content={content} />
      </main>
    </MarketingShell>
  );
}

