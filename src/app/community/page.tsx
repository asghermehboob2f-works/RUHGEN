import type { Metadata } from "next";
import { CommunityPageContent } from "@/components/marketing/CommunityPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Creator Community & Visual Drops",
  description:
    "Discover community prompts, image showcases, and video drops from global creators using RUHGEN. Share your work and fork creative styles.",
  alternates: {
    canonical: "/community",
  },
  openGraph: {
    title: "Creator Community & Visual Drops | RUHGEN",
    description: "Discover community prompts, image showcases, and video drops from global creators using RUHGEN.",
    url: "/community",
  },
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
