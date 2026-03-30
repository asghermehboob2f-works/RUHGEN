import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Contact — RUHGEN",
  description: "Talk to RUHGEN about Studio plans, partnerships, or support.",
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <main className="mesh-section-muted flex-1 pt-24 sm:pt-28">
        <div className="mx-auto grid max-w-[1100px] gap-12 px-4 pb-20 sm:px-6 md:grid-cols-2 md:gap-16 lg:px-10">
          <div>
            <PageHeader
              eyebrow="Contact"
              title="Let’s build something unreal."
              description="Sales, partnerships, or a stubborn bug—we read every message. For fastest answers on Studio, mention your team size and target go-live."
            />
            <div className="mt-8 space-y-4 text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
              <p>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Studio onboarding:</span>{" "}
                Typically 2–3 business days for workspace provisioning and SSO.
              </p>
              <p>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Support hours:</span>{" "}
                Global coverage with priority routing for Studio (see dashboard for region-specific windows).
              </p>
            </div>
          </div>
          <ContactForm />
        </div>
      </main>
    </MarketingShell>
  );
}
