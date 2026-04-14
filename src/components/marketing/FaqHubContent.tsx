"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FAQ_CATEGORY_LABELS,
  MARKETING_FAQS,
  type FaqCategory,
} from "@/lib/marketing-faqs";
import { SITE_CONTAINER } from "@/lib/site-layout";

const categories: (FaqCategory | "all")[] = ["all", "product", "billing", "teams", "security"];

export function FaqHubContent() {
  const reduce = useReducedMotion() === true;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<FaqCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(MARKETING_FAQS[0]?.id ?? null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MARKETING_FAQS.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (!needle) return true;
      return (
        item.q.toLowerCase().includes(needle) ||
        item.a.toLowerCase().includes(needle) ||
        FAQ_CATEGORY_LABELS[item.category].toLowerCase().includes(needle)
      );
    });
  }, [q, cat]);

  return (
    <>
      <section className="relative overflow-hidden border-b pt-24 sm:pt-28" style={{ borderColor: "var(--border-subtle)" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(0,212,255,0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(123,97,255,0.14), transparent 55%)",
          }}
        />
        <div className={`relative ${SITE_CONTAINER} pb-10`}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-end lg:gap-12">
            <div className="text-center lg:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--text-subtle)" }}>
                Help center
              </p>
              <h1 className="font-display mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight" style={{ color: "var(--text-primary)" }}>
                Answers, <span className="text-gradient-primary">searchable</span>
              </h1>
            </div>
            <p className="text-center text-sm leading-relaxed sm:text-base lg:text-left" style={{ color: "var(--text-muted)" }}>
              Filter by topic or search—straight answers on product, billing, teams, and data practices.
            </p>
          </div>

          <motion.div
            className="mx-auto mt-10 max-w-xl lg:mx-0 lg:max-w-lg"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <label className="relative block">
              <span className="sr-only">Search questions</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B61FF]/70" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search questions…"
                className="w-full rounded-2xl border py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/35"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}
              />
            </label>
          </motion.div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((c) => {
              const label = c === "all" ? "All" : FAQ_CATEGORY_LABELS[c];
              const active = cat === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className="min-h-[40px] rounded-full border px-4 text-xs font-semibold transition-colors sm:text-sm"
                  style={{
                    borderColor: active ? "rgba(123,97,255,0.45)" : "var(--border-subtle)",
                    background: active ? "rgba(123,97,255,0.12)" : "var(--glass)",
                    color: active ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mesh-section relative py-12 md:py-20">
        <div className={`${SITE_CONTAINER} flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14 xl:gap-20`}>
          <div className="hidden w-full max-w-xs shrink-0 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
              Browse
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Jump between categories or search—answers stay scannable on wide screens.
            </p>
          </div>
          <div className="min-w-0 flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No matches. Try a shorter term or switch category.
            </p>
          ) : (
            <div className="flex flex-col gap-2 sm:gap-3">
              {filtered.map((item) => {
                const isOpen = openId === item.id;
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
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="flex w-full min-h-14 items-start justify-between gap-4 px-4 py-4 text-left sm:min-h-16 sm:items-center sm:px-6 sm:py-5"
                      aria-expanded={isOpen}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                        <span
                          className="shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}
                        >
                          {FAQ_CATEGORY_LABELS[item.category]}
                        </span>
                        <span className="font-display text-base font-semibold sm:text-lg" style={{ color: "var(--text-primary)" }}>
                          {item.q}
                        </span>
                      </span>
                      <ChevronDown
                        className="mt-0.5 h-5 w-5 shrink-0 transition-transform duration-300 sm:mt-0"
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
          )}

          <div className="mt-12 grid gap-6 rounded-2xl border p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:text-left" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
            <div>
              <p className="font-display text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Need something that isn&apos;t listed?
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Security reviews, procurement, or a stubborn bug—send context and we&apos;ll route it fast.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center justify-self-center rounded-xl px-8 text-sm font-semibold text-white btn-gradient lg:justify-self-end"
            >
              Contact
            </Link>
          </div>
          </div>
        </div>
      </section>
    </>
  );
}
