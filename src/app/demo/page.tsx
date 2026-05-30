import type { Metadata } from "next";
import { DemoPageContent } from "@/components/marketing/DemoPageContent";
import { MarketingShell } from "@/components/MarketingShell";
import { readSiteContent } from "@/backend/site-content";

export const metadata: Metadata = {
  title: "Demo — RUHGEN",
  description:
    "Interactive image and video generation preview—aspect presets, looks, and exports in one flow.",
};

export default async function DemoPage() {
  const content = await readSiteContent();
  return (
    <MarketingShell>
      <main>
        <DemoPageContent content={content} />
      </main>
    </MarketingShell>
  );
}

