import type { Metadata } from "next";
import { WorkflowPageContent } from "@/components/marketing/WorkflowPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Production Pipeline & Workflows",
  description:
    "Discover how RUHGEN streamlines visual creation from initial prompt to final high-resolution render, batch generation, and team review.",
  alternates: {
    canonical: "/workflow",
  },
  openGraph: {
    title: "Production Pipeline & Workflows | RUHGEN",
    description: "Streamline visual creation from prompt to final high-resolution render and team review.",
    url: "/workflow",
  },
};

export default function WorkflowPage() {
  return (
    <MarketingShell>
      <main className="flex-1">
        <WorkflowPageContent />
      </main>
    </MarketingShell>
  );
}
