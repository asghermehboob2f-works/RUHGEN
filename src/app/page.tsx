import { FinalCta } from "@/components/FinalCta";
import { Hero } from "@/components/Hero";
import { HeroBackground } from "@/components/HeroBackground";
import { MarketingShell } from "@/components/MarketingShell";
import { StatsStrip } from "@/components/StatsStrip";
import { Testimonials } from "@/components/Testimonials";
import { ValueProposition } from "@/components/ValueProposition";
import { readSiteContent } from "@/backend/site-content";

export default async function Home() {
  const content = await readSiteContent();
  return (
    <MarketingShell>
      <main className="relative">
        <HeroBackground config={content.heroBackground} />
        <Hero />
        <ValueProposition pillars={content.pillars} />
        <StatsStrip stats={content.stats} />
        <Testimonials quotes={content.testimonials} />
        <FinalCta />
      </main>
    </MarketingShell>
  );
}
