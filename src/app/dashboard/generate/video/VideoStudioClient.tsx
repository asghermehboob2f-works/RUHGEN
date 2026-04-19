"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  BookmarkPlus,
  Check,
  Clapperboard,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Film,
  Grid3x3,
  Home,
  ImagePlus,
  List,
  Loader2,
  Maximize2,
  PanelLeft,
  PanelLeftClose,
  RectangleHorizontal,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LuxuryStudioLayout } from "@/components/studio/luxury/LuxuryStudioLayout";
import { StudioCollapsible, StudioGlowGenerate, StudioPromptChips } from "@/components/studio/luxury/StudioPremiumUi";
import type { LuxuryStudioChromeValue } from "@/components/studio/luxury/studio-chrome-context";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { useAuth } from "@/components/AuthProvider";
import { readUserToken } from "@/lib/auth-storage";
import { createVideoTask, pollPiApiTask, uploadStudioReferenceImage } from "@/lib/piapi-client";

const VERSIONS = ["2.6", "2.5", "2.1", "1.6", "1.5", "2.1-master"] as const;
const CHAT_STORAGE_PREFIX = "ruhgen-video-studio-chat-v1:";
const PRESET_STORAGE_PREFIX = "ruhgen-video-studio-presets-v1:";

const PROMPT_CHIPS = [
  "Slow dolly in",
  "Handheld micro-shake",
  "Golden hour rim",
  "Anamorphic flare",
  "Low fog rolling",
  "Product hero orbit",
] as const;

type VideoPreset = {
  id: string;
  name: string;
  duration: 5 | 10;
  aspect: "16:9" | "9:16" | "1:1";
  mode: "std" | "pro";
  version: string;
  negativePrompt: string;
};

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

const btnGhostIcon =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-[var(--text-muted)] transition-all duration-200 hover:bg-white/[0.05] hover:text-[var(--text-primary)] disabled:opacity-35 disabled:hover:bg-transparent sm:h-9";
const btnCredits =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-sm transition-[box-shadow,opacity] hover:opacity-95 sm:px-3 sm:text-xs";

