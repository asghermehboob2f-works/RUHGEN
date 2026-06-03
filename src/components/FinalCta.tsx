"use client";

import Link from "next/link";

export function FinalCta() {
  return (
    <section
      id="cta"
      className="relative scroll-mt-24 overflow-hidden py-28 sm:py-36 md:py-40"
      style={{
        background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(123, 97, 255, 0.04), transparent 70%), var(--deep-black)",
      }}
    >
      {/* Absolute Brand-Integrated Glowing Top Border Line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"
        aria-hidden
      />

      {/* Editorial Vertical Guideline (Ultra-Thin Tech Coordinate) */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent pointer-events-none" />

      {/* Subtle Noise Texture Overlay for premium high-end feel */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.01]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Widened wrapper to utilize screen width on desktop */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center sm:px-8">
        
        {/* Bold Classic Heading with cohesive brand gradient shimmer */}
        <h2 className="font-display text-[clamp(2.25rem,5.5vw,4rem)] font-extrabold leading-[1.03] tracking-[-0.03em] text-white mb-6">
          <span className="premium-text-shimmer bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
            Ready to create your vision?
          </span>
        </h2>
        
        {/* Clean Normal Readable description */}
        <p
          className="mx-auto mt-4 max-w-xl text-xs sm:text-sm leading-relaxed font-normal tracking-wide text-white/30"
        >
          Join thousands of creators pushing the boundaries of imagination—with
          cinematic tools that feel like the future.
        </p>

        {/* Simple Themed Gradient Premium Button without any icon */}
        <div className="mt-10">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7B61FF] to-[#00D4FF] px-11 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_24px_rgba(123,97,255,0.35)]"
          >
            Get started free
          </Link>
        </div>
      </div>
    </section>
  );
}
