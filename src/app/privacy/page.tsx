import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy — RUHGEN",
  description: "How RUHGEN handles personal data, retention, and your rights.",
};

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <main className="mesh-section flex-1 pt-24 sm:pt-28">
        <article className="mx-auto max-w-[720px] px-4 pb-24 sm:px-6 lg:px-10">
          <PageHeader
            eyebrow="Legal"
            title="Privacy Policy"
            description="Last updated: March 31, 2026. Plain-language summary first, details below."
          />
          <div className="prose-legal space-y-6 text-[15px] leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
            <p style={{ color: "var(--text-primary)" }} className="font-medium">
              Summary: We collect what we need to run the service, secure your account, and bill you. We don’t sell personal data. Studio customers get additional retention and compliance options in their order form.
            </p>
            <h2 className="font-display pt-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Information we collect
            </h2>
            <p>
              Account details (name, email), billing information processed by our payment providers, usage and diagnostic data (logs, device class, approximate region), and content you submit (prompts, uploads) to generate outputs.
            </p>
            <h2 className="font-display pt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              How we use information
            </h2>
            <p>
              To provide and improve RUHGEN, authenticate users, prevent abuse, communicate about the product, and meet legal obligations. Model improvement uses only data you’ve agreed to in your plan or contract.
            </p>
            <h2 className="font-display pt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Retention
            </h2>
            <p>
              Defaults vary by tier. You may request export or deletion of personal data subject to legal holds. Studio workspaces can configure shorter retention for prompts and assets.
            </p>
            <h2 id="cookies" className="font-display scroll-mt-28 pt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Cookies
            </h2>
            <p>
              We use essential cookies for sign-in and security, and optional analytics cookies where permitted. You can control non-essential cookies via the banner where available in your region.
            </p>
            <h2 className="font-display pt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Contact
            </h2>
            <p>
              For privacy requests, contact us through the form on the{" "}
              <Link href="/contact" className="font-medium text-[#7B61FF] underline-offset-2 hover:underline">
                Contact
              </Link>{" "}
              page and mention “Privacy request” in the subject.
            </p>
          </div>
        </article>
      </main>
    </MarketingShell>
  );
}
