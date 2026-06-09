"use client";

import { Pricing } from "@/components/Pricing";
import type { SiteContent } from "@/backend/site-content/types";

export function PricingPageContent({ content }: { content: SiteContent }) {
  return <Pricing hideHeading={false} plans={content?.plans} />;
}
