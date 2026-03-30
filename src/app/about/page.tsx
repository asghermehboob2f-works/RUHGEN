import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "About — RUHGEN",
  description:
    "Why we built RUHGEN: a creative engine for teams who care about craft, speed, and ownership.",
};

const values = [
  {
    title: "Clarity over noise",
    text: "Professional tools shouldn’t need a manual the size of a phone book. Power lives in defaults that respect your time.",
  },
  {
    title: "Craft is non-negotiable",
    text: "We ship features when they hold up on a grading monitor—not when a checklist says “done.”",
  },
  {
    title: "Creators own their work",
    text: "Your prompts and outputs are yours. Clear licensing, export controls, and honest data practices.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <main className="mesh-section flex-1 pt-24 sm:pt-28">
        <div className="mx-auto max-w-[900px] px-4 pb-20 sm:px-6 lg:px-10">
          <PageHeader
            eyebrow="Company"
            title="We build the layer between imagination and ship."
            description="RUHGEN started as an internal tool for a small film team tired of fragile pipelines and toy-quality AI demos. It grew into a platform for anyone who needs beautiful output on real deadlines."
          />

          <div
            className="premium-ring rounded-[1.5rem] border p-8 sm:p-10"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--glass)",
            }}
          >
            <p className="text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-muted)" }}>
              Today we focus on three things: <strong style={{ color: "var(--text-primary)" }}>latency</strong> you can direct with, <strong style={{ color: "var(--text-primary)" }}>fidelity</strong> you can grade, and <strong style={{ color: "var(--text-primary)" }}>integrations</strong> that don’t break production. If your team lives in timelines and reviews, you’re the audience we obsess over.
            </p>
          </div>

          <h2
            className="font-display mt-16 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "var(--text-primary)" }}
          >
            What we believe
          </h2>
          <ul className="mt-6 flex flex-col gap-6">
            {values.map((v) => (
              <li
                key={v.title}
                className="premium-ring rounded-2xl border p-6 sm:p-7"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--rich-black)",
                }}
              >
                <h3 className="font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {v.title}
                </h3>
                <p className="mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {v.text}
                </p>
              </li>
            ))}
          </ul>

          <section id="join" className="mt-16 scroll-mt-28 rounded-2xl border p-8 sm:mt-20 sm:p-10" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
            <h2 className="font-display text-xl font-bold sm:text-2xl" style={{ color: "var(--text-primary)" }}>
              Careers
            </h2>
            <p className="mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              We’re always interested in engineers, designers, and filmmakers who blur the line between story and systems. Send a note with work you’re proud of—portfolio, reel, or GitHub all work.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white btn-gradient"
            >
              Get in touch
            </Link>
          </section>
        </div>
      </main>
    </MarketingShell>
  );
}
