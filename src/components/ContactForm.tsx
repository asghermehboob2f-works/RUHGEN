"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";
import { useState } from "react";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const reduce = useReducedMotion();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !isValidEmail(email) || message.trim().length < 8) {
      setStatus("err");
      return;
    }
    setStatus("sending");
    window.setTimeout(() => {
      setStatus("ok");
      setName("");
      setEmail("");
      setMessage("");
      window.setTimeout(() => setStatus("idle"), 5000);
    }, 900);
  };

  const field =
    "w-full rounded-2xl border px-4 py-3.5 text-base outline-none transition-shadow focus:ring-2 focus:ring-[#7B61FF]/40";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="premium-ring rounded-[1.5rem] border p-6 sm:p-8 md:p-10"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--glass)",
        backdropFilter: "blur(24px)",
      }}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="c-name" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Name
            </label>
            <input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--soft-black)",
                color: "var(--text-primary)",
              }}
              placeholder="Alex Rivera"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="c-email" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Email
            </label>
            <input
              id="c-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--soft-black)",
                color: "var(--text-primary)",
              }}
              placeholder="you@studio.com"
              autoComplete="email"
            />
          </div>
        </div>
        <div>
          <label htmlFor="c-msg" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            How can we help?
          </label>
          <textarea
            id="c-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className={`${field} min-h-[140px] resize-y`}
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--soft-black)",
              color: "var(--text-primary)",
            }}
            placeholder="Tell us about your team, timeline, and what you want to build…"
          />
        </div>
        {status === "err" && (
          <p className="text-sm font-medium text-[#FF2E9A]">
            Please fill all fields with a valid email and a message (8+ characters).
          </p>
        )}
        {status === "ok" && (
          <p className="text-sm font-medium text-[#00D4FF]">
            Thanks—your note is in. We’ll reply within one business day.
          </p>
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold text-white btn-gradient disabled:opacity-70"
        >
          {status === "sending" ? (
            "Sending…"
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send message
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
