"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  ImagePlus,
  LayoutGrid,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { StudioWorkspaceHeader } from "@/components/studio/StudioWorkspaceChrome";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { useAuth } from "@/components/AuthProvider";
import { readUserToken } from "@/lib/auth-storage";
import { createImageTask, pollPiApiTask, uploadStudioReferenceImage } from "@/lib/piapi-client";

const MODELS = [
  { id: "Qubico/flux1-dev", label: "Quality" },
  { id: "Qubico/flux1-schnell", label: "Fast" },
] as const;

const SIZES = [
  { w: 1024, h: 1024, label: "1:1", sub: "1024²" },
  { w: 1280, h: 720, label: "16:9", sub: "1280×720" },
  { w: 768, h: 1024, label: "3:4", sub: "768×1024" },
  { w: 1024, h: 768, label: "4:3", sub: "1024×768" },
] as const;

const CHAT_STORAGE_PREFIX = "ruhgen-image-studio-chat-v1:";

type UserMsg = { id: string; role: "user"; content: string; meta: string; refineFromUrl?: string };
type AssistantMsg = { id: string; role: "assistant"; loading: boolean; phase: string; urls: string[]; error: string | null };
type ChatMsg = UserMsg | AssistantMsg;

type PersistedChat = {
  v: 1;
  messages: Array<
    | (Omit<UserMsg, "role"> & { role: "user" })
    | (Omit<AssistantMsg, "loading"> & { role: "assistant"; loading: false })
  >;
};

function filenameFromImageUrl(url: string, index: number) {
  try {
    const path = new URL(url).pathname;
    const seg = path.split("/").filter(Boolean).pop() ?? "";
    const clean = seg.replace(/[^a-zA-Z0-9._-]/g, "");
    if (clean && clean.includes(".")) return clean;
  } catch {
    /* ignore */
  }
  return `ruhgen-image-${index + 1}.png`;
}

async function downloadImageViaProxy(url: string, index: number): Promise<void> {
  const token = readUserToken();
  if (!token) throw new Error("Sign in required.");
  const res = await fetch("/api/studio/download-image", {
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
  let name = filenameFromImageUrl(url, index);
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

function sanitizeForStorage(messages: ChatMsg[]): PersistedChat["messages"] {
  const out: PersistedChat["messages"] = [];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ id: m.id, role: "user", content: m.content, meta: m.meta, refineFromUrl: m.refineFromUrl });
    } else if (!m.loading) {
      out.push({ id: m.id, role: "assistant", loading: false, phase: m.phase, urls: m.urls, error: m.error });
    }
  }
  return out;
}

function hydrateMessages(raw: PersistedChat["messages"]): ChatMsg[] {
  const list: ChatMsg[] = [];
  for (const m of raw) {
    if (m.role === "user") {
      list.push({ id: m.id, role: "user", content: m.content, meta: m.meta, refineFromUrl: m.refineFromUrl });
    } else {
      list.push({ id: m.id, role: "assistant", loading: false, phase: m.phase, urls: m.urls, error: m.error });
    }
  }
  return list;
}

const btnGhost =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-all duration-200 hover:bg-white/[0.05] disabled:opacity-40 disabled:hover:bg-transparent";

