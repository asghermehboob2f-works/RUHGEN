"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Coins, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function BillingPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/billing");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }
  if (!user) return null;

  const credits = 120;

  const features = ["Priority queue", "HD exports", "Email support"];

  return (
    <div className="space-y-8">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
          Billing
        </p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
          Credits & plan
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
          Track how many generations you can run. Connect a real payments provider when you go live.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.06 }}
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: "transparent",
            background:
              "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, rgba(123,97,255,0.4), rgba(0,212,255,0.2)) border-box",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))" }}
            >
              <Coins className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                Balance
              </p>
              <p className="font-display mt-1 text-4xl font-extrabold tabular-nums sm:text-5xl" style={{ color: "var(--text-primary)" }}>
                {credits}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                credits available
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))",
                boxShadow: "0 10px 32px -8px rgba(123,97,255,0.5)",
              }}
            >
              View pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border px-5 text-sm font-semibold"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}
            >
              Back to overview
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.1 }}
          className="rounded-3xl border p-6 sm:p-8"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5" style={{ color: "var(--primary-cyan)" }} strokeWidth={1.75} />
            <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Current plan
            </h2>
          </div>
          <p className="mt-1 text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
            Creator
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Demo tier — swap for Stripe or your billing API later.
          </p>
          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary-cyan)_15%,transparent)]">
                  <Check className="h-3.5 w-3.5 text-[var(--primary-cyan)]" strokeWidth={2.5} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
