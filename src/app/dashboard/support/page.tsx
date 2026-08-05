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

const STATUS_STYLES: Record<string, string> = {
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

type Ticket = {
  id: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  reply_count: number;
  unread_count: number;
};

type Reply = {
  id: string;
  message: string;
  is_admin: number;
  author_name: string;
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
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Detail view
  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
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
      }
    } catch {}
    finally { setLoadingDetail(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!subject.trim() || subject.trim().length < 5) return setFormError("Subject must be at least 5 characters.");
    if (!message.trim() || message.trim().length < 20) return setFormError("Message must be at least 20 characters.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ category, subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setFormSuccess(true);
        setSubject(""); setMessage(""); setCategory("billing");
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
            onClick={() => { setView("list"); setActiveTicket(null); setReplies([]); }}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {activeTicket && (
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[activeTicket.status] || ""}`}>
              {STATUS_LABEL[activeTicket.status] || activeTicket.status}
            </span>
          )}
        </div>

        {loadingDetail ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" /></div>
        ) : activeTicket ? (
          <>
            <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                #{activeTicket.id.slice(0, 8).toUpperCase()} · {activeTicket.category}
              </p>
              <h1 className="font-display mt-1 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {activeTicket.subject}
              </h1>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {activeTicket.message}
              </p>
              <p className="mt-3 text-xs" style={{ color: "var(--text-subtle)" }}>
                Submitted {new Date(activeTicket.created_at).toLocaleString()}
              </p>
            </div>

            {/* Thread */}
            <div className="space-y-3">
              {replies.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-xl border p-4 ${r.is_admin ? "ml-0" : "ml-6 sm:ml-12"}`}
                  style={{
                    borderColor: r.is_admin ? "color-mix(in srgb, #7B61FF 30%, transparent)" : "var(--border-subtle)",
                    background: r.is_admin ? "color-mix(in srgb, #7B61FF 8%, var(--soft-black))" : "var(--deep-black)",
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: r.is_admin ? "#7B61FF" : "#444", color: "white" }}
                    >
                      {r.is_admin ? "S" : (user.name?.[0] || "U").toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: r.is_admin ? "#A08AFF" : "var(--text-primary)" }}>
                      {r.is_admin ? "Support Team" : r.author_name || "You"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
                      · {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {r.message}
                  </p>
                </div>
              ))}
            </div>

            {/* Reply form */}
            {activeTicket.status !== "closed" && (
              <form onSubmit={handleReply} className="rounded-2xl border p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Add a Reply</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Type your message…"
                  className="w-full resize-y rounded-xl border bg-[var(--deep-black)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)" }}
                  >
                    {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Reply
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
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>Support</p>
            <h1 className="font-display text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>New Ticket</h1>
          </div>
        </div>

        {formSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center rounded-2xl border py-16 text-center"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            <CheckCircle2 className="h-12 w-12 text-[#00E575]" />
            <h2 className="mt-4 font-display text-xl font-bold text-white">Ticket Submitted!</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              We&apos;ll get back to you within 24 hours.
            </p>
          </motion.div>
        ) : (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border p-6 sm:p-8"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
          >
            {formError && (
              <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {formError}
              </div>
            )}

            <div className="space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
                  Category *
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
                  Subject *
                </span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  maxLength={200}
                  className="min-h-[44px] w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
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
                  placeholder="Describe your issue in detail. Include any relevant information such as error messages, steps to reproduce, or account details."
                  maxLength={8000}
                  className="w-full resize-y rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                />
                <p className="mt-1 text-right text-xs" style={{ color: "var(--text-subtle)" }}>
                  {message.length}/8000
                </p>
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
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
            Support
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Create a ticket and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)", boxShadow: "0 6px 20px -6px rgba(123,97,255,0.5)" }}
        >
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" /></div>
      ) : tickets.length === 0 ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border py-16 text-center"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <HelpCircle className="h-12 w-12 opacity-25" style={{ color: "var(--text-muted)" }} />
          <h2 className="mt-4 font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>No tickets yet</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Need help? Create a support ticket and we&apos;ll respond quickly.
          </p>
          <button
            onClick={() => setView("create")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)" }}
          >
            <Plus className="h-4 w-4" /> Create First Ticket
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
              className="flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition-all hover:bg-white/[0.02]"
              style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[t.status] || ""}`}>
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
                    {CATEGORIES.find((c) => c.value === t.category)?.label || t.category}
                  </span>
                  {t.unread_count > 0 && (
                    <span className="rounded-full bg-[#7B61FF] px-2 py-0.5 text-[9px] font-bold text-white">
                      {t.unread_count} new
                    </span>
                  )}
                </div>
                <p className="mt-1.5 font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {t.subject}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "var(--text-subtle)" }}>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Updated {new Date(t.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0" style={{ color: "var(--text-subtle)" }} />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
