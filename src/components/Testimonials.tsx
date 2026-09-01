"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import type { TestimonialItem } from "@/backend/site-content/types";

const defaultQuotes: TestimonialItem[] = [
  {
    id: "test-1",
    body: "We replaced a week of mood-board iteration with one RUHGEN session. The team finally stopped fighting over references and started shipping.",
    name: "Elena Voss",
    role: "Creative Director, Northwind Studio",
    avatarColor: "from-brand-purple to-indigo-950/40",
    hoverColor: "group-hover:text-brand-purple/70",
    initials: "EV",
  },
  {
    id: "test-2",
    body: "Latency is honestly wild. I can iterate on a shot while the director is still in the room—feels like a realtime renderer for ideas.",
    name: "Marcus Chen",
    role: "VFX Supervisor",
    avatarColor: "from-brand-cyan to-teal-950/40",
    hoverColor: "group-hover:text-brand-cyan/70",
    initials: "MC",
  },
  {
    id: "test-3",
    body: "The API slots straight into our asset pipeline. Webhooks fire when renders finish; our DAM ingests frames without anyone touching FTP.",
    name: "Priya Nair",
    role: "Head of Platform, Lumen Labs",
    avatarColor: "from-brand-pink to-rose-950/40",
    hoverColor: "group-hover:text-brand-pink/70",
    initials: "PN",
  },
];

export function Testimonials({ quotes }: { quotes?: TestimonialItem[] }) {
  const activeQuotes = quotes && quotes.length > 0 ? quotes : defaultQuotes;

  return (
    <section
      id="stories"
      className="mesh-section scroll-mt-24 py-16 sm:py-20 md:py-28 relative overflow-hidden"
    >
      <div className="mx-auto max-w-full px-6 sm:px-12 lg:px-20 xl:px-32 relative z-10">
        <div className="mb-14 text-center">
          {/* Enhanced Badge */}
          <div className="relative mb-5 inline-flex items-center justify-center rounded-full border border-border bg-card/30 px-5 py-1.5 backdrop-blur-2xl transition-all duration-500 hover:border-brand-purple/20">
            <span className="text-[8px] font-normal uppercase tracking-[0.4em] text-muted-foreground ml-[0.5em]">
              Industry Endorsements
            </span>
          </div>

          {/* BOLD Testimonial Heading with clean, sophisticated typography */}
          <h2
            className="font-display text-[clamp(2.25rem,6.5vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-foreground"
          >
            Trusted where <br className="hidden md:block" />
            <span className="text-foreground">pixels matter</span>
          </h2>
        </div>

        {/* Enhanced grid layout to support perfect responsive viewing on all mobile/tablet views */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {activeQuotes.map((q, i) => (
            <motion.article
              key={q.id || q.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-5 sm:p-6 backdrop-blur-2xl transition-all duration-700 hover:border-border/80 hover:bg-card/35"
              style={{
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.02)",
              }}
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Quote
                      className="h-5 w-5 shrink-0 text-foreground opacity-15 transition-all duration-700 group-hover:opacity-30"
                      strokeWidth={1.5}
                    />
                  </div>
                  
                  {/* Clean Light Typography for quote body */}
                  <blockquote
                    className="mt-4 flex-1 text-[11.5px] sm:text-xs leading-relaxed font-light tracking-wide text-muted-foreground/75 group-hover:text-muted-foreground transition-colors duration-500"
                  >
                    &ldquo;{q.body}&rdquo;
                  </blockquote>
                </div>

                <div
                  className="mt-6 border-t border-border/40 pt-4 flex items-center gap-3"
                >
                  {/* Unique author initials bubble with brand gradient and thin border */}
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${q.avatarColor || 'from-zinc-800 to-zinc-900'} flex items-center justify-center border border-border/60 shadow-md text-[9.5px] font-bold text-white tracking-wide relative overflow-hidden shrink-0`}>
                    <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                    <span className="relative z-10">{q.initials}</span>
                  </div>
                  
                  <div className="min-w-0">
                    <p className="font-display text-xs font-semibold tracking-wide text-foreground transition-colors duration-500 truncate">
                      {q.name}
                    </p>
                    <p className={`mt-0.5 text-[8.5px] uppercase tracking-[0.16em] font-mono text-muted-foreground/70 transition-colors duration-500 truncate ${q.hoverColor || 'group-hover:text-muted-foreground'}`}>
                      {q.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
