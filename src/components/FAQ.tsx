"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { MARKETING_FAQS, type MarketingFaq } from "@/lib/marketing-faqs";
import { SITE_CONTAINER } from "@/lib/site-layout";

export function FAQ({
  hideHeading = false,
  items,
}: {
  hideHeading?: boolean;
  /** Defaults to first five entries — pricing embed. */
  items?: MarketingFaq[];
}) {
  const list = items ?? MARKETING_FAQS.slice(0, 5);
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="mesh-section scroll-mt-24 py-12 md:py-24">
      <div className={SITE_CONTAINER}>
        <div
          className={
            hideHeading
              ? "mx-auto max-w-[min(100%,960px)]"
              : "grid gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-14 xl:gap-20"
          }
        >
          {!hideHeading && (
            <div className="text-center lg:sticky lg:top-28 lg:text-left">
              <p
                className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
                style={{ color: "var(--text-subtle)" }}
              >
                Questions
              </p>
              <h2
                className="font-display text-[clamp(1.55rem,3.8vw,3rem)] font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Straight answers
              </h2>
              <p
                className="mx-auto mt-2 max-w-lg text-sm sm:mt-3 sm:text-lg lg:mx-0 lg:max-w-none"
                style={{ color: "var(--text-muted)" }}
              >
                Everything you need to decide fast—no jargon wall.
              </p>
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
          {list.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border transition-[box-shadow,border-color] duration-300"
                style={{
                  borderColor: isOpen ? "rgba(123, 97, 255, 0.35)" : "var(--border-subtle)",
                  background: "var(--glass)",
                  boxShadow: isOpen ? "0 0 40px -12px rgba(123, 97, 255, 0.2)" : undefined,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full min-h-14 items-center justify-between gap-4 px-4 py-4 text-left sm:min-h-16 sm:px-6 sm:py-5"
                  aria-expanded={isOpen}
                >
                  <span
                    className="font-display pr-2 text-base font-semibold sm:text-lg"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.q}
                  </span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform duration-300"
                    style={{
                      color: "#7B61FF",
                      transform: isOpen ? "rotate(180deg)" : undefined,
                    }}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={reduce ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduce ? undefined : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p
                        className="border-t px-4 pb-5 pt-4 text-sm leading-relaxed sm:px-6 sm:pb-6 sm:text-base"
                        style={{
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
