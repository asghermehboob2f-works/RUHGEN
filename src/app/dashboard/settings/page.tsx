"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bell, LogOut, Mail, Monitor, Moon, Palette, Sun, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";

const NOTIFY_KEY = "ruhgen-notify-email";
const PRODUCT_KEY = "ruhgen-notify-product";
const MARKETING_KEY = "ruhgen-notify-marketing";

function readBool(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

type RowProps = {
  title: string;
  desc: string;
  children: React.ReactNode;
};

function SettingRow({ title, desc, children }: RowProps) {
  return (
    <div className="flex flex-col gap-4 border-b py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="min-w-0">
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {desc}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  on,
  onChange,
  id,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative h-8 w-[52px] shrink-0 rounded-full transition-colors"
      style={{
        background: on ? "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))" : "var(--glass)",
        boxShadow: on ? "0 0 20px -4px rgba(123,97,255,0.5)" : "inset 0 0 0 1px var(--border-subtle)",
      }}
    >
      <span
        className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform"
        style={{ left: on ? "calc(100% - 1.65rem)" : "0.25rem" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, ready, signOut } = useAuth();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const reduce = useReducedMotion();

  const [emailNotif, setEmailNotif] = useState(true);
  const [productNotif, setProductNotif] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/settings");
  }, [ready, user, router]);

  useEffect(() => {
    setEmailNotif(readBool(NOTIFY_KEY, true));
    setProductNotif(readBool(PRODUCT_KEY, true));
    setMarketing(readBool(MARKETING_KEY, false));
    setPrefsReady(true);
  }, []);

  const persist = useCallback((key: string, value: boolean) => {
    try {
      localStorage.setItem(key, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="space-y-8">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
          Settings
        </p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
          Workspace preferences
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
          Account details are read-only in this demo. Theme and notification toggles persist in your browser.
        </p>
      </motion.div>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.05 }}
        className="rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: "var(--border-subtle)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--soft-black) 100%, transparent), color-mix(in srgb, var(--deep-black) 85%, transparent))",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <User className="h-5 w-5" style={{ color: "var(--primary-purple)" }} strokeWidth={1.75} />
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Account
          </h2>
        </div>
        <SettingRow title="Display name" desc="Shown in the dashboard header and receipts.">
          <p className="rounded-xl border px-4 py-2.5 text-sm font-medium" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>
            {user.name}
          </p>
        </SettingRow>
        <SettingRow title="Email" desc="Signed in with this address.">
          <p className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-muted)" }}>
            <Mail className="h-4 w-4 shrink-0 opacity-70" />
            <span className="font-mono text-[13px]">{user.email}</span>
          </p>
        </SettingRow>
        <p className="pt-2 text-xs" style={{ color: "var(--text-subtle)" }}>
          Password changes can be wired to your auth backend later.
        </p>
      </motion.section>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.08 }}
        className="rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: "var(--border-subtle)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--soft-black) 100%, transparent), color-mix(in srgb, var(--deep-black) 85%, transparent))",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Palette className="h-5 w-5" style={{ color: "var(--primary-cyan)" }} strokeWidth={1.75} />
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Appearance
          </h2>
        </div>
        <SettingRow title="Theme" desc="Match the marketing site light/dark tokens.">
          <div className="flex items-center gap-2 rounded-2xl border p-1" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}>
            <button
              type="button"
              onClick={() => {
                if (theme !== "dark") toggle();
              }}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors"
              style={{
                background: theme === "dark" ? "var(--glass)" : "transparent",
                color: theme === "dark" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => {
                if (theme !== "light") toggle();
              }}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors"
              style={{
                background: theme === "light" ? "var(--glass)" : "transparent",
                color: theme === "light" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
          </div>
        </SettingRow>
        <SettingRow title="Interface density" desc="Compact layouts are coming; this is a placeholder.">
          <span
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-muted)" }}
          >
            <Monitor className="h-4 w-4" />
            Default
          </span>
        </SettingRow>
      </motion.section>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.11 }}
        className="rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: "var(--border-subtle)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--soft-black) 100%, transparent), color-mix(in srgb, var(--deep-black) 85%, transparent))",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Bell className="h-5 w-5" style={{ color: "var(--accent-pink)" }} strokeWidth={1.75} />
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Notifications
          </h2>
        </div>
        <p className="mb-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Stored locally for this demo — connect to real email preferences when you ship.
        </p>
        {!prefsReady ? null : (
          <>
            <SettingRow title="Generation complete" desc="Get notified when a render finishes.">
              <Toggle
                id="notify-email"
                on={emailNotif}
                onChange={(v) => {
                  setEmailNotif(v);
                  persist(NOTIFY_KEY, v);
                }}
              />
            </SettingRow>
            <SettingRow title="Product updates" desc="New features and changelog highlights.">
              <Toggle
                id="notify-product"
                on={productNotif}
                onChange={(v) => {
                  setProductNotif(v);
                  persist(PRODUCT_KEY, v);
                }}
              />
            </SettingRow>
            <SettingRow title="Tips & inspiration" desc="Occasional prompts and examples.">
              <Toggle
                id="notify-marketing"
                on={marketing}
                onChange={(v) => {
                  setMarketing(v);
                  persist(MARKETING_KEY, v);
                }}
              />
            </SettingRow>
          </>
        )}
      </motion.section>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.14 }}
        className="rounded-3xl border p-6 sm:p-8"
        style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
      >
        <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Session
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          You’re signed in on this browser. Signing out clears the local session only.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/");
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-5 text-sm font-semibold"
            style={{
              borderColor: "color-mix(in srgb, var(--accent-pink) 35%, var(--border-subtle))",
              background: "var(--deep-black)",
              color: "var(--text-primary)",
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out everywhere (this device)
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border px-5 text-sm font-semibold"
            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
          >
            Back to overview
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
