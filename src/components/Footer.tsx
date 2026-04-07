"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";

const product = [
  { href: "/#showcase", label: "Spotlight" },
  { href: "/#features", label: "Features" },
  { href: "/#platform", label: "Platform" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#stories", label: "Stories" },
];

const company = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/about#join", label: "Careers" },
  { href: "/#faq", label: "FAQ" },
];

const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy#cookies", label: "Cookie Policy" },
  { href: "/terms", label: "Licenses" },
];

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
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

  return (
    <footer
      className="relative border-t"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--rich-black)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7B61FF]/50 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-[1400px] px-3 py-10 sm:px-5 sm:py-12 lg:px-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-x-8">
          <div className="col-span-2 flex flex-col items-center text-center lg:col-span-2 lg:items-start lg:text-left">
            <BrandLogo size="lg" showWordmark href="/" className="justify-center lg:justify-start" />
            <p
              className="mt-3 max-w-md text-xs leading-relaxed sm:text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Where imagination becomes reality — instantly. Your creative engine for next-generation
              visuals.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              {[
                { href: "https://twitter.com", label: "X (Twitter)", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                {
                  href: "https://linkedin.com",
                  label: "LinkedIn",
                  path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
                },
                {
                  href: "https://youtube.com",
                  label: "YouTube",
                  path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
                },
              ].map((soc) => (
                <a
                  key={soc.label}
                  href={soc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:border-[#7B61FF]/45 hover:text-[#7B61FF] sm:h-10 sm:w-10"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                    background: "var(--glass)",
                  }}
                  aria-label={soc.label}
                >
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={soc.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="text-left">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.15em]"
              style={{ color: "var(--text-primary)" }}
            >
              Product
            </p>
            <ul className="mt-3 space-y-2 text-xs sm:mt-4 sm:space-y-2.5 sm:text-sm">
              {product.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="inline-block transition-colors hover:text-[#7B61FF]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-left">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.15em]"
              style={{ color: "var(--text-primary)" }}
            >
              Company
            </p>
            <ul className="mt-3 space-y-2 text-xs sm:mt-4 sm:space-y-2.5 sm:text-sm">
              {company.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="inline-block transition-colors hover:text-[#7B61FF]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 text-left lg:col-span-1">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.15em]"
              style={{ color: "var(--text-primary)" }}
            >
              Legal
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:mt-4 sm:grid-cols-1 sm:gap-y-2.5 sm:text-sm">
              {legal.map((l) => (
                <li key={l.label + l.href}>
                  <Link
                    href={l.href}
                    className="inline-block transition-colors hover:text-[#7B61FF]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.15em]"
              style={{ color: "var(--text-primary)" }}
            >
              Stay updated
            </p>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch"
              onSubmit={onSubscribe}
            >
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
                className="min-h-[40px] min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40 sm:min-h-[44px] sm:text-sm"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={newsletterState === "loading"}
                className="min-h-[40px] shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white btn-gradient disabled:opacity-60 sm:min-h-[44px] sm:px-5 sm:text-sm"
              >
                {newsletterState === "loading" ? "…" : "Subscribe"}
              </button>
            </form>
            {newsletterState === "success" && (
              <p className="mt-2 text-xs font-medium text-[#00D4FF] sm:text-sm">
                You’re in — watch your inbox.
              </p>
            )}
            {newsletterState === "error" && (
              <p className="mt-2 text-xs font-medium text-[#FF2E9A] sm:text-sm">{errorMsg}</p>
            )}
          </div>
        </div>

        <div
          className="mt-8 flex flex-col items-center justify-between gap-2 border-t pt-6 text-[11px] sm:mt-10 sm:flex-row sm:gap-3 sm:pt-7 sm:text-xs md:text-sm"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-subtle)",
          }}
        >
          <p>© {new Date().getFullYear()} RUHGEN. All rights reserved.</p>
          <p className="text-center sm:text-right">Engineered for motion, stills, and imagination.</p>
        </div>
      </div>
    </footer>
  );
}
