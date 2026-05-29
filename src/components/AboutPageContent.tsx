"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Film,
  Palette,
  Shield,
  Sparkles,
  Users,
  Zap,
  Globe,
  Award,
} from "lucide-react";
import Link from "next/link";
import { SITE_CONTAINER } from "@/lib/site-layout";

const values = [
  {
    title: "Clarity over noise",
    text: "Professional tools shouldn't need a manual the size of a phone book. Power lives in defaults that respect your time.",
    icon: Compass,
    glow: "#7B61FF",
  },
  {
    title: "Craft is non-negotiable",
    text: "We ship features when they hold up on a grading monitor—not when a checklist says \u201cdone.\u201d",
    icon: Palette,
    glow: "#00D4FF",
  },
  {
    title: "Creators own their work",
    text: "Your prompts and outputs are yours. Clear licensing, export controls, and honest data practices.",
    icon: Users,
    glow: "#FF2E9A",
  },
];

const highlights = [
  { label: "Ship-ready fidelity", detail: "Masters you can grade, not just scroll past." },
  { label: "Directed latency", detail: "Previews that keep up with creative iteration." },
  { label: "Honest handoff", detail: "Exports and integrations that respect your pipeline." },
];

const stats = [
  { value: "10M+", label: "Assets Generated", icon: Zap },
  { value: "99.9%", label: "Uptime SLA", icon: Shield },
  { value: "50+", label: "Countries Served", icon: Globe },
  { value: "4.9/5", label: "Creator Rating", icon: Award },
];

