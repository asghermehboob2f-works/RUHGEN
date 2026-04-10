import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Globe2, Layers, ShieldCheck, Zap } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Platform — RUHGEN",
  description:
    "How RUHGEN routes jobs to the edge, ships multi-pass exports, enforces guardrails, and scales burst capacity for real production timelines.",
};

const sections = [
  {
    id: "global-edge",
    icon: Globe2,
    title: "Global edge rendering",
    tag: "Latency-optimized",
    intro:
      "Previews should feel instant wherever your team sits. RUHGEN schedules work on clusters close to the request so round-trip time stays predictable—not just fast on average, but fast when it counts in review sessions.",
    bullets: [
      "Regional routing picks the nearest healthy GPU pool based on load and queue depth.",
      "Warm pools keep common model weights ready so first-frame latency doesn’t spike cold starts.",
      "You see estimated time-to-first-pixel in the dashboard before you commit credits.",
      "Failover moves a job to the next region if a cluster degrades—without losing your prompt state.",
    ],
  },
  {
    id: "multi-pass",
    icon: Layers,
    title: "Multi-pass exports",
    tag: "Pipeline-ready",
    intro:
      "A single beauty pass isn’t always enough for comp. When you enable multi-pass, RUHGEN can emit separate layers your NLE or compositor expects—so color, relighting, and roto stay in your usual toolchain.",
    bullets: [
      "Optional beauty, depth, and normal passes where the model supports disentangled outputs.",
      "Matte-friendly alphas for subjects on complex backgrounds when you enable segmentation.",
      "Consistent naming and folder layout for batch exports into After Effects, Nuke, or Resolve.",
      "Metadata sidecars (resolution, color space, frame range) travel with the files.",
    ],
  },
  {
    id: "guardrails",
    icon: ShieldCheck,
    title: "Guardrails by default",
    tag: "Studio-safe",
    intro:
      "Client work needs boundaries. Team policies let admins steer what can be generated, how outputs are labeled, and when watermarks apply—so review copies don’t leak unfinished frames.",
    bullets: [
      "Role-based access: operators vs. viewers; API keys scoped to environments.",
      "Prompt allowlists / blocklists for brand-sensitive productions.",
      "Export watermarks and expiry links for external review without raw masters.",
      "Audit-friendly logs: who ran what, when, and from which workspace.",
    ],
  },
  {
    id: "burst",
    icon: Zap,
    title: "Burst when it matters",
    tag: "Scale on demand",
    intro:
      "Launches and finales don’t follow a flat curve. Burst capacity raises concurrent job limits for a window you define, with queue depth visible so producers can plan around the spike.",
    bullets: [
      "Temporary concurrency boosts with start/end times—no ticket to “ops.”",
      "Live queue depth and ETA per job class in the dashboard.",
      "Soft caps notify you before hard stops so you can trim batch size or extend the window.",
      "Usage reports after the burst for billing reconciliation and retrospectives.",
    ],
  },
];

export default function PlatformPage() {
  return (
    <MarketingShell>
      <main className="mesh-section flex-1 pt-24 sm:pt-28">
        <div className="mx-auto max-w-[900px] px-4 pb-20 sm:px-6 lg:px-10">
          <Link
            href="/#platform"
            className="mb-8 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#00D4FF] hover:underline"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to overview
          </Link>

          <PageHeader
            eyebrow="Deep dive"
            title="Built past the demo"
            description="The marketing site stays simple on purpose. Here’s how the engine behaves when you move from experiment to production: routing, passes, policy, and scale."
          />

          <nav
            className="mb-12 rounded-2xl border p-4 sm:p-5"
            style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            aria-label="On this page"
          >
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
              On this page
            </p>
            <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-sm font-medium text-[#00D4FF] hover:underline"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-16 sm:gap-20">
            {sections.map((s) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-28 rounded-[1.35rem] border p-6 sm:p-8 md:p-10"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--rich-black)",
                }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
                  >
                    <s.icon className="h-6 w-6 text-[#7B61FF]" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--text-subtle)" }}
                    >
                      {s.tag}
                    </p>
                    <h2 className="font-display mt-1 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>
                      {s.title}
                    </h2>
                  </div>
                </div>
                <p className="mt-5 leading-relaxed sm:text-lg" style={{ color: "var(--text-muted)" }}>
                  {s.intro}
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {s.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed sm:text-[15px]"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D4FF]" aria-hidden />
                      <span style={{ color: "var(--text-muted)" }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div
            className="mt-16 flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
            style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Ready to try the workspace? Sign in and open the dashboard for generation, billing, and preferences.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white btn-gradient"
            >
              Get started
            </Link>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
