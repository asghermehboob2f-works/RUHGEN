import type { Metadata } from "next";
import { CommunityPageContent } from "@/components/marketing/CommunityPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Community — RUHGEN",
  description:
    "Where creators show their craft. Browse photo, video, and template drops from the RUHGEN community, follow the makers behind them, and share your own.",
};

export default function CommunityPage() {
  return (
    <MarketingShell>
      <main className="flex-1">
        <CommunityPageContent />
      </main>
    </MarketingShell>
  );
}
