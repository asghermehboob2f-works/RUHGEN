import type { Metadata } from "next";
import { AcademyPageContent } from "@/components/academy";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Tutorials — RUHGEN",
  description:
    "Explore comprehensive video tutorials, masterclasses, and step-by-step guides for mastering generative AI video production.",
};

export default function TutorialsPage() {
  return (
    <MarketingShell>
      <main className="flex-1">
        <AcademyPageContent />
      </main>
    </MarketingShell>
  );
}
