"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  HelpCircle,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  User,
  Zap,
  Tag,
  ExternalLink,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

const STATUS_COLOR: Record<string, string> = {
  open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/25",
  resolved: "text-purple-400 bg-purple-400/10 border-purple-400/25",
  closed: "text-[var(--text-subtle)] bg-white/5 border-white/10",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  high: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  medium: "text-cyan-400 bg-cyan-400/10 border-cyan-400/25",
  low: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const CATEGORIES_MAP: Record<string, string> = {
  billing: "Billing & Payments",
  credits: "Credits & Balance",
  technical: "Technical Issue",
  generation: "Generation Problem",
  account: "Account & Access",
  other: "Other",
};

const QUICK_REPLIES = [
  "Thank you for contacting RUHGEN support. We are looking into this issue and will update you shortly.",
  "Your account balance/credits have been updated. Please refresh your dashboard.",
  "Could you please provide additional details or a screenshot to help us diagnose this issue?",
  "This issue has been resolved. Please let us know if you need any further assistance!",
];

export default function AdminSupportPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();

  const [tickets, setTickets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail view state
  const [view, setView] = useState<"list" | "detail">("list");
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Response & Note states
  const [activeTab, setActiveTab] = useState<"thread" | "notes">("thread");
  const [replyText, setReplyText] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadTickets = useCallback(async () => {
    const h = authHeaders();
    if (!h.Authorization) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (search) params.set("search", search.trim());

      const res = await fetch(`/api/admin/support/tickets?${params}`, { headers: h, cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setTickets(data.tickets || []);
        setTotal(data.total || 0);
        setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, page, statusFilter, priorityFilter, categoryFilter, search]);

  useEffect(() => {
    if (ready && admin) loadTickets();
  }, [ready, admin, loadTickets]);

  const loadDetail = async (id: string) => {
    const h = authHeaders();
    setLoadingDetail(true);
    setView("detail");
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, { headers: h, cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setActiveTicket(data.ticket);
        setReplies(data.replies || []);
        setAttachments(data.attachments || []);
        setInternalNotes(data.ticket?.internal_notes || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
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
      if (data.ok) {
        setReplyText("");
        showToast("Reply sent to user!");
        await loadDetail(activeTicket.id);
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateTicket = async (updates: { status?: string; priority?: string; category?: string; internal_notes?: string }) => {
    if (!activeTicket) return;
    const h = authHeaders();
    setUpdatingTicket(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${activeTicket.id}`, {
        method: "PATCH",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.ok) {
        setActiveTicket((prev: any) => ({ ...prev, ...data.ticket }));
        showToast("Ticket updated successfully.");
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handleSaveInternalNotes = async () => {
    if (!activeTicket) return;
    setSavingNotes(true);
    await handleUpdateTicket({ internal_notes: internalNotes });
    setSavingNotes(false);
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this support ticket?")) return;
    const h = authHeaders();
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, { method: "DELETE", headers: h });
      const data = await res.json();
      if (data.ok) {
        showToast("Ticket deleted.");
        if (view === "detail") {
          setView("list");
          setActiveTicket(null);
        }
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInlineStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, ticketId: string, status: string) => {
    e.stopPropagation();
    const h = authHeaders();
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
        showToast("Status updated.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-sm text-[var(--text-muted)]">Admin access required.</p>
        <Link href="/admin/login" className="mt-2 inline-block font-semibold text-[#00D4FF] hover:underline">
          Go to Admin Login
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 shadow-2xl backdrop-blur-md"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {view === "detail" ? (
        /* ── DETAIL WORKSPACE VIEW ────────────────────────────────────────── */
        <div className="mx-auto max-w-[1100px] space-y-6">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setView("list");
                  setActiveTicket(null);
                  setReplies([]);
                  setAttachments([]);
                }}
                className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Tickets
              </button>
              {activeTicket && (
                <span className="font-mono text-xs font-bold text-[#00D4FF]">
                  #{activeTicket.id.slice(0, 8).toUpperCase()}
                </span>
              )}
            </div>

            {activeTicket && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Switcher */}
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span style={{ color: "var(--text-subtle)" }}>Status:</span>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleUpdateTicket({ status: e.target.value })}
                    disabled={updatingTicket}
                    className="rounded-xl border px-3 py-1.5 text-xs font-bold outline-none cursor-pointer"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                  >
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Switcher */}
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span style={{ color: "var(--text-subtle)" }}>Priority:</span>
                  <select
                    value={activeTicket.priority || "medium"}
                    onChange={(e) => handleUpdateTicket({ priority: e.target.value })}
                    disabled={updatingTicket}
                    className="rounded-xl border px-3 py-1.5 text-xs font-bold outline-none cursor-pointer"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                  >
                    {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Delete Ticket */}
                <button
                  onClick={() => handleDeleteTicket(activeTicket.id)}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 transition-colors hover:bg-rose-500/20"
                  title="Delete Ticket"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {loadingDetail ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
            </div>
          ) : activeTicket ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Ticket Content & Messages (Left 2 cols) */}
              <div className="space-y-6 lg:col-span-2">
                {/* Main Ticket Box */}
                <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[activeTicket.status] || ""}`}>
                        {STATUS_LABEL[activeTicket.status] || activeTicket.status}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PRIORITY_COLOR[activeTicket.priority || "medium"]}`}>
                        {PRIORITY_LABEL[activeTicket.priority || "medium"]} Priority
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                        {CATEGORIES_MAP[activeTicket.category] || activeTicket.category}
                      </span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: "var(--text-subtle)" }}>
                      {new Date(activeTicket.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h1 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {activeTicket.subject}
                  </h1>

                  <div className="rounded-xl border p-4 text-sm leading-relaxed" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-muted)" }}>
                    {activeTicket.message}
                  </div>

                  {/* Ticket Attachments if any */}
                  {attachments.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5" /> Attachments ({attachments.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((att) => (
                          <a
                            key={att.id}
                            href={`/api/admin/support/attachments/${att.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:border-[#7B61FF]/50 hover:bg-[#7B61FF]/5"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                          >
                            <FileText className="h-3.5 w-3.5 text-[#00D4FF]" />
                            <span className="truncate max-w-[180px]">{att.original_name || att.filename}</span>
                            <span className="text-[10px] text-[var(--text-subtle)]">({Math.round((att.size || 0) / 1024)} KB)</span>
                            <Download className="h-3.5 w-3.5 text-[var(--text-subtle)]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs: Thread vs Internal Notes */}
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  <div className="flex border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <button
                      onClick={() => setActiveTab("thread")}
                      className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
                        activeTab === "thread" ? "border-[#7B61FF] text-[#00D4FF] bg-white/[0.02]" : "border-transparent text-[var(--text-subtle)] hover:text-white"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" /> Discussion Thread ({replies.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("notes")}
                      className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
                        activeTab === "notes" ? "border-amber-400 text-amber-300 bg-amber-400/5" : "border-transparent text-[var(--text-subtle)] hover:text-white"
                      }`}
                    >
                      <StickyNote className="h-4 w-4" /> Internal Notes (Staff Only)
                    </button>
                  </div>

                  <div className="p-5">
                    {activeTab === "thread" ? (
                      /* Thread Tab */
                      <div className="space-y-6">
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                          {replies.length === 0 ? (
                            <p className="text-center py-6 text-xs text-[var(--text-subtle)]">No replies yet. Send a response below.</p>
                          ) : (
                            replies.map((r) => (
                              <div
                                key={r.id}
                                className={`rounded-xl border p-4 space-y-2 ${r.is_admin ? "ml-4 sm:ml-8" : "mr-4 sm:mr-8"}`}
                                style={{
                                  borderColor: r.is_admin ? "color-mix(in srgb, #7B61FF 35%, transparent)" : "var(--border-subtle)",
                                  background: r.is_admin ? "color-mix(in srgb, #7B61FF 8%, var(--deep-black))" : "var(--deep-black)",
                                }}
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                                      style={{ background: r.is_admin ? "#7B61FF" : "#333", color: "white" }}
                                    >
                                      {r.is_admin ? "S" : (activeTicket.user_name?.[0] || "U").toUpperCase()}
                                    </div>
                                    <span className="font-semibold" style={{ color: r.is_admin ? "#A08AFF" : "var(--text-primary)" }}>
                                      {r.is_admin ? r.author_name || "Support Team" : activeTicket.user_name}
                                    </span>
                                    {r.is_admin && (
                                      <span className="rounded bg-[#7B61FF]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#00D4FF]">STAFF</span>
                                    )}
                                  </div>
                                  <span className="font-mono text-[11px]" style={{ color: "var(--text-subtle)" }}>
                                    {new Date(r.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed text-[var(--text-muted)] whitespace-pre-wrap">
                                  {r.message}
                                </p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">Quick Reply Presets</p>
                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_REPLIES.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setReplyText((prev) => (prev ? prev + "\n" + preset : preset))}
                                className="rounded-lg border px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:border-[#7B61FF]/40 hover:text-white hover:bg-white/5"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                              >
                                {preset.slice(0, 32)}...
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Reply Form */}
                        <form onSubmit={handleReply} className="space-y-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={4}
                            placeholder="Write your response to the user..."
                            className="w-full resize-y rounded-xl border bg-[var(--deep-black)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                            style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-subtle)]">User will be notified immediately.</span>
                            <button
                              type="submit"
                              disabled={sendingReply || !replyText.trim()}
                              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-opacity disabled:opacity-50"
                              style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)", boxShadow: "0 4px 14px -4px rgba(123,97,255,0.4)" }}
                            >
                              {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Reply
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      /* Notes Tab */
                      <div className="space-y-4">
                        <p className="text-xs text-amber-300/80 bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
                          Internal staff notes are only visible to system admins. Use this for recording transaction IDs, investigation logs, or handoff notes.
                        </p>
                        <textarea
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          rows={6}
                          placeholder="Type internal staff notes here..."
                          className="w-full resize-y rounded-xl border bg-[var(--deep-black)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/40"
                          style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleSaveInternalNotes}
                            disabled={savingNotes}
                            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-2.5 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-400/20 disabled:opacity-50"
                          >
                            {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save Internal Notes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Profile & Ticket Metadata Sidebar (Right 1 col) */}
              <div className="space-y-6">
                {/* User Info Card */}
                <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#00D4FF]" /> User Profile
                    </h3>
                    <Link
                      href={`/admindashboard/users?search=${encodeURIComponent(activeTicket.user_email || "")}`}
                      className="text-[11px] font-semibold text-[#00D4FF] hover:underline flex items-center gap-1"
                    >
                      Manage User <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{activeTicket.user_name || "Anonymous User"}</p>
                      <p className="font-mono text-xs text-[var(--text-muted)]">{activeTicket.user_email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                      <div className="rounded-xl border p-2.5 bg-[var(--deep-black)]" style={{ borderColor: "var(--border-subtle)" }}>
                        <span className="block text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Plan</span>
                        <span className="font-bold text-xs text-[#00D4FF] uppercase">{activeTicket.user_plan || "Free"}</span>
                      </div>
                      <div className="rounded-xl border p-2.5 bg-[var(--deep-black)]" style={{ borderColor: "var(--border-subtle)" }}>
                        <span className="block text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Credits</span>
                        <span className="font-bold text-xs text-amber-400 flex items-center gap-1">
                          <Zap className="h-3 w-3 fill-amber-400" /> {activeTicket.user_credits ?? 0}
                        </span>
                      </div>
                    </div>

                    {activeTicket.user_suspended ? (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-center text-xs font-bold text-rose-300">
                        ⚠ User Account Suspended
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center text-xs font-semibold text-emerald-400">
                        ✓ Account Active
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Properties Card */}
                <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5 border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <Tag className="h-3.5 w-3.5 text-[#7B61FF]" /> Ticket Metadata
                  </h3>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-subtle)]">Ticket ID:</span>
                      <span className="font-mono text-[11px] font-semibold text-white">#{activeTicket.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-subtle)]">Created:</span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">{new Date(activeTicket.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-subtle)]">Last Update:</span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">{new Date(activeTicket.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-subtle)]">Replies:</span>
                      <span className="font-semibold text-white">{replies.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-16 text-sm text-[var(--text-muted)]">Ticket not found.</p>
          )}
        </div>
      ) : (
        /* ── LIST VIEW ────────────────────────────────────────────────────── */
        <div className="mx-auto max-w-[1200px] space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Admin Control Center
              </p>
              <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
                Support Tickets
              </h1>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Manage customer requests, technical issues, and billing support queries.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 text-xs font-semibold"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                <ArrowLeft className="h-4 w-4" /> Admin Dashboard
              </Link>
              <button
                onClick={loadTickets}
                disabled={loading}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 text-xs font-semibold disabled:opacity-50 transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#7B61FF]" /> : <RefreshCw className="h-4 w-4" />} Refresh
              </button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              <div className="rounded-2xl border p-4 space-y-1" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">Total Tickets</span>
                <p className="text-2xl font-extrabold font-mono text-white">{summary.total || 0}</p>
              </div>
              <div className="rounded-2xl border p-4 space-y-1 border-emerald-500/20 bg-emerald-500/[0.02]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Open Tickets</span>
                <p className="text-2xl font-extrabold font-mono text-emerald-300">{summary.open_count || 0}</p>
              </div>
              <div className="rounded-2xl border p-4 space-y-1 border-blue-500/20 bg-blue-500/[0.02]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">In Progress</span>
                <p className="text-2xl font-extrabold font-mono text-blue-300">{summary.in_progress_count || 0}</p>
              </div>
              <div className="rounded-2xl border p-4 space-y-1 border-purple-500/20 bg-purple-500/[0.02]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Resolved</span>
                <p className="text-2xl font-extrabold font-mono text-purple-300">{summary.resolved_count || 0}</p>
              </div>
              <div className="rounded-2xl border p-4 space-y-1 border-rose-500/20 bg-rose-500/[0.02] col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Urgent / High</span>
                <p className="text-2xl font-extrabold font-mono text-rose-300">{summary.urgent_count || 0}</p>
              </div>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search ticket ID, subject, email, or user..."
                className="h-10 w-full rounded-xl border pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border px-3 text-xs font-semibold outline-none cursor-pointer"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border px-3 text-xs font-semibold outline-none cursor-pointer"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            >
              <option value="">All Priorities</option>
              {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border px-3 text-xs font-semibold outline-none cursor-pointer"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORIES_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Tickets Table */}
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
            {loading && tickets.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <HelpCircle className="mx-auto h-10 w-10 text-[var(--text-subtle)] opacity-40" />
                <p className="text-sm font-semibold text-[var(--text-muted)]">No support tickets found.</p>
                <p className="text-xs text-[var(--text-subtle)]">Try clearing search filters or refreshing.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead>
                    <tr className="border-b uppercase tracking-wider text-[10px] font-bold" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}>
                      <th className="px-5 py-3.5">Ticket & Subject</th>
                      <th className="px-4 py-3.5">User Details</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Priority</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Replies</th>
                      <th className="px-5 py-3.5">Updated</th>
                      <th className="px-4 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                    {tickets.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => loadDetail(t.id)}
                        className="group cursor-pointer transition-colors hover:bg-white/[0.02]"
                      >
                        {/* Subject & ID */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-sm truncate max-w-[240px] text-[var(--text-primary)] group-hover:text-[#00D4FF] transition-colors">
                            {t.subject}
                          </p>
                          <span className="font-mono text-[10px] text-[#00D4FF]">
                            #{t.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>

                        {/* User details */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-[#7B61FF]/20 text-[#00D4FF] flex items-center justify-center font-bold text-[10px]">
                              {(t.user_name?.[0] || t.user_email?.[0] || "U").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs truncate text-[var(--text-primary)]">{t.user_name || "User"}</p>
                              <p className="text-[11px] truncate text-[var(--text-subtle)]">{t.user_email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4 text-[var(--text-muted)] font-medium">
                          {CATEGORIES_MAP[t.category] || t.category}
                        </td>

                        {/* Priority Pill */}
                        <td className="px-4 py-4">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${PRIORITY_COLOR[t.priority || "medium"]}`}>
                            {PRIORITY_LABEL[t.priority || "medium"]}
                          </span>
                        </td>

                        {/* Status Switcher inline */}
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={t.status}
                            onChange={(e) => handleInlineStatusChange(e, t.id, e.target.value)}
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer ${STATUS_COLOR[t.status] || ""}`}
                            style={{ background: "transparent" }}
                          >
                            {Object.entries(STATUS_LABEL).map(([k, v]) => (
                              <option key={k} value={k} className="bg-[var(--deep-black)] text-white">{v}</option>
                            ))}
                          </select>
                        </td>

                        {/* Replies & Unread Pill */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-[var(--text-subtle)]" />
                            <span className="font-semibold text-[var(--text-muted)]">{t.reply_count || 0}</span>
                            {t.unread_count > 0 && (
                              <span className="rounded-full bg-[#7B61FF] px-2 py-0.5 text-[9px] font-bold text-white animate-pulse">
                                {t.unread_count} new
                              </span>
                            )}
                            {t.attachment_count > 0 && (
                              <span title={`${t.attachment_count} attachment(s)`}>
                                <Paperclip className="h-3 w-3 text-[#00D4FF]" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 font-mono text-[11px] text-[var(--text-subtle)]">
                          {new Date(t.updated_at).toLocaleDateString()}
                        </td>

                        {/* Action Chevron */}
                        <td className="px-4 py-4 text-right">
                          <ChevronRight className="h-4 w-4 text-[var(--text-subtle)] group-hover:text-white transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
