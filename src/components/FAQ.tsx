"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "What can I create with RUHGEN?",
    a: "Still images, image sequences, and short-form cinematic clips from text—or combine reference frames and style prompts. Pro and Studio add higher resolutions, longer outputs, and batch workflows.",
  },
  {
    q: "How does pricing scale for teams?",
    a: "Free is for experimentation. Pro fits solo creators and small squads with pooled monthly generations. Studio adds seats, shared prompt libraries, audit logs, and priority infrastructure.",
  },
  {
    q: "Can I use outputs commercially?",
    a: "Yes on Pro and Studio within the license terms in your agreement. Free tier is for personal exploration—upgrade before client or broadcast work.",
  },
  {
    q: "Do you offer an API?",
    a: "Studio includes REST hooks, webhooks on job completion, and signed URLs for assets so you can automate ingest into DAMs, MAMs, or custom render farms.",
  },
  {
    q: "How do you handle data privacy?",
    a: "Prompts and uploads are encrypted in transit. Retention defaults are configurable on Studio; we never sell your data or train on private Studio content without a contract addendum.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="mesh-section scroll-mt-24 py-12 md:py-24">
      <div className="mx-auto max-w-[880px] px-3 sm:px-6 lg:px-10">
        <div className="mb-8 text-center md:mb-12">
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
            className="mx-auto mt-2 max-w-lg text-sm sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Everything you need to decide fast—no jargon wall.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:gap-3">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
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
    </section>
  );
}
