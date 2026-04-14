import { FinalCta } from "@/components/FinalCta";
import { Hero } from "@/components/Hero";
import { MarketingShell } from "@/components/MarketingShell";
import { StatsStrip } from "@/components/StatsStrip";
import { Testimonials } from "@/components/Testimonials";
import { ValueProposition } from "@/components/ValueProposition";
import { readSiteContent } from "@/backend/site-content";

export default async function Home() {
  const content = await readSiteContent();
  return (
    <MarketingShell>
      <main>
        <Hero previews={content.hero.previews} />
        <ValueProposition />
        <StatsStrip />
        <Testimonials />
        <FinalCta />
      </main>
    </MarketingShell>
  );
}
