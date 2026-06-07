"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Coins, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BillingSkeleton } from "@/components/Skeletons";

export default function BillingPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/billing");
  }, [ready, user, router]);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("ruhgen_user_jwt_v1");
      if (!token) return;
      try {
        const res = await fetch("/api/credits/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.ok && data.history) {
          setHistory(data.history);
        }
      } catch (err) {
        console.error("Error fetching credit history", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    if (user) {
      void fetchHistory();
    }
  }, [user]);

  if (!ready) {
    return <BillingSkeleton />;
  }
  if (!user) return null;

  const credits = user.credits ?? 0;
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

      {/* Credit Transactions Ledger */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.15 }}
        className="rounded-3xl border p-6 sm:p-8"
        style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Coins className="h-5 w-5" style={{ color: "var(--primary-purple)" }} strokeWidth={1.75} />
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Transaction Ledger
          </h2>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <span className="text-sm text-[var(--text-subtle)]">Loading transaction history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl bg-black/10">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No transaction history found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[var(--text-subtle)] font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">New Balance</th>
                  <th className="pb-3 pr-4">Reason</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((item) => {
                  const isAdd = item.creditsAdded > 0;
                  const amtStr = isAdd ? `+${item.creditsAdded}` : `-${item.creditsDeducted}`;
                  const color = isAdd ? "text-emerald-400" : "text-rose-400";
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">
                        <span className="capitalize">{item.actionType.replace(/_/g, " ")}</span>
                      </td>
                      <td className={`py-3 pr-4 font-bold tabular-nums ${color}`}>
                        {amtStr}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[var(--text-muted)]">
                        {item.newBalance}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-muted)] max-w-xs truncate" title={item.reason}>
                        {item.reason}
                      </td>
                      <td className="py-3 text-[var(--text-subtle)] whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
