"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Clock, CreditCard, Headphones, HelpCircle, MessageCircle, Sparkles } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { SITE_CONTAINER } from "@/lib/site-layout";

const assurances = [
  {
    icon: Clock,
    title: "Studio onboarding",
    body: "Typically 2–3 business days for workspace provisioning and SSO.",
    glow: "#7B61FF",
  },
  {
    icon: Headphones,
    title: "Support coverage",
    body: "Global coverage with priority routing for Studio (see dashboard for region-specific windows).",
    glow: "#00D4FF",
  },
  {
    icon: MessageCircle,
    title: "We read every note",
    body: "Sales, partnerships, or a stubborn bug—mention your team size for faster routing.",
    glow: "#FF2E9A",
  },
];

export function ContactPageContent() {
  const reduce = useReducedMotion();

  return (
    <main className="mesh-section-muted relative flex-1 overflow-hidden pt-24 sm:pt-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 90% 5%, rgba(123,97,255,0.18), transparent 50%), radial-gradient(ellipse 55% 45% at 10% 90%, rgba(0,212,255,0.12), transparent 52%)",
        }}
      />
      <div className={`relative ${SITE_CONTAINER} pb-24`}>
        <div className="mb-10 grid gap-3 sm:grid-cols-3 lg:gap-4">
          {[
            { href: "/faq", label: "Help center", sub: "Searchable answers", Icon: HelpCircle },
            { href: "/pricing", label: "Plans & credits", sub: "Compare tiers", Icon: CreditCard },
            { href: "/demo", label: "Live demo", sub: "Try without install", Icon: MessageCircle },
          ].map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className="premium-ring flex items-start gap-3 rounded-2xl border p-4 transition-colors hover:border-[#7B61FF]/35"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
                <x.Icon className="h-[18px] w-[18px] text-[#7B61FF]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {x.label}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  {x.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12 xl:gap-20">
          <div className="lg:sticky lg:top-28">
            <motion.header
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] sm:text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)", background: "var(--glass)" }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: "#7B61FF" }} />
                Contact
              </div>
              <h1 className="font-display mt-5 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight">
                <span style={{ color: "var(--text-primary)" }}>Let’s build something </span>
                <span className="text-gradient-hero">unreal.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-muted)" }}>
                Sales, partnerships, or a stubborn bug—we read every message. For fastest answers on Studio, mention your
                team size and target go-live.
              </p>
            </motion.header>

            <motion.ul
              className="mt-10 flex flex-col gap-3 sm:gap-4"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: reduce ? 0 : 0.1 }}
            >
              {assurances.map((a, i) => (
                <motion.li
                  key={a.title}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ delay: reduce ? 0 : i * 0.05, duration: 0.35 }}
                  className="premium-ring flex gap-4 rounded-2xl border p-4 sm:p-5"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    backdropFilter: "blur(18px)",
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: `linear-gradient(145deg, color-mix(in srgb, ${a.glow} 22%, transparent), rgba(255,255,255,0.04))`,
                      boxShadow: `0 12px 32px -18px color-mix(in srgb, ${a.glow} 45%, transparent)`,
                    }}
                  >
                    <a.icon className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: a.glow }} />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold sm:text-base" style={{ color: "var(--text-primary)" }}>
                      {a.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {a.body}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            <motion.p
              className="mt-8 max-w-md text-xs leading-relaxed sm:text-sm"
              style={{ color: "var(--text-subtle)" }}
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Prefer async? Use the form—no account required. For security-sensitive topics, say so in your message and
              we’ll route you appropriately.
            </motion.p>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-40 blur-2xl sm:-inset-6"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(123,97,255,0.25), transparent 60%), radial-gradient(ellipse 50% 50% at 100% 100%, rgba(0,212,255,0.12), transparent 55%)",
              }}
            />
            <ContactForm />
          </div>
        </div>

        <motion.section
          className="mt-14 grid gap-6 overflow-hidden rounded-[1.5rem] border px-6 py-8 sm:mt-16 sm:px-10 sm:py-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-10"
          style={{
            borderColor: "var(--border-subtle)",
            background: "linear-gradient(135deg, rgba(123,97,255,0.10), rgba(0,212,255,0.08), rgba(255,46,154,0.06))",
            backdropFilter: "blur(24px)",
          }}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
        >
          <div className="text-center lg:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] sm:text-xs" style={{ color: "var(--text-subtle)" }}>
              Fast routing
            </p>
            <p className="font-display mt-3 text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>
              Want a Studio quote?
            </p>
          </div>
          <p className="text-center text-sm leading-relaxed sm:text-base lg:text-left" style={{ color: "var(--text-muted)" }}>
            Include team size, target launch date, and whether you need SSO. We’ll reply with the right plan and a clear path to production.
          </p>
        </motion.section>
      </div>
    </main>
  );
}
