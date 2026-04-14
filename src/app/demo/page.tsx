import type { Metadata } from "next";
import { DemoPageContent } from "@/components/marketing/DemoPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Demo — RUHGEN",
  description:
    "Interactive image and video generation preview—aspect presets, looks, and exports in one flow.",
};

export default function DemoPage() {
  return (
    <MarketingShell>
      <main>
        <DemoPageContent />
      </main>
    </MarketingShell>
  );
}
