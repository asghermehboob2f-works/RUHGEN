import type { Metadata } from "next";
import { SpotlightPageContent } from "@/components/marketing/SpotlightPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";

export const metadata: Metadata = {
  title: "Spotlight — RUHGEN",
  description:
    "Highlighted workflows and looks—how teams ship cinematic stills and motion with RUHGEN.",
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
