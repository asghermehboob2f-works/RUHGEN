"use client";

const stats = [
  { label: "Generations delivered", value: "12.4M+", sub: "and counting" },
  { label: "Median time to first frame", value: "4.2s", sub: "Pro tier, global edge" },
  { label: "Creators & studios", value: "84K+", sub: "in 120+ countries" },
  { label: "Peak output resolution", value: "8K", sub: "HDR-ready exports" },
];

export function StatsStrip() {
  return (
    <section
      className="relative border-y"
      style={{
        borderColor: "var(--border-subtle)",
        background:
          "linear-gradient(180deg, var(--glass) 0%, transparent 100%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-3 py-8 sm:px-6 sm:py-12 lg:px-10">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative text-center sm:text-left lg:border-l lg:border-[var(--border-subtle)] lg:pl-8 first:lg:border-l-0 first:lg:pl-0"
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs"
                style={{ color: "var(--text-subtle)" }}
              >
                {s.label}
              </p>
              <p className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                <span className="text-gradient-primary">{s.value}</span>
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
