import type { Metadata } from "next";
import { ContactPageContent } from "@/components/ContactPageContent";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Contact — RUHGEN",
  description: "Talk to RUHGEN about Studio plans, partnerships, or support.",
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <ContactPageContent />
    </MarketingShell>
  );
}