export default function VideoStudioClient() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const promptDockRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const scrollGuardUntilRef = useRef(0);
  const prevLenForSnapRef = useRef<number | null>(null);
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
  const [mobileStudioPane, setMobileStudioPane] = useState<"output" | "controls">("output");
  const [studioView, setStudioView] = useState<"feed" | "gallery">("feed");
  const [feedFilter, setFeedFilter] = useState<"all" | "ready" | "running">("all");
  const [lightbox, setLightbox] = useState<{ src: string } | null>(null);
  const [savedPresets, setSavedPresets] = useState<VideoPreset[]>([]);

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
    if (!user?.id || typeof window === "undefined") return;
    try {
      const rawP = localStorage.getItem(`${PRESET_STORAGE_PREFIX}${user.id}`);
      if (rawP) {
        const parsed = JSON.parse(rawP) as { v?: number; presets?: VideoPreset[] };
        if (parsed?.v === 1 && Array.isArray(parsed.presets)) setSavedPresets(parsed.presets);
      }
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`${PRESET_STORAGE_PREFIX}${user.id}`, JSON.stringify({ v: 1, presets: savedPresets }));
    } catch {
      /* quota */
    }
  }, [user?.id, savedPresets]);

  const appendPromptChip = useCallback((t: string) => {
    setPrompt((p) => (p.trim() ? `${p.trim()}, ${t}` : t));
  }, []);

  const applyPreset = useCallback((pr: VideoPreset) => {
    setDuration(pr.duration);
    setAspect(pr.aspect);
    setMode(pr.mode);
    setVersion(pr.version);
    setNegativePrompt(pr.negativePrompt);
  }, []);

  const saveCurrentPreset = useCallback(() => {
    const name = window.prompt("Preset name");
    if (!name?.trim()) return;
    const id = crypto.randomUUID();
    setSavedPresets((prev) =>
      [
        { id, name: name.trim(), duration, aspect, mode, version, negativePrompt },
        ...prev.filter((p) => p.name !== name.trim()),
      ].slice(0, 24),
    );
  }, [duration, aspect, mode, version, negativePrompt]);

  const galleryItems = useMemo(() => {
    const out: { key: string; src: string; msgId: string; vidx: number }[] = [];
    for (const m of messages) {
      if (m.role !== "assistant" || m.loading) continue;
      m.urls.forEach((src, vidx) => {
        out.push({ key: `${m.id}-${vidx}`, src, msgId: m.id, vidx });
      });
    }
    return out.reverse();
  }, [messages]);

  const snapCanvasToEnd = useCallback((behavior: ScrollBehavior = "auto") => {
    scrollGuardUntilRef.current = Date.now() + 550;
    stickToBottomRef.current = true;
    const root = scrollRef.current;
    const end = scrollEndRef.current;
    if (root) {
      root.scrollTo({ top: root.scrollHeight, behavior });
    }
    end?.scrollIntoView({ block: "end", behavior: behavior === "smooth" ? "smooth" : "instant" });
    const dock = promptDockRef.current;
    if (dock) {
      requestAnimationFrame(() => {
        dock.scrollIntoView({ block: "end", behavior: "instant" });
        requestAnimationFrame(() => {
          dock.scrollIntoView({ block: "end", behavior: "instant" });
        });
      });
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (Date.now() < scrollGuardUntilRef.current) return;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = dist < 120;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [historyLoaded, messages.length]);

  useLayoutEffect(() => {
    if (!historyLoaded || messages.length === 0) return;
    const len = messages.length;
    const prev = prevLenForSnapRef.current;
    const shouldSnapToEnd = prev === null || prev === 0;
    prevLenForSnapRef.current = len;
    if (!shouldSnapToEnd) return;

    const snap = () => {
      snapCanvasToEnd("auto");
    };
    snap();
    let raf0 = 0;
    let raf1 = 0;
    raf0 = requestAnimationFrame(() => {
      snap();
      raf1 = requestAnimationFrame(snap);
    });
    const timeouts = [0, 32, 80, 160, 320, 480].map((ms) => window.setTimeout(snap, ms));
    const root = scrollRef.current;
    let ro: ResizeObserver | null = null;
    if (root && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        snap();
      });
      ro.observe(root);
    }
    const disconnectRo = window.setTimeout(() => {
      ro?.disconnect();
    }, 900);
    return () => {
      cancelAnimationFrame(raf0);
      cancelAnimationFrame(raf1);
      timeouts.forEach(clearTimeout);
      clearTimeout(disconnectRo);
      ro?.disconnect();
    };
  }, [historyLoaded, messages.length, snapCanvasToEnd]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 1023px)").matches) return;
    if (mobileStudioPane !== "output") return;
    snapCanvasToEnd("auto");
    const timeouts = [0, 50, 120, 280].map((ms) => window.setTimeout(() => snapCanvasToEnd("auto"), ms));
    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mobile Canvas tab only
  }, [mobileStudioPane, snapCanvasToEnd]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    const followUser = last?.role === "user";
    if (!followUser && !stickToBottomRef.current) return;
    const scrollToEnd = () => {
      el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
      scrollEndRef.current?.scrollIntoView({ block: "end", behavior: reduce ? "smooth" : "instant" });
    };
    scrollToEnd();
    const t = window.setTimeout(scrollToEnd, 100);
    return () => clearTimeout(t);
  }, [messages, reduce]);

  useEffect(() => {
    if (!copyToast) return;
    const t = window.setTimeout(() => setCopyToast(null), 2000);
    return () => window.clearTimeout(t);
  }, [copyToast]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

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
    prevLenForSnapRef.current = null;
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

  const aspectButtons: { key: typeof aspect; label: string; icon: typeof RectangleHorizontal }[] = [
    { key: "16:9", label: "16:9", icon: RectangleHorizontal },
    { key: "9:16", label: "9:16", icon: Smartphone },
    { key: "1:1", label: "1:1", icon: Square },
  ];

  const leftPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="sr-only">Press Enter to generate. Shift+Enter for a new line.</p>
      <div className="studio-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-3">
        <div className="border-gradient-premium rounded-[1.15rem] p-[1px] shadow-[0_20px_60px_-40px_rgba(0,212,255,0.45)]">
          <div
            className="rounded-[1.1rem] p-3 sm:p-3.5"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--primary-cyan) 10%, var(--deep-black)) 0%, color-mix(in srgb, var(--rich-black) 96%, transparent) 100%)",
            }}
          >
            <div className="mb-3 flex items-center gap-2 border-b border-white/[0.07] pb-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/35 to-[var(--primary-cyan)]/40 ring-1 ring-white/15">
                <Clapperboard className="h-4 w-4 text-cyan-50" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Motion deck</p>
                <p className="truncate font-display text-sm font-bold text-[var(--text-primary)]">Temporal engine</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <StudioCollapsible title="Timeline & engine" subtitle="Duration, quality mode, and model version" defaultOpen>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-end justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/25">
                          <Clock className="h-3.5 w-3.5 text-cyan-200" strokeWidth={2} />
                        </span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Clip length</p>
                          <p className="mt-0.5 text-[10px] text-[var(--text-subtle)]/80">{duration * 24} frames · 24 fps</p>
                        </div>
                      </div>
                      <span className="font-display text-2xl font-bold leading-none tabular-nums text-cyan-100 drop-shadow-[0_0_12px_color-mix(in_srgb,var(--primary-cyan)_35%,transparent)]">
                        {duration}
                        <span className="ml-0.5 text-sm font-semibold text-cyan-200/70">s</span>
                      </span>
                    </div>
                    <div
                      className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.07] bg-black/35 p-1.5"
                      role="radiogroup"
                      aria-label="Clip length"
                    >
                      {([5, 10] as const).map((d) => {
                        const on = duration === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={busy}
                            onClick={() => setDuration(d)}
                            className="group relative flex min-h-[56px] items-center justify-between gap-2 overflow-hidden rounded-xl px-3 py-2 transition-all duration-200 enabled:hover:-translate-y-[1px] disabled:opacity-45"
                            style={{
                              border: on
                                ? "1px solid color-mix(in srgb, var(--primary-cyan) 55%, transparent)"
                                : "1px solid color-mix(in srgb, white 7%, transparent)",
                              background: on
                                ? "linear-gradient(180deg, color-mix(in srgb, var(--primary-cyan) 18%, transparent) 0%, color-mix(in srgb, var(--primary-cyan) 6%, rgba(0,0,0,0.5)) 100%)"
                                : "rgba(0,0,0,0.28)",
                              boxShadow: on
                                ? "0 10px 28px -14px color-mix(in srgb, var(--primary-cyan) 75%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)"
                                : "inset 0 1px 0 rgba(255,255,255,0.03)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {on ? (
                              <span
                                aria-hidden
                                className="pointer-events-none absolute inset-x-3 top-0 h-px"
                                style={{
                                  background:
                                    "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--primary-cyan) 80%, transparent) 50%, transparent 100%)",
                                }}
                              />
                            ) : null}
                            <div className="flex items-center gap-2">
                              <Film
                                className="h-4 w-4"
                                strokeWidth={1.75}
                                style={{ color: on ? "var(--primary-cyan)" : "var(--text-muted)" }}
                              />
                              <div className="text-left">
                                <div className="font-display text-[14px] font-bold leading-none tabular-nums">{d} sec</div>
                                <div className="mt-0.5 text-[9.5px] font-medium tracking-wide text-[var(--text-subtle)]">{d === 5 ? "Quick beat" : "Extended shot"}</div>
                              </div>
                            </div>
                            {on ? (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 ring-1 ring-cyan-300/40">
                                <Check className="h-3 w-3 text-cyan-100" strokeWidth={2.5} />
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Quality profile</p>
                    <div
                      className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.07] bg-black/35 p-1.5"
                      role="radiogroup"
                      aria-label="Quality profile"
                    >
                      {[
                        { value: "std" as const, label: "Standard", sub: "Fast render", icon: Zap },
                        { value: "pro" as const, label: "Professional", sub: "Cinema grade", icon: Sparkles },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const on = mode === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={busy}
                            onClick={() => setMode(opt.value)}
                            className="group relative flex min-h-[52px] items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2 text-left transition-all duration-200 enabled:hover:-translate-y-[1px] disabled:opacity-45"
                            style={{
                              border: on
                                ? "1px solid color-mix(in srgb, var(--primary-cyan) 55%, transparent)"
                                : "1px solid color-mix(in srgb, white 7%, transparent)",
                              background: on
                                ? "linear-gradient(180deg, color-mix(in srgb, var(--primary-cyan) 18%, transparent) 0%, color-mix(in srgb, var(--primary-cyan) 6%, rgba(0,0,0,0.5)) 100%)"
                                : "rgba(0,0,0,0.28)",
                              boxShadow: on
                                ? "0 10px 28px -14px color-mix(in srgb, var(--primary-cyan) 75%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)"
                                : "inset 0 1px 0 rgba(255,255,255,0.03)",
                              color: "var(--text-primary)",
                            }}
                          >
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                              style={{
                                background: on
                                  ? "linear-gradient(135deg, color-mix(in srgb, var(--primary-cyan) 40%, transparent), color-mix(in srgb, var(--primary-cyan) 15%, transparent))"
                                  : "rgba(255,255,255,0.05)",
                                boxShadow: on
                                  ? "inset 0 0 8px color-mix(in srgb, var(--primary-cyan) 25%, transparent)"
                                  : "none",
                              }}
                            >
                              <Icon
                                className="h-4 w-4"
                                strokeWidth={1.9}
                                style={{ color: on ? "var(--primary-cyan)" : "var(--text-muted)" }}
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-display text-[13px] font-bold leading-none">{opt.label}</div>
                              <div className="mt-0.5 truncate text-[10px] font-medium tracking-wide text-[var(--text-subtle)]">{opt.sub}</div>
                            </div>
                            {on ? (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 ring-1 ring-cyan-300/40">
                                <Check className="h-3 w-3 text-cyan-100" strokeWidth={2.5} />
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Model engine</p>
                        <p className="mt-0.5 text-[10px] text-[var(--text-subtle)]/80">Select diffusion checkpoint</p>
                      </div>
                      <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 font-display text-[10px] font-bold tabular-nums text-cyan-100">
                        v{version}
                      </span>
                    </div>
                    <div
                      className="flex flex-wrap gap-1.5 rounded-2xl border border-white/[0.07] bg-black/35 p-1.5"
                      role="radiogroup"
                      aria-label="Model engine"
                    >
                      {VERSIONS.map((v) => {
                        const on = version === v;
                        const isLatest = v === VERSIONS[0];
                        const isMaster = v.includes("master");
                        return (
                          <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={busy}
                            onClick={() => setVersion(v)}
                            className="relative inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 enabled:hover:-translate-y-[1px] disabled:opacity-45"
                            style={{
                              border: on
                                ? "1px solid color-mix(in srgb, var(--primary-cyan) 60%, transparent)"
                                : "1px solid color-mix(in srgb, white 7%, transparent)",
                              background: on
                                ? "linear-gradient(135deg, color-mix(in srgb, var(--primary-cyan) 22%, transparent), color-mix(in srgb, var(--primary-cyan) 8%, rgba(0,0,0,0.4)))"
                                : "rgba(0,0,0,0.3)",
                              boxShadow: on
                                ? "0 8px 22px -12px color-mix(in srgb, var(--primary-cyan) 70%, transparent)"
                                : "none",
                              color: on ? "var(--text-primary)" : "var(--text-muted)",
                            }}
                          >
                            <span className="tabular-nums">v{v.replace("-master", "")}</span>
                            {isMaster ? (
                              <span className="rounded-sm bg-cyan-400/25 px-1 py-[1px] text-[8.5px] font-bold tracking-[0.1em] text-cyan-50">
                                MASTER
                              </span>
                            ) : null}
                            {isLatest ? (
                              <span className="rounded-sm bg-emerald-400/20 px-1 py-[1px] text-[8.5px] font-bold tracking-[0.1em] text-emerald-100">
                                NEW
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-subtle)]">Presets</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={saveCurrentPreset}
                      className="inline-flex items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:opacity-40"
                    >
                      <BookmarkPlus className="h-3 w-3" strokeWidth={2} />
                      Save
                    </button>
                  </div>
                  {savedPresets.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {savedPresets.slice(0, 6).map((pr) => (
                        <button
                          key={pr.id}
                          type="button"
                          disabled={busy}
                          onClick={() => applyPreset(pr)}
                          className="max-w-[160px] truncate rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:border-cyan-400/40 hover:text-[var(--text-primary)] disabled:opacity-40"
                        >
                          {pr.name}
                        </button>
                      ))}
                      {savedPresets.length > 6 ? (
                        <span className="self-center text-[10px] text-[var(--text-subtle)]">+{savedPresets.length - 6}</span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-[10px] leading-snug text-[var(--text-subtle)]">No presets saved yet.</p>
                  )}
                </div>
              </StudioCollapsible>

              <StudioCollapsible title="Frame geometry" subtitle="Aspect ratio for delivery" defaultOpen>
                <div className="grid grid-cols-3 gap-1.5">
                  {aspectButtons.map(({ key, label, icon: Icon }) => {
                    const on = aspect === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={busy}
                        onClick={() => setAspect(key)}
                        className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center text-[11px] font-bold transition-all enabled:hover:bg-white/[0.05] disabled:opacity-50"
                        style={{
                          borderColor: on ? "color-mix(in srgb, var(--primary-cyan) 50%, transparent)" : "color-mix(in srgb, white 10%, transparent)",
                          background: on ? "color-mix(in srgb, var(--primary-cyan) 18%, transparent)" : "rgba(0,0,0,0.35)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <Icon className="h-4 w-4 opacity-90" strokeWidth={1.75} style={{ color: on ? "var(--primary-cyan)" : "var(--text-muted)" }} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </StudioCollapsible>

              <StudioCollapsible title="Negative & start frame" subtitle="Optional constraints and conditioning still" defaultOpen={false}>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="vid-negative" className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                      <span>Negative <span className="font-normal opacity-70 normal-case">(optional)</span></span>
                      <span className="tabular-nums">{negativePrompt.length}/2500</span>
                    </label>
                    <textarea
                      id="vid-negative"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value.slice(0, 2500))}
                      disabled={busy}
                      placeholder="Elements to suppress…"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#00D4FF]/35 sm:text-[13px]"
                      style={{ color: "var(--text-primary)", minHeight: "3rem" }}
                    />
                  </div>
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] p-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Start frame <span className="font-normal opacity-70 normal-case">(optional)</span></span>
                      {imageUrl.trim() ? (
                        <button
                          type="button"
                          disabled={busy || refUploading}
                          onClick={() => {
                            setImageUrl("");
                            setRefUploadError(null);
                          }}
                          className="inline-flex h-6 items-center gap-1 rounded-md border border-white/10 px-1.5 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </button>
                      ) : null}
                    </div>
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
                    <div className="flex items-center gap-2">
                      {imageUrl.trim() ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl.trim()} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy || refUploading}
                        onClick={() => refFileInput.current?.click()}
                        className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2 text-[12px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-white/[0.06] disabled:opacity-40"
                      >
                        {refUploading ? <Loader2 className="h-4 w-4 animate-spin text-[#00D4FF]" /> : <ImagePlus className="h-4 w-4" strokeWidth={2} />}
                        {refUploading ? "Uploading…" : imageUrl.trim() ? "Replace" : "Upload start frame"}
                      </button>
                    </div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setRefUploadError(null);
                        setImageUrl(e.target.value);
                      }}
                      disabled={busy}
                      placeholder="…or paste image URL"
                      className="mt-2 min-h-[34px] w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 font-mono text-[10px] outline-none focus:ring-1 focus:ring-[#00D4FF]/40"
                      style={{ color: "var(--text-muted)" }}
                    />
                    {refUploadError ? <p className="mt-1.5 text-[11px] text-rose-200">{refUploadError}</p> : null}
                  </div>
                </div>
              </StudioCollapsible>

              <StudioCollapsible title="Motion vocabulary" subtitle="Camera-native tokens" defaultOpen>
                <StudioPromptChips labels={PROMPT_CHIPS} onPick={appendPromptChip} disabled={busy} tone="cyan" />
              </StudioCollapsible>

              <p className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-center text-[11px] leading-snug text-[var(--text-muted)] lg:hidden">
                Switch to the <span className="font-semibold text-[var(--text-primary)]">Canvas</span> tab to write motion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky desktop prompt + generate */}
      <div
        className="hidden shrink-0 border-t px-3 pb-3 pt-3 backdrop-blur-xl lg:block"
        style={{
          borderColor: "color-mix(in srgb, white 8%, transparent)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--deep-black) 55%, transparent) 0%, color-mix(in srgb, var(--deep-black) 88%, transparent) 100%)",
        }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Director prompt</span>
          <span className="text-[10px] tabular-nums text-[var(--text-subtle)]">{prompt.length}</span>
        </div>
        <div
          className="studio-prompt-focus-video rounded-xl border border-white/10 bg-black/45 px-3 py-2"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
        >
          <label className="sr-only" htmlFor="vid-prompt">Prompt</label>
          <textarea
            id="vid-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Motion, camera, lighting…"
            rows={2}
            disabled={busy}
            className="max-h-[160px] min-h-[44px] w-full resize-y bg-transparent text-sm leading-relaxed outline-none placeholder:text-[var(--text-subtle)] sm:text-[14px]"
            style={{ color: "var(--text-primary)" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void run();
              }
            }}
          />
        </div>
        <div className="mt-2">
          <StudioGlowGenerate tone="cyan" size="lg" disabled={busy || prompt.trim().length < 2} onClick={() => void run()}>
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Rendering…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" strokeWidth={2} />
                Generate
              </>
            )}
          </StudioGlowGenerate>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[var(--text-subtle)]">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );

  const renderRightPanel = (chrome: LuxuryStudioChromeValue) => {
    const showCanvasDock = chrome.collapsed;
    const showAssistantRow = (msg: AssistantMsg) => {
      if (feedFilter === "all") return true;
      if (feedFilter === "running") return msg.loading;
      if (feedFilter === "ready") return !msg.loading && msg.urls.length > 0;
      return true;
    };
    return (
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2 overflow-hidden">
        {copyToast ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="shrink-0 rounded-full border px-3 py-1.5 text-center text-xs font-medium"
            style={{
              borderColor: "color-mix(in srgb, var(--primary-cyan) 35%, var(--border-subtle))",
              background: "color-mix(in srgb, var(--primary-cyan) 10%, var(--deep-black))",
              color: "var(--primary-cyan)",
            }}
            role="status"
          >
            {copyToast}
          </motion.p>
        ) : null}

        <div
          className={`flex min-h-0 flex-1 flex-col gap-2 ${
            showCanvasDock ? "min-h-0 overflow-y-auto overscroll-contain" : "overflow-hidden"
          }`}
        >
          <div className="luxury-glass-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
            <div
              className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-3 py-2 backdrop-blur-xl"
              style={{
                borderColor: "color-mix(in srgb, white 9%, transparent)",
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--rich-black) 94%, transparent) 0%, color-mix(in srgb, var(--rich-black) 78%, transparent) 100%)",
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase leading-none tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                  Canvas
                </p>
                <p className="truncate font-display text-[13px] font-bold leading-tight sm:text-sm" style={{ color: "var(--text-primary)" }}>
                  {messages.length === 0 ? "Awaiting motion brief" : `${galleryItems.length} clip${galleryItems.length === 1 ? "" : "s"} · ${messages.length} events`}
                </p>
              </div>
              {studioView === "feed" ? (
                <div className="hidden shrink-0 items-center gap-1 sm:flex">
                  {(["all", "running", "ready"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFeedFilter(f)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                        feedFilter === f
                          ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/45"
                          : "border border-white/10 bg-black/25 text-[var(--text-muted)] hover:border-white/20"
                      }`}
                    >
                      {f === "all" ? "All" : f === "running" ? "Live" : "Ready"}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-0.5">
                <button
                  type="button"
                  onClick={() => setStudioView("feed")}
                  aria-pressed={studioView === "feed"}
                  aria-label="Feed view"
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                    studioView === "feed" ? "bg-white/10 text-white shadow-inner" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <List className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setStudioView("gallery")}
                  aria-pressed={studioView === "gallery"}
                  aria-label="Gallery view"
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                    studioView === "gallery" ? "bg-white/10 text-white shadow-inner" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Grid3x3 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
              <button
                type="button"
                onClick={chrome.toggleCollapsed}
                className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-white/[0.06] lg:inline-flex"
                style={{
                  borderColor: "color-mix(in srgb, white 8%, transparent)",
                  color: "var(--text-muted)",
                  background: "color-mix(in srgb, var(--deep-black) 40%, transparent)",
                }}
                aria-label={chrome.collapsed ? "Show control column" : "Hide control column"}
                aria-pressed={chrome.collapsed}
                title={chrome.collapsed ? "Show controls" : "Hide controls"}
              >
                {chrome.collapsed ? <PanelLeft className="h-3.5 w-3.5" strokeWidth={2} /> : <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={2} />}
              </button>
            </div>
            {studioView === "feed" ? (
              <div className="flex shrink-0 items-center gap-1 border-b border-white/[0.06] px-3 py-1.5 sm:hidden">
                {(["all", "running", "ready"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFeedFilter(f)}
                    className={`flex-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                      feedFilter === f
                        ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/45"
                        : "border border-white/10 bg-black/25 text-[var(--text-muted)]"
                    }`}
                  >
                    {f === "all" ? "All" : f === "running" ? "Live" : "Ready"}
                  </button>
                ))}
              </div>
            ) : null}
            <div
              ref={scrollRef}
              className="studio-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y px-3 py-3 sm:px-4"
            >
              {studioView === "gallery" ? (
                galleryItems.length === 0 ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-12 text-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/30 to-violet-600/20 shadow-[0_0_60px_-20px_rgba(0,212,255,0.5)]">
                      <Grid3x3 className="h-9 w-9 text-white/90" strokeWidth={1.5} />
                    </div>
                    <p className="max-w-xs text-sm text-[var(--text-muted)]">Rendered takes appear here as a reel wall.</p>
                  </div>
                ) : (
                  <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {galleryItems.map((item, gi) => (
                      <motion.button
                        key={item.key}
                        type="button"
                        initial={reduce ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduce ? 0 : Math.min(gi * 0.04, 0.35) }}
                        onClick={() => setLightbox({ src: item.src })}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 text-left shadow-xl ring-1 ring-white/[0.05] transition-transform hover:z-[1] hover:scale-[1.01] hover:ring-cyan-400/35"
                      >
                        <video src={item.src} muted playsInline className="aspect-video w-full object-cover opacity-90 transition group-hover:opacity-100" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                          <Maximize2 className="h-4 w-4" strokeWidth={2} />
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )
              ) : messages.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-5 py-12 text-center">
                  <motion.div
                    initial={reduce ? false : { scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/35 via-[var(--deep-black)] to-violet-600/25 shadow-[0_0_80px_-24px_rgba(0,212,255,0.55)]"
                  >
                    <Sparkles className="h-10 w-10 text-cyan-200" strokeWidth={1.5} />
                  </motion.div>
                  <div className="max-w-md space-y-2 px-2">
                    <p className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">Motion stage primed</p>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      Dial duration, aspect, and engine, then describe camera and energy. Clips stream into this canvas as they finish.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-[min(100%,960px)] flex-col gap-6 px-1 pb-2">
                  {messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <motion.div key={msg.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                          <div className="max-w-[min(100%,580px)] rounded-2xl rounded-br-md border border-cyan-400/25 bg-gradient-to-br from-cyan-500/15 to-black/40 px-4 py-3.5 shadow-[0_16px_48px_-28px_rgba(0,212,255,0.35)] ring-1 ring-white/[0.06] backdrop-blur-md">
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text-primary)]">{msg.content}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <p className="text-[11px] font-medium text-[var(--text-subtle)]">{msg.meta}</p>
                              <button
                                type="button"
                                onClick={() => void copyText(msg.content, "Prompt copied")}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-cyan-200 transition-colors hover:bg-white/[0.08]"
                              >
                                <Copy className="h-3 w-3" />
                                Copy
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                    if (!showAssistantRow(msg)) return null;
                    return (
                      <motion.div key={msg.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="w-full max-w-[min(100%,760px)] rounded-2xl rounded-bl-md border border-white/10 bg-black/35 px-4 py-3.5 shadow-xl ring-1 ring-white/[0.05] backdrop-blur-md">
                          {msg.loading ? (
                            <div className="space-y-3">
                              <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#00D4FF]" />
                                <span className="font-medium">{msg.phase || "Rendering…"}</span>
                              </p>
                              <div className="relative h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                  className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-to-r from-[#00D4FF] via-[#7B61FF] to-[#00D4FF]"
                                  animate={reduce ? undefined : { x: ["-100%", "280%"] }}
                                  transition={{ duration: 1.35, repeat: Infinity, ease: "linear" }}
                                />
                              </div>
                            </div>
                          ) : null}
                          {msg.error ? <p className="text-sm text-rose-100">{msg.error}</p> : null}
                          {msg.urls.length > 0 ? (
                            <div className="mt-3 space-y-4">
                              {msg.urls.map((src, vidx) => (
                                <div key={src} className="space-y-2">
                                  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl ring-1 ring-white/[0.06]">
                                    <video
                                      src={src}
                                      controls
                                      playsInline
                                      className="max-h-[min(70vh,560px)] w-full bg-black object-contain lg:max-h-[520px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setLightbox({ src })}
                                      className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/75 group-hover:opacity-100"
                                      aria-label="Fullscreen"
                                    >
                                      <Maximize2 className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                  </div>
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
                                      className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold transition-colors hover:border-cyan-400/45 disabled:opacity-60 sm:flex-none sm:px-4"
                                      style={{ color: "var(--text-primary)" }}
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
                                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold transition-colors hover:border-cyan-400/45"
                                      style={{ color: "var(--text-primary)" }}
                                    >
                                      <ExternalLink className="h-4 w-4 text-[#00D4FF]" />
                                      Open
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => void copyText(src, "Video URL copied")}
                                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold transition-colors hover:border-cyan-400/45"
                                      style={{ color: "var(--text-primary)" }}
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
                      </motion.div>
                    );
                  })}
                </div>
              )}
              <div ref={scrollEndRef} className="h-px w-full shrink-0" aria-hidden />
            </div>

            <div
              className="shrink-0 border-t px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-xl lg:hidden"
              style={{
                borderColor: "color-mix(in srgb, white 8%, transparent)",
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--rich-black) 60%, transparent) 0%, color-mix(in srgb, var(--deep-black) 92%, transparent) 100%)",
                boxShadow: "0 -20px 40px -28px rgba(0,0,0,0.75)",
              }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void run();
                    }
                  }}
                  disabled={busy}
                  placeholder="Motion, camera, lighting…"
                  rows={1}
                  className="studio-prompt-focus-video min-h-[44px] max-h-28 flex-1 resize-none rounded-xl border border-white/10 bg-black/45 px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
                />
                <StudioGlowGenerate tone="cyan" size="icon" disabled={busy || prompt.trim().length < 2} onClick={() => void run()}>
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" strokeWidth={2.25} />}
                </StudioGlowGenerate>
              </div>
            </div>
          </div>

          {showCanvasDock ? (
            <div
              ref={promptDockRef}
              className="shrink-0 rounded-2xl border border-white/10 px-3 pt-3 shadow-[0_-12px_48px_-28px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
              style={{
                background:
                  "linear-gradient(165deg, color-mix(in srgb, white 5%, transparent) 0%, color-mix(in srgb, var(--rich-black) 92%, transparent) 100%)",
                boxShadow: "inset 0 1px 0 color-mix(in srgb, white 6%, transparent), 0 -20px 56px -24px rgba(0,0,0,0.5)",
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                Motion prompt
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void run();
                    }
                  }}
                  disabled={busy}
                  placeholder="Motion, camera, lighting…"
                  rows={2}
                  className="studio-prompt-focus-video min-h-[44px] w-full flex-1 resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
                />
                <StudioGlowGenerate tone="cyan" size="lg" disabled={busy || prompt.trim().length < 2} onClick={() => void run()}>
                  {busy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Rendering…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" strokeWidth={2} />
                      Generate
                    </>
                  )}
                </StudioGlowGenerate>
              </div>
            </div>
          ) : null}
        </div>

        {downloadError ? (
          <p className="rounded-xl border border-[#FF2E9A]/35 bg-[#FF2E9A]/10 px-3 py-2 text-xs text-rose-100 sm:text-sm">{downloadError}</p>
        ) : null}

        {lightbox ? (
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/88 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close preview"
              onClick={() => setLightbox(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <video
              src={lightbox.src}
              controls
              autoPlay
              playsInline
              className="max-h-[min(88vh,800px)] w-full max-w-[min(100%,1100px)] rounded-2xl border border-white/10 bg-black shadow-[0_0_80px_-20px_rgba(0,212,255,0.45)]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <motion.div className="flex min-h-0 flex-1 flex-col overflow-hidden" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <LuxuryStudioLayout
        mode="video"
        eyebrow="Motion"
        title="Video studio"
        subtitle="Luxury glass workspace · motion-native pipeline · tuned for cinema-grade clips."
        mobilePane={mobileStudioPane}
        onMobilePaneChange={setMobileStudioPane}
        topActions={
          <>
            <button
              type="button"
              disabled={messages.length === 0}
              onClick={() => {
                if (messages.length === 0) return;
                if (!window.confirm("Clear session?")) return;
                clearChatHistory();
              }}
              className={btnGhostIcon}
              style={{ borderColor: "var(--border-subtle)", background: "color-mix(in srgb, var(--deep-black) 70%, transparent)" }}
              aria-label="Clear session"
              title="Clear session"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
            <Link
              href="/dashboard/billing"
              className={btnCredits}
              style={{
                background: "linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))",
                boxShadow: "0 6px 20px -8px rgba(0,212,255,0.45)",
              }}
              aria-label="Credits"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Credits</span>
            </Link>
            <Link
              href="/dashboard"
              className={`${btnGhostIcon} hidden sm:inline-flex`}
              style={{ borderColor: "var(--border-subtle)", background: "color-mix(in srgb, var(--deep-black) 70%, transparent)" }}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <Home className="h-4 w-4" strokeWidth={2} />
            </Link>
          </>
        }
        leftPanel={leftPanel}
        renderRightPanel={renderRightPanel}
      />
    </motion.div>
  );
}
