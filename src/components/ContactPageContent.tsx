"use client";

import Link from "next/link";
import { 
  HelpCircle, 
  CreditCard, 
  MessageCircle
} from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { SITE_CONTAINER } from "@/lib/site-layout";

export function ContactPageContent() {
  return (
    <main className="relative flex-1 overflow-hidden pt-24 sm:pt-28" style={{ background: "var(--deep-black)" }}>
      {/* Background ambient radial gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div 
          className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-35" 
          style={{ background: "radial-gradient(circle, rgba(123,97,255,0.3), transparent 70%)" }} 
        />
        <div 
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20" 
          style={{ background: "radial-gradient(circle, rgba(0,212,255,0.25), transparent 70%)" }} 
        />
        <div className="absolute inset-0 app-grain" />
      </div>

      <div className={`relative ${SITE_CONTAINER} pb-24`}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center lg:gap-12 xl:gap-20">
          
          {/* Left Column: Visual Typography and Quick Nav */}
          <div className="flex flex-col justify-center">
            <header>
              <h1 className="font-display text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-tight" style={{ color: "var(--text-primary)" }}>
                Let&apos;s talk about <br />
                <span className="premium-text-shimmer font-black">what is next.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Whether you want to report a system bug, suggest a new engine feature, or discuss custom workspace licenses, our team reads every single message.
              </p>
            </header>

            {/* Quick-nav buttons */}
            <div className="mt-10 flex flex-col gap-3 max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Helpful Resources
              </p>
              {[
                { href: "/faq", label: "Help center", sub: "Browse self-service answers", Icon: HelpCircle },
                { href: "/pricing", label: "Plans & billing", sub: "Compare account pricing tiers", Icon: CreditCard },
                { href: "/demo", label: "Live sandbox", sub: "Generate images without setup", Icon: MessageCircle },
              ].map((x) => (
                <Link
                  key={x.href}
                  href={x.href}
                  className="premium-ring flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-500/20"
                  style={{ 
                    borderColor: "var(--border-subtle)", 
                    background: "var(--glass)", 
                    backdropFilter: "blur(20px)" 
                  }}
                >
                  <div 
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border" 
                    style={{ 
                      borderColor: "var(--border-subtle)", 
                      background: "rgba(123,97,255,0.08)" 
                    }}
                  >
                    <x.Icon className="h-4.5 w-4.5 text-[#7B61FF]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold tracking-tight text-white">
                      {x.label}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {x.sub}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="relative">
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  );
}
