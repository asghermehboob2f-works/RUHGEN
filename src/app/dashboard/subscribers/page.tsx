"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import type { NewsletterSubscriber } from "@/lib/newsletter-types";

function adminEmailAllowed(userEmail: string | null) {
  const allow = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
  if (!allow) return true;
  return !!userEmail && userEmail.trim().toLowerCase() === allow;
}

export default function SubscribersAdminPage() {
  const { user, ready } = useAuth();
  const [secret, setSecret] = useState("");
  const [rows, setRows] = useState<NewsletterSubscriber[] | null>(null);
  const [status, setStatus] = useState("");
  const canUse = useMemo(() => adminEmailAllowed(user?.email ?? null), [user?.email]);

  const load = async () => {
    if (!secret.trim()) {
      setStatus("Enter Admin secret (same as ADMIN_SECRET in .env.local).");
      return;
    }
    setStatus("");
    const res = await fetch("/api/admin/newsletter", {
      headers: {
        "x-admin-secret": secret.trim(),
        Authorization: `Bearer ${secret.trim()}`,
      },
    });
    const data = (await res.json()) as { ok?: boolean; subscribers?: NewsletterSubscriber[]; error?: string };
    if (!data.ok) {
      setRows(null);
      setStatus(data.error || "Failed to load.");
      return;
    }
    setRows(data.subscribers ?? []);
    setStatus(`Loaded ${data.subscribers?.length ?? 0} subscriber(s).`);
  };

  const csv = useMemo(() => {
    if (!rows?.length) return "";
    const header = "email,subscribedAt,source";
    const body = rows.map((r) => `${r.email},${r.subscribedAt},${r.source}`).join("\n");
    return `${header}\n${body}`;
  }, [rows]);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20" style={{ color: "var(--text-muted)" }}>
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Sign in required</p>
        <p className="mt-2">
          Go to{" "}
          <Link className="text-[#00D4FF] hover:underline" href="/sign-in?next=/dashboard/subscribers">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!canUse) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20" style={{ color: "var(--text-muted)" }}>
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Access denied</p>
        <p className="mt-2">
          Restricted to <span className="font-mono text-[#00D4FF]">{process.env.NEXT_PUBLIC_ADMIN_EMAIL}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="mesh-section relative flex-1 overflow-x-clip px-4 pb-24 pt-[max(5.5rem,env(safe-area-inset-top)+4.5rem)] sm:px-6 sm:pt-28 lg:px-10">
      <div className="relative mx-auto max-w-[960px]">
        <div className="flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>Admin</p>
            <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Newsletter subscribers
            </h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
              Stored in <span className="font-mono text-[13px] text-[#00D4FF]">data/newsletter-subscribers.json</span> (gitignored).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
              Admin secret
            </label>
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="ADMIN_SECRET"
              className="min-h-[44px] w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 sm:w-[320px]"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            />
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}
              >
                Back
              </Link>
              <button
                type="button"
                onClick={load}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-semibold text-white btn-gradient"
              >
                Load list
              </button>
              <button
                type="button"
                disabled={!csv}
                onClick={() => {
                  if (!csv) return;
                  void navigator.clipboard.writeText(csv);
                  setStatus("CSV copied to clipboard.");
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold disabled:opacity-50"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}
              >
                Copy CSV
              </button>
            </div>
            {status && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{status}</p>}
          </div>
        </div>

        {rows && (
          <div className="mt-8 overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <th className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>Email</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>Subscribed</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center" style={{ color: "var(--text-muted)" }}>
                      No subscribers yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={`${r.email}-${r.subscribedAt}`} className="border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                      <td className="px-4 py-2.5 font-mono text-[13px]" style={{ color: "var(--text-muted)" }}>{r.email}</td>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-muted)" }}>{r.subscribedAt}</td>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-muted)" }}>{r.source}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
