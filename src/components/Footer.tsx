"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  MARKETING_NAV_PRIMARY,
  MARKETING_NAV_SECONDARY,
} from "@/lib/marketing-nav";
import { SITE_CONTAINER } from "@/lib/site-layout";
import { BrandLogo } from "./BrandLogo";

const product = [
  ...MARKETING_NAV_PRIMARY.map((l) => ({ href: l.href, label: l.label })),
  { href: "/#stories", label: "Stories" },
] as const;

const company = [
  ...MARKETING_NAV_SECONDARY.map((l) => ({ href: l.href, label: l.label })),
  { href: "/platform/engineering", label: "Engineering" },
  { href: "/about#join", label: "Careers" },
  { href: "/faq", label: "FAQ" },
] as const;

const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy#cookies", label: "Cookie Policy" },
  { href: "/terms", label: "Licenses" },
] as const;

const SOCIALS = [
  {
    href: "https://instagram.com",
    label: "Instagram",
    icon: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    ),
  },
  {
    href: "https://youtube.com",
    label: "YouTube",
    icon: (
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    ),
  },
  {
    href: "https://facebook.com",
    label: "Facebook",
    icon: (
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    ),
  },
  {
    href: "https://twitter.com",
    label: "X",
    icon: (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    ),
  },
  {
    href: "https://linkedin.com",
    label: "LinkedIn",
    icon: (
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    ),
  },
] as const;

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

const sectionHeadingDesktop =
  "font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-subtle)]";

const navLinkDesktop =
  "group relative inline-flex w-full items-center py-1 text-[13px] font-medium leading-snug text-[var(--text-muted)] transition-colors duration-200 hover:text-[#d4c8ff]";

const navLinkMobile =
  "group relative flex min-h-[40px] w-full items-center py-1.5 text-[13px] font-medium text-[var(--text-muted)] transition-colors active:bg-[color-mix(in_oklab,var(--glass)_40%,transparent)] hover:text-[#d4c8ff]";

const underlineSweep =
  "pointer-events-none absolute -bottom-px left-0 h-px w-0 bg-gradient-to-r from-[#7B61FF]/80 to-[#00d4ff]/60 transition-[width] duration-300 ease-out group-hover:w-full";

const socialBtnClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_oklab,var(--border-subtle)_88%,transparent)] bg-[color-mix(in_oklab,var(--glass)_75%,transparent)] text-[var(--text-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition-[border-color,box-shadow,color,background-color] duration-200 hover:border-[#7B61FF]/42 hover:bg-[color-mix(in_oklab,var(--glass)_100%,#7B61FF_10%)] hover:text-[#e8e0ff] hover:shadow-[0_0_16px_rgba(123,97,255,0.2)] focus-visible:ring-2 focus-visible:ring-[#7B61FF]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rich-black)] active:scale-[0.96] motion-safe:hover:-translate-y-0.5 light:hover:shadow-[0_0_12px_rgba(123,97,255,0.12)]";

const dividerV =
  "hidden w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-[color-mix(in_oklab,var(--border-subtle)_85%,#7B61FF_12%)] to-transparent lg:block";

function LinkUnderline({ className = "" }: { className?: string }) {
  return <span className={`${underlineSweep} ${className}`} aria-hidden />;
}

function NavList({
  links,
  linkClass,
}: {
  links: readonly { href: string; label: string }[];
  linkClass: string;
}) {
  return (
    <ul className="flex min-w-0 flex-col gap-0.5">
      {links.map((l) => (
        <li key={`${l.href}-${l.label}`}>
          <Link href={l.href} className={linkClass}>
            <span className="relative inline-block">
              {l.label}
              <LinkUnderline />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NewsletterBlock({
  email,
  setEmail,
  newsletterState,
  setNewsletterState,
  errorMsg,
  onSubscribe,
  compact,
}: {
  email: string;
  setEmail: (v: string) => void;
  newsletterState: "idle" | "loading" | "success" | "error";
  setNewsletterState: (v: "idle" | "loading" | "success" | "error") => void;
  errorMsg: string;
  onSubscribe: (e: React.FormEvent) => void;
  compact?: boolean;
}) {
  const headingClass = compact ? "font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]" : sectionHeadingDesktop;
  const inputClass =
    "h-9 w-full min-w-0 rounded-lg border border-[color-mix(in_oklab,var(--border-subtle)_85%,transparent)] bg-[color-mix(in_oklab,var(--deep-black)_45%,var(--rich-black))] px-3 text-[13px] text-[var(--text-primary)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--text-subtle)] focus:border-[#7B61FF]/50 focus:shadow-[0_0_0_1px_rgba(123,97,255,0.22),0_0_20px_-10px_rgba(123,97,255,0.4)] light:focus:shadow-[0_0_0_1px_rgba(123,97,255,0.18),0_0_14px_-8px_rgba(123,97,255,0.2)]";
  const btnClass =
    "h-9 shrink-0 rounded-lg px-4 text-[13px] font-semibold whitespace-nowrap text-white transition-[opacity,transform,filter,box-shadow] duration-200 btn-gradient hover:brightness-110 hover:shadow-[0_0_20px_-4px_rgba(123,97,255,0.5)] light:hover:shadow-[0_0_14px_-2px_rgba(123,97,255,0.28)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55";

  return (
    <div className={`flex min-w-0 flex-col ${compact ? "gap-2 pt-1" : "gap-2.5"}`}>
      {!compact && (
        <div>
          <h2 className={headingClass}>Newsletter</h2>
          <p className="mt-1 max-w-[18rem] text-[11.5px] leading-snug text-[var(--text-subtle)]">
            Product drops and creative tips — no spam.
          </p>
        </div>
      )}
      <form
        className={`flex w-full min-w-0 flex-col gap-2 ${compact ? "" : "sm:flex-row sm:items-stretch"}`}
        onSubmit={onSubscribe}
      >
        <div className="relative min-w-[11rem] flex-1 sm:min-w-[15rem]">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (newsletterState === "error") setNewsletterState("idle");
            }}
            placeholder="you@studio.com"
            autoComplete="email"
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={newsletterState === "loading"} className={btnClass}>
          {newsletterState === "loading" ? "…" : "Subscribe"}
        </button>
      </form>
      {newsletterState === "success" && (
        <p className="text-[11.5px] font-medium leading-snug text-[#5eead4]">You’re in — watch your inbox.</p>
      )}
      {newsletterState === "error" && (
        <p className="text-[11.5px] font-medium leading-snug text-[#fb7185]">{errorMsg}</p>
      )}
    </div>
  );
}

function MobileAccordion({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <details
      id={id}
      className="group border-b border-[color-mix(in_oklab,var(--border-subtle)_70%,transparent)] last:border-b-0"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-2.5 pr-0 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
          {title}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[var(--text-subtle)] transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="pb-2.5 pt-0">{children}</div>
    </details>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [newsletterState, setNewsletterState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setNewsletterState("error");
      setErrorMsg("Please enter a valid email.");
      return;
    }
    setNewsletterState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setNewsletterState("error");
        setErrorMsg("Could not subscribe. Try again.");
        return;
      }
      setNewsletterState("success");
      setEmail("");
      window.setTimeout(() => setNewsletterState("idle"), 4500);
    } catch {
      setNewsletterState("error");
      setErrorMsg("Network error.");
    }
  };

  const newsletterProps = {
    email,
    setEmail,
    newsletterState,
    setNewsletterState,
    errorMsg,
    onSubscribe,
  };

  return (
    <footer
      className="footer-site relative border-t pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--rich-black)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7B61FF]/38 to-transparent"
        aria-hidden
      />
      <div
        className="footer-ambient-glow pointer-events-none absolute inset-x-0 bottom-0 h-[min(28%,72px)] bg-[radial-gradient(ellipse_75%_55%_at_50%_100%,rgba(123,97,255,0.045),transparent_72%)]"
        aria-hidden
      />

      <div className={`relative ${SITE_CONTAINER} pt-3 pb-2 sm:pt-3.5 sm:pb-2.5 lg:pt-4 lg:pb-3`}>
        {/* Mobile + small tablet: brand + accordions */}
        <div className="lg:hidden">
          <div className="mb-2.5 -ml-1 sm:-ml-0.5">
            <BrandLogo size="md" showWordmark href="/" className="justify-start" />
            <p
              className="mt-2 max-w-[22rem] text-[12.5px] leading-relaxed tracking-wide sm:text-[13px]"
              style={{ color: "var(--text-muted)" }}
            >
              Where imagination becomes reality — instantly. Your creative engine for next-generation
              visuals.
            </p>
            <div className="mt-2.5 flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SOCIALS.map((soc) => (
                <a
                  key={soc.label}
                  href={soc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialBtnClass}
                  aria-label={soc.label}
                >
                  <svg className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    {soc.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[color-mix(in_oklab,var(--border-subtle)_65%,transparent)] bg-[color-mix(in_oklab,var(--glass)_35%,transparent)] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
            <MobileAccordion id="footer-m-product" title="Product">
              <NavList links={product} linkClass={navLinkMobile} />
            </MobileAccordion>
            <MobileAccordion id="footer-m-company" title="Company">
              <NavList links={company} linkClass={navLinkMobile} />
            </MobileAccordion>
            <MobileAccordion id="footer-m-legal" title="Legal">
              <NavList links={legal} linkClass={navLinkMobile} />
            </MobileAccordion>
            <MobileAccordion id="footer-m-newsletter" title="Newsletter">
              <p className="mb-2 text-[11px] leading-snug text-[var(--text-subtle)]">
                Product drops and creative tips — no spam.
              </p>
              <NewsletterBlock {...newsletterProps} compact />
            </MobileAccordion>
          </div>
        </div>

        {/* Desktop: horizontal band */}
        <div className="hidden lg:flex lg:items-stretch lg:gap-0 lg:pb-0.5">
          <aside className="flex min-w-[232px] max-w-[272px] shrink-0 flex-col pr-4 lg:-ml-1 xl:min-w-[248px] xl:max-w-[288px]">
            <BrandLogo size="md" showWordmark href="/" className="justify-start" />
            <p
              className="mt-2.5 max-w-[24rem] text-[12.5px] leading-relaxed tracking-wide xl:text-[13px]"
              style={{ color: "var(--text-muted)" }}
            >
              Where imagination becomes reality — instantly. Your creative engine for next-generation
              visuals.
            </p>
            <div className="mt-3 flex flex-nowrap gap-1.5">
              {SOCIALS.map((soc) => (
                <a
                  key={soc.label}
                  href={soc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialBtnClass}
                  aria-label={soc.label}
                >
                  <svg className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    {soc.icon}
                  </svg>
                </a>
              ))}
            </div>
          </aside>

          <div className={dividerV} aria-hidden />

          <div className="grid min-w-0 flex-1 grid-cols-3 gap-6 px-6 xl:gap-8 xl:px-8">
            <nav aria-labelledby="footer-product-heading" className="min-w-0">
              <h2 id="footer-product-heading" className={`${sectionHeadingDesktop} mb-2`}>
                Product
              </h2>
              <NavList links={product} linkClass={navLinkDesktop} />
            </nav>
            <nav aria-labelledby="footer-company-heading" className="min-w-0">
              <h2 id="footer-company-heading" className={`${sectionHeadingDesktop} mb-2`}>
                Company
              </h2>
              <NavList links={company} linkClass={navLinkDesktop} />
            </nav>
            <nav aria-labelledby="footer-legal-heading" className="min-w-0">
              <h2 id="footer-legal-heading" className={`${sectionHeadingDesktop} mb-2`}>
                Legal
              </h2>
              <NavList links={legal} linkClass={navLinkDesktop} />
            </nav>
          </div>

          <div className={dividerV} aria-hidden />

          <div className="flex min-w-[260px] w-[min(100%,300px)] max-w-[320px] shrink-0 flex-col pl-5 xl:min-w-[280px] xl:w-[min(100%,320px)] xl:max-w-[340px] xl:pl-7">
            <NewsletterBlock {...newsletterProps} />
          </div>
        </div>

        <div
          className="mt-3 flex flex-col gap-1 border-t border-[color-mix(in_oklab,var(--border-subtle)_75%,transparent)] pt-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:mt-3.5 lg:pt-2.5"
          style={{ color: "var(--text-subtle)" }}
        >
          <p className="text-[10.5px] font-medium tabular-nums tracking-wide sm:text-[11px]">
            © {new Date().getFullYear()} RUHGEN. All rights reserved.
          </p>
          <p className="max-w-md text-[10.5px] leading-snug sm:text-right sm:text-[11px] sm:leading-snug">
            Engineered for motion, stills, and imagination.
          </p>
        </div>
      </div>
    </footer>
  );
}
