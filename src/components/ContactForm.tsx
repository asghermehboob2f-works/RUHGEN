"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const genres = [
  { 
    id: "general", 
    label: "General Feedback", 
    placeholder: "Share your overall thoughts, questions, or ideas..." 
  },
  { 
    id: "feature", 
    label: "Feature Request", 
    placeholder: "• Desired Feature:\n• Why it would help you:\n• Additional context:" 
  },
  { 
    id: "bug", 
    label: "Bug Report", 
    placeholder: "• What happened:\n• Steps to reproduce:\n• Expected outcome:" 
  },
  { 
    id: "studio", 
    label: "Studio Request", 
    placeholder: "• Company Name:\n• Team Size:\n• Key Requirements (SSO, SLAs, custom GPUs, etc.):" 
  }
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [genre, setGenre] = useState("general");
  const [message, setMessage] = useState(genres[0].placeholder);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errDetail, setErrDetail] = useState("");

  const handleGenreSelect = (genreId: string) => {
    setGenre(genreId);
    const selected = genres.find(g => g.id === genreId);
    if (selected) {
      // If message is empty or matches another genre's default template, switch it
      const isTemplateOrEmpty = !message.trim() || genres.some(g => message.trim() === g.placeholder.trim());
      if (isTemplateOrEmpty) {
        setMessage(selected.placeholder);
      }
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrDetail("Please fill in your name, email, and message.");
      setStatus("err");
      return;
    }

    setErrDetail("");
    setStatus("sending");

    try {
      const selectedGenre = genres.find(g => g.id === genre)?.label || "General Feedback";
      const formattedMessage = `=== Inquiry Genre: ${selectedGenre} ===\n\n${message.trim()}`;

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: formattedMessage,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrDetail(data.error ?? "Could not send your message. Please try again.");
        setStatus("err");
        return;
      }

      setStatus("ok");
    } catch {
      setErrDetail("Network error. Check your connection and try again.");
      setStatus("err");
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setGenre("general");
    setMessage(genres[0].placeholder);
    setStatus("idle");
  };

  const fieldStyle = 
    "w-full rounded-2xl border px-4 py-3 text-base outline-none transition-all duration-200 text-[var(--text-primary)] placeholder:text-neutral-500 focus:ring-2 focus:ring-[#7B61FF]/20 focus:border-[#7B61FF]/50";

  return (
    <div 
      className="rounded-3xl border p-6 sm:p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--glass)",
        backdropFilter: "blur(24px)",
      }}
    >
      <AnimatePresence mode="wait">
        {status === "ok" ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center py-10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00D4FF]/10 text-[#00D4FF] mb-6">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Message Dispatched
            </h2>
            <p className="mt-3 text-sm leading-relaxed max-w-sm" style={{ color: "var(--text-muted)" }}>
              Thank you, <span className="font-semibold text-[var(--text-primary)]">{name}</span>. Your inquiry has been securely sent. <span className="text-white font-medium">We will reach you very soon.</span>
            </p>
            <button
              onClick={handleReset}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold hover:bg-white/5 transition-colors"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={onSubmit} 
            className="flex flex-col gap-6"
          >
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Get in Touch
              </h2>
              <p className="mt-1 text-xs font-light" style={{ color: "var(--text-muted)" }}>
                Fill in the details below. We handle all direct messages securely.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className="mb-1.5 block text-xs font-normal uppercase tracking-wider text-neutral-400">
                  Full Name
                </label>
                <input
                  id="c-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldStyle}
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--soft-black)",
                  }}
                  placeholder="Alex Rivera"
                  autoComplete="name"
                  required
                />
              </div>
              <div>
                <label htmlFor="c-email" className="mb-1.5 block text-xs font-normal uppercase tracking-wider text-neutral-400">
                  Work Email
                </label>
                <input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldStyle}
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--soft-black)",
                  }}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Custom Genre Selector */}
            <div>
              <label className="mb-2 block text-xs font-normal uppercase tracking-wider text-neutral-400">
                Message Genre / Template
              </label>
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => {
                  const isSelected = genre === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleGenreSelect(g.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-normal transition-all duration-200 border"
                      style={{
                        borderColor: isSelected ? "#7B61FF" : "var(--border-subtle)",
                        background: isSelected ? "rgba(123, 97, 255, 0.1)" : "rgba(255, 255, 255, 0.02)",
                        color: isSelected ? "white" : "var(--text-muted)",
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="c-msg" className="mb-1.5 block text-xs font-normal uppercase tracking-wider text-neutral-400">
                Message Details
              </label>
              <textarea
                id="c-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                className={`${fieldStyle} min-h-[160px] resize-y font-mono text-sm`}
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--soft-black)",
                }}
                placeholder="Write your message here..."
                required
              />
            </div>

            {status === "err" && errDetail && (
              <p className="text-xs font-semibold text-[#FF2E9A] bg-[#FF2E9A]/5 border border-[#FF2E9A]/20 rounded-xl px-4 py-2.5">
                {errDetail}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white btn-gradient disabled:opacity-75"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending message...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Inquiry
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
