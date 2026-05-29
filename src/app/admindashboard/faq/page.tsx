"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, Edit2, Trash2, HelpCircle,
  LayoutDashboard, X, AlertCircle, Sparkles, Award
} from "lucide-react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { 
  ProSettingsHero, 
  ProSettingsCard, 
  proInputClass, 
  proInputStyle,
  ProLabel
} from "@/components/settings/ProSettingsShell";

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

function FaqCmsContent() {
  const { authHeaders } = useAdminAuth();
  const reduce = useReducedMotion() === true;
  
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form / Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [category, setCategory] = useState("product");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faqs");
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.faqs)) {
          setFaqs(data.faqs);
        }
      } else {
        setError("Failed to fetch FAQs list from database.");
      }
    } catch {
      setError("Network error fetching FAQs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingFaq(null);
    setCategory("product");
    setQuestion("");
    setAnswer("");
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (f: Faq) => {
    setEditingFaq(f);
    setCategory(f.category);
    setQuestion(f.question);
    setAnswer(f.answer);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!question.trim() || !answer.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const h = authHeaders();
      const method = editingFaq ? "PUT" : "POST";
      const url = editingFaq 
        ? `/api/admin/faqs/${editingFaq.id}`
        : "/api/admin/faqs";

      const res = await fetch(url, {
        method,
        headers: {
          ...h,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category,
          question,
          answer
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess(editingFaq ? "FAQ updated successfully." : "New FAQ created successfully.");
        setIsModalOpen(false);
        fetchFaqs();
      } else {
        setError(data.error || "Failed to save FAQ.");
      }
    } catch {
      setError("Network error while saving FAQ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ? This action is permanent.")) return;

    setError("");
    setSuccess("");
    try {
      const h = authHeaders();
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: "DELETE",
        headers: h
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess("FAQ deleted successfully.");
        fetchFaqs();
      } else {
        setError(data.error || "Failed to delete FAQ.");
      }
    } catch {
      setError("Network error while deleting FAQ.");
    }
  };

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-5xl space-y-8">
        
        {/* Hero Banner */}
        <ProSettingsHero
          eyebrow="FAQ CMS"
          title="Manage Help Content"
          description="Update, add, and organize frequently asked questions across product, billing, teams, and security."
          actions={
            <div className="flex gap-3">
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#7B61FF]/35"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
                Dashboard Overview
              </Link>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)"
                }}
              >
                <Plus className="h-4 w-4" />
                Add FAQ
              </button>
            </div>
          }
        />

        {/* Global Alert Notices */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* FAQs Data Table */}
        <ProSettingsCard>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex py-16 flex-col items-center justify-center gap-4 text-zinc-400">
                <span
                  className="loading-orbit h-8 w-8 rounded-full border-2 border-t-transparent"
                  style={{ borderColor: "#7B61FF", borderTopColor: "transparent" }}
                />
                <p className="text-xs font-semibold tracking-wide">Loading FAQs from database...</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                <HelpCircle className="h-12 w-12 opacity-30" />
                <p className="mt-3 text-sm font-semibold">No FAQs available.</p>
                <p className="mt-1 text-xs">Click the &apos;Add FAQ&apos; button above to create one.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">Category</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-zinc-400 w-1/3">Question</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-zinc-400 w-1/3">Answer</th>
                    <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {faqs.map((f) => (
                    <tr key={f.id} className="group hover:bg-white/[0.01]">
                      {/* Category */}
                      <td className="py-4.5 pr-4 align-top pt-4">
                        <span className="inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black/40" style={{ borderColor: "var(--border-subtle)", color: "#7B61FF" }}>
                          {f.category}
                        </span>
                      </td>

                      {/* Question */}
                      <td className="py-4.5 pr-4 align-top pt-4">
                        <div className="font-semibold text-white text-sm leading-snug group-hover:text-[#7B61FF] transition-colors line-clamp-2">
                          {f.question}
                        </div>
                      </td>

                      {/* Answer */}
                      <td className="py-4.5 pr-4 align-top pt-4">
                        <div className="text-sm text-zinc-400 leading-snug line-clamp-3">
                          {f.answer}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4.5 text-right whitespace-nowrap align-top pt-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(f)}
                            className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                            title="Edit FAQ"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(f.id)}
                            className="p-2 rounded-lg border border-rose-950 bg-rose-950/20 text-rose-400 hover:text-white hover:bg-rose-900 transition-colors"
                            title="Delete FAQ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ProSettingsCard>
      </div>

      {/* CREATE & EDIT FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={reduce ? false : { scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-[600px] overflow-hidden rounded-2xl border bg-zinc-900 shadow-2xl"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              {/* Close Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 p-5">
                <h3 className="font-display font-bold text-lg text-white">
                  {editingFaq ? "Edit FAQ" : "Create New FAQ"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveFaq} className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
                
                {/* Category */}
                <div>
                  <ProLabel htmlFor="category" required>Category</ProLabel>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={proInputClass}
                    style={{ ...proInputStyle, colorScheme: "dark" }}
                  >
                    <option value="product">Product</option>
                    <option value="billing">Billing & licensing</option>
                    <option value="teams">Teams & API</option>
                    <option value="security">Security & data</option>
                  </select>
                </div>

                {/* Question */}
                <div>
                  <ProLabel htmlFor="question" required>Question</ProLabel>
                  <input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What is RUHGEN?"
                    className={proInputClass}
                    style={proInputStyle}
                    required
                  />
                </div>

                {/* Answer */}
                <div>
                  <ProLabel htmlFor="answer" required>Answer</ProLabel>
                  <textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Detailed explanation..."
                    rows={4}
                    className={`${proInputClass} resize-none py-2.5`}
                    style={proInputStyle}
                    required
                  />
                </div>

                {/* Error locally within form */}
                {error && (
                  <p className="text-xs font-semibold text-rose-400">
                    {error}
                  </p>
                )}

                {/* Form Action Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 px-5 text-xs font-semibold text-zinc-300 transition-colors hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl text-xs font-bold text-white px-6 transition-opacity hover:opacity-95 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)"
                    }}
                  >
                    {submitting ? "Saving..." : "Save FAQ"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqCmsPage() {
  const { admin, ready } = useAdminAuth();

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-zinc-400">
        <span
          className="loading-orbit h-10 w-10 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#7B61FF", borderTopColor: "transparent" }}
        />
        <p className="text-xs font-semibold tracking-wide">Securing connection...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-muted)" }}>
          <Award className="mx-auto h-12 w-12 text-[#7B61FF] opacity-40" />
          <p className="font-display text-xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>CMS Login Required</p>
          <p className="mt-2 text-sm">
            Please log in first to manage resources.
          </p>
          <p className="mt-4">
            <Link className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 px-5 text-xs font-bold text-[#00D4FF] hover:underline" href="/admin/login?next=/admindashboard/faq">
              Operator Sign-in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <FaqCmsContent />;
}
