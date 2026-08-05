"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Ban, CheckCircle2, ChevronDown, ChevronRight, Loader2, Shield, Coins } from "lucide-react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

export type PlatformUserRow = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  suspended: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  adminNotes: string;
  credits?: number;
  generationDisabled?: boolean;
  specialAccess?: boolean;
  role?: string;
};

const PLAN_PRESETS = ["free", "pro", "pro_yearly", "pro_plus", "pro_plus_yearly", "custom"] as const;
const STATUS_PRESETS = ["active", "paused", "cancelled", "past_due"] as const;

export default function AdminUsersPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<PlatformUserRow[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const h = authHeaders();
    if (!h.Authorization) {
      setStatus("Sign in again at /admin/login.");
      return;
    }
    setStatus("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: h, cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        users?: PlatformUserRow[];
        error?: string;
      };
      if (!data.ok) {
        setRows(null);
        setStatus(data.error || "Failed to load.");
        return;
      }
      setRows(data.users ?? []);
      setStatus(`Loaded ${data.users?.length ?? 0} user(s).`);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!ready || !admin) return;
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [ready, admin, load]);

  const patchUser = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      const h = authHeaders();
      if (!h.Authorization) {
        setStatus("Sign in again at /admin/login.");
        return;
      }
      setSavingId(id);
      setStatus("");
      try {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { ...h, "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string; user?: PlatformUserRow };
        if (!data.ok) {
          setStatus(data.error || "Update failed.");
          return;
        }
        if (data.user) {
          setRows((prev) =>
            prev ? prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)) : prev
          );
        } else {
          await load();
        }
        setStatus("Saved.");
      } finally {
        setSavingId(null);
      }
    },
    [authHeaders, load]
  );

  const counts = useMemo(() => {
    if (!rows?.length) return { total: 0, active: 0, suspended: 0 };
    const suspended = rows.filter((r) => r.suspended).length;
    return { total: rows.length, active: rows.length - suspended, suspended };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!rows) return null;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

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
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-muted)" }}
        >
          <p className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Admin sign-in required
          </p>
          <p className="mt-2 text-sm">
            Go to{" "}
            <Link className="font-semibold text-[#00D4FF] hover:underline" href="/admin/login?next=/admindashboard/users">
              admin login
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-[1100px]">
        <div
          className="flex flex-col gap-6 rounded-2xl border p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
              Admin · Members
            </p>
            <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Platform users
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
              Registered accounts stored in SQLite. Suspend access, set subscription labels, and manage credit balances.
              Member sign-in uses the same API as the marketing app (<span className="font-mono text-[13px] text-[#00D4FF]">POST /api/auth/login</span>).
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
              <span className="rounded-full border px-3 py-1" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                Total: {counts.total}
              </span>
              <span className="rounded-full border border-emerald-500/35 px-3 py-1 text-emerald-200/90">
                Active: {counts.active}
              </span>
              <span className="rounded-full border border-rose-500/35 px-3 py-1 text-rose-200/90">
                Suspended: {counts.suspended}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                Dashboard
              </Link>
              <motion.button
                type="button"
                whileTap={reduce ? undefined : { scale: 0.98 }}
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold disabled:opacity-60"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Refresh
              </motion.button>
            </div>
            {status && (
              <p className="max-w-md text-xs lg:text-right" style={{ color: "var(--text-muted)" }}>
                {status}
              </p>
            )}
          </div>
        </div>

        {/* Search Field */}
        <div className="mt-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or user ID..."
            className="min-h-[44px] w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/45"
            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}>
                  <th className="px-4 py-3 font-bold sm:px-5">Member</th>
                  <th className="px-2 py-3 font-bold">Credits</th>
                  <th className="hidden px-2 py-3 font-bold md:table-cell">Plan</th>
                  <th className="hidden px-2 py-3 font-bold lg:table-cell">Status</th>
                  <th className="hidden px-2 py-3 font-bold sm:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right font-bold sm:px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!filteredRows?.length && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                      No users match your query.
                    </td>
                  </tr>
                ) : null}
                {filteredRows?.map((u) => {
                  const isOpen = openId === u.id;
                  const suspended = !!u.suspended;
                  return (
                    <Fragment key={u.id}>
                      <tr
                        className="border-b transition-colors hover:bg-white/[0.02]"
                        style={{ borderColor: "var(--border-subtle)" }}
                      >
                        <td className="px-4 py-3 sm:px-5">
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              className="mt-0.5 shrink-0 text-[var(--text-subtle)] hover:text-[var(--text-primary)]"
                              aria-expanded={isOpen}
                              onClick={() => setOpenId(isOpen ? null : u.id)}
                            >
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            <div className="min-w-0">
                              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                                {u.name || "—"}
                              </p>
                              <p className="truncate font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                                {u.email}
                              </p>
                              {suspended ? (
                                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-200">
                                  <Ban className="h-3 w-3" /> Suspended
                                </span>
                              ) : (
                                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" /> Active
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 font-semibold text-[var(--text-primary)]">
                          {u.credits ?? 0}
                        </td>
                        <td className="hidden px-2 py-3 md:table-cell">
                          <span className="rounded-md bg-[var(--deep-black)] px-2 py-1 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                            {u.subscriptionPlan}
                          </span>
                        </td>
                        <td className="hidden px-2 py-3 lg:table-cell">
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {u.subscriptionStatus}
                          </span>
                        </td>
                        <td className="hidden px-2 py-3 font-mono text-xs sm:table-cell" style={{ color: "var(--text-subtle)" }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-right sm:px-5">
                          <button
                            type="button"
                            disabled={savingId === u.id}
                            onClick={() => void patchUser(u.id, { suspended: !suspended })}
                            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-50"
                            style={{
                              borderColor: suspended ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)",
                              color: "var(--text-primary)",
                              background: "var(--deep-black)",
                            }}
                          >
                            {savingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : suspended ? <Shield className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                            {suspended ? "Unsuspend" : "Suspend"}
                          </button>
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-b bg-[var(--deep-black)]/40" style={{ borderColor: "var(--border-subtle)" }}>
                          <td colSpan={6} className="px-4 py-4 sm:px-6">
                            <UserDetailPanel
                              key={`${u.id}-${u.subscriptionPlan}-${u.subscriptionStatus}-${u.adminNotes ?? ""}-${u.credits ?? 0}`}
                              user={u}
                              saving={savingId === u.id}
                              onSave={(patch) => void patchUser(u.id, patch)}
                              authHeaders={authHeaders}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailPanel({
  user,
  saving,
  onSave,
  authHeaders,
}: {
  user: PlatformUserRow;
  saving: boolean;
  onSave: (patch: Record<string, unknown>) => void;
  authHeaders: () => Record<string, string>;
}) {
  const [plan, setPlan] = useState(user.subscriptionPlan);
  const [subStatus, setSubStatus] = useState(user.subscriptionStatus);
  const [notes, setNotes] = useState(user.adminNotes || "");
  const [adjustCredits, setAdjustCredits] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [role, setRole] = useState(user.role || "user");
  const [genDisabled, setGenDisabled] = useState(!!user.generationDisabled);
  const [specialAccess, setSpecialAccess] = useState(!!user.specialAccess);

  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchUserHistory = async () => {
      const h = authHeaders();
      try {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/history`, {
          headers: h,
        });
        const data = await res.json();
        if (data.ok && data.history) {
          setUserHistory(data.history);
        }
      } catch (err) {
        console.error("Error fetching user history", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchUserHistory();
  }, [user.id, authHeaders]);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
        Subscription plan
        <input
          type="text"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          list="admin-user-plan-presets"
          placeholder="free, pro, pro_plus…"
          className="min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium normal-case outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
          style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)", color: "var(--text-primary)" }}
        />
        <datalist id="admin-user-plan-presets">
          {PLAN_PRESETS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </label>

      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
        Billing / subscription status
        <input
          type="text"
          value={subStatus}
          onChange={(e) => setSubStatus(e.target.value)}
          list="admin-user-status-presets"
          placeholder="active, paused…"
          className="min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium normal-case outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
          style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)", color: "var(--text-primary)" }}
        />
        <datalist id="admin-user-status-presets">
          {STATUS_PRESETS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>

      {/* Manual Credits Adjuster */}
      <div className="sm:col-span-2 lg:col-span-1 border border-white/5 rounded-xl bg-black/10 p-3">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
          Credits Management
          <div className="flex gap-2">
            <input
              type="number"
              value={adjustCredits}
              onChange={(e) => setAdjustCredits(e.target.value)}
              placeholder="+/- amount"
              className="min-h-[44px] w-24 rounded-lg border px-3 py-2 text-sm font-medium normal-case outline-none"
              style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)", color: "var(--text-primary)" }}
            />
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Reason for change"
              className="min-h-[44px] flex-1 rounded-lg border px-3 py-2 text-sm font-medium normal-case outline-none"
              style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)", color: "var(--text-primary)" }}
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                const amount = Number(adjustCredits);
                if (!amount) return;
                onSave({
                  adjustCredits: amount,
                  creditsReason: adjustReason.trim() || "Manual admin adjustment"
                });
                setAdjustCredits("");
                setAdjustReason("");
              }}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-3 text-xs font-semibold"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            >
              Adjust
            </button>
          </div>
          <span className="text-[10px] text-[var(--text-subtle)] mt-1">
            Current balance: <span className="font-bold text-white">{user.credits ?? 0}</span>
          </span>
        </label>
      </div>

      {/* Role & Access controls */}
      <div className="sm:col-span-2 lg:col-span-1 border border-white/5 rounded-xl bg-black/10 p-3 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
          Access & Role Control
        </h4>
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--text-primary)]">
            System Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border px-2 py-1 text-xs outline-none"
              style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)", color: "var(--text-primary)" }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          
          <label className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
            Generation Access
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={!genDisabled}
                onChange={(e) => setGenDisabled(!e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7B61FF]"></div>
              <span className="ml-2 text-[10px] min-w-[36px]">{!genDisabled ? "Enabled" : "Disabled"}</span>
            </div>
          </label>

          <label className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
            Special Access
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={specialAccess}
                onChange={(e) => setSpecialAccess(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7B61FF]"></div>
              <span className="ml-2 text-[10px] min-w-[36px]">{specialAccess ? "Yes" : "No"}</span>
            </div>
          </label>
        </div>
      </div>

      <div className="sm:col-span-2 lg:col-span-2">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
          Admin notes (internal)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-lg border px-3 py-2 text-sm normal-case outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
            style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)", color: "var(--text-primary)" }}
            placeholder="Billing context, support tickets, etc."
          />
        </label>
      </div>

      {/* User Transaction History */}
      <div className="sm:col-span-2 lg:col-span-3 border-t border-white/5 pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: "var(--text-subtle)" }}>
          <Coins className="h-3.5 w-3.5 text-[var(--primary-purple)]" />
          Recent Transactions Ledger
        </h4>
        {loadingHistory ? (
          <span className="text-xs text-[var(--text-subtle)]">Loading history...</span>
        ) : userHistory.length === 0 ? (
          <span className="text-xs text-[var(--text-subtle)]">No transactions found.</span>
        ) : (
          <div className="max-h-40 overflow-y-auto border border-white/5 rounded-lg bg-black/20 p-2 space-y-1.5">
            {userHistory.slice(0, 10).map((tx) => {
              const isAdd = tx.creditsAdded > 0;
              const amtStr = isAdd ? `+${tx.creditsAdded}` : `-${tx.creditsDeducted}`;
              const color = isAdd ? "text-emerald-400" : "text-rose-400";
              return (
                <div key={tx.id} className="flex justify-between items-center text-xs py-0.5 border-b border-white/[0.02] last:border-0">
                  <span className="text-[var(--text-muted)]">
                    <span className="font-semibold text-[var(--text-primary)] capitalize">{tx.actionType.replace(/_/g, " ")}</span> ({tx.reason || "no reason"})
                  </span>
                  <span className="font-mono text-[var(--text-subtle)] flex gap-2">
                    <span className={`font-bold ${color}`}>{amtStr}</span>
                    <span>(Bal: {tx.newBalance})</span>
                    <span>· {new Date(tx.timestamp).toLocaleString()}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave({
              subscriptionPlan: plan.trim() || "free",
              subscriptionStatus: subStatus.trim() || "active",
              adminNotes: notes.slice(0, 4000),
              role: role,
              generationDisabled: genDisabled,
              specialAccess: specialAccess,
            })
          }
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold disabled:opacity-50"
          style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save user settings & notes
        </button>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          User id: <span className="font-mono text-[11px] text-[#00D4FF]">{user.id}</span>
        </p>
      </div>
    </div>
  );
}
