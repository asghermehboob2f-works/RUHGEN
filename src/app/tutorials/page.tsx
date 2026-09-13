import type { Metadata } from "next";
import { AcademyPageContent } from "@/components/academy";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Tutorials & Masterclasses",
  description:
    "Explore comprehensive video tutorials, masterclasses, and step-by-step guides for mastering generative AI video production.",
  alternates: {
    canonical: "/tutorials",
  },
  openGraph: {
    title: "Tutorials & Masterclasses | RUHGEN",
    description: "Comprehensive video tutorials, masterclasses, and guides for generative AI video production.",
    url: "/tutorials",
  },
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
