"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { 
  Inbox, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  CornerUpLeft, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  submittedAt: string;
};

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
  
  // Custom Admin States
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [resolvedIds, setResolvedIds] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");

  // Load Resolved Statuses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ruhgen_resolved_messages");
    if (saved) {
      try {
        setResolvedIds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse resolved messages", e);
      }
    }
  }, []);

  const toggleResolved = (id: string) => {
    const updated = { ...resolvedIds, [id]: !resolvedIds[id] };
    setResolvedIds(updated);
    localStorage.setItem("ruhgen_resolved_messages", JSON.stringify(updated));
    setStatus(updated[id] ? "Message marked as resolved." : "Message marked as pending.");
  };

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
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [ready, admin, load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this message from the database?")) {
      return;
    }
    
    const h = authHeaders();
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "DELETE",
        headers: h,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || "Failed to delete message.");
        return;
      }
      setRows(prev => prev ? prev.filter(r => r.id !== id) : null);
      setStatus("Message permanently deleted.");
      if (activeReplyId === id) setActiveReplyId(null);
    } catch {
      alert("Network error. Could not delete message.");
    }
  };

  const startDraft = (id: string, name: string) => {
    if (activeReplyId === id) {
      setActiveReplyId(null);
    } else {
      setActiveReplyId(id);
      if (!replyDrafts[id]) {
        const defaultDraft = `Dear ${name},\n\nThank you for contacting RUHGEN. \n\n[Write your message here]\n\nBest regards,\nRUHGEN Admin`;
        setReplyDrafts(prev => ({ ...prev, [id]: defaultDraft }));
      }
    }
  };

  const handleLaunchEmailClient = (m: ContactMessage) => {
    const draftText = replyDrafts[m.id] || "";
    const subject = `Re: Your RUHGEN Inquiry`;
    
    // Professionally quote original inquiry details
    const body = `${draftText}\n\n---\nOriginal Message:\nFrom: ${m.name} (${m.email})\nDate: ${formatWhen(m.submittedAt)}\n\n${m.message}`;
    
    const mailtoUri = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUri;
    
    // Auto mark resolved on launch as it's been handled
    if (!resolvedIds[m.id]) {
      toggleResolved(m.id);
    }
  };

  const filteredRows = useMemo(() => {
    if (!rows) return null;
    return rows.filter(row => {
      const isResolved = !!resolvedIds[row.id];
      if (filter === "pending") return !isResolved;
      if (filter === "resolved") return isResolved;
      return true;
    });
  }, [rows, filter, resolvedIds]);

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
      {/* Ambient backgrounds */}
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
        {/* Header Hero banner */}
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
              <p className="max-w-md text-xs lg:text-right font-medium text-[#00D4FF]" style={{ color: "var(--text-muted)" }}>
                {status}
              </p>
            )}
          </div>
        </motion.div>

        {rows && (
          <div className="mt-10">
            {/* Filter Tabs */}
            <div className="flex border-b mb-6 gap-6 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
              {[
                { id: "all", label: "All Messages", count: rows.length },
                { id: "pending", label: "Pending", count: rows.filter(r => !resolvedIds[r.id]).length },
                { id: "resolved", label: "Resolved", count: rows.filter(r => !!resolvedIds[r.id]).length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`pb-3 font-semibold relative transition-colors ${filter === tab.id ? "text-white" : "text-neutral-400 hover:text-white"}`}
                >
                  {tab.label} ({tab.count})
                  {filter === tab.id && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 inset-x-0 h-0.5 bg-[#7B61FF]" 
                    />
                  )}
                </button>
              ))}
            </div>

            {filteredRows && filteredRows.length === 0 ? (
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
                  No messages found
                </p>
                <p className="mt-2 max-w-sm px-4 text-sm" style={{ color: "var(--text-muted)" }}>
                  There are no messages matching the select filter.
                </p>
              </motion.div>
            ) : (
              <ul className="grid gap-6">
                {filteredRows?.map((m, i) => {
                  const isResolved = !!resolvedIds[m.id];
                  const isReplying = activeReplyId === m.id;

                  return (
                    <motion.li
                      key={m.id}
                      initial={reduce ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduce ? 0 : 0.04 * Math.min(i, 12), duration: 0.35 }}
                      className="premium-ring group relative flex flex-col overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300"
                      style={{
                        borderColor: isResolved ? "var(--border-subtle)" : "color-mix(in srgb, var(--border-subtle) 70%, rgba(123,97,255,0.2))",
                        background: isResolved 
                          ? "rgba(255, 255, 255, 0.01)" 
                          : "linear-gradient(165deg, rgba(255, 255, 255, 0.02) 0%, var(--soft-black) 100%)",
                        opacity: isResolved ? 0.65 : 1,
                      }}
                    >
                      <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold text-white"
                            style={{
                              borderColor: "rgba(255,255,255,0.12)",
                              background: isResolved
                                ? "linear-gradient(145deg, #4b5563, #374151)"
                                : "linear-gradient(145deg, #7B61FF 0%, #00D4FF 100%)",
                              boxShadow: isResolved ? "none" : "0 8px 24px -10px rgba(123,97,255,0.5)",
                            }}
                          >
                            {initials(m.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h2
                                className="font-display text-lg font-bold leading-tight sm:text-xl text-[var(--text-primary)]"
                              >
                                {m.name}
                              </h2>
                              {isResolved ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Resolved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                                  <Circle className="h-2 w-2 fill-current" />
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-[var(--text-subtle)]">
                              {formatWhen(m.submittedAt)}
                            </p>
                            <a
                              href={`mailto:${m.email}`}
                              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D4FF] hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate font-mono">{m.email}</span>
                            </a>
                          </div>
                        </div>

                        {/* Controls Header */}
                        <div className="flex flex-wrap gap-2 sm:self-start">
                          <button
                            onClick={() => startDraft(m.id, m.name)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-all hover:bg-white/5 text-[var(--text-primary)] border-[var(--border-subtle)]"
                          >
                            <CornerUpLeft className="h-3.5 w-3.5" />
                            {isReplying ? "Close Draft" : "Reply"}
                          </button>
                          <button
                            onClick={() => toggleResolved(m.id)}
                            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-all border-[var(--border-subtle)] ${
                              isResolved 
                                ? "text-neutral-400 hover:text-white" 
                                : "text-emerald-400 hover:bg-emerald-500/5 hover:border-emerald-500/35"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isResolved ? "Mark Pending" : "Mark Resolved"}
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-neutral-400 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/35 transition-all"
                            title="Delete Message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Message Content */}
                      <div
                        className="relative mt-5 rounded-xl border px-4 py-3.5 text-sm leading-relaxed"
                        style={{
                          borderColor: "var(--border-subtle)",
                          background: "rgba(0,0,0,0.15)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      </div>

                      {/* Reply Composer Block */}
                      <AnimatePresence>
                        {isReplying && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden mt-4 pt-4 border-t"
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            <div className="flex flex-col gap-3.5">
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                  Draft Email Response
                                </label>
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                  Compose your email below. When satisfied, click &quot;Open in Mail Client&quot; to transfer the content.
                                </p>
                              </div>

                              <textarea
                                value={replyDrafts[m.id] || ""}
                                onChange={(e) => setReplyDrafts(prev => ({ ...prev, [m.id]: e.target.value }))}
                                rows={6}
                                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 text-[var(--text-primary)] placeholder:text-neutral-500 focus:ring-2 focus:ring-[#7B61FF]/20 focus:border-[#7B61FF]/50 bg-black/30 border-[var(--border-subtle)]"
                              />

                              <div className="flex items-center justify-between gap-4 flex-wrap">
                                <p className="text-[11px] text-neutral-500">
                                  Recipients: <span className="font-mono text-neutral-400">{m.email}</span>
                                </p>
                                <button
                                  onClick={() => handleLaunchEmailClient(m)}
                                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white btn-gradient"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Open in Mail Client to Send
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
