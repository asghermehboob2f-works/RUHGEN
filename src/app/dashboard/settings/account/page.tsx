"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  ProFieldGroup,
  ProLabel,
  ProSettingsCard,
  ProSettingsHero,
  proInputClass,
  proInputStyle,
} from "@/components/settings/ProSettingsShell";

export default function UserAccountSettingsPage() {
  const { user, ready, updateProfile } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/settings/account");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    if (!currentPassword.trim()) {
      setStatus("Enter your current password to save changes.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setStatus("New password and confirmation do not match.");
      return;
    }
    setPending(true);
    const result = await updateProfile({
      name: name.trim(),
      email: email.trim(),
      currentPassword,
      ...(newPassword.trim() ? { newPassword: newPassword.trim() } : {}),
    });
    setPending(false);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus("Account updated.");
  };

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="mx-auto max-w-[640px] space-y-8">
      <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/dashboard/settings"
          className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#00D4FF] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to settings
        </Link>
        <ProSettingsHero
          eyebrow="Account"
          title="Profile & credentials"
          description="Update your display name, sign-in email, or password. In this demo, data stays on this device. Your current password is required to save any change."
        />
      </motion.div>

      <motion.form
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.05 }}
        onSubmit={onSubmit}
      >
        <ProSettingsCard>
        <div className="space-y-8">
          <ProFieldGroup title="Profile" description="How you appear in the workspace and what you use to sign in.">
          <div>
            <ProLabel htmlFor="acc-name">Display name</ProLabel>
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Shown in the dashboard header.
            </p>
            <input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={proInputClass}
              style={proInputStyle}
            />
          </div>
          <div>
            <ProLabel htmlFor="acc-email">Email</ProLabel>
            <p className="mb-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" />
              Used to sign in. Must be unique across accounts on this device.
            </p>
            <input
              id="acc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={`${proInputClass} font-mono text-[13px]`}
              style={proInputStyle}
            />
          </div>
          </ProFieldGroup>

          <div className="h-px" style={{ background: "var(--border-subtle)" }} />

          <ProFieldGroup title="Password" description="Leave new password blank to keep your current one.">
          <div>
            <ProLabel htmlFor="acc-new-pass">New password</ProLabel>
            <div className="relative">
              <input
                id="acc-new-pass"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className={`${proInputClass} pr-12`}
                style={proInputStyle}
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5"
                style={{ color: "var(--text-muted)" }}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <ProLabel htmlFor="acc-confirm">Confirm new password</ProLabel>
            <input
              id="acc-confirm"
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={proInputClass}
              style={proInputStyle}
            />
          </div>

          <div>
            <ProLabel htmlFor="acc-cur-pass" required>
              Current password
            </ProLabel>
            <div className="relative">
              <input
                id="acc-cur-pass"
                type={showCur ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={`${proInputClass} pr-12`}
                style={proInputStyle}
              />
              <button
                type="button"
                onClick={() => setShowCur((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5"
                style={{ color: "var(--text-muted)" }}
                aria-label={showCur ? "Hide password" : "Show password"}
              >
                {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          </ProFieldGroup>

          {status && (
            <p
              className="text-sm font-medium"
              style={{ color: status.startsWith("Account updated") ? "var(--text-muted)" : "#FF2E9A" }}
            >
              {status}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <motion.button
              type="submit"
              disabled={pending}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-6 text-sm font-semibold disabled:opacity-60"
              style={{
                borderColor: "var(--border-subtle)",
                background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                color: "#fff",
              }}
            >
              {pending ? "Saving…" : "Save changes"}
            </motion.button>
            <Link
              href="/dashboard/settings"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 text-sm font-semibold"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            >
              Cancel
            </Link>
          </div>
        </div>
        </ProSettingsCard>
      </motion.form>
    </div>
  );
}
