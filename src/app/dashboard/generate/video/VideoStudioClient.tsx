"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  Clapperboard,
  Copy,
  Download,
  ExternalLink,
  ImagePlus,
  Loader2,
  RectangleHorizontal,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  Video as VideoIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { StudioSegmented, StudioWorkspaceHeader } from "@/components/studio/StudioWorkspaceChrome";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { useAuth } from "@/components/AuthProvider";
import { readUserToken } from "@/lib/auth-storage";
import { createVideoTask, pollPiApiTask, uploadStudioReferenceImage } from "@/lib/piapi-client";

const VERSIONS = ["2.6", "2.5", "2.1", "1.6", "1.5", "2.1-master"] as const;
const CHAT_STORAGE_PREFIX = "ruhgen-video-studio-chat-v1:";

type UserMsg = { id: string; role: "user"; content: string; meta: string };
type AssistantMsg = { id: string; role: "assistant"; loading: boolean; phase: string; urls: string[]; error: string | null };
type ChatMsg = UserMsg | AssistantMsg;

type PersistedChat = {
  v: 1;
  messages: Array<
    | { id: string; role: "user"; content: string; meta: string }
    | (Omit<AssistantMsg, "loading"> & { role: "assistant"; loading: false })
  >;
};

function sanitizeForStorage(messages: ChatMsg[]): PersistedChat["messages"] {
  const out: PersistedChat["messages"] = [];
  for (const m of messages) {
    if (m.role === "user") out.push({ id: m.id, role: "user", content: m.content, meta: m.meta });
    else if (!m.loading) out.push({ id: m.id, role: "assistant", loading: false, phase: m.phase, urls: m.urls, error: m.error });
  }
  return out;
}

function hydrateMessages(raw: PersistedChat["messages"]): ChatMsg[] {
  return raw.map((m) =>
    m.role === "user"
      ? { id: m.id, role: "user", content: m.content, meta: m.meta }
      : { id: m.id, role: "assistant", loading: false, phase: m.phase, urls: m.urls, error: m.error },
  );
}

function metaLine(opts: {
  duration: number;
  aspect: string;
  mode: string;
  version: string;
  hasNegative: boolean;
  hasImage: boolean;
}) {
  const parts = [
    `${opts.duration}s`,
    opts.aspect,
    opts.mode === "pro" ? "Pro" : "Standard",
    `v${opts.version}`,
  ];
  if (opts.hasNegative) parts.push("negative");
  if (opts.hasImage) parts.push("image ref");
  return parts.join(" · ");
}

function filenameFromVideoUrl(url: string, index: number) {
  try {
    const path = new URL(url).pathname;
    const seg = path.split("/").filter(Boolean).pop() ?? "";
    const clean = seg.replace(/[^a-zA-Z0-9._-]/g, "");
    if (clean && clean.includes(".")) return clean;
  } catch {
    /* ignore */
  }
  return `ruhgen-video-${index + 1}.mp4`;
}

async function downloadVideoViaProxy(url: string, index: number): Promise<void> {
  const token = readUserToken();
  if (!token) throw new Error("Sign in required.");
  const res = await fetch("/api/studio/download-video", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const raw = await res.text();
    let msg = `Download failed (HTTP ${res.status}).`;
    try {
      const j = JSON.parse(raw) as { error?: string; message?: string };
      if (typeof j.error === "string" && j.error.trim()) msg = j.error.trim();
      else if (typeof j.message === "string" && j.message.trim() && j.message !== "success") msg = j.message.trim();
    } catch {
      if (raw.trim()) msg = raw.trim().slice(0, 400);
    }
    throw new Error(msg);
  }
  if ((res.headers.get("content-type") || "").includes("application/json")) {
    const raw = await res.text();
    let err = "Download failed.";
    try {
      const j = JSON.parse(raw) as { error?: string };
      if (typeof j.error === "string" && j.error.trim()) err = j.error.trim();
    } catch {
      /* ignore */
    }
    throw new Error(err);
  }
  const blob = await res.blob();
  let name = filenameFromVideoUrl(url, index);
  const cd = res.headers.get("Content-Disposition");
  if (cd) {
    const m = /filename\*=UTF-8''([^;\n]+)|filename="([^"]+)"/i.exec(cd);
    const raw = (m?.[1] || m?.[2] || "").trim();
    if (raw) {
      try {
        name = decodeURIComponent(raw.replace(/\+/g, " "));
      } catch {
        name = raw;
      }
    }
  }
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(href);
}

