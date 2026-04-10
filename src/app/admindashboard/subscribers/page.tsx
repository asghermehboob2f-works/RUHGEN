"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import type { NewsletterSubscriber } from "@/backend/newsletter/types";

export default function SubscribersAdminPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const [rows, setRows] = useState<NewsletterSubscriber[] | null>(null);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const h = authHeaders();
    if (!h.Authorization) {
      setStatus("Sign in again at /admin/login.");
      return;
    }
    setStatus("");
    const res = await fetch("/api/admin/newsletter", { headers: h });
    const data = (await res.json()) as { ok?: boolean; subscribers?: NewsletterSubscriber[]; error?: string };
    if (!data.ok) {
      setRows(null);
      setStatus(data.error || "Failed to load.");
      return;
    }
    setRows(data.subscribers ?? []);
    setStatus(`Loaded ${data.subscribers?.length ?? 0} subscriber(s).`);
  }, [authHeaders]);

  useEffect(() => {
    if (!ready || !admin) return;
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [ready, admin, load]);

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

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-muted)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Admin sign-in required</p>
          <p className="mt-2 text-sm">
            Go to{" "}
            <Link className="font-semibold text-[#00D4FF] hover:underline" href="/admin/login?next=/admindashboard/subscribers">
              admin login
            </Link>
            .
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
              Stored in the SQLite database (<span className="font-mono text-[13px] text-[#00D4FF]">backend/data/ruhgen.sqlite</span>).
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
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
                onClick={() => void load()}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 text-sm font-semibold"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                Refresh
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
