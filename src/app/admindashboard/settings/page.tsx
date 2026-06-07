"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import type { AdminUser } from "@/lib/admin-auth-storage";
import {
  ProFieldGroup,
  ProLabel,
  ProSettingsCard,
  ProSettingsHero,
  proInputClass,
  proInputStyle,
} from "@/components/settings/ProSettingsShell";

function AdminSettingsForm({ admin }: { admin: AdminUser }) {
  const { authHeaders, applySession } = useAdminAuth();
  const reduce = useReducedMotion();

  const [name, setName] = useState(admin.name || "");
  const [email, setEmail] = useState(admin.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  // Credit Rates states
  const [imageRate, setImageRate] = useState("2");
  const [videoRate, setVideoRate] = useState("5");
  const [rateStatus, setRateStatus] = useState("");
  const [ratesPending, setRatesPending] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("/api/credits/rates");
        const data = await res.json();
        if (data.ok && data.rates) {
          setImageRate(String(data.rates.credits_per_image));
          setVideoRate(String(data.rates.credits_per_video_second));
        }
      } catch (err) {
        console.error("Error fetching credit rates", err);
      }
    };
    fetchRates();
  }, []);

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
    if (newPassword && newPassword.length < 8) {
      setStatus("New password must be at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      const h = authHeaders();
      if (!h.Authorization) {
        setStatus("Sign in again at /admin/login.");
        setPending(false);
        return;
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          currentPassword,
          ...(newPassword ? { newPassword } : {}),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        token?: string;
        admin?: { id: string; email: string; name: string };
      };
      if (!data.ok || !data.token || !data.admin) {
        setStatus(data.error || "Could not save settings.");
        setPending(false);
        return;
      }
      applySession({ token: data.token, admin: data.admin });
      setName(data.admin.name);
      setEmail(data.admin.email);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("Saved. Your session was refreshed.");
    } catch {
      setStatus("Network error.");
    }
    setPending(false);
  };

  const onSaveRates = async () => {
    setRateStatus("");
    const imgVal = Number(imageRate);
    const vidVal = Number(videoRate);
    if (isNaN(imgVal) || imgVal < 0 || isNaN(vidVal) || vidVal < 0) {
      setRateStatus("Rates must be positive numbers.");
      return;
    }
    setRatesPending(true);
    try {
      const h = authHeaders();
      if (!h.Authorization) {
        setRateStatus("Sign in again at /admin/login.");
        setRatesPending(false);
        return;
      }
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({ imageRate: imgVal, videoRate: vidVal }),
      });
      const data = await res.json();
      if (!data.ok) {
        setRateStatus(data.error || "Could not save rates.");
      } else {
        setRateStatus("Saved credit rates successfully.");
      }
    } catch {
      setRateStatus("Network error.");
    } finally {
      setRatesPending(false);
    }
  };

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-[640px] space-y-8">
        <ProSettingsHero
          eyebrow="Admin console"
          title="Account & security"
          description="Update your operator display name, sign-in email, or password. Your current password is required for any change."
          actions={
            <Link
              href="/admindashboard"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#7B61FF]/35"
              style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
              Console overview
            </Link>
          }
        />

        <motion.form initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={onSubmit}>
          <ProSettingsCard>
            <div className="flex flex-col gap-8">
              <ProFieldGroup title="Profile" description="How you appear in the admin console and what you use to sign in.">
                <div>
                  <ProLabel htmlFor="adm-name">Display name</ProLabel>
                  <input
                    id="adm-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className={proInputClass}
                    style={proInputStyle}
                  />
                </div>
                <div>
                  <ProLabel htmlFor="adm-email">Admin email</ProLabel>
                  <input
                    id="adm-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={`${proInputClass} font-mono text-[13px] sm:text-sm`}
                    style={proInputStyle}
                  />
                </div>
              </ProFieldGroup>

              <div className="h-px" style={{ background: "var(--border-subtle)" }} />

              <ProFieldGroup title="Password" description="Leave new password blank to keep your current one.">
                <div>
                  <ProLabel htmlFor="adm-new-pass">New password</ProLabel>
                  <div className="relative">
                    <input
                      id="adm-new-pass"
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
                      aria-label={showNew ? "Hide" : "Show"}
                    >
                      {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <ProLabel htmlFor="adm-confirm">Confirm new password</ProLabel>
                  <input
                    id="adm-confirm"
                    type={showNew ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className={proInputClass}
                    style={proInputStyle}
                  />
                </div>

                <div>
                  <ProLabel htmlFor="adm-cur-pass" required>
                    Current password
                  </ProLabel>
                  <div className="relative">
                    <input
                      id="adm-cur-pass"
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
                      aria-label={showCur ? "Hide" : "Show"}
                    >
                      {showCur ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </ProFieldGroup>

              {status && (
                <p
                  className="text-sm font-medium"
                  style={{ color: status.startsWith("Saved") ? "var(--text-muted)" : "#FF2E9A" }}
                >
                  {status}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/admindashboard"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-5 text-sm font-semibold"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                >
                  Cancel
                </Link>
                <motion.button
                  type="submit"
                  disabled={pending}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold disabled:opacity-60"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                    color: "#fff",
                  }}
                >
                  {pending ? "Saving…" : "Save changes"}
                </motion.button>
              </div>
            </div>
          </ProSettingsCard>
        </motion.form>

        {/* Credit System Rates Settings Card */}
        <ProSettingsCard>
          <div className="flex flex-col gap-6">
            <ProFieldGroup title="Credit System Rates" description="Configure the credit costs for image and video generations.">
              <div>
                <ProLabel htmlFor="rate-image">Credits per Image Generation</ProLabel>
                <input
                  id="rate-image"
                  type="number"
                  value={imageRate}
                  onChange={(e) => setImageRate(e.target.value)}
                  className={proInputClass}
                  style={proInputStyle}
                />
              </div>
              <div>
                <ProLabel htmlFor="rate-video">Credits per Video Second</ProLabel>
                <input
                  id="rate-video"
                  type="number"
                  value={videoRate}
                  onChange={(e) => setVideoRate(e.target.value)}
                  className={proInputClass}
                  style={proInputStyle}
                />
              </div>
            </ProFieldGroup>

            {rateStatus && (
              <p
                className="text-sm font-medium animate-pulse"
                style={{ color: rateStatus.includes("successfully") ? "#10B981" : "#FF2E9A" }}
              >
                {rateStatus}
              </p>
            )}

            <div className="flex pt-2">
              <motion.button
                type="button"
                onClick={onSaveRates}
                disabled={ratesPending}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 text-sm font-semibold disabled:opacity-60"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                  color: "#fff",
                }}
              >
                {ratesPending ? "Saving Rates…" : "Save Rates"}
              </motion.button>
            </div>
          </div>
        </ProSettingsCard>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { admin, ready } = useAdminAuth();

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4" style={{ color: "var(--text-muted)" }}>
        <span
          className="loading-orbit h-10 w-10 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#7B61FF", borderTopColor: "transparent" }}
          aria-hidden
        />
        <p className="text-sm font-semibold tracking-wide">Loading…</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-muted)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Admin sign-in required</p>
          <p className="mt-2 text-sm">
            <Link className="font-semibold text-[#00D4FF] hover:underline" href="/admin/login?next=/admindashboard/settings">
              Admin login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <AdminSettingsForm key={admin.id} admin={admin} />;
}
