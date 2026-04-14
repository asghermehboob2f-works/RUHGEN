import type { Metadata } from "next";
import { GalleryPageContent } from "@/components/marketing/GalleryPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";

export const metadata: Metadata = {
  title: "Gallery — RUHGEN",
  description:
    "Curated outputs from the RUHGEN community—cinematic stills and motion frames worth pinning.",
};

export default async function GalleryPage() {
  const content = await readSiteContent();
  return (
    <MarketingShell>
      <main className="flex-1">
        <GalleryPageContent content={content} />
      </main>
    </MarketingShell>
  );
}