export default function ImageStudioClient() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refFileInput = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingIdx, setDownloadingIdx] = useState<{ key: string; idx: number } | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [editDenoise, setEditDenoise] = useState(0.65);
  const [editNegative, setEditNegative] = useState("");
  const [guidanceScale, setGuidanceScale] = useState(3.5);
  const [refUploading, setRefUploading] = useState(false);
  const [refUploadError, setRefUploadError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/generate/image");
  }, [ready, user, router]);

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

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    setReferenceImageUrl(null);
    if (user?.id && typeof window !== "undefined") {
      try {
        localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${user.id}`);
      } catch {
        /* ignore */
      }
    }
  }, [user?.id]);

  const run = useCallback(async () => {
    const p = prompt.trim();
    if (p.length < 2 || busy) return;
    const modelId = model;
    const { w, h } = SIZES[sizeIdx];
    const modelLabel = MODELS.find((m) => m.id === modelId)?.label ?? modelId;
    const sizeLabel = SIZES[sizeIdx].label;
    const refUrl = referenceImageUrl?.trim() || null;
    const negTxt = negativePrompt.trim();
    let meta: string;
    if (refUrl) {
      meta = `Edit · ${Math.round(editDenoise * 100)}% · guidance ${guidanceScale.toFixed(1)} · ${modelLabel}`;
      if (editNegative.trim()) meta += " · negative";
    } else {
      meta = `${modelLabel} · ${sizeLabel} (${w}×${h})`;
      if (negTxt) meta += " · negative prompt";
    }
    const userId = crypto.randomUUID();
    const asstId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: p, meta, refineFromUrl: refUrl ?? undefined },
      { id: asstId, role: "assistant", loading: true, phase: "Submitting…", urls: [], error: null },
    ]);
    setPrompt("");
    setReferenceImageUrl(null);
    setBusy(true);
    try {
      const { taskId } = await createImageTask({
        prompt: p,
        model: modelId,
        ...(refUrl
          ? {
              image_url: refUrl,
              denoise: editDenoise,
              guidance_scale: guidanceScale,
              ...(editNegative.trim() ? { negative_prompt: editNegative.trim() } : {}),
            }
          : { width: w, height: h, ...(negTxt ? { negative_prompt: negTxt } : {}) }),
      });
      setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, phase: "Generating…" } : m)));
      const result = await pollPiApiTask(taskId, {
        onStatus: (s) => {
          setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, phase: `Status: ${s}` } : m)));
        },
      });
      if (!result.urls.length) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  loading: false,
                  phase: "",
                  urls: [],
                  error: "Generation finished but no image URL was returned. Try again.",
                }
              : m,
          ),
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, loading: false, phase: "", urls: result.urls, error: null } : m)),
        );
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : "Something went wrong.";
      setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, loading: false, phase: "", urls: [], error: err } : m)));
    } finally {
      setBusy(false);
    }
  }, [prompt, model, sizeIdx, busy, referenceImageUrl, editDenoise, editNegative, negativePrompt, guidanceScale]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(label);
    } catch {
      setCopyToast("Could not copy");
    }
  };

  if (!ready) return <DashboardLoading label="Loading image studio…" />;
  if (!user) return null;

  const selectCls =
    "min-h-[36px] w-full cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition-colors focus:ring-2 focus:ring-[#7B61FF]/40 hover:border-[color-mix(in_srgb,var(--primary-purple)_35%,var(--border-subtle))] sm:min-h-[38px] sm:text-sm";
  const isEdit = Boolean(referenceImageUrl);

  return (
    <motion.div
      className="studio-page studio-page--image flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-4 pb-0 pt-4 max-sm:h-[calc(100dvh-env(safe-area-inset-top,0px)-3.5rem)] sm:h-[calc(100dvh-env(safe-area-inset-top,0px)-4rem)] sm:px-6 sm:pt-5 lg:h-[calc(100dvh-env(safe-area-inset-top,0px))] lg:gap-6 lg:px-10 lg:pb-0 lg:pt-6"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StudioWorkspaceHeader
        eyebrow="Still frames"
        title="Image studio"
        subtitle="Full-width canvas · controls sit in the composer under the timeline."
        icon={ImageIcon}
        accent="image"
        crossStudioLink={{ href: "/dashboard/generate/video", label: "Video" }}
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
              className={`${btnGhost} border-[color-mix(in_srgb,var(--primary-purple)_25%,var(--border-subtle))] text-white`}
              style={{
                background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))",
                boxShadow: "0 8px 28px -8px rgba(123,97,255,0.5)",
              }}
            >
              Credits
            </Link>
            <Link
              href="/dashboard"
              className={btnGhost}
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            >
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

      <div className="studio-session-shell studio-session-shell--image min-h-0 flex-1">
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-3 sm:px-5 sm:py-3.5"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ring-1 ring-white/12"
              style={{
                background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))",
                boxShadow: "0 8px 24px -12px rgba(123,97,255,0.55)",
              }}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={2} />
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
            Newest at the bottom
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
              borderColor: "color-mix(in srgb, var(--primary-purple) 25%, var(--border-subtle))",
              background:
                "radial-gradient(ellipse 85% 70% at 50% 0%, color-mix(in srgb, var(--primary-purple) 14%, transparent), transparent 55%), var(--deep-black)",
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
                background: "linear-gradient(145deg, color-mix(in srgb, var(--primary-purple) 28%, var(--deep-black)), var(--soft-black))",
                borderColor: "var(--border-subtle)",
                boxShadow: "0 16px 48px -20px rgba(123,97,255,0.45)",
              }}
            >
              <Sparkles className="h-8 w-8" style={{ color: "var(--primary-cyan)" }} strokeWidth={1.5} />
            </div>
            <div className="relative max-w-[280px] space-y-2">
              <p className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Your canvas is empty
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Set size and model in the dock below, then describe your image — generations appear here.
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
                        borderColor: "color-mix(in srgb, var(--primary-purple) 35%, var(--border-subtle))",
                        background: "color-mix(in srgb, var(--primary-purple) 12%, var(--deep-black))",
                      }}
                    >
                      <div className="flex gap-3">
                        {msg.refineFromUrl ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.refineFromUrl} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : null}
                        <div className="min-w-0 flex-1">
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
                    </div>
                  </div>
                );
              }
              return (
                <div key={msg.id} className="flex justify-start">
                  <div
                    className="max-w-[min(100%,720px)] rounded-2xl rounded-bl-md border px-4 py-3.5 shadow-[0_8px_28px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.05]"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                  >
                    {msg.loading ? (
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#7B61FF]" />
                          {msg.phase || "Working…"}
                        </p>
                        <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#00D4FF]"
                            animate={reduce ? undefined : { x: ["-100%", "400%"] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      </div>
                    ) : null}
                    {msg.error ? <p className="text-sm text-rose-100">{msg.error}</p> : null}
                    {msg.urls.length > 0 ? (
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        {msg.urls.map((src, idx) => (
                          <div
                            key={`${msg.id}-${src}`}
                            className="overflow-hidden rounded-2xl border shadow-[0_12px_40px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
                          >
                            <a href={src} target="_blank" rel="noopener noreferrer" className="group relative block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="Generated" className="aspect-square w-full bg-black/40 object-contain" />
                              <span className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-white">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Open
                                </span>
                              </span>
                            </a>
                            <div className="flex flex-col gap-2 border-t p-2.5" style={{ borderColor: "var(--border-subtle)" }}>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  setReferenceImageUrl(src);
                                  setPrompt("");
                                  document.getElementById("img-prompt")?.focus();
                                }}
                                className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-colors hover:border-[#7B61FF]/50 hover:bg-white/[0.04] disabled:opacity-60 sm:text-sm"
                                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                              >
                                <Wand2 className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
                                Refine
                              </button>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={downloadingIdx !== null}
                                  onClick={() => {
                                    setDownloadError(null);
                                    setDownloadingIdx({ key: msg.id, idx });
                                    void downloadImageViaProxy(src, idx)
                                      .catch((e: unknown) => {
                                        setDownloadError(e instanceof Error ? e.message : "Download failed.");
                                      })
                                      .finally(() => setDownloadingIdx(null));
                                  }}
                                  className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border px-2 text-xs font-semibold transition-colors hover:border-[#7B61FF]/50 hover:bg-white/[0.04] disabled:opacity-60 sm:text-sm"
                                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                                >
                                  {downloadingIdx?.key === msg.id && downloadingIdx.idx === idx ? (
                                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#7B61FF]" strokeWidth={2} />
                                  ) : (
                                    <Download className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
                                  )}
                                  Download
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void copyText(src, "Link copied")}
                                  className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border px-2 text-xs font-semibold transition-colors hover:border-[#7B61FF]/50 hover:bg-white/[0.04] sm:text-sm"
                                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy link
                                </button>
                              </div>
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

      <div className="studio-composer-dock studio-composer-dock--image studio-composer shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="mx-auto max-w-[min(100%,960px)]">
          <p className="sr-only">Press Enter to generate. Shift+Enter for a new line.</p>
          <div
            className="rounded-xl border p-2.5 sm:p-3"
            style={{
              borderColor: "color-mix(in srgb, var(--primary-purple) 26%, var(--border-subtle))",
              background:
                "linear-gradient(165deg, color-mix(in srgb, var(--primary-purple) 7%, var(--deep-black)) 0%, color-mix(in srgb, var(--rich-black) 100%, transparent) 100%)",
              boxShadow: "inset 0 1px 0 0 color-mix(in srgb, white 5%, transparent)",
            }}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
              <div className="flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 shrink-0 text-violet-300" strokeWidth={2} />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--text-subtle)" }}>
                  Prompt & settings
                </span>
              </div>
              {isEdit ? (
                <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                  Edit mode · size locked
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                  Size
                </p>
                <div
                  className="flex gap-0.5 rounded-lg border p-0.5"
                  style={{ borderColor: "var(--border-subtle)", background: "color-mix(in srgb, var(--deep-black) 94%, transparent)" }}
                  role="radiogroup"
                  aria-label="Output size"
                >
                  {SIZES.map((s, i) => {
                    const on = sizeIdx === i;
                    const disabled = busy || isEdit;
                    return (
                      <button
                        key={`${s.w}x${s.h}`}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={disabled}
                        onClick={() => setSizeIdx(i)}
                        className="flex min-h-[36px] min-w-0 flex-1 flex-col items-center justify-center rounded-md px-0.5 py-1 text-center text-[9px] font-bold leading-tight transition-all enabled:hover:bg-white/[0.05] disabled:opacity-50 sm:min-h-[38px] sm:text-[10px]"
                        style={{
                          border: on ? "1px solid color-mix(in srgb, var(--primary-purple) 45%, transparent)" : "1px solid transparent",
                          background: on ? "color-mix(in srgb, var(--primary-purple) 15%, var(--deep-black))" : "transparent",
                          color: "var(--text-primary)",
                        }}
                      >
                        <span className="tabular-nums">{s.label}</span>
                        <span className="hidden tabular-nums sm:block" style={{ color: "var(--text-subtle)", fontSize: "8px", fontWeight: 500 }}>
                          {s.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="w-full shrink-0 sm:w-[min(100%,9.5rem)]">
                <label htmlFor="img-model" className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                  Model
                </label>
                <select
                  id="img-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={busy}
                  className={selectCls}
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!isEdit ? (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label htmlFor="img-neg-create" className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                    Negative <span className="font-normal opacity-80">(opt.)</span>
                  </label>
                  <textarea
                    id="img-neg-create"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value.slice(0, 2000))}
                    disabled={busy}
                    placeholder="Avoid…"
                    rows={2}
                    className="w-full resize-none rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/30"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)", minHeight: "2.75rem" }}
                  />
                  <p className="mt-0.5 text-right text-[9px] tabular-nums" style={{ color: "var(--text-subtle)" }}>
                    {negativePrompt.length}/2000
                  </p>
                </div>
                <div
                  className="flex flex-col rounded-lg border p-2 sm:max-w-[11rem]"
                  style={{
                    borderColor: "color-mix(in srgb, var(--primary-purple) 20%, var(--border-subtle))",
                    background: "color-mix(in srgb, var(--primary-purple) 5%, var(--deep-black))",
                  }}
                >
                  <span className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                    Ref.
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
                        .then(({ url }) => setReferenceImageUrl(url))
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
                      {refUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7B61FF]" /> : <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />}
                      {refUploading ? "…" : "Upload"}
                    </button>
                    {referenceImageUrl ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setReferenceImageUrl(null);
                          setRefUploadError(null);
                        }}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-white/[0.05]"
                        style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
                        aria-label="Remove reference"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    {referenceImageUrl ? (
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border" style={{ borderColor: "var(--border-subtle)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={referenceImageUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                  {refUploadError ? <p className="mt-1 text-[10px] text-rose-200">{refUploadError}</p> : null}
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2 rounded-lg border border-white/[0.06] p-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0">
                <div>
                  <label htmlFor="img-denoise" className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                    Strength {Math.round(editDenoise * 100)}%
                  </label>
                  <input
                    id="img-denoise"
                    type="range"
                    min={35}
                    max={85}
                    step={5}
                    value={Math.round(editDenoise * 100)}
                    onChange={(e) => setEditDenoise(Number(e.target.value) / 100)}
                    disabled={busy}
                    className="mt-1 h-1.5 w-full accent-[#7B61FF]"
                  />
                </div>
                <div>
                  <label htmlFor="img-guidance" className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                    Guidance {guidanceScale.toFixed(1)}
                  </label>
                  <input
                    id="img-guidance"
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={Math.round(guidanceScale * 10)}
                    onChange={(e) => setGuidanceScale(Number(e.target.value) / 10)}
                    disabled={busy}
                    className="mt-1 h-1.5 w-full accent-[#7B61FF]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="img-neg-edit" className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                    Negative
                  </label>
                  <input
                    id="img-neg-edit"
                    type="text"
                    value={editNegative}
                    onChange={(e) => setEditNegative(e.target.value.slice(0, 2000))}
                    disabled={busy}
                    placeholder="What to avoid…"
                    className="min-h-[34px] w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/35"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                  />
                </div>
                {referenceImageUrl ? (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border" style={{ borderColor: "var(--border-subtle)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={referenceImageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <p className="text-[10px] leading-snug" style={{ color: "var(--text-muted)" }}>
                      Reference active — send to apply edits.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-2.5 border-t border-white/[0.08] pt-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                  Prompt
                </span>
                <span className="text-[9px] tabular-nums" style={{ color: "var(--text-subtle)" }}>
                  {prompt.length} chars
                </span>
              </div>
              <div
                className="studio-prompt-focus-image flex items-end gap-1.5 rounded-lg border px-2 py-1.5 transition-shadow sm:gap-2 sm:px-2.5 sm:py-2"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "color-mix(in srgb, var(--deep-black) 96%, transparent)",
                }}
              >
                <label className="sr-only" htmlFor="img-prompt">
                  Prompt
                </label>
                <textarea
                  id="img-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isEdit ? "How should this change?" : "Describe the image…"}
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
                  className="btn-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-40 sm:h-10 sm:w-10"
                  aria-label="Generate"
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
