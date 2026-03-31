"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";

const product = [
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
  const [newsletterState, setNewsletterState] = useState<
    "idle" | "success" | "error"
  >("idle");

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setNewsletterState("error");
      return;
    }
    setNewsletterState("success");
    setEmail("");
    window.setTimeout(() => setNewsletterState("idle"), 4500);
  };

  return (
    <footer
      className="border-t"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--rich-black)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 sm:py-16 lg:px-10">
        <div className="grid gap-12 sm:gap-14 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col items-center text-center lg:col-span-2 lg:items-start lg:text-left">
            <BrandLogo size="lg" showWordmark href="/" className="justify-center lg:justify-start" />
            <p
              className="mt-4 max-w-md text-sm leading-relaxed sm:text-[15px]"
              style={{ color: "var(--text-muted)" }}
            >
              Where imagination becomes reality — instantly. Your creative engine
              for next-generation visuals.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all hover:border-[#7B61FF]/45 hover:text-[#7B61FF]"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-muted)",
                  background: "var(--glass)",
                }}
                aria-label="X (Twitter)"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all hover:border-[#7B61FF]/45 hover:text-[#7B61FF]"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-muted)",
                  background: "var(--glass)",
                }}
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all hover:border-[#7B61FF]/45 hover:text-[#7B61FF]"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-muted)",
                  background: "var(--glass)",
                }}
                aria-label="YouTube"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <p
              className="text-xs font-bold uppercase tracking-[0.15em]"
              style={{ color: "var(--text-primary)" }}
            >
              Product
            </p>
            <ul className="mt-4 space-y-3 text-sm">
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

          <div className="text-center sm:text-left">
            <p
              className="text-xs font-bold uppercase tracking-[0.15em]"
              style={{ color: "var(--text-primary)" }}
            >
              Company
            </p>
            <ul className="mt-4 space-y-3 text-sm">
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

          <div className="text-center sm:text-left">
            <p
              className="text-xs font-bold uppercase tracking-[0.15em]"
              style={{ color: "var(--text-primary)" }}
            >
              Legal
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {legal.map((l) => (
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
            <div className="mt-10">
              <p
                className="text-xs font-bold uppercase tracking-[0.15em]"
                style={{ color: "var(--text-primary)" }}
              >
                Stay updated
              </p>
              <form className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row" onSubmit={onSubscribe}>
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
                  className="min-h-[44px] min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="submit"
                  className="min-h-[44px] shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white btn-gradient"
                >
                  Subscribe
                </button>
              </form>
              {newsletterState === "success" && (
                <p className="mt-2 text-sm font-medium text-[#00D4FF]">
                  You’re in — watch your inbox.
                </p>
              )}
              {newsletterState === "error" && (
                <p className="mt-2 text-sm font-medium text-[#FF2E9A]">
                  Please enter a valid email.
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm sm:flex-row sm:mt-14"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-subtle)",
          }}
        >
          <p>© {new Date().getFullYear()} RUHGEN. All rights reserved.</p>
          <p className="text-center text-xs sm:text-sm">
            Engineered for motion, stills, and imagination.
          </p>
        </div>
      </div>
    </footer>
  );
}
