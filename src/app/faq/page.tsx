import type { Metadata } from "next";
import { FaqHubContent } from "@/components/marketing/FaqHubContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "FAQ — RUHGEN",
  description:
    "Answers about credits, exports, teams, and billing—everything you need before you subscribe.",
};

export default function FaqPage() {
  return (
    <MarketingShell>
      <main className="flex-1">
        <FaqHubContent />
      </main>
    </MarketingShell>
  );
}
