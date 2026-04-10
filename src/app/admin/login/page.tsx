"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthChrome } from "@/components/AuthChrome";
import { useAdminAuth } from "@/components/AdminAuthProvider";

export default function AdminLoginPage() {
  const { admin, ready, login } = useAdminAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!ready || !admin) return;
    const q = new URLSearchParams(window.location.search).get("next");
    router.replace(q && q.startsWith("/") ? q : "/admindashboard");
  }, [ready, admin, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    const result = await login(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const q = new URLSearchParams(window.location.search).get("next");
    router.push(q && q.startsWith("/") ? q : "/admindashboard");
  };

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (admin) return null;

  return (
    <AuthChrome
      title="Admin sign-in"
      subtitle="Operator access for site content, newsletter exports, and contact inbox. This is separate from member accounts."
      footer={
        <>
          Member workspace?{" "}
          <Link href="/sign-in" className="font-semibold text-[#7B61FF] hover:underline">
            User sign-in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="adm-email" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Admin email
          </label>
          <input
            id="adm-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[48px] w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--deep-black)",
              color: "var(--text-primary)",
            }}
            placeholder="admin@ruhgen.local"
          />
        </div>
        <div>
          <label htmlFor="adm-pass" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Password
          </label>
          <div className="relative">
            <input
              id="adm-pass"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border py-3 pl-4 pr-12 text-base outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--deep-black)",
                color: "var(--text-primary)",
              }}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5"
              style={{ color: "var(--text-muted)" }}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {error && <p className="text-sm font-medium text-[#FF2E9A]">{error}</p>}
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          className="min-h-[52px] w-full rounded-xl text-base font-semibold text-white btn-gradient disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in to admin"}
        </motion.button>
      </form>
    </AuthChrome>
  );
}
