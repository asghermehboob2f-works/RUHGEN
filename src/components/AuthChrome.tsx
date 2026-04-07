"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthChrome({ title, subtitle, children, footer }: Props) {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-[100dvh] overflow-x-clip">
      <div className="app-grain pointer-events-none absolute inset-0 z-[1]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(123,97,255,0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(0,212,255,0.2), transparent)",
        }}
      />
      <header className="relative z-10 border-b px-4 py-4 sm:px-6" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <BrandLogo size="md" href="/" />
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-[#7B61FF]"
            style={{ color: "var(--text-muted)" }}
          >
            Back to site
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1200px] gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#00D4FF" }}>
            RUHGEN
          </p>
          <h1 className="font-display mt-4 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
            <span className="text-gradient-hero">Creative infrastructure</span>
            <span className="mt-2 block" style={{ color: "var(--text-primary)" }}>
              that keeps up with you.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            One workspace for cinematic stills, motion, and team delivery—synced to the tools you
            already trust.
          </p>
          <ul className="mt-8 space-y-3 text-sm" style={{ color: "var(--text-muted)" }}>
            {[
              "GPU-accelerated previews on the edge",
              "Multi-pass exports for real comps",
              "Webhooks & API on Studio",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)" }}
                />
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mx-auto w-full max-w-[440px] lg:mx-0 lg:max-w-none"
        >
          <div className="lg:hidden">
            <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {title}
            </h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          </div>
          <div className="hidden lg:block">
            <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {title}
            </h1>
            <p className="mt-2 text-base" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          </div>

          <div className="border-gradient-premium mt-8 p-6 sm:mt-10 sm:p-8">
            {children}
          </div>
          <div className="mt-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            {footer}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
