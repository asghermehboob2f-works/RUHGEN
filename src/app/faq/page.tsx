import type { Metadata } from "next";
import { FaqHubContent } from "@/components/marketing/FaqHubContent";
import { MarketingShell } from "@/components/MarketingShell";
import { MARKETING_FAQS } from "@/lib/marketing-faqs";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Everything you need to know about RUHGEN credits, image & video exports, commercial usage rights, team seats, and security.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | RUHGEN",
    description: "Everything you need to know about RUHGEN credits, image & video exports, commercial rights, and security.",
    url: "/faq",
  },
};

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MARKETING_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <MarketingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="flex-1">
        <FaqHubContent />
      </main>
    </MarketingShell>
  );
}
