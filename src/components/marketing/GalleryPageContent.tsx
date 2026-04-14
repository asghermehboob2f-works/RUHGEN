"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { GallerySection } from "@/components/GallerySection";
import { GraphicGalleryMosaic } from "@/components/marketing/graphics/MarketingGraphics";
import type { SiteContent } from "@/backend/site-content/types";
import { SITE_CONTAINER } from "@/lib/site-layout";

export function GalleryPageContent({ content }: { content: SiteContent }) {
  const reduce = useReducedMotion() === true;

  return (
    <>
      <section className="relative overflow-hidden border-b pt-24 sm:pt-28" style={{ borderColor: "var(--border-subtle)" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(255,46,154,0.08), transparent 50%), var(--deep-black)",
          }}
        />
        <div className={`relative ${SITE_CONTAINER} pb-12 sm:pb-16`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
            <div className="text-center lg:text-left">
              <motion.p
                className="text-[10px] font-bold uppercase tracking-[0.35em]"
                style={{ color: "var(--text-subtle)" }}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Community wall
              </motion.p>
              <motion.h1
                className="font-display mt-3 text-[clamp(2.1rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-tight"
                style={{ color: "var(--text-primary)" }}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Pixels worth <span className="text-gradient-hero">saving</span>
              </motion.h1>
              <motion.p
                className="mt-5 text-sm leading-relaxed sm:text-base lg:max-w-xl"
                style={{ color: "var(--text-muted)" }}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05 }}
              >
                Filter by look, open any tile for the full prompt, and steal inspiration for your next session—this page is
                built for browsing, not reading marketing copy.
              </motion.p>
              <Link
                href="/spotlight"
                className="mt-8 inline-block text-sm font-semibold text-[#00D4FF] underline-offset-4 hover:underline"
              >
                See motion spotlights →
              </Link>
            </div>
            <motion.div
              className="mx-auto w-full max-w-[420px] lg:mx-0 lg:max-w-none"
              initial={reduce ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GraphicGalleryMosaic className="h-auto w-full opacity-95" />
            </motion.div>
          </div>
        </div>
      </section>

      <GallerySection items={content.gallery.items} hideHeading />

      <section className="border-t py-12" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
        <div className={`${SITE_CONTAINER} grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center`}>
          <p className="text-center text-sm leading-relaxed lg:text-left" style={{ color: "var(--text-muted)" }}>
            Hero and gallery content can be curated from your dashboard—swap assets as your brand evolves without redeploying
            the site.
          </p>
          <div className="flex justify-center lg:justify-end">
            <Link
              href="/sign-up"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-8 text-sm font-semibold text-white btn-gradient"
            >
              Create your first render
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
