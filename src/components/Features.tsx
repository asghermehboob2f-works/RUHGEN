"use client";

import {
  Clock,
  ImageIcon,
  Layers,
  Star,
  Video,
  Zap,
} from "lucide-react";

const features = [
  {
    title: "Text-to-image generation",
    description: "Transform words into stunning visuals in seconds.",
    icon: ImageIcon,
  },
  {
    title: "Text-to-video generation",
    description: "Create cinematic motion sequences from a single prompt.",
    icon: Video,
  },
  {
    title: "Style control",
    description: "Choose from multiple artistic styles and brand-safe looks.",
    icon: Layers,
  },
  {
    title: "Real-time rendering",
    description: "See results in seconds—not minutes—with live previews.",
    icon: Zap,
  },
  {
    title: "Ultra HD output",
    description: "Up to 8K resolution support for print and screens.",
    icon: Clock,
  },
  {
    title: "Advanced controls",
    description: "Fine-tune every detail with pro-grade parameters.",
    icon: Star,
  },
];

export function Features() {
  return (
    <section id="features" className="mesh-section scroll-mt-24 py-12 md:py-24">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <div className="mb-8 text-center md:mb-16">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            Capabilities
          </p>
          <h2
            className="font-display text-[clamp(1.55rem,3.8vw,3rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Limitless creativity
          </h2>
          <p
            className="mx-auto mt-2 max-w-xl text-sm sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Powered by cutting-edge AI technology
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="group premium-ring rounded-[1.15rem] border p-5 transition-all duration-500 hover:-translate-y-2 hover:border-[#7B61FF]/45 hover:shadow-[0_24px_64px_-12px_rgba(123,97,255,0.28)] sm:rounded-2xl sm:p-7 md:p-9"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#00D4FF] shadow-[0_0_36px_rgba(123,97,255,0.42)] transition-transform duration-500 group-hover:scale-110 md:h-20 md:w-20">
                <f.icon className="h-8 w-8 text-white md:h-9 md:w-9" strokeWidth={1.75} />
              </div>
              <h3
                className="font-display text-lg font-bold md:text-xl"
                style={{ color: "var(--text-primary)" }}
              >
                {f.title}
              </h3>
              <p
                className="mt-3 leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {f.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
