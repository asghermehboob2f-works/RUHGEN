"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Search, HelpCircle, Mail, HelpCircle as HelpIcon, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FAQ_CATEGORY_LABELS,
  MARKETING_FAQS,
  type FaqCategory,
} from "@/lib/marketing-faqs";
import { SITE_CONTAINER } from "@/lib/site-layout";

const categories: (FaqCategory | "all")[] = ["all", "product", "billing", "teams", "security"];

// Color mappings for premium category badges
const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  all: { bg: "var(--glass)", border: "var(--border-subtle)", text: "var(--text-primary)" },
  product: { bg: "rgba(123,97,255,0.06)", border: "rgba(123,97,255,0.25)", text: "#7B61FF" },
  billing: { bg: "rgba(0,212,255,0.06)", border: "rgba(0,212,255,0.25)", text: "#00D4FF" },
  teams: { bg: "rgba(255,46,154,0.06)", border: "rgba(255,46,154,0.25)", text: "#FF2E9A" },
  security: { bg: "rgba(0,255,196,0.06)", border: "rgba(0,255,196,0.25)", text: "#00FFC4" }
};

interface Faq {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export function FaqHubContent() {
  const reduce = useReducedMotion() === true;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<FaqCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/faqs?_t=${Date.now()}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        if (data.ok && Array.isArray(data.faqs) && data.faqs.length > 0) {
          setFaqs(data.faqs);
          if (data.faqs.length > 0) setOpenId(data.faqs[0].id);
        } else {
          console.warn("[FaqHubContent] API response was not OK or returned empty faqs, falling back to static FAQs.", data);
          setFaqs(MARKETING_FAQS);
          if (MARKETING_FAQS.length > 0) setOpenId(MARKETING_FAQS[0].id);
        }
      })
      .catch((err) => {
        console.error("[FaqHubContent] Error fetching FAQs from backend API, falling back to static FAQs:", err);
        setFaqs(MARKETING_FAQS);
        if (MARKETING_FAQS.length > 0) setOpenId(MARKETING_FAQS[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return faqs.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (!needle) return true;
      return (
        item.question.toLowerCase().includes(needle) ||
        item.answer.toLowerCase().includes(needle) ||
        FAQ_CATEGORY_LABELS[item.category].toLowerCase().includes(needle)
      );
    });
  }, [q, cat, faqs]);

  return (
    <div className="relative min-h-screen font-sans" style={{ background: "var(--deep-black)" }}>
      {/* Decorative Cinematic Background Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-[#7B61FF]/10 blur-[130px]" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full bg-[#00D4FF]/5 blur-[120px]" />
      </div>

      {/* Hero Search Section */}
      <section className="relative overflow-hidden border-b border-white/[0.03] pt-32 pb-16 z-10">
        <div className={`relative ${SITE_CONTAINER} flex flex-col items-center text-center`}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl w-full"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/5 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#00D4FF] mb-5 shadow-[0_0_12px_rgba(0,212,255,0.15)]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#00D4FF]" />
              RUHGEN Help Center
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-[var(--text-primary)] mb-6">
              Answers, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#00D4FF] via-[#7B61FF] to-[#FF2E9A] bg-clip-text text-transparent">
                searchable.
              </span>
            </h1>

            <p className="max-w-xl mx-auto text-sm sm:text-base text-[var(--text-muted)] font-light leading-relaxed mb-10">
              Filter by category or query—straightforward architectural guidelines, billing rules, and security answers.
            </p>

            {/* Gorgeous Glassmorphic Search Bar */}
            <div className="relative max-w-xl mx-auto mb-8 group">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#00D4FF] to-[#7B61FF] opacity-15 blur-sm transition-opacity group-hover:opacity-30 group-focus-within:opacity-40" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#00D4FF] transition-colors" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search visual pipeline, models, SSO..."
                  className="w-full rounded-2xl border border-[color-mix(in_oklab,var(--border-subtle)_60%,transparent)] py-4 pl-12 pr-5 text-sm outline-none bg-[color-mix(in_oklab,var(--glass)_95%,transparent)] text-[var(--text-primary)] transition-all focus:border-[#00D4FF]/40 focus:ring-1 focus:ring-[#00D4FF]/20"
                />
              </div>
            </div>

            {/* Category Selectors */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((c) => {
                const label = c === "all" ? "All Topics" : FAQ_CATEGORY_LABELS[c];
                const active = cat === c;
                const colors = categoryColors[c] || categoryColors.all;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCat(c)}
                    className="min-h-[38px] rounded-full border px-4 py-1.5 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      borderColor: active ? colors.border : "var(--border-subtle)",
                      background: active ? colors.bg : "var(--glass)",
                      color: active ? colors.text : "var(--text-muted)",
                      boxShadow: active ? `0 0 15px -3px ${colors.border}` : undefined
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Accordion Hub Section */}
      <section className="relative py-16 sm:py-20 z-10">
        <div className={SITE_CONTAINER}>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14 xl:gap-20">
            
            {/* Left Info Column */}
            <div className="hidden w-full max-w-xs shrink-0 lg:block">
              <div className="rounded-2xl border border-[color-mix(in_oklab,var(--border-subtle)_60%,transparent)] p-5 animate-pulse-slow" style={{ background: "var(--glass)" }}>
                <HelpIcon className="w-6 h-6 text-[#7B61FF] mb-3.5" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Topic Navigation
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-subtle)] font-light">
                  Select a category above or run searches to instantly filter the operational ledger. Hover to explore deep content maps.
                </p>
              </div>
            </div>

            {/* Main Accordion Rows */}
            <div className="min-w-0 flex-1">
              {loading ? (
                <div className="flex justify-center py-10">
                  <span className="loading-orbit h-8 w-8 rounded-full border-2 border-[#7B61FF] border-t-transparent animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 rounded-3xl border border-dashed border-[color-mix(in_oklab,var(--border-subtle)_60%,transparent)] bg-[color-mix(in_oklab,var(--glass)_30%,transparent)] p-6">
                  <p className="text-[var(--text-muted)] text-sm font-light">
                    No results found matching your search. Try adjusting the query or switching category filters.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.map((item) => {
                    const isOpen = openId === item.id;
                    const colors = categoryColors[item.category] || categoryColors.all;
                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-2xl border transition-all duration-300 relative group"
                        style={{
                          borderColor: isOpen ? colors.border : "var(--border-subtle)",
                          background: isOpen ? "var(--glass-elevated)" : "var(--glass)",
                          boxShadow: isOpen ? `0 0 30px -12px ${colors.border}` : undefined
                        }}
                      >
                        {/* Glow left side indicator light */}
                        <div 
                          className="absolute left-0 inset-y-0 w-[3px] rounded-r transition-opacity duration-300"
                          style={{ 
                            backgroundColor: colors.text, 
                            opacity: isOpen ? 1 : 0 
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : item.id)}
                          className="flex w-full min-h-[64px] items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                          aria-expanded={isOpen}
                        >
                          <span className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                            <span
                              className="shrink-0 rounded-md border text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
                              style={{ 
                                borderColor: colors.border, 
                                color: colors.text,
                                backgroundColor: `${colors.text}08`
                              }}
                            >
                              {FAQ_CATEGORY_LABELS[item.category]}
                            </span>
                            <span className="font-display text-sm sm:text-base font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--text-primary)]">
                              {item.question}
                            </span>
                          </span>
                          <ChevronDown
                            className="h-5 w-5 shrink-0 transition-transform duration-300"
                            style={{
                              color: colors.text,
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
                              transition={{ duration: 0.25, ease: "easeOut" }}
                            >
                              <p className="border-t border-white/5 px-5 pb-5 pt-4 text-xs sm:text-sm leading-relaxed text-[var(--text-muted)] font-light sm:px-6">
                                {item.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Still have questions CTA panel */}
              <div className="mt-12 grid gap-6 rounded-3xl border p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
                <div>
                  <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                    Need something that isn&apos;t listed here?
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[var(--text-muted)] font-light">
                    Custom security compliance sheets, enterprise procurement paths, or dedicated node access—send details to our engineering desks.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7B61FF] px-6 text-xs font-bold text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Contact Desk
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
