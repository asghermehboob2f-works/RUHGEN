"use client";

import { Globe2, Layers, ShieldCheck, Zap } from "lucide-react";

const tiles = [
  {
    title: "Global edge rendering",
    desc: "Jobs route to the nearest GPU cluster so previews feel local—whether you're in Seoul, São Paulo, or Stockholm.",
    icon: Globe2,
    span: "md:col-span-2",
  },
  {
    title: "Multi-pass exports",
    desc: "Optional depth, normal, and matte passes for comp—not just a flat PNG.",
    icon: Layers,
    span: "md:col-span-1",
  },
  {
    title: "Guardrails by default",
    desc: "Team policies, prompt allowlists, and export watermarks when you need client review without leaks.",
    icon: ShieldCheck,
    span: "md:col-span-1",
  },
  {
    title: "Burst when it matters",
    desc: "Studio can spike concurrency for launch windows—queue depth visible in the dashboard.",
    icon: Zap,
    span: "md:col-span-2",
  },
];

export function BentoHighlights() {
  return (
    <section
      id="platform"
      className="scroll-mt-24 border-t py-12 md:py-24"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--rich-black)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <div className="mb-8 text-center md:mb-14">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            Platform depth
          </p>
          <h2
            className="font-display text-[clamp(1.55rem,3.8vw,3rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Built past the demo
          </h2>
          <p
            className="mx-auto mt-2 max-w-2xl text-sm sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            The interface is simple on purpose—the engine underneath is built for
            real timelines, real clients, and real file sizes.
          </p>
        </div>

        <div className="grid auto-rows-fr gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
          {tiles.map((t) => (
            <div
              key={t.title}
              className={`premium-ring group relative overflow-hidden rounded-[1.15rem] border p-5 sm:rounded-2xl sm:p-8 ${t.span}`}
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-35"
                style={{ background: "#7B61FF" }}
              />
              <div
                className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "linear-gradient(135deg, rgba(123,97,255,0.2) 0%, rgba(0,212,255,0.15) 100%)",
                }}
              >
                <t.icon className="h-6 w-6 text-[#00D4FF]" strokeWidth={1.75} />
              </div>
              <h3
                className="font-display relative text-lg font-bold sm:text-xl"
                style={{ color: "var(--text-primary)" }}
              >
                {t.title}
              </h3>
              <p
                className="relative mt-2 max-w-prose text-sm leading-relaxed sm:text-[15px]"
                style={{ color: "var(--text-muted)" }}
              >
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
