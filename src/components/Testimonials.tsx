"use client";

import { Quote } from "lucide-react";

const quotes = [
  {
    body: "We replaced a week of mood-board iteration with one RUHGEN session. The team finally stopped fighting over references and started shipping.",
    name: "Elena Voss",
    role: "Creative Director, Northwind Studio",
  },
  {
    body: "Latency is honestly wild. I can iterate on a shot while the director is still in the room—feels like a realtime renderer for Ideas.",
    name: "Marcus Chen",
    role: "VFX Supervisor",
  },
  {
    body: "The API slots straight into our asset pipeline. Webhooks fire when renders finish; our DAM ingests frames without anyone touching FTP.",
    name: "Priya Nair",
    role: "Head of Platform, Lumen Labs",
  },
];

export function Testimonials() {
  return (
    <section
      id="stories"
      className="mesh-section-muted scroll-mt-24 py-12 md:py-24"
    >
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <div className="mb-8 text-center md:mb-14">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            Voices from the field
          </p>
          <h2
            className="font-display text-[clamp(1.55rem,3.8vw,3rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Trusted where pixels matter
          </h2>
          <p
            className="mx-auto mt-2 max-w-lg text-sm sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Studios, indies, and product teams use RUHGEN to move from concept to
            final—not just pretty thumbnails.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {quotes.map((q) => (
            <article
              key={q.name}
              className="premium-ring flex h-full flex-col rounded-[1.15rem] border p-5 sm:rounded-2xl sm:p-8"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(24px)",
              }}
            >
              <Quote
                className="h-9 w-9 shrink-0 opacity-40"
                style={{ color: "#7B61FF" }}
                strokeWidth={1.25}
              />
              <p
                className="mt-3 flex-1 text-sm leading-relaxed sm:mt-4 sm:text-base"
                style={{ color: "var(--text-primary)" }}
              >
                {q.body}
              </p>
              <div
                className="mt-6 border-t pt-5 sm:mt-8 sm:pt-6"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <p className="font-display font-semibold" style={{ color: "var(--text-primary)" }}>
                  {q.name}
                </p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {q.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
