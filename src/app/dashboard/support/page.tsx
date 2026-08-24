"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  HelpCircle,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  X,
  CheckCircle2,
  ArrowLeft,
  Paperclip,
  FileText,
  Download,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const CATEGORIES = [
  { value: "billing", label: "Billing & Payments" },
  { value: "credits", label: "Credits & Balance" },
  { value: "technical", label: "Technical Issue" },
  { value: "generation", label: "Generation Problem" },
  { value: "account", label: "Account & Access" },
  { value: "other", label: "Other" },
] as const;

const PRIORITIES = [
  { value: "low", label: "Low - General question" },
  { value: "medium", label: "Medium - Standard issue" },
  { value: "high", label: "High - Feature blocking" },
  { value: "urgent", label: "Urgent - Critical issue" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/25",
  resolved: "text-purple-400 bg-purple-400/10 border-purple-400/25",
  closed: "text-[var(--text-subtle)] bg-[var(--deep-black)] border-[var(--border-subtle)]",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  high: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  medium: "text-cyan-400 bg-cyan-400/10 border-cyan-400/25",
  low: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

type Ticket = {
  id: string;
  category: string;
  subject: string;
  status: string;
  priority?: string;
  created_at: string;
  updated_at: string;
  reply_count: number;
  unread_count: number;
  attachment_count?: number;
};

type Reply = {
  id: string;
  message: string;
  is_admin: number;
  author_name: string;
  created_at: string;
};

type Attachment = {
  id: string;
  filename: string;
  original_name: string;
  size: number;
  mimetype: string;
  created_at: string;
};

type TicketDetail = Ticket & {
  message: string;
};

export default function SupportPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Create form
  const [category, setCategory] = useState("billing");
  const [priority, setPriority] = useState("medium");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Detail view
  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const token = () => localStorage.getItem("ruhgen_user_jwt_v1") || "";

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.ok) setTickets(data.tickets || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/support");
  }, [ready, user, router]);

  useEffect(() => {
    if (user) loadTickets();
  }, [user, loadTickets]);

  const loadTicketDetail = async (id: string) => {
    setLoadingDetail(true);
    setView("detail");
    try {
      const res = await fetch(`/api/support/tickets/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.ok) {
        setActiveTicket(data.ticket);
        setReplies(data.replies || []);
        setAttachments(data.attachments || []);
      }
    } catch {}
    finally { setLoadingDetail(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!subject.trim() || subject.trim().length < 5) return setFormError("Subject must be at least 5 characters.");
    if (!message.trim() || message.trim().length < 15) return setFormError("Message must be at least 15 characters.");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("priority", priority);
      formData.append("subject", subject.trim());
      formData.append("message", message.trim());
      if (attachment) {
        formData.append("attachment", attachment);
      }

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setFormSuccess(true);
        setSubject(""); setMessage(""); setCategory("billing"); setPriority("medium"); setAttachment(null);
        loadTickets();
        setTimeout(() => { setFormSuccess(false); setView("list"); }, 2000);
      } else {
        setFormError(data.error || "Failed to submit ticket.");
      }
    } catch { setFormError("Network error."); }
    finally { setSubmitting(false); }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setReplyText("");
        await loadTicketDetail(activeTicket.id);
        loadTickets();
      }
    } catch {}
    finally { setSendingReply(false); }
  };

  if (!ready) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
    </div>
  );

  if (!user) return null;

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === "detail") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView("list"); setActiveTicket(null); setReplies([]); setAttachments([]); }}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Tickets
          </button>
          {activeTicket && (
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[activeTicket.status] || ""}`}>
                {STATUS_LABEL[activeTicket.status] || activeTicket.status}
              </span>
              {activeTicket.priority && (
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PRIORITY_STYLES[activeTicket.priority] || ""}`}>
                  {activeTicket.priority} Priority
                </span>
              )}
            </div>
          )}
        </div>

        {loadingDetail ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" /></div>
        ) : activeTicket ? (
          <>
            <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <div className="flex justify-between items-center text-xs" style={{ color: "var(--text-subtle)" }}>
                <span className="font-mono font-semibold text-[#00D4FF]">
                  #{activeTicket.id.slice(0, 8).toUpperCase()} · {CATEGORIES.find((c) => c.value === activeTicket.category)?.label || activeTicket.category}
                </span>
                <span>Submitted {new Date(activeTicket.created_at).toLocaleString()}</span>
              </div>
              
              <h1 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {activeTicket.subject}
              </h1>
              
              <div className="rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-muted)" }}>
                {activeTicket.message}
              </div>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" /> Attached Files ({attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <a
                        key={att.id}
                        href={`/api/support/attachments/${att.id}`}
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

            {/* Thread */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">Responses ({replies.length})</h3>
              {replies.length === 0 ? (
                <div className="rounded-xl border p-6 text-center text-xs text-[var(--text-muted)]" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  No responses yet. Support team will reply within 24 hours.
                </div>
              ) : (
                replies.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-4 ${r.is_admin ? "ml-0" : "ml-6 sm:ml-12"}`}
                    style={{
                      borderColor: r.is_admin ? "color-mix(in srgb, #7B61FF 35%, transparent)" : "var(--border-subtle)",
                      background: r.is_admin ? "color-mix(in srgb, #7B61FF 8%, var(--soft-black))" : "var(--deep-black)",
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: r.is_admin ? "#7B61FF" : "#444", color: "white" }}
                        >
                          {r.is_admin ? "S" : (user.name?.[0] || "U").toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: r.is_admin ? "#A08AFF" : "var(--text-primary)" }}>
                          {r.is_admin ? "Support Team" : r.author_name || "You"}
                        </span>
                        {r.is_admin && (
                          <span className="rounded bg-[#7B61FF]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#00D4FF]">OFFICIAL</span>
                        )}
                      </div>
                      <span className="text-xs font-mono" style={{ color: "var(--text-subtle)" }}>
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>
                      {r.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Reply form */}
            {activeTicket.status !== "closed" && (
              <form onSubmit={handleReply} className="rounded-2xl border p-5 space-y-3" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Add a Response</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Type your message to support staff..."
                  className="w-full resize-y rounded-xl border bg-[var(--deep-black)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-subtle)]">Replying will automatically notify support agents.</span>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-opacity disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)", boxShadow: "0 4px 14px -4px rgba(123,97,255,0.4)" }}
                  >
                    {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Response
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>Ticket not found.</p>
        )}
      </div>
    );
  }

  // ── CREATE VIEW ──────────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView("list"); setFormError(""); setFormSuccess(false); }}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Tickets
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>Help Center</p>
            <h1 className="font-display text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>New Support Ticket</h1>
          </div>
        </div>

        {formSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center rounded-2xl border py-16 text-center space-y-3"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <CheckCircle2 className="h-12 w-12 text-[#00E575]" />
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Ticket Submitted Successfully!</h2>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              Our engineering & support team will inspect your issue and respond within 24 hours.
            </p>
          </motion.div>
        ) : (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border p-6 sm:p-8 space-y-5"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            {formError && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                {formError}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
                  Category *
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40 cursor-pointer"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
                  Priority Level *
                </span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40 cursor-pointer"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
                Subject *
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your question or issue"
                maxLength={200}
                className="min-h-[44px] w-full rounded-xl border px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
                Message *
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Describe your issue in detail. Include any relevant transaction IDs, prompt texts, or error codes..."
                maxLength={8000}
                className="w-full resize-y rounded-xl border px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              />
              <p className="mt-1 text-right text-[11px]" style={{ color: "var(--text-subtle)" }}>
                {message.length}/8000
              </p>
            </label>

            {/* Optional File Attachment */}
            <div className="block space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
                Attach Document or Screenshot (Optional, Max 10MB)
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="file-attachment"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="hidden"
                  accept="image/*,.pdf,.txt,.log,.json"
                />
                <label
                  htmlFor="file-attachment"
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                >
                  <Paperclip className="h-4 w-4 text-[#00D4FF]" />
                  {attachment ? attachment.name : "Choose File..."}
                </label>
                {attachment && (
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)", boxShadow: "0 6px 20px -6px rgba(123,97,255,0.5)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Ticket
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // ── LIST VIEW (default) ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>Help Center</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
            Support & Help Desk
          </h1>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Create a support ticket or track responses from our customer experience team.
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white shadow-lg transition-transform active:scale-95"
          style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)", boxShadow: "0 6px 20px -6px rgba(123,97,255,0.5)" }}
        >
          <Plus className="h-4 w-4" /> Create New Ticket
        </button>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" /></div>
      ) : tickets.length === 0 ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border py-16 text-center space-y-3"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <HelpCircle className="h-12 w-12 opacity-25" style={{ color: "var(--text-muted)" }} />
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>No tickets submitted yet</h2>
          <p className="text-xs text-[var(--text-muted)] max-w-sm">
            Have a question about subscriptions, billing, or generation models? Create a ticket and we&apos;ll help immediately.
          </p>
          <button
            onClick={() => setView("create")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)" }}
          >
            <Plus className="h-4 w-4" /> Submit First Ticket
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t, i) => (
            <motion.button
              key={t.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : i * 0.03 }}
              onClick={() => loadTicketDetail(t.id)}
              className="flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition-all hover:bg-white/[0.02] group"
              style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[t.status] || ""}`}>
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                  {t.priority && (
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${PRIORITY_STYLES[t.priority] || ""}`}>
                      {t.priority}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-[var(--text-subtle)]">
                    {CATEGORIES.find((c) => c.value === t.category)?.label || t.category}
                  </span>
                  {t.unread_count > 0 && (
                    <span className="rounded-full bg-[#7B61FF] px-2 py-0.5 text-[9px] font-bold text-white animate-pulse">
                      {t.unread_count} new response(s)
                    </span>
                  )}
                </div>

                <p className="font-semibold truncate text-sm text-[var(--text-primary)] group-hover:text-[#00D4FF] transition-colors">
                  {t.subject}
                </p>

                <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--text-subtle)" }}>
                  <span className="flex items-center gap-1 font-mono">
                    #{t.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Updated {new Date(t.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--text-subtle)] group-hover:text-[var(--text-primary)] transition-colors" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
