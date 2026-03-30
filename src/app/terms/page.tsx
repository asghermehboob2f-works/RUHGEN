import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Terms of Service — RUHGEN",
  description: "Terms governing your use of RUHGEN software and services.",
};

export default function TermsPage() {
  return (
    <MarketingShell>
      <main className="mesh-section-muted flex-1 pt-24 sm:pt-28">
        <article className="mx-auto max-w-[720px] px-4 pb-24 sm:px-6 lg:px-10">
          <PageHeader
            eyebrow="Legal"
            title="Terms of Service"
            description="Last updated: March 31, 2026. By using RUHGEN you agree to these terms and our Privacy Policy."
          />
          <div className="space-y-6 text-[15px] leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
            <h2 className="font-display pt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              The service
            </h2>
            <p>
              RUHGEN provides AI-assisted generation tools subject to plan limits and fair-use policies. We may change features with notice where materially affecting paid customers.
            </p>
            <h2 className="font-display pt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Accounts & acceptable use
            </h2>
            <p>
              You’re responsible for activity under your account. No unlawful content, no attempts to bypass quotas or security, and no use that harms our infrastructure or other users. We may suspend accounts that violate these rules.
            </p>
            <h2 className="font-display pt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Intellectual property
            </h2>
            <p>
              You retain rights to your inputs. Output rights follow your subscription tier and any enterprise agreement. Don’t prompt the service to imitate identifiable people or third-party IP in ways that infringe others’ rights.
            </p>
            <h2 className="font-display pt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Warranties & liability
            </h2>
            <p>
              The service is provided “as is” to the maximum extent permitted by law. Our liability is limited to fees paid in the twelve months before the claim, except where law forbids such caps.
            </p>
            <h2 className="font-display pt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Governing law
            </h2>
            <p>
              These terms are governed by the laws specified in your order form; otherwise by the jurisdiction of our operating company as stated in your account agreement.
            </p>
          </div>
        </article>
      </main>
    </MarketingShell>
  );
}
