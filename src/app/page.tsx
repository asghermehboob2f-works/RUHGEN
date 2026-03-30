import { BentoHighlights } from "@/components/BentoHighlights";
import { FAQ } from "@/components/FAQ";
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

export default function Home() {
  return (
    <MarketingShell>
      <main>
        <Hero />
        <StatsStrip />
        <LivePreview />
        <StackStrip />
        <Features />
        <BentoHighlights />
        <GallerySection />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCta />
      </main>
    </MarketingShell>
  );
}