const btnGhost =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-all duration-200 hover:bg-white/[0.05] disabled:opacity-40 disabled:hover:bg-transparent";

export default function VideoStudioClient() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refFileInput = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [aspect, setAspect] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [mode, setMode] = useState<"std" | "pro">("std");
  const [version, setVersion] = useState<string>("2.6");
  const [imageUrl, setImageUrl] = useState("");
  const [refUploading, setRefUploading] = useState(false);
  const [refUploadError, setRefUploadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/generate/video");
  }, [ready, user, router]);

  /** Home-page demo session → studio handoff (prompt, duration, frame, quality). */
  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("ruhgen.videoDemo.handoff");
      if (!raw) return;
      sessionStorage.removeItem("ruhgen.videoDemo.handoff");
      const d = JSON.parse(raw) as {
        prompt?: string;
        duration?: number;
        aspect?: string;
        mode?: string;
      };
      if (typeof d.prompt === "string" && d.prompt.trim()) setPrompt(d.prompt.trim());
      if (d.duration === 10 || d.duration === 5) setDuration(d.duration);
      if (d.aspect === "16:9" || d.aspect === "9:16" || d.aspect === "1:1") setAspect(d.aspect);
      if (d.mode === "std" || d.mode === "pro") setMode(d.mode);
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedChat;
        if (parsed?.v === 1 && Array.isArray(parsed.messages)) setMessages(hydrateMessages(parsed.messages));
      }
    } catch {
      /* ignore */
    }
    setHistoryLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !historyLoaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(`${CHAT_STORAGE_PREFIX}${user.id}`, JSON.stringify({ v: 1, messages: sanitizeForStorage(messages) }));
      } catch {
        /* quota */
      }
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [messages, user?.id, historyLoaded]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, reduce]);

  useEffect(() => {
    if (!copyToast) return;
    const t = window.setTimeout(() => setCopyToast(null), 2000);
    return () => window.clearTimeout(t);
  }, [copyToast]);

  useEffect(() => {
    if (version === "2.1-master" && mode !== "pro") setMode("pro");
  }, [version, mode]);

  const run = useCallback(async () => {
    const p = prompt.trim();
    if (p.length < 2 || busy) return;
    const neg = negativePrompt.trim();
    const img = imageUrl.trim();
    const meta = metaLine({
      duration,
      aspect,
      mode,
      version,
      hasNegative: neg.length > 0,
      hasImage: img.length > 0,
    });
    const userId = crypto.randomUUID();
    const asstId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: p, meta },
      { id: asstId, role: "assistant", loading: true, phase: "Submitting…", urls: [], error: null },
    ]);
    setPrompt("");
    setBusy(true);
    try {
      const { taskId } = await createVideoTask({
        prompt: p,
        duration,
        aspect_ratio: aspect,
        mode,
        version,
        negative_prompt: neg || undefined,
        image_url: img || undefined,
      });
      setMessages((prev) => prev.map((x) => (x.id === asstId ? { ...x, phase: "Rendering video…" } : x)));
      const result = await pollPiApiTask(taskId, {
        intervalMs: 3000,
        maxAttempts: 200,
        onStatus: (s) => {
          setMessages((prev) => prev.map((x) => (x.id === asstId ? { ...x, phase: `Status: ${s}` } : x)));
        },
      });
      if (!result.urls.length) {
        setMessages((prev) =>
          prev.map((x) =>
            x.id === asstId
              ? { ...x, loading: false, phase: "", urls: [], error: "Task completed but no video URL was returned." }
              : x,
          ),
        );
      } else {
        setMessages((prev) =>
          prev.map((x) => (x.id === asstId ? { ...x, loading: false, phase: "", urls: result.urls, error: null } : x)),
        );
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : "Something went wrong.";
      setMessages((prev) => prev.map((x) => (x.id === asstId ? { ...x, loading: false, phase: "", urls: [], error: err } : x)));
    } finally {
      setBusy(false);
    }
  }, [prompt, negativePrompt, duration, aspect, mode, version, imageUrl, busy]);

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    if (user?.id && typeof window !== "undefined") {
      try {
        localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${user.id}`);
      } catch {
        /* ignore */
      }
    }
  }, [user?.id]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(label);
    } catch {
      setCopyToast("Could not copy");
    }
  };

  if (!ready) return <DashboardLoading label="Loading video studio…" />;
  if (!user) return null;

  const selectCls =
    "min-h-[36px] w-full cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition-colors focus:ring-2 focus:ring-[#00D4FF]/40 hover:border-[color-mix(in_srgb,var(--primary-cyan)_35%,var(--border-subtle))] sm:min-h-[38px] sm:text-sm";

  const aspectButtons: { key: typeof aspect; label: string; icon: typeof RectangleHorizontal }[] = [
    { key: "16:9", label: "16:9", icon: RectangleHorizontal },
    { key: "9:16", label: "9:16", icon: Smartphone },
    { key: "1:1", label: "1:1", icon: Square },
  ];

  return (
    <motion.div
      className="studio-page studio-page--video flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-4 pb-0 pt-4 max-sm:h-[calc(100dvh-env(safe-area-inset-top,0px)-3.5rem)] sm:h-[calc(100dvh-env(safe-area-inset-top,0px)-4rem)] sm:px-6 sm:pt-5 lg:h-[calc(100dvh-env(safe-area-inset-top,0px))] lg:gap-6 lg:px-10 lg:pb-0 lg:pt-6"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StudioWorkspaceHeader
        eyebrow="Motion"
        title="Video studio"
        subtitle="Full-width canvas · render controls live in the composer under the timeline."
        icon={VideoIcon}
        accent="video"
        crossStudioLink={{ href: "/dashboard/generate/image", label: "Image" }}
        actions={
          <>
            <button
              type="button"
              disabled={messages.length === 0}
              onClick={() => {
                if (messages.length === 0) return;
                if (!window.confirm("Clear chat?")) return;
                clearChatHistory();
              }}
              className={btnGhost}
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              Clear
            </button>
            <Link
              href="/dashboard/billing"
              className={`${btnGhost} text-white`}
              style={{
                background: "linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))",
                boxShadow: "0 8px 28px -8px rgba(0,212,255,0.45)",
                borderColor: "transparent",
              }}
            >
              Credits
            </Link>
            <Link href="/dashboard" className={btnGhost} style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>
              Dashboard
            </Link>
          </>
        }
      />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      {copyToast ? (
        <p
          className="mx-auto shrink-0 rounded-full border px-3 py-1.5 text-center text-xs font-medium sm:text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--primary-cyan) 35%, var(--border-subtle))",
            background: "color-mix(in srgb, var(--primary-cyan) 10%, var(--deep-black))",
            color: "var(--primary-cyan)",
          }}
          role="status"
        >
          {copyToast}
        </p>
      ) : null}

      <div className="studio-session-shell studio-session-shell--video min-h-0 flex-1">
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-3 sm:px-5 sm:py-3.5"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ring-1 ring-white/12"
              style={{
                background: "linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))",
                boxShadow: "0 8px 24px -12px rgba(0,212,255,0.45)",
              }}
            >
              <Clapperboard className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Session
              </p>
              <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Conversation
              </p>
            </div>
          </div>
          <p className="hidden text-xs sm:block" style={{ color: "var(--text-muted)" }}>
            Scroll for full history
          </p>
        </div>

      <div
        ref={scrollRef}
        className="studio-output min-h-0 flex-1 basis-0 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
      >
        {messages.length === 0 ? (
          <div
            className="relative flex min-h-[200px] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border px-6 py-12 text-center sm:min-h-[220px] sm:py-14"
            style={{
              borderColor: "color-mix(in srgb, var(--primary-cyan) 28%, var(--border-subtle))",
              background:
                "radial-gradient(ellipse 85% 70% at 50% 0%, color-mix(in srgb, var(--primary-cyan) 12%, transparent), transparent 55%), var(--deep-black)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
              }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ring-1 ring-white/10"
              style={{
                background: "linear-gradient(145deg, color-mix(in srgb, var(--primary-cyan) 22%, var(--deep-black)), var(--soft-black))",
                borderColor: "var(--border-subtle)",
                boxShadow: "0 16px 48px -20px rgba(0,212,255,0.35)",
              }}
            >
              <Sparkles className="h-8 w-8" style={{ color: "var(--primary-cyan)" }} strokeWidth={1.5} />
            </div>
            <div className="relative max-w-[280px] space-y-2">
              <p className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Ready when you are
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Tune duration, aspect, and engine in the dock, then describe motion — clips appear above.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[min(100%,960px)] flex-col gap-6 px-1">
            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      className="max-w-[min(100%,560px)] rounded-2xl rounded-br-md border px-4 py-3.5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.06]"
                      style={{
                        borderColor: "color-mix(in srgb, var(--primary-cyan) 35%, var(--border-subtle))",
                        background: "color-mix(in srgb, var(--primary-cyan) 10%, var(--deep-black))",
                      }}
                    >
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                        {msg.content}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium" style={{ color: "var(--text-subtle)" }}>
                          {msg.meta}
                        </p>
                        <button
                          type="button"
                          onClick={() => void copyText(msg.content, "Prompt copied")}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-[var(--primary-cyan)] hover:underline"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={msg.id} className="flex justify-start">
                  <div
                    className="w-full max-w-[min(100%,720px)] rounded-2xl rounded-bl-md border px-4 py-3.5 shadow-[0_8px_28px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.05]"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                  >
                    {msg.loading ? (
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#00D4FF]" />
                          {msg.phase || "Working…"}
                        </p>
                        <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#7B61FF]"
                            animate={reduce ? undefined : { x: ["-100%", "400%"] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      </div>
                    ) : null}
                    {msg.error ? <p className="text-sm text-rose-100">{msg.error}</p> : null}
                    {msg.urls.length > 0 ? (
                      <div className="mt-3 space-y-4">
                        {msg.urls.map((src, vidx) => (
                          <div key={src} className="space-y-2">
                            <video
                              src={src}
                              controls
                              playsInline
                              className="w-full max-w-3xl overflow-hidden rounded-2xl border bg-black shadow-[0_12px_40px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]"
                              style={{ borderColor: "var(--border-subtle)" }}
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={downloadingKey !== null}
                                onClick={() => {
                                  setDownloadError(null);
                                  const key = `${msg.id}-${vidx}`;
                                  setDownloadingKey(key);
                                  void downloadVideoViaProxy(src, vidx)
                                    .catch((e: unknown) => setDownloadError(e instanceof Error ? e.message : "Download failed."))
                                    .finally(() => setDownloadingKey(null));
                                }}
                                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors hover:border-[#00D4FF]/50 hover:bg-white/[0.04] disabled:opacity-60 sm:flex-none sm:px-4"
                                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                              >
                                {downloadingKey === `${msg.id}-${vidx}` ? (
                                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#00D4FF]" strokeWidth={2} />
                                ) : (
                                  <Download className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                                )}
                                {downloadingKey === `${msg.id}-${vidx}` ? "Saving…" : "Download"}
                              </button>
                              <a
                                href={src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors hover:border-[#00D4FF]/50 hover:bg-white/[0.04]"
                                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                              >
                                <ExternalLink className="h-4 w-4 text-[#00D4FF]" />
                                Open
                              </a>
                              <button
                                type="button"
                                onClick={() => void copyText(src, "Video URL copied")}
                                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors hover:border-[#00D4FF]/50 hover:bg-white/[0.04]"
                                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                              >
                                <Copy className="h-4 w-4" />
                                Copy URL
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {downloadError ? (
        <p className="shrink-0 rounded-xl border border-[#FF2E9A]/35 bg-[#FF2E9A]/10 px-3 py-2 text-xs text-rose-100 sm:text-sm">
          {downloadError}
        </p>
      ) : null}

      <div className="studio-composer-dock studio-composer-dock--video studio-composer shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="mx-auto max-w-[min(100%,960px)]">
          <p className="sr-only">Press Enter to generate. Shift+Enter for a new line.</p>
          <div
            className="rounded-xl border p-2.5 sm:p-3"
            style={{
              borderColor: "color-mix(in srgb, var(--primary-cyan) 26%, var(--border-subtle))",
              background:
                "linear-gradient(165deg, color-mix(in srgb, var(--primary-cyan) 7%, var(--deep-black)) 0%, color-mix(in srgb, var(--rich-black) 100%, transparent) 100%)",
              boxShadow: "inset 0 1px 0 0 color-mix(in srgb, white 5%, transparent)",
            }}
          >
            <div className="mb-2 flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
              <Clapperboard className="h-3.5 w-3.5 shrink-0 text-cyan-300" strokeWidth={2} />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--text-subtle)" }}>
                Prompt & render
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:items-end">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                  Length
                </span>
                <StudioSegmented
                  tone="cyan"
                  name="duration"
                  value={String(duration) as "5" | "10"}
                  onChange={(v) => setDuration(Number(v) as 5 | 10)}
                  disabled={busy}
                  options={[
                    { value: "5", label: "5s" },
                    { value: "10", label: "10s" },
                  ]}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                  Mode
                </span>
                <StudioSegmented
                  tone="cyan"
                  name="mode"
                  value={mode}
                  onChange={(v) => setMode(v as "std" | "pro")}
                  disabled={busy}
                  options={[
                    { value: "std", label: "Std" },
                    { value: "pro", label: "Pro" },
                  ]}
                />
              </div>
              <div className="col-span-2 space-y-1 sm:col-span-2">
                <label htmlFor="vid-ver" className="block text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                  Engine
                </label>
                <select
                  id="vid-ver"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={busy}
                  className={selectCls}
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                >
                  {VERSIONS.map((v) => (
                    <option key={v} value={v}>
                      v{v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-2">
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                Aspect
              </span>
              <div className="grid grid-cols-3 gap-1">
                {aspectButtons.map(({ key, label, icon: Icon }) => {
                  const on = aspect === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={busy}
                      onClick={() => setAspect(key)}
                      className="flex min-h-[38px] flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1 text-center text-[10px] font-bold transition-all enabled:hover:bg-white/[0.04] disabled:opacity-50"
                      style={{
                        borderColor: on ? "color-mix(in srgb, var(--primary-cyan) 45%, var(--border-subtle))" : "var(--border-subtle)",
                        background: on ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--deep-black))" : "var(--soft-black)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <Icon className="h-4 w-4 opacity-90" strokeWidth={1.75} style={{ color: on ? "var(--primary-cyan)" : "var(--text-muted)" }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label htmlFor="vid-negative" className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                  Negative <span className="font-normal opacity-80">(opt.)</span>
                </label>
                <textarea
                  id="vid-negative"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value.slice(0, 2500))}
                  disabled={busy}
                  placeholder="Avoid…"
                  rows={2}
                  className="w-full resize-none rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#00D4FF]/30"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--deep-black)",
                    color: "var(--text-primary)",
                    minHeight: "2.75rem",
                  }}
                />
                <p className="mt-0.5 text-right text-[9px] tabular-nums" style={{ color: "var(--text-subtle)" }}>
                  {negativePrompt.length}/2500
                </p>
              </div>
              <div
                className="flex flex-col rounded-lg border p-2 sm:max-w-[11rem]"
                style={{
                  borderColor: "color-mix(in srgb, var(--primary-cyan) 20%, var(--border-subtle))",
                  background: "color-mix(in srgb, var(--primary-cyan) 5%, var(--deep-black))",
                }}
              >
                <span className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                  Start
                </span>
                <input
                  ref={refFileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  disabled={busy || refUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    setRefUploadError(null);
                    setRefUploading(true);
                    void uploadStudioReferenceImage(f)
                      .then(({ url }) => setImageUrl(url))
                      .catch((err: unknown) => setRefUploadError(err instanceof Error ? err.message : "Upload failed."))
                      .finally(() => setRefUploading(false));
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy || refUploading}
                    onClick={() => refFileInput.current?.click()}
                    className="inline-flex min-h-[32px] flex-1 items-center justify-center gap-1 rounded-lg border px-2 text-[11px] font-semibold transition-colors hover:bg-white/[0.05] disabled:opacity-40"
                    style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                  >
                    {refUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00D4FF]" /> : <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />}
                    {refUploading ? "…" : "Upload"}
                  </button>
                  {imageUrl.trim() ? (
                    <button
                      type="button"
                      disabled={busy || refUploading}
                      onClick={() => {
                        setImageUrl("");
                        setRefUploadError(null);
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-white/[0.05]"
                      style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
                      aria-label="Clear start frame"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  ) : null}
                  {imageUrl.trim() ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border" style={{ borderColor: "var(--border-subtle)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl.trim()} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                </div>
                {refUploadError ? <p className="mt-1 text-[10px] text-rose-200">{refUploadError}</p> : null}
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setRefUploadError(null);
                    setImageUrl(e.target.value);
                  }}
                  disabled={busy}
                  placeholder="https://…"
                  className="mt-1.5 min-h-[30px] w-full rounded-md border px-2 py-1 font-mono text-[10px] outline-none focus:ring-1 focus:ring-[#00D4FF]/40"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-muted)" }}
                />
              </div>
            </div>

            <div className="mt-2.5 border-t border-white/[0.08] pt-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                  Motion prompt
                </span>
                <span className="text-[9px] tabular-nums" style={{ color: "var(--text-subtle)" }}>
                  {prompt.length} chars
                </span>
              </div>
              <div
                className="studio-prompt-focus-video flex items-end gap-1.5 rounded-lg border px-2 py-1.5 transition-shadow sm:gap-2 sm:px-2.5 sm:py-2"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "color-mix(in srgb, var(--deep-black) 96%, transparent)",
                }}
              >
                <label className="sr-only" htmlFor="vid-prompt">
                  Prompt
                </label>
                <textarea
                  id="vid-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Motion, camera, lighting…"
                  rows={2}
                  disabled={busy}
                  className="max-h-[160px] min-h-[44px] w-full resize-y bg-transparent py-1 text-sm outline-none placeholder:text-[var(--text-subtle)] sm:text-[15px]"
                  style={{ color: "var(--text-primary)" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void run();
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={busy || prompt.trim().length < 2}
                  onClick={() => void run()}
                  className="btn-gradient-video flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-40 sm:h-10 sm:w-10"
                  aria-label="Generate video"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.25} />}
                </button>
              </div>
              <p className="mt-1 text-[9px] leading-relaxed" style={{ color: "var(--text-subtle)" }}>
                Enter send · Shift+Enter newline
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
        </div>
    </motion.div>
  );
}
