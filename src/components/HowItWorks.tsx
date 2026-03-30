"use client";

const steps = [
  {
    n: "01",
    title: "Enter prompt",
    description: "Describe your vision in natural language.",
  },
  {
    n: "02",
    title: "AI generates",
    description: "Watch as AI brings your idea to life in real time.",
  },
  {
    n: "03",
    title: "Download & share",
    description: "Export in high resolution and share anywhere.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mesh-section scroll-mt-24 py-12 md:py-24">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <div className="mb-8 text-center md:mb-16">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            Workflow
          </p>
          <h2
            className="font-display text-[clamp(1.55rem,3.8vw,3rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            How it works
          </h2>
          <p
            className="mx-auto mt-2 max-w-lg text-sm sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Three simple steps to create magic
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute left-0 right-0 top-[52px] hidden h-0.5 md:block"
            style={{
              background:
                "linear-gradient(90deg, #7B61FF 0%, #00D4FF 50%, #FF2E9A 100%)",
              opacity: 0.45,
            }}
            aria-hidden
          />
          <div className="grid gap-5 md:grid-cols-3 md:gap-8">
            {steps.map((s) => (
              <div
                key={s.n}
                className="relative glass-panel rounded-2xl p-6 pt-12 sm:p-8 sm:pt-14 md:p-10 md:pt-16"
              >
                <div
                  className="absolute left-1/2 top-0 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full md:top-[52px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                    boxShadow: "0 0 28px rgba(123, 97, 255, 0.65)",
                  }}
                  aria-hidden
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </div>
                <p className="text-gradient-primary text-[clamp(2rem,5.5vw,4rem)] font-black leading-none">
                  {s.n}
                </p>
                <h3
                  className="mt-3 text-lg font-bold capitalize sm:mt-4 sm:text-xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed sm:mt-3 sm:text-base"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
