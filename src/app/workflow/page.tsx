import type { Metadata } from "next";
import { WorkflowPageContent } from "@/components/marketing/WorkflowPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Workflow — RUHGEN",
  description:
    "From prompt to delivery in four clear steps—built for reviews, revisions, and release.",
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
