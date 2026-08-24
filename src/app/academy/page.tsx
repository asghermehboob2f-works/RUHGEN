import type { Metadata } from "next";
import { AcademyPageContent } from "@/components/academy";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "RUHGEN Academy — Master AI Content Creation",
  description:
    "Free and premium courses on generative AI prompting, video production techniques, workflow optimization, and creative agency growth.",
  alternates: {
    canonical: "/academy",
  },
  openGraph: {
    title: "RUHGEN Academy — Master AI Content Creation",
    description: "Free and premium courses on generative AI prompting and video production workflows.",
    url: "/academy",
  },
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
