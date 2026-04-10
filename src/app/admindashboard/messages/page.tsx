"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Inbox, Mail, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import type { ContactMessage } from "@/backend/contact/types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ContactMessagesAdminPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<ContactMessage[] | null>(null);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const h = authHeaders();
    if (!h.Authorization) {
      setStatus("Sign in again at /admin/login.");
      return;
    }
    setStatus("");
    const res = await fetch("/api/admin/contact-messages", {
      headers: h,
    });
    const data = (await res.json()) as {
      ok?: boolean;
      messages?: ContactMessage[];
      error?: string;
    };
    if (!data.ok) {
      setRows(null);
      setStatus(data.error || "Failed to load messages.");
      return;
    }
    setRows(data.messages ?? []);
    setStatus(`Loaded ${data.messages?.length ?? 0} message(s). Newest first.`);
  }, [authHeaders]);

  useEffect(() => {
    if (!ready || !admin) return;
    void load();
  }, [ready, admin, load]);

  const exportJson = useMemo(() => {
    if (!rows?.length) return "";
    return JSON.stringify(rows, null, 2);
  }, [rows]);

  if (!ready) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4"
        style={{ color: "var(--text-muted)" }}
      >
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
        <div
          className="rounded-2xl border p-8 text-center"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--soft-black)",
            color: "var(--text-muted)",
          }}
        >
          <p className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Admin sign-in required
          </p>
          <p className="mt-2 text-sm">
            Go to{" "}
            <Link
              className="font-semibold text-[#00D4FF] hover:underline"
              href="/admin/login?next=/admindashboard/messages"
            >
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
      <div
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full opacity-20 blur-[100px]"
        style={{ background: "#7B61FF" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-20 h-64 w-64 rounded-full opacity-15 blur-[90px]"
        style={{ background: "#00D4FF" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1080px]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="premium-ring relative overflow-hidden rounded-[1.35rem] border p-6 sm:p-8 lg:flex lg:items-end lg:justify-between"
          style={{
            borderColor: "var(--border-subtle)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--soft-black) 92%, rgba(123,97,255,0.08)) 0%, var(--soft-black) 45%, color-mix(in srgb, var(--soft-black) 94%, rgba(0,212,255,0.06)) 100%)",
            boxShadow: "0 32px 90px -40px rgba(123,97,255,0.35)",
          }}
        >
          <div
            className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-25 blur-3xl"
            style={{ background: "#7B61FF" }}
            aria-hidden
          />
          <div className="relative max-w-xl">
            <p
              className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--text-subtle)" }}
            >
              <Inbox className="h-3.5 w-3.5" strokeWidth={2} />
              Admin · Inbox
            </p>
            <h1
              className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{ color: "var(--text-primary)" }}
            >
              Contact messages
            </h1>
            <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
              Submissions from your public contact page are stored in SQLite (
              <span className="font-mono text-[13px] text-[#00D4FF]">backend/data/ruhgen.sqlite</span>).
            </p>
          </div>

          <div className="relative mt-8 flex w-full flex-col gap-3 lg:mt-0 lg:w-auto lg:items-end">
            <p className="text-xs lg:text-right" style={{ color: "var(--text-muted)" }}>
              Signed in as <span className="font-mono text-[#00D4FF]">{admin.email}</span>
            </p>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors hover:border-[#7B61FF]/40"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--deep-black)",
                  color: "var(--text-primary)",
                }}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-colors hover:border-[#7B61FF]/40"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--deep-black)",
                  color: "var(--text-primary)",
                }}
              >
                Refresh
              </button>
              <button
                type="button"
                disabled={!exportJson}
                onClick={() => {
                  if (!exportJson) return;
                  void navigator.clipboard.writeText(exportJson);
                  setStatus("JSON copied to clipboard.");
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold disabled:opacity-45"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--deep-black)",
                  color: "var(--text-primary)",
                }}
              >
                Copy JSON
              </button>
            </div>
            {status && (
              <p className="max-w-md text-xs lg:text-right" style={{ color: "var(--text-muted)" }}>
                {status}
              </p>
            )}
          </div>
        </motion.div>

        {rows && (
          <div className="mt-10">
            {rows.length === 0 ? (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
              >
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                >
                  <MessageSquare className="h-7 w-7" strokeWidth={1.75} style={{ color: "var(--text-muted)" }} />
                </div>
                <p className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  Inbox is empty
                </p>
                <p className="mt-2 max-w-sm px-4 text-sm" style={{ color: "var(--text-muted)" }}>
                  When visitors submit the form on{" "}
                  <Link href="/contact" className="font-semibold text-[#00D4FF] hover:underline">
                    /contact
                  </Link>
                  , messages will appear here.
                </p>
              </motion.div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {rows.map((m, i) => (
                  <motion.li
                    key={m.id}
                    initial={reduce ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduce ? 0 : 0.04 * Math.min(i, 12), duration: 0.35 }}
                    className="premium-ring group relative flex flex-col overflow-hidden rounded-2xl border p-5 sm:p-6"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background:
                        "linear-gradient(165deg, color-mix(in srgb, var(--glass) 88%, transparent) 0%, var(--soft-black) 100%)",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    <div
                      className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-15 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
                      style={{
                        background: "linear-gradient(135deg, #7B61FF, #00D4FF)",
                      }}
                      aria-hidden
                    />
                    <div className="relative flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold text-white"
                        style={{
                          borderColor: "rgba(255,255,255,0.12)",
                          background: "linear-gradient(145deg, #7B61FF 0%, #00D4FF 100%)",
                          boxShadow: "0 12px 32px -14px rgba(123,97,255,0.7)",
                        }}
                      >
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2
                          className="font-display text-lg font-bold leading-tight sm:text-xl"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {m.name}
                        </h2>
                        <p className="mt-1 text-xs font-medium sm:text-sm" style={{ color: "var(--text-subtle)" }}>
                          {formatWhen(m.submittedAt)}
                        </p>
                        <a
                          href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: Your message to RUHGEN")}`}
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#00D4FF] transition-opacity hover:opacity-80"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate font-mono text-[13px]">{m.email}</span>
                        </a>
                      </div>
                      <Sparkles
                        className="mt-0.5 h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-70"
                        style={{ color: "#7B61FF" }}
                        aria-hidden
                      />
                    </div>
                    <div
                      className="relative mt-5 rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "color-mix(in srgb, var(--deep-black) 85%, transparent)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
