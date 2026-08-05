"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

const STATUS_COLOR: Record<string, string> = {
  open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/25",
  resolved: "text-[var(--text-subtle)] bg-white/5 border-white/10",
  closed: "text-rose-400/70 bg-rose-400/5 border-rose-400/15",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const CATEGORIES_MAP: Record<string, string> = {
  billing: "Billing & Payments",
  credits: "Credits & Balance",
  technical: "Technical Issue",
  generation: "Generation Problem",
  account: "Account & Access",
  other: "Other",
};

export default function AdminSupportPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();

  const [tickets, setTickets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  // Detail
  const [view, setView] = useState<"list" | "detail">("list");
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    const h = authHeaders();
    if (!h.Authorization) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/support/tickets?${params}`, { headers: h, cache: "no-store" });
      const data = await res.json();
      if (data.ok) { setTickets(data.tickets || []); setTotal(data.total || 0); setSummary(data.summary); }
    } catch {}
    finally { setLoading(false); }
  }, [authHeaders, statusFilter, search]);

  useEffect(() => { if (ready && admin) load(); }, [ready, admin, load]);

  const loadDetail = async (id: string) => {
    const h = authHeaders();
    setLoadingDetail(true);
    setView("detail");
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, { headers: h, cache: "no-store" });
      const data = await res.json();
      if (data.ok) { setActiveTicket(data.ticket); setReplies(data.replies || []); }
    } catch {}
    finally { setLoadingDetail(false); }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    const h = authHeaders();
    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${activeTicket.id}/reply`, {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const data = await res.json();
      if (data.ok) { setReplyText(""); await loadDetail(activeTicket.id); load(); }
    } catch {}
    finally { setSendingReply(false); }
  };

  const handleStatusChange = async (status: string) => {
    if (!activeTicket) return;
    const h = authHeaders();
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${activeTicket.id}`, {
        method: "PATCH",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) { setActiveTicket((prev: any) => ({ ...prev, status })); load(); }
    } catch {}
    finally { setUpdatingStatus(false); }
  };

  if (!ready) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
    </div>
  );

  if (!admin) return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <Link href="/admin/login" className="font-semibold text-[#00D4FF] hover:underline">Admin login required</Link>
    </div>
  );

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === "detail") {
    return (
      <div className="px-4 pb-20 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[900px] space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setView("list"); setActiveTicket(null); setReplies([]); }} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {activeTicket && (
              <select
                value={activeTicket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="rounded-xl border px-3 py-2 text-xs font-bold outline-none"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            )}
          </div>

          {loadingDetail ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" /></div>
          ) : activeTicket ? (
            <>
              <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLOR[activeTicket.status] || ""}`}>
                    {STATUS_LABEL[activeTicket.status] || activeTicket.status}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-subtle)" }}>#{activeTicket.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-xs" style={{ color: "var(--text-subtle)" }}>{CATEGORIES_MAP[activeTicket.category] || activeTicket.category}</span>
                </div>
                <h1 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>{activeTicket.subject}</h1>
                <div className="mt-3 flex gap-4 text-xs" style={{ color: "var(--text-subtle)" }}>
                  <span>From: <span className="font-semibold text-[var(--text-primary)]">{activeTicket.user_name}</span></span>
                  <span>{activeTicket.user_email}</span>
                  {activeTicket.user_credits !== undefined && (
                    <span>Credits: <span className="font-semibold text-[#00D4FF]">{activeTicket.user_credits}</span></span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{activeTicket.message}</p>
                <p className="mt-3 text-xs" style={{ color: "var(--text-subtle)" }}>{new Date(activeTicket.created_at).toLocaleString()}</p>
              </div>

              <div className="space-y-3">
                {replies.map((r) => (
                  <div key={r.id} className={`rounded-xl border p-4 ${r.is_admin ? "" : "ml-6 sm:ml-12"}`} style={{
                    borderColor: r.is_admin ? "color-mix(in srgb, #7B61FF 30%, transparent)" : "var(--border-subtle)",
                    background: r.is_admin ? "color-mix(in srgb, #7B61FF 8%, var(--soft-black))" : "var(--deep-black)",
                  }}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: r.is_admin ? "#7B61FF" : "#444", color: "white" }}>
                        {r.is_admin ? "A" : (activeTicket.user_name?.[0] || "U").toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: r.is_admin ? "#A08AFF" : "var(--text-primary)" }}>
                        {r.is_admin ? r.author_name || "Support Team" : activeTicket.user_name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-subtle)" }}>· {new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{r.message}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="rounded-2xl border p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Reply to User</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Write your reply…"
                  className="w-full resize-y rounded-xl border bg-[var(--deep-black)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                />
                <div className="mt-3 flex justify-end">
                  <button type="submit" disabled={sendingReply || !replyText.trim()} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)" }}>
                    {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Reply
                  </button>
                </div>
              </form>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Ticket not found.</p>
          )}
        </div>
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1100px] space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>Admin · Support</p>
            <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Support Tickets
            </h1>
            {summary && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-emerald-500/35 px-3 py-1 text-emerald-200/90">Open: {summary.open_count}</span>
                <span className="rounded-full border border-blue-500/35 px-3 py-1 text-blue-200/90">In Progress: {summary.in_progress_count}</span>
                <span className="rounded-full border px-3 py-1" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>Total: {summary.total}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/admindashboard" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <button onClick={load} disabled={loading} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or subject…"
            className="min-h-[40px] flex-1 min-w-[200px] rounded-xl border px-4 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[40px] rounded-xl border px-3 text-sm outline-none"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Tickets table */}
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          {loading && tickets.length === 0 ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" /></div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>No tickets found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}>
                    <th className="px-5 py-3 font-bold">Ticket</th>
                    <th className="px-4 py-3 font-bold">User</th>
                    <th className="px-4 py-3 font-bold">Category</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Replies</th>
                    <th className="px-5 py-3 font-bold">Updated</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-white/[0.02] cursor-pointer" style={{ borderColor: "var(--border-subtle)" }} onClick={() => loadDetail(t.id)}>
                      <td className="px-5 py-3">
                        <p className="font-semibold truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>{t.subject}</p>
                        <p className="font-mono text-[10px]" style={{ color: "var(--text-subtle)" }}>#{t.id.slice(0, 8).toUpperCase()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{t.user_name || "—"}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {CATEGORIES_MAP[t.category] || t.category}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLOR[t.status] || ""}`}>
                          {STATUS_LABEL[t.status] || t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                          <MessageSquare className="h-3 w-3" /> {t.reply_count}
                          {t.unread_count > 0 && <span className="ml-1 rounded-full bg-[#7B61FF] px-1.5 text-[9px] font-bold text-white">{t.unread_count}</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--text-subtle)" }}>
                        {new Date(t.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4" style={{ color: "var(--text-subtle)" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
