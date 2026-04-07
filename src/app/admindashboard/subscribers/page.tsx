"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import type { NewsletterSubscriber } from "@/backend/newsletter/types";

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
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4" style={{ color: "var(--text-muted)" }}>
        <span
          className="loading-orbit h-10 w-10 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#7B61FF", borderTopColor: "transparent" }}
          aria-hidden
        />
        <p className="text-sm font-semibold tracking-wide">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-muted)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Sign in required</p>
          <p className="mt-2 text-sm">
            Go to{" "}
            <Link className="font-semibold text-[#00D4FF] hover:underline" href="/sign-in?next=/admindashboard/subscribers">
              sign in
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  if (!canUse) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-muted)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Access denied</p>
          <p className="mt-2 text-sm">
            Restricted to{" "}
            <span className="font-mono text-[#00D4FF]">{process.env.NEXT_PUBLIC_ADMIN_EMAIL}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-[960px]">
        <div className="flex flex-col gap-6 rounded-2xl border p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
              Admin · Audience
            </p>
            <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Newsletter subscribers
            </h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
              Persisted at{" "}
              <span className="font-mono text-[13px] text-[#00D4FF]">data/newsletter-subscribers.json</span> (gitignored).
              Load with your admin secret to export.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
              Admin secret
            </label>
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="ADMIN_SECRET"
              type="password"
              autoComplete="off"
              className="min-h-[44px] w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 lg:w-[320px]"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            />
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={load}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 text-sm font-semibold"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
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
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                Copy CSV
              </button>
            </div>
            {status && <p className="max-w-md text-xs lg:text-right" style={{ color: "var(--text-muted)" }}>{status}</p>}
          </div>
        </div>

        {rows && (
          <div className="mt-8 overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead style={{ background: "var(--deep-black)" }}>
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
