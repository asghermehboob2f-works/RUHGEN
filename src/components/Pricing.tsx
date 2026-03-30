"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    description: "Try the magic",
    features: [
      "10 generations / month",
      "Standard quality",
      "2K resolution",
      "Community support",
    ],
    cta: "Start free",
    popular: false,
  },
  {
    name: "Pro",
    monthly: 29,
    yearly: 290,
    description: "For serious creators",
    features: [
      "500 generations / month",
      "Premium quality",
      "4K resolution",
      "Priority rendering",
      "Email support",
      "Commercial license",
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Studio",
    monthly: 99,
    yearly: 990,
    description: "Teams at scale",
    features: [
      "Unlimited generations",
      "Ultra quality",
      "8K resolution",
      "Instant rendering",
      "Dedicated support",
      "API access",
      "Team collaboration",
      "Custom models",
    ],
    cta: "Get Studio",
    popular: false,
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="mesh-section-muted scroll-mt-24 py-12 md:py-24">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <div className="mb-10 text-center sm:mb-12">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            Pricing
          </p>
          <h2
            className="font-display text-[clamp(1.55rem,3.8vw,3rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Choose your plan
          </h2>
          <p
            className="mx-auto mt-2 max-w-lg text-sm sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Flexible pricing for every creator
          </p>
        </div>

        <div className="mb-10 flex justify-center sm:mb-12">
          <div
            className="inline-flex min-h-12 rounded-full border p-1"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--glass)",
            }}
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`min-h-10 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                !yearly ? "text-white" : ""
              }`}
              style={
                !yearly
                  ? {
                      background:
                        "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                    }
                  : { color: "var(--text-muted)" }
              }
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`min-h-10 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                yearly ? "text-white" : ""
              }`}
              style={
                yearly
                  ? {
                      background:
                        "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                    }
                  : { color: "var(--text-muted)" }
              }
            >
              Yearly
              <span className="ml-2 rounded-md bg-[#FF2E9A]/20 px-1.5 py-0.5 text-xs text-[#FF2E9A]">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan) => {
            const price = yearly ? plan.yearly : plan.monthly;
            const suffix = plan.monthly === 0 ? "" : yearly ? "/yr" : "/mo";

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(123,97,255,0.25)] sm:p-8 md:p-10 ${
                  plan.popular
                    ? "border-transparent ring-2 ring-[#7B61FF]/50 lg:scale-[1.02]"
                    : ""
                }`}
                style={{
                  borderColor: plan.popular ? "transparent" : "var(--border-subtle)",
                  background: "var(--glass)",
                  backdropFilter: "blur(20px)",
                  ...(plan.popular
                    ? {
                        boxShadow: "0 0 60px -10px rgba(123, 97, 255, 0.35)",
                        background:
                          "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, #7B61FF, #00D4FF) border-box",
                        border: "2px solid transparent",
                      }
                    : {}),
                }}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#00D4FF] px-4 py-1 text-xs font-bold text-white shadow-lg">
                    Most popular
                  </span>
                )}
                <h3
                  className="text-xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span
                    className="text-4xl font-black md:text-5xl"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {price === 0 ? "$0" : `$${price}`}
                  </span>
                  {plan.monthly !== 0 && (
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {suffix}
                    </span>
                  )}
                </div>
                <ul className="mt-8 flex flex-col gap-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm">
                      <Check
                        className="h-5 w-5 shrink-0 text-[#7B61FF]"
                        strokeWidth={2.5}
                      />
                      <span style={{ color: "var(--text-muted)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`mt-10 block w-full rounded-xl py-3.5 text-center text-sm font-bold transition-transform hover:scale-[1.02] ${
                    plan.popular
                      ? "text-white btn-gradient"
                      : "border font-semibold"
                  }`}
                  style={
                    !plan.popular
                      ? {
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                          background: "var(--glass)",
                        }
                      : undefined
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
