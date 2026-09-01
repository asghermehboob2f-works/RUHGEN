"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { MARKETING_FAQS, type MarketingFaq } from "@/lib/marketing-faqs";
import { SITE_CONTAINER } from "@/lib/site-layout";

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export function FAQ({
  hideHeading = false,
  items,
}: {
  hideHeading?: boolean;
  /** Optional pre-loaded items */
  items?: Faq[];
}) {
  const [list, setList] = useState<Faq[]>(items ?? []);
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!items) {
      fetch(`/api/faqs?_t=${Date.now()}`, { cache: "no-store" })
        .then((r) => {
          if (!r.ok) {
            throw new Error(`HTTP error! status: ${r.status}`);
          }
          return r.json();
        })
        .then((data) => {
          if (data.ok && Array.isArray(data.faqs) && data.faqs.length > 0) {
            setList(data.faqs.slice(0, 5));
          } else {
            console.warn("[FAQ] API response was not OK or returned empty faqs, falling back to static FAQs.", data);
            setList(MARKETING_FAQS.slice(0, 5));
          }
        })
        .catch((err) => {
          console.error("[FAQ] Error fetching FAQs from backend API, falling back to static FAQs:", err);
          setList(MARKETING_FAQS.slice(0, 5));
        });
    }
  }, [items]);

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
                className="font-display text-section-title font-bold leading-[1.2] tracking-tight"
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
                className="overflow-hidden rounded-xl border transition-[box-shadow,border-color] duration-300"
                style={{
                  borderColor: isOpen ? "rgba(123, 97, 255, 0.35)" : "var(--border-subtle)",
                  background: "var(--glass)",
                  boxShadow: isOpen ? "0 0 32px -12px rgba(123, 97, 255, 0.18)" : undefined,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full min-h-12 items-center justify-between gap-4 px-4 py-3.5 text-left sm:min-h-14 sm:px-5 sm:py-4"
                  aria-expanded={isOpen}
                >
                  <span
                    className="font-display pr-2 text-sm font-semibold sm:text-base"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.question}
                  </span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform duration-300"
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
                        className="border-t px-4 pb-4 pt-3 text-xs leading-relaxed font-light sm:px-5 sm:pb-5 sm:text-[13px]"
                        style={{
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.answer}
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
