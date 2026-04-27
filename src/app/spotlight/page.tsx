import type { Metadata } from "next";
import { SpotlightPageContent } from "@/components/marketing/SpotlightPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";

export const metadata: Metadata = {
  title: "Spotlight — RUHGEN",
  description:
    "Cinematic spotlight for RUHGEN—curated motion and stills you edit from the dashboard, built to feel like a premiere, not a feature list.",
};

export default async function SpotlightPage() {
  const content = await readSiteContent();
  return (
    <MarketingShell>
      <main>
        <SpotlightPageContent content={content} />
      </main>
    </MarketingShell>
  );
}