export function AboutPageContent() {
  const reduce = useReducedMotion();

  return (
    <main className="relative flex-1 overflow-hidden pt-24 sm:pt-28" style={{ background: "var(--deep-black)" }}>
      {/* Ultra-premium ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full blur-[180px] opacity-30" style={{ background: "radial-gradient(circle, rgba(123,97,255,0.4), transparent 70%)" }} />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full blur-[160px] opacity-25" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.35), transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] rounded-full blur-[180px] opacity-20" style={{ background: "radial-gradient(circle, rgba(255,46,154,0.25), transparent 70%)" }} />
        {/* Subtle noise grain for depth */}
        <div className="absolute inset-0 app-grain" />
        {/* Micro grid for high-end tech feel */}
        <div
          className="absolute inset-0 opacity-[0.008]"
          style={{
            backgroundImage: "linear-gradient(rgba(123,97,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(123,97,255,0.3) 1px, transparent 1px)",
            backgroundSize: "32px 32px"
          }}
        />
      </div>

      <div className={`relative ${SITE_CONTAINER} pb-24`}>
        {/* Hero Header — dramatic full-width */}
        <motion.header
          className="text-center mb-20"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] mb-6"
            style={{
              borderColor: "color-mix(in srgb, var(--border-subtle) 80%, rgba(123,97,255,0.3))",
              color: "var(--text-subtle)",
              background: "var(--glass)",
              boxShadow: "0 0 20px rgba(123,97,255,0.08)"
            }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: "#7B61FF" }} />
            Company
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
            We build the layer between{" "}
            <br className="hidden sm:inline" />
            <span className="text-gradient-hero">imagination</span>
            {" "}and{" "}
            <span style={{ color: "var(--text-primary)" }}>reality.</span>
          </h1>

          <p
            className="mx-auto max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            RUHGEN started as an internal tool for a small film team tired of fragile pipelines and toy-quality
            AI demos. It grew into a platform for anyone who needs beautiful output on real deadlines.
          </p>
        </motion.header>

        {/* Stats Strip — premium glassmorphism */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-20"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="premium-ring group flex flex-col items-center rounded-2xl border p-5 sm:p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#7B61FF]/30"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(20px) saturate(180%)",
              }}
            >
              <s.icon className="h-5 w-5 mb-3 opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: "#7B61FF" }} strokeWidth={1.75} />
              <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight premium-text-shimmer">
                {s.value}
              </span>
              <span className="mt-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                {s.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Focus Card + Highlights */}
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8 mb-16">
          <motion.article
            className="premium-ring relative overflow-hidden rounded-[1.35rem] border p-7 sm:p-9 lg:col-span-3"
            style={{
              borderColor: "var(--border-subtle)",
              background: "linear-gradient(165deg, var(--glass-elevated), var(--glass))",
              backdropFilter: "blur(24px) saturate(180%)",
            }}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
              style={{ background: "#7B61FF" }}
            />
            <div className="relative flex items-start gap-3 sm:gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:h-12 sm:w-12"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                  boxShadow: "0 0 24px rgba(123,97,255,0.35)",
                }}
              >
                <Film className="h-5 w-5 text-white sm:h-[22px] sm:w-[22px]" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>
                  Built for timelines and reviews
                </h2>
                <p className="mt-4 text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-muted)" }}>
                  Today we focus on three things:{" "}
                  <strong style={{ color: "var(--text-primary)" }}>latency</strong> you can direct with,{" "}
                  <strong style={{ color: "var(--text-primary)" }}>fidelity</strong> you can grade, and{" "}
                  <strong style={{ color: "var(--text-primary)" }}>integrations</strong> that don&apos;t break production. If
                  your team lives in timelines and reviews, you&apos;re the audience we obsess over.
                </p>
              </div>
            </div>
          </motion.article>

          <motion.div
            className="flex flex-col gap-3 lg:col-span-2 lg:gap-4"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: reduce ? 0 : 0.06 }}
          >
            <div
              className="premium-ring flex flex-1 flex-col justify-center rounded-[1.35rem] border px-5 py-5 sm:px-6 sm:py-6"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--rich-black)",
              }}
            >
              <Sparkles className="h-5 w-5" style={{ color: "#00D4FF" }} strokeWidth={1.75} />
              <p className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Opinionated where it matters
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Defaults that keep teams moving—without hiding the controls power users need.
              </p>
            </div>
            <div
              className="premium-ring flex flex-1 flex-col justify-center rounded-[1.35rem] border px-5 py-5 sm:px-6 sm:py-6"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--rich-black)",
              }}
            >
              <Shield className="h-5 w-5 text-[#7B61FF]" strokeWidth={1.75} />
              <p className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Studio-grade guardrails
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Policies and exports designed for client review—not just solo experiments.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Highlights strip */}
        <motion.div
          className="flex flex-wrap items-stretch justify-center gap-2 sm:gap-3 lg:justify-start mb-16"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: reduce ? 0 : 0.08 }}
        >
          {highlights.map((h) => (
            <div
              key={h.label}
              className="premium-ring flex min-w-[200px] flex-1 flex-col rounded-2xl border px-4 py-3 text-center sm:min-w-0 sm:flex-none sm:px-5 sm:py-3.5"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(20px)",
              }}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                {h.label}
              </span>
              <span className="mt-1 text-xs leading-snug sm:text-sm" style={{ color: "var(--text-muted)" }}>
                {h.detail}
              </span>
            </div>
          ))}
        </motion.div>

        {/* What we believe — values */}
        <motion.div
          className="grid gap-4 text-center lg:grid-cols-[1fr_2fr] lg:items-end lg:text-left mb-8"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            What we believe
          </h2>
          <p className="text-sm sm:text-base lg:max-w-2xl" style={{ color: "var(--text-muted)" }}>
            Principles that show up in product decisions—not just slide decks.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5 mb-16">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: reduce ? 0 : i * 0.06, duration: 0.4 }}
              className="premium-ring group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#7B61FF]/30"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                backdropFilter: "blur(20px) saturate(180%)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
                style={{ background: v.glow }}
              />
              <div
                className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-xl border sm:h-11 sm:w-11"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: `linear-gradient(135deg, color-mix(in srgb, ${v.glow} 28%, transparent) 0%, rgba(255,255,255,0.05) 100%)`,
                  boxShadow: `0 18px 40px -22px color-mix(in srgb, ${v.glow} 50%, transparent)`,
                }}
              >
                <v.icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={1.75} style={{ color: v.glow }} />
              </div>
              <h3 className="font-display relative text-lg font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                {v.title}
              </h3>
              <p className="relative mt-2 flex-1 text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--text-muted)" }}>
                {v.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Story beats */}
        <motion.section
          className="mb-16"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
        >
          <div className="grid gap-4 text-center lg:grid-cols-[1fr_2fr] lg:items-end lg:text-left mb-10">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              Story beats
            </h2>
            <p className="text-sm sm:text-base lg:max-w-2xl" style={{ color: "var(--text-muted)" }}>
              A short arc—not a vanity timeline. Each phase changed what we optimized for.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { phase: "Prototype", year: "2022", detail: "Internal tool for a film team: prove latency and look quality before polish." },
              { phase: "Platform", year: "2024", detail: "Shared workspaces, exports, and the first real pipeline hooks—not just a prettier UI." },
              { phase: "Studios", year: "Today", detail: "Guardrails, seats, and integrations for teams who ship on deadlines, not vibes." },
            ].map((s, i) => (
              <motion.div
                key={s.phase}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="premium-ring rounded-2xl border p-6 text-left group transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}
              >
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00D4FF]">{s.year}</p>
                <h3 className="font-display mt-2 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {s.phase}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {s.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Trust banner */}
        <motion.section
          className="relative overflow-hidden rounded-[1.5rem] border px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-10 grid gap-6 mb-14"
          style={{
            borderColor: "var(--border-subtle)",
            background: "linear-gradient(135deg, rgba(123,97,255,0.12), rgba(0,212,255,0.08), rgba(255,46,154,0.06))",
            backdropFilter: "blur(24px) saturate(180%)",
            boxShadow: "0 32px 80px -24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
          }}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: "radial-gradient(ellipse 80% 70% at 100% 0%, rgba(123,97,255,0.35), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(0,212,255,0.2), transparent 50%)" }} />
          <div className="relative text-center lg:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] sm:text-xs" style={{ color: "var(--text-subtle)" }}>
              Trusted in review rooms
            </p>
            <p className="font-display mt-3 text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>
              RUHGEN is built for teams who care about craft.
            </p>
          </div>
          <p className="relative text-center text-sm leading-relaxed sm:text-base lg:text-left" style={{ color: "var(--text-muted)" }}>
            The product is designed to feel quiet and premium while the engine underneath does the heavy lifting—latency, exports, and guardrails you can depend on.
          </p>
        </motion.section>

        {/* Careers CTA */}
        <motion.section
          id="join"
          className="relative scroll-mt-28 overflow-hidden rounded-[1.5rem] border p-8 sm:p-10 lg:p-12"
          style={{
            borderColor: "var(--border-subtle)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, #7B61FF 12%, transparent) 0%, var(--glass) 45%, color-mix(in srgb, #00D4FF 8%, transparent) 100%)",
            backdropFilter: "blur(24px) saturate(180%)",
            boxShadow: "0 32px 80px -24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
          }}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 100% 0%, rgba(123,97,255,0.35), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(0,212,255,0.2), transparent 50%)",
            }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Careers
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                Bring your reel and your systems thinking
              </h2>
              <p className="mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                We&apos;re always interested in engineers, designers, and filmmakers who blur the line between story and
                systems. Send a note with work you&apos;re proud of—portfolio, reel, or GitHub all work.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 self-start rounded-2xl px-8 py-3.5 text-base font-semibold text-white btn-gradient lg:self-center"
            >
              Get in touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
