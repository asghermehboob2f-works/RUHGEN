import type { Metadata } from "next";
import { FeaturesPageContent } from "@/components/marketing/FeaturesPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Features — RUHGEN",
  description:
    "Generation modes, pipelines, collaboration, and delivery—everything you need to ship visuals faster.",
};

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <main className="flex-1">
        <FeaturesPageContent />
      </main>
    </MarketingShell>
  );
}
