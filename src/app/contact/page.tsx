import type { Metadata } from "next";
import { ContactPageContent } from "@/components/ContactPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Contact Support & Inquiries",
  description:
    "Get in touch with the RUHGEN team for support, custom enterprise plans, API access, or partnership inquiries.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Support & Inquiries | RUHGEN",
    description: "Get in touch with the RUHGEN team for support, custom enterprise plans, or partnership inquiries.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <ContactPageContent />
    </MarketingShell>
  );
}
