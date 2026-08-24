import { Suspense } from "react";
import { FinalCta } from "@/components/FinalCta";
import { Hero } from "@/components/Hero";
import { HeroBackground } from "@/components/HeroBackground";
import { MarketingShell } from "@/components/MarketingShell";
import { StatsStrip } from "@/components/StatsStrip";
import { Testimonials } from "@/components/Testimonials";
import { ValueProposition } from "@/components/ValueProposition";
import { readSiteContent } from "@/backend/site-content";
import type { Metadata } from "next";
import { ContentPageSkeleton } from "@/components/Skeletons";

export const metadata: Metadata = {
  title: "RUHGEN — Generative AI Image & Video Studio",
  description:
    "Create cinematic images and high-fidelity videos instantly. Built for visual storytellers, prompt engineers, and creative studios.",
  alternates: {
    canonical: "/",
  },
};

async function HomeDynamicContent() {
  const content = await readSiteContent();
  return (
    <>
      <HeroBackground config={content.heroBackground} />
      <ValueProposition pillars={content.pillars} />
      <StatsStrip stats={content.stats} />
      <Testimonials quotes={content.testimonials} />
      <FinalCta />
    </>
  );
}

export default function Home() {
  return (
    <MarketingShell>
      <main className="relative">
        <Hero />
        <Suspense fallback={<ContentPageSkeleton />}>
          <HomeDynamicContent />
        </Suspense>
      </main>
    </MarketingShell>
  );
}
