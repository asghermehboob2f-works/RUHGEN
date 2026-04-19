"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  BookmarkPlus,
  Copy,
  Download,
  ExternalLink,
  Grid3x3,
  Home,
  ImagePlus,
  List,
  Loader2,
  Maximize2,
  PanelLeft,
  PanelLeftClose,
  Sparkles,
  Trash2,
  Wand2,
  X,
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
const PRESET_STORAGE_PREFIX = "ruhgen-image-studio-presets-v1:";

const PROMPT_CHIPS = [
  "Cinematic lighting",
  "Ultra-detailed 8K",
  "85mm portrait lens",
  "Volumetric fog",
  "Practical neon accents",
  "Editorial studio lighting",
] as const;

type ImagePreset = {
  id: string;
  name: string;
  model: string;
  sizeIdx: number;
  negativePrompt: string;
};

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

const btnGhostIcon =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-[var(--text-muted)] transition-all duration-200 hover:bg-white/[0.05] hover:text-[var(--text-primary)] disabled:opacity-35 disabled:hover:bg-transparent sm:h-9";
const btnCredits =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-sm transition-[box-shadow,opacity] hover:opacity-95 sm:px-3 sm:text-xs";

export default function ImageStudioClient() {
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
  const [mobileStudioPane, setMobileStudioPane] = useState<"output" | "controls">("output");
  const [studioView, setStudioView] = useState<"feed" | "gallery">("feed");
  const [feedFilter, setFeedFilter] = useState<"all" | "ready" | "running">("all");
  const [lightbox, setLightbox] = useState<{ src: string } | null>(null);
  const [savedPresets, setSavedPresets] = useState<ImagePreset[]>([]);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/generate/image");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;
    try {
      const rawP = localStorage.getItem(`${PRESET_STORAGE_PREFIX}${user.id}`);
      if (rawP) {
        const parsed = JSON.parse(rawP) as { v?: number; presets?: ImagePreset[] };
        if (parsed?.v === 1 && Array.isArray(parsed.presets)) setSavedPresets(parsed.presets);
      }
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

  const applyPreset = useCallback((pr: ImagePreset) => {
    setModel(pr.model);
    setSizeIdx(pr.sizeIdx);
    setNegativePrompt(pr.negativePrompt);
  }, []);

  const saveCurrentPreset = useCallback(() => {
    const name = window.prompt("Preset name");
    if (!name?.trim()) return;
    const id = crypto.randomUUID();
    setSavedPresets((prev) =>
      [{ id, name: name.trim(), model, sizeIdx, negativePrompt }, ...prev.filter((p) => p.name !== name.trim())].slice(0, 24),
    );
  }, [model, sizeIdx, negativePrompt]);

  const galleryItems = useMemo(() => {
    const out: { key: string; src: string; msgId: string; idx: number }[] = [];
    for (const m of messages) {
      if (m.role !== "assistant" || m.loading) continue;
      m.urls.forEach((src, idx) => {
        out.push({ key: `${m.id}-${idx}`, src, msgId: m.id, idx });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when switching to Canvas on mobile
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

  const clearChatHistory = useCallback(() => {
    prevLenForSnapRef.current = null;
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

  const leftPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="sr-only">Press Enter to generate. Shift+Enter for a new line.</p>
      <div className="studio-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-3">
        <div className="border-gradient-premium rounded-[1.15rem] p-[1px] shadow-[0_20px_60px_-40px_rgba(123,97,255,0.55)]">
          <div
            className="rounded-[1.1rem] p-3 sm:p-3.5"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--primary-purple) 10%, var(--deep-black)) 0%, color-mix(in srgb, var(--rich-black) 96%, transparent) 100%)",
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400/30 to-[var(--primary-purple)]/40 ring-1 ring-white/15">
                  <Wand2 className="h-4 w-4 text-violet-100" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Control deck</p>
                  <p className="truncate font-display text-sm font-bold text-[var(--text-primary)]">Diffusion pipeline</p>
                </div>
              </div>
              {isEdit ? (
                <span className="shrink-0 rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                  Edit
                </span>
              ) : null}
            </div>

            <div className="space-y-2.5">
              <StudioCollapsible title="Canvas & model" subtitle="Aspect, resolution, and render engine" defaultOpen>
                <div className="space-y-3.5">
                  <div>
                    <div className="mb-2 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Output size</p>
                        <p className="mt-0.5 text-[10px] text-[var(--text-subtle)]/80">Pick an aspect ratio · {SIZES[sizeIdx]?.sub}</p>
                      </div>
                      <span
                        className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-violet-100"
                        aria-live="polite"
                      >
                        {SIZES[sizeIdx]?.label}
                      </span>
                    </div>
                    <div
                      className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.07] bg-black/35 p-1.5 sm:grid-cols-4"
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
                            aria-label={`${s.label} ${s.sub}`}
                            disabled={disabled}
                            onClick={() => setSizeIdx(i)}
                            className="group relative flex min-h-[92px] flex-col items-center justify-between gap-2 overflow-hidden rounded-xl px-2 py-2.5 text-center transition-all duration-200 enabled:hover:-translate-y-[1px] disabled:opacity-45"
                            style={{
                              border: on
                                ? "1px solid color-mix(in srgb, var(--primary-purple) 55%, transparent)"
                                : "1px solid color-mix(in srgb, white 7%, transparent)",
                              background: on
                                ? "linear-gradient(180deg, color-mix(in srgb, var(--primary-purple) 18%, transparent) 0%, color-mix(in srgb, var(--primary-purple) 6%, rgba(0,0,0,0.45)) 100%)"
                                : "rgba(0,0,0,0.28)",
                              boxShadow: on
                                ? "0 10px 28px -14px color-mix(in srgb, var(--primary-purple) 75%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)"
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
                                    "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--primary-purple) 80%, transparent) 50%, transparent 100%)",
                                }}
                              />
                            ) : null}
                            <div className="flex h-10 w-full items-center justify-center">
                              <div
                                className="rounded-[4px] transition-all duration-200"
                                style={{
                                  aspectRatio: `${s.w} / ${s.h}`,
                                  height: s.w >= s.h ? "26px" : "34px",
                                  maxWidth: "82%",
                                  border: on
                                    ? "1px solid color-mix(in srgb, var(--primary-purple) 70%, transparent)"
                                    : "1px solid rgba(255,255,255,0.16)",
                                  background: on
                                    ? "linear-gradient(135deg, color-mix(in srgb, var(--primary-purple) 55%, transparent) 0%, color-mix(in srgb, var(--primary-purple) 12%, transparent) 100%)"
                                    : "rgba(255,255,255,0.04)",
                                  boxShadow: on
                                    ? "0 0 18px color-mix(in srgb, var(--primary-purple) 45%, transparent), inset 0 0 12px color-mix(in srgb, var(--primary-purple) 18%, transparent)"
                                    : "none",
                                }}
                              />
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-display text-[13px] font-bold leading-none tabular-nums">{s.label}</span>
                              <span className="text-[9px] font-medium tracking-wide text-[var(--text-subtle)]">{s.sub}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="img-model" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">
                      Render engine
                    </label>
                    <div className="relative">
                      <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                        <Sparkles className="h-3.5 w-3.5 text-violet-300/80" strokeWidth={2} />
                      </span>
                      <select
                        id="img-model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={busy}
                        className={`${selectCls} rounded-xl border-white/10 bg-black/40 pl-8 pr-8`}
                        style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                      >
                        {MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
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
                      className="inline-flex items-center gap-1 rounded-full border border-[#7B61FF]/35 bg-[#7B61FF]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-100 transition-colors hover:bg-[#7B61FF]/20 disabled:opacity-40"
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
                          className="max-w-[160px] truncate rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:border-[#7B61FF]/40 hover:text-[var(--text-primary)] disabled:opacity-40"
                        >
                          {pr.name}
                        </button>
                      ))}
                      {savedPresets.length > 6 ? (
                        <span className="self-center text-[10px] text-[var(--text-subtle)]">+{savedPresets.length - 6}</span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-[10px] leading-snug text-[var(--text-subtle)]">No presets yet. Save the current setup to reuse later.</p>
                  )}
                </div>
              </StudioCollapsible>

              <StudioCollapsible title="Prompt intelligence" subtitle="Curated tokens — tap to append" defaultOpen>
                <StudioPromptChips labels={PROMPT_CHIPS} onPick={appendPromptChip} disabled={busy} tone="purple" />
              </StudioCollapsible>

              {!isEdit ? (
                <StudioCollapsible title="Negative & reference" subtitle="Constraints and optional image conditioning" defaultOpen={false}>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="img-neg-create" className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        <span>Negative prompt <span className="font-normal opacity-70 normal-case">(optional)</span></span>
                        <span className="tabular-nums">{negativePrompt.length}/2000</span>
                      </label>
                      <textarea
                        id="img-neg-create"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value.slice(0, 2000))}
                        disabled={busy}
                        placeholder="Elements to suppress…"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs outline-none transition-shadow focus:ring-2 focus:ring-[#7B61FF]/35 sm:text-[13px]"
                        style={{ color: "var(--text-primary)", minHeight: "3rem" }}
                      />
                    </div>
                    <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Reference image</span>
                        {referenceImageUrl ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setReferenceImageUrl(null);
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
                            .then(({ url }) => setReferenceImageUrl(url))
                            .catch((err: unknown) => setRefUploadError(err instanceof Error ? err.message : "Upload failed."))
                            .finally(() => setRefUploading(false));
                        }}
                      />
                      <div className="flex items-center gap-2">
                        {referenceImageUrl ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={referenceImageUrl} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy || refUploading}
                          onClick={() => refFileInput.current?.click()}
                          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2 text-[12px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-white/[0.06] disabled:opacity-40"
                        >
                          {refUploading ? <Loader2 className="h-4 w-4 animate-spin text-[#7B61FF]" /> : <ImagePlus className="h-4 w-4" strokeWidth={2} />}
                          {refUploading ? "Uploading…" : referenceImageUrl ? "Replace" : "Upload reference"}
                        </button>
                      </div>
                      {refUploadError ? <p className="mt-1.5 text-[11px] text-rose-200">{refUploadError}</p> : null}
                    </div>
                  </div>
                </StudioCollapsible>
              ) : (
                <StudioCollapsible title="Edit controls" subtitle="Strength, guidance, and edit negatives" defaultOpen>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="img-denoise" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
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
                        className="studio-range-premium mt-2 w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="img-guidance" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
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
                        className="studio-range-premium mt-2 w-full"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="img-neg-edit" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Negative
                      </label>
                      <input
                        id="img-neg-edit"
                        type="text"
                        value={editNegative}
                        onChange={(e) => setEditNegative(e.target.value.slice(0, 2000))}
                        disabled={busy}
                        placeholder="What to avoid…"
                        className="min-h-[40px] w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/35"
                        style={{ color: "var(--text-primary)" }}
                      />
                    </div>
                    {referenceImageUrl ? (
                      <div className="flex items-center gap-3 sm:col-span-2">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={referenceImageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">Reference locked — describe the transformation on desktop or Canvas.</p>
                      </div>
                    ) : null}
                  </div>
                </StudioCollapsible>
              )}

              <p className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-center text-[11px] leading-snug text-[var(--text-muted)] lg:hidden">
                Switch to the <span className="font-semibold text-[var(--text-primary)]">Canvas</span> tab to write prompts.
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
          className="studio-prompt-focus-image rounded-xl border border-white/10 bg-black/45 px-3 py-2 transition-shadow"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
        >
          <label className="sr-only" htmlFor="img-prompt">Prompt</label>
          <textarea
            id="img-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isEdit ? "How should this change?" : "Describe the image…"}
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
          <StudioGlowGenerate tone="purple" size="lg" disabled={busy || prompt.trim().length < 2} onClick={() => void run()}>
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Synthesizing…
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
                  {messages.length === 0 ? "Awaiting your vision" : `${galleryItems.length} frame${galleryItems.length === 1 ? "" : "s"} · ${messages.length} events`}
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
                          ? "bg-[#7B61FF]/25 text-violet-100 ring-1 ring-[#7B61FF]/40"
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
                        ? "bg-[#7B61FF]/25 text-violet-100 ring-1 ring-[#7B61FF]/40"
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
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/30 to-cyan-500/20 shadow-[0_0_60px_-20px_rgba(123,97,255,0.55)]">
                      <Grid3x3 className="h-9 w-9 text-white/90" strokeWidth={1.5} />
                    </div>
                    <div className="max-w-xs space-y-2">
                      <p className="font-display text-lg font-bold text-[var(--text-primary)]">Gallery awaits</p>
                      <p className="text-sm leading-relaxed text-[var(--text-muted)]">Finished frames collect here in a cinematic grid.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto grid w-full max-w-[1100px] grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                    {galleryItems.map((item, gi) => (
                      <motion.button
                        key={item.key}
                        type="button"
                        initial={reduce ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduce ? 0 : Math.min(gi * 0.03, 0.35) }}
                        onClick={() => setLightbox({ src: item.src })}
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/40 text-left shadow-lg ring-1 ring-white/[0.04] transition-transform hover:z-[1] hover:scale-[1.02] hover:ring-[#7B61FF]/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
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
                    className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-600/40 via-[var(--deep-black)] to-cyan-500/25 shadow-[0_0_80px_-24px_rgba(123,97,255,0.65)]"
                  >
                    <Sparkles className="h-10 w-10 text-cyan-200" strokeWidth={1.5} />
                  </motion.div>
                  <div className="max-w-md space-y-2 px-2">
                    <p className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">Neural canvas online</p>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      Dial in controls, drop a reference if you need it, then describe the shot. Your session renders as a living timeline.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 pb-2">
                  {messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <motion.div key={msg.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                          <div
                            className="max-w-[min(100%,580px)] rounded-2xl rounded-br-md border border-violet-400/25 bg-gradient-to-br from-violet-500/15 to-black/40 px-4 py-3.5 shadow-[0_16px_48px_-28px_rgba(123,97,255,0.45)] ring-1 ring-white/[0.06] backdrop-blur-md"
                          >
                            <div className="flex gap-3">
                              {msg.refineFromUrl ? (
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={msg.refineFromUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                              ) : null}
                              <div className="min-w-0 flex-1">
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
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                    if (!showAssistantRow(msg)) return null;
                    return (
                      <motion.div key={msg.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="max-w-[min(100%,760px)] rounded-2xl rounded-bl-md border border-white/10 bg-black/35 px-4 py-3.5 shadow-xl ring-1 ring-white/[0.05] backdrop-blur-md">
                          {msg.loading ? (
                            <div className="space-y-3">
                              <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#7B61FF]" />
                                <span className="font-medium">{msg.phase || "Synthesizing…"}</span>
                              </p>
                              <div className="relative h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                  className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-to-r from-[#7B61FF] via-[#00D4FF] to-[#7B61FF]"
                                  animate={reduce ? undefined : { x: ["-100%", "280%"] }}
                                  transition={{ duration: 1.35, repeat: Infinity, ease: "linear" }}
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
                                  className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--soft-black)] shadow-2xl ring-1 ring-white/[0.06]"
                                >
                                  <div className="group relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt="Generated" className="aspect-square w-full bg-black/50 object-contain" />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-95" />
                                    <div className="absolute inset-x-0 bottom-0 flex translate-y-1 flex-wrap items-center justify-center gap-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={() => setLightbox({ src })}
                                        className="pointer-events-auto inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur-md hover:bg-black/70"
                                      >
                                        <Maximize2 className="h-3.5 w-3.5" />
                                        Full
                                      </button>
                                      <a
                                        href={src}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="pointer-events-auto inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur-md hover:bg-black/70"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Open
                                      </a>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 border-t border-white/10 p-2.5">
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => {
                                        setReferenceImageUrl(src);
                                        setPrompt("");
                                        document.getElementById("img-prompt")?.focus();
                                      }}
                                      className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[#7B61FF]/45 hover:bg-[#7B61FF]/10 disabled:opacity-60 sm:text-sm"
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
                                        className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-xs font-semibold transition-colors hover:border-[#7B61FF]/45 disabled:opacity-60 sm:text-sm"
                                        style={{ color: "var(--text-primary)" }}
                                      >
                                        {downloadingIdx?.key === msg.id && downloadingIdx.idx === idx ? (
                                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#7B61FF]" strokeWidth={2} />
                                        ) : (
                                          <Download className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
                                        )}
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void copyText(src, "Link copied")}
                                        className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-xs font-semibold transition-colors hover:border-[#7B61FF]/45 sm:text-sm"
                                        style={{ color: "var(--text-primary)" }}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        Link
                                      </button>
                                    </div>
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
                  placeholder={isEdit ? "How should this change?" : "Describe your shot…"}
                  rows={1}
                  className="studio-prompt-focus-image min-h-[44px] max-h-28 flex-1 resize-none rounded-xl border border-white/10 bg-black/45 px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
                />
                <StudioGlowGenerate tone="purple" size="icon" disabled={busy || prompt.trim().length < 2} onClick={() => void run()}>
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
                Prompt
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
                  placeholder="Describe your still frame…"
                  rows={2}
                  className="studio-prompt-focus-image min-h-[44px] w-full flex-1 resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
                />
                <StudioGlowGenerate tone="purple" size="lg" disabled={busy || prompt.trim().length < 2} onClick={() => void run()}>
                  {busy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Working…
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
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal
            onClick={() => setLightbox(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setLightbox(null);
            }}
          >
            <button
              type="button"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close preview"
              onClick={() => setLightbox(null)}
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.src}
              alt="Preview"
              className="max-h-[min(92vh,920px)] max-w-full rounded-2xl object-contain shadow-[0_0_80px_-20px_rgba(123,97,255,0.5)]"
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
        mode="image"
        eyebrow="Still frames"
        title="Image generation"
        subtitle="Luxury glass workspace · diffusion-native pipeline · tuned for cinema-grade stills."
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
                background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))",
                boxShadow: "0 6px 20px -8px rgba(123,97,255,0.5)",
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

