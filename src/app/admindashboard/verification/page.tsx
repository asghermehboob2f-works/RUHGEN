"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Clock, AlertTriangle, Ban, RefreshCw, Mail, KeyRound,
  CheckCircle2, Loader2, Search, Download, Users, TrendingUp, XCircle,
} from "lucide-react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

/** Parse a fetch Response safely — returns {ok:false, error} if body isn't valid JSON. */
async function safeJson(res: Response): Promise<Record<string, any>> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, " ").trim();
    return { ok: false, error: `Server error (HTTP ${res.status}): ${preview}` };
  }
}

interface VerifStats {
  total: number; verified: number; pending: number; suspended: number;
  verificationRate: number; todayRegistrations: number; todayVerifications: number;
}
interface UserRow {
  id: string; email: string; name: string; createdAt: string;
  emailVerified: number; emailVerifiedAt: string | null;
  verificationStatus: string; verificationDeadline: string | null;
  suspended: number; lastResendAt: string | null; resendCountToday: number;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  targetEmail?: string;
  target_user_id?: string;
  actor_email?: string;
}

const API = "";

export default function AdminVerificationPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const [stats, setStats] = useState<VerifStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgId, setMsgId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "suspended">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const h = authHeaders();
    if (!h.Authorization) return;
    setLoading(true); setLoadError(null);
    try {
      const [statsRes, auditRes] = await Promise.all([
        fetch(`${API}/api/admin/verification/stats`, { headers: h }),
        fetch(`${API}/api/admin/verification/audit-logs`, { headers: h }),
      ]);
      const s = await safeJson(statsRes);
      const a = await safeJson(auditRes);
      if (s.ok) { setStats(s.stats); setUsers(s.users || []); }
      else setLoadError(s.error || "Failed to load stats.");
      if (a.ok) setAuditLogs(a.logs || []);
    } catch (e: unknown) {
      const err = e as Error;
      setLoadError(err?.message || "Network error. Is the backend running?");
    } finally { setLoading(false); }
  }, [authHeaders]);

  useEffect(() => { if (ready && admin) load(); }, [ready, admin, load]);

  const doAction = useCallback(async (
    userId: string, url: string, method = "POST", body?: object
  ) => {
    const h = authHeaders();
    setBusyId(userId); setMsg(""); setMsgId(userId);
    try {
      const r = await fetch(url, {
        method, headers: { ...h, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = await safeJson(r);
      setMsg(d.ok ? "✓ Done." : (d.error || "Failed."));
      if (d.ok) await load();
    } catch (e: unknown) {
      const err = e as Error;
      setMsg(err?.message || "Network error.");
    } finally { setBusyId(null); }
  }, [authHeaders, load]);

  const filtered = useMemo(() => {
    let rows = users;
    if (filter !== "all") {
      rows = rows.filter(u =>
        filter === "verified" ? !!u.emailVerified :
        filter === "suspended" ? (!!u.suspended && !u.emailVerified) :
        (!u.emailVerified && !u.suspended)
      );
    }
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(u => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
    return rows;
  }, [users, filter, search]);

  const exportCsv = () => {
    const lines = ["Email,Name,Status,Verified At,Deadline,Suspended"];
    for (const u of filtered) {
      lines.push(`"${u.email}","${u.name}","${u.verificationStatus}","${u.emailVerifiedAt || ""}","${u.verificationDeadline || ""}","${u.suspended ? "Yes" : "No"}"`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ruhgen-verification-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (!ready) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" /></div>;
  if (!admin) return <div className="p-8 text-center"><Link href="/admin/login" className="text-[#00D4FF] underline">Sign in as admin</Link></div>;

  const statCards = stats ? [
    { label: "Total Users", value: stats.total, icon: Users, color: "#7B61FF" },
    { label: "Verified", value: stats.verified, icon: CheckCircle2, color: "#10b981" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "#00D4FF" },
    { label: "Suspended", value: stats.suspended, icon: Ban, color: "#f43f5e" },
    { label: "Verification Rate", value: `${stats.verificationRate}%`, icon: TrendingUp, color: "#7B61FF" },
    { label: "Today Registrations", value: stats.todayRegistrations, icon: Users, color: "#00D4FF" },
    { label: "Today Verified", value: stats.todayVerifications, icon: ShieldCheck, color: "#10b981" },
  ] : [];

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="mx-auto max-w-[1200px] space-y-8">

        {/* Error banner */}
        {loadError && (
          <div className="rounded-xl border px-5 py-4 flex items-start gap-3" style={{ borderColor: "rgba(244,63,94,0.35)", background: "rgba(244,63,94,0.06)" }}>
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-rose-400">Backend error — restart the dev server if this persists</p>
              <p className="text-xs mt-1 font-mono break-all" style={{ color: "var(--text-muted)" }}>{loadError}</p>
            </div>
            <button onClick={() => void load()} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e" }}>Retry</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>Admin · Email</p>
            <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Verification Management</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Monitor, manage and act on user email verification status.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admindashboard" className="inline-flex min-h-[40px] items-center rounded-xl border px-4 text-sm font-semibold"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>
              Dashboard
            </Link>
            <button onClick={() => void load()} disabled={loading}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
            <button onClick={exportCsv}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold"
              style={{ borderColor: "rgba(123,97,255,0.35)", background: "rgba(123,97,255,0.06)", color: "#7B61FF" }}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>{s.label}</span>
                  <s.icon className="h-4 w-4 shrink-0" style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-subtle)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or name…"
              className="w-full min-h-[40px] rounded-xl border pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
              style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }} />
          </div>
          {(["all", "pending", "verified", "suspended"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-colors"
              style={{
                borderColor: filter === f ? "rgba(123,97,255,0.5)" : "var(--border-subtle)",
                background: filter === f ? "rgba(123,97,255,0.1)" : "var(--soft-black)",
                color: filter === f ? "#7B61FF" : "var(--text-muted)",
              }}>
              {f}
            </button>
          ))}
          <span className="text-xs" style={{ color: "var(--text-subtle)" }}>{filtered.length} users</span>
        </div>

        {/* User Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}>
                  <th className="px-5 py-3 font-bold">User</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold hidden md:table-cell">Deadline</th>
                  <th className="px-3 py-3 font-bold hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center" style={{ color: "var(--text-muted)" }}>No users match your filter.</td></tr>
                )}
                {filtered.map(u => {
                  const verified = !!u.emailVerified;
                  const suspended = !!u.suspended && !verified;
                  const now = Date.now();
                  const urgency = !verified && u.verificationDeadline && (new Date(u.verificationDeadline).getTime() - now) < 86400000;
                  return (
                    <tr key={u.id} className="border-b transition-colors hover:bg-white/[0.02]" style={{ borderColor: "var(--border-subtle)" }}>
                      <td className="px-5 py-3">
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{u.name || "—"}</p>
                        <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{
                          background: verified ? "rgba(16,185,129,0.12)" : suspended ? "rgba(244,63,94,0.12)" : urgency ? "rgba(255,46,154,0.12)" : "rgba(123,97,255,0.12)",
                          color: verified ? "#10b981" : suspended ? "#f43f5e" : urgency ? "#FF2E9A" : "#7B61FF",
                        }}>
                          {verified ? <CheckCircle2 className="h-3 w-3" /> : suspended ? <Ban className="h-3 w-3" /> : urgency ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {verified ? "Verified" : suspended ? "Suspended" : urgency ? "Urgent" : "Pending"}
                        </span>
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {u.verificationDeadline ? new Date(u.verificationDeadline).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="hidden px-3 py-3 lg:table-cell font-mono text-xs" style={{ color: "var(--text-subtle)" }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {busyId === u.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7B61FF]" />}
                          {msgId === u.id && msg && (
                            <span className="text-[10px] font-semibold" style={{ color: msg.startsWith("✓") ? "#10b981" : "#f43f5e" }}>{msg}</span>
                          )}
                          {!verified && (
                            <ActionBtn icon={<Mail className="h-3.5 w-3.5" />} label="Resend"
                              onClick={() => doAction(u.id, `/api/admin/verification/resend/${u.id}`)}
                              disabled={busyId === u.id} color="purple" />
                          )}
                          {!verified && (
                            <ActionBtn icon={<KeyRound className="h-3.5 w-3.5" />} label="OTP"
                              onClick={() => doAction(u.id, `/api/admin/verification/generate-otp/${u.id}`)}
                              disabled={busyId === u.id} color="cyan" />
                          )}
                          {!verified && (
                            <ActionBtn icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Force Verify"
                              onClick={() => doAction(u.id, `/api/admin/verification/force-verify/${u.id}`)}
                              disabled={busyId === u.id} color="green" />
                          )}
                          {!verified && (
                            <ActionBtn icon={<Clock className="h-3.5 w-3.5" />} label="+7 days"
                              onClick={() => doAction(u.id, `/api/admin/verification/extend/${u.id}`, "POST", { days: 7 })}
                              disabled={busyId === u.id} color="cyan" />
                          )}
                          {suspended && (
                            <ActionBtn icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Unsuspend"
                              onClick={() => doAction(u.id, `/api/admin/verification/unsuspend/${u.id}`)}
                              disabled={busyId === u.id} color="green" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <button onClick={() => setShowAudit(!showAudit)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#7B61FF]" />
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Audit Logs</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(123,97,255,0.12)", color: "#7B61FF" }}>{auditLogs.length}</span>
            </div>
            <span className="text-xs" style={{ color: "var(--text-subtle)" }}>{showAudit ? "▲ Hide" : "▼ Show"}</span>
          </button>
          {showAudit && (
            <div className="border-t max-h-96 overflow-y-auto" style={{ borderColor: "var(--border-subtle)" }}>
              {auditLogs.length === 0 ? (
                <p className="px-6 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>No audit logs yet.</p>
              ) : auditLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 border-b px-6 py-3 text-xs hover:bg-white/[0.01]" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="font-mono shrink-0 mt-0.5" style={{ color: "var(--text-subtle)" }}>{new Date(log.timestamp).toLocaleString("en-IN")}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{log.action.replace(/_/g, " ")}</span>
                    {" — "}
                    <span style={{ color: "var(--text-muted)" }}>{log.targetEmail || log.target_user_id}</span>
                    {log.actor_email !== "system" && <span style={{ color: "var(--text-subtle)" }}> (by {log.actor_email})</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, disabled, color }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean;
  color: "purple" | "cyan" | "green";
}) {
  const colors = { purple: ["rgba(123,97,255,0.1)", "rgba(123,97,255,0.35)", "#7B61FF"], cyan: ["rgba(0,212,255,0.08)", "rgba(0,212,255,0.3)", "#00D4FF"], green: ["rgba(16,185,129,0.08)", "rgba(16,185,129,0.3)", "#10b981"] };
  const [bg, border, clr] = colors[color];
  return (
    <button onClick={onClick} disabled={disabled} title={label}
      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-40 transition-colors hover:brightness-110"
      style={{ background: bg, borderColor: border, color: clr }}>
      {icon} {label}
    </button>
  );
}
