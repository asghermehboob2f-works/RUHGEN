import type { Metadata } from "next";
import { AcademyPageContent } from "@/components/marketing/AcademyPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Academy — RUHGEN",
  description:
    "Master generative AI tools, discover proven earning strategies, and access premium courses to scale your creative agency.",
};

export default function AcademyPage() {
  return (
    <MarketingShell>
      <main className="flex-1">
        <AcademyPageContent />
      </main>
    </MarketingShell>
  );
}
