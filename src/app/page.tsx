import { BentoHighlights } from "@/components/BentoHighlights";
import { FAQ } from "@/components/FAQ";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { Features } from "@/components/Features";
import { FinalCta } from "@/components/FinalCta";
import { GallerySection } from "@/components/GallerySection";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { LivePreview } from "@/components/LivePreview";
import { MarketingShell } from "@/components/MarketingShell";
import { StackStrip } from "@/components/StackStrip";
import { StatsStrip } from "@/components/StatsStrip";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { readSiteContent } from "@/lib/site-content";

export default async function Home() {
  const content = await readSiteContent();
  return (
    <MarketingShell>
      <main>
        <Hero previews={content.hero.previews} />
        <StatsStrip />
        <FeatureShowcase slides={content.showcase.slides} />
        <LivePreview />
        <StackStrip />
        <Features />
        <BentoHighlights />
        <GallerySection items={content.gallery.items} />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCta />
      </main>
    </MarketingShell>
  );
}
