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

const QUALITY_OPTIONS = [
  { id: "standard", label: "Standard", sub: "Fast render", icon: Zap },
  { id: "quality", label: "Quality", sub: "Balanced high fidelity", icon: Film },
  { id: "ultra", label: "Ultra Quality", sub: "Cinema grade", icon: Sparkles },
] as const;
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
  quality: string;
  mode?: "std" | "pro";
  version?: string;
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
  quality: string;
  hasNegative: boolean;
  hasImage: boolean;
}) {
  const qualityLabel = QUALITY_OPTIONS.find((q) => q.id === opts.quality)?.label ?? "Quality";
  const parts = [
    `${opts.duration}s`,
    opts.aspect,
    qualityLabel,
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
  const { user, ready, refreshUser } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [rates, setRates] = useState<{
    cost_video_std: number;
    cost_video_pro: number;
    credits_per_video_second: number;
  }>({
    cost_video_std: 5,
    cost_video_pro: 8,
    credits_per_video_second: 5,
  });

  useEffect(() => {
    const fetchRates = async () => {
      const token = localStorage.getItem("ruhgen_user_jwt_v1");
      if (!token) return;
      try {
        const res = await fetch("/api/credits/rates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.ok && data.rates) {
          setRates(data.rates);
        }
      } catch (err) {
        console.error("Error fetching credit rates", err);
      }
    };
    if (user) {
      void fetchRates();
    }
  }, [user]);
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
  const [quality, setQuality] = useState<string>("quality");
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
  const [videoMode, setVideoMode] = useState<"txt2video" | "img2video" | "motion_control" | "frame_extender">("txt2video");
  const [cameraMotion, setCameraMotion] = useState<string>("dolly_in");
  const [fps, setFps] = useState<24 | 30 | 60>(24);
  const [motionIntensity, setMotionIntensity] = useState<number>(5);
  const [seed, setSeed] = useState<string>("");

  const costPerSecond = quality === "ultra" ? (rates.cost_video_pro ?? 8) : (rates.cost_video_std ?? rates.credits_per_video_second ?? 5);
  const currentCost = costPerSecond * duration;

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
      if (d.mode === "std" || d.mode === "pro") setQuality(d.mode === "pro" ? "ultra" : "quality");
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  // Check for prompt query parameter from "Use prompt" dashboard action
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryPrompt = params.get("prompt");
      if (queryPrompt) {
        setPrompt(queryPrompt);
        // Clean URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete("prompt");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

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
    if (pr.quality) {
      setQuality(pr.quality);
    } else if (pr.mode) {
      setQuality(pr.mode === "pro" ? "ultra" : "quality");
    }
    setNegativePrompt(pr.negativePrompt);
  }, []);

  const saveCurrentPreset = useCallback(() => {
    const name = window.prompt("Preset name");
    if (!name?.trim()) return;
    const id = crypto.randomUUID();
    setSavedPresets((prev) =>
      [
        { id, name: name.trim(), duration, aspect, quality, negativePrompt },
        ...prev.filter((p) => p.name !== name.trim()),
      ].slice(0, 24),
    );
  }, [duration, aspect, quality, negativePrompt]);

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

  const run = useCallback(async () => {
    const p = prompt.trim();
    if (p.length < 2 || busy) return;
    const neg = negativePrompt.trim();
    const img = imageUrl.trim();
    const meta = metaLine({
      duration,
      aspect,
      quality,
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
        quality,
        negative_prompt: neg || undefined,
        image_url: img || undefined,
      });
      void refreshUser();
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
      void refreshUser();
    }
  }, [prompt, negativePrompt, duration, aspect, quality, imageUrl, busy, refreshUser]);

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

  const aspectButtons: { key: typeof aspect; label: string; sub: string; icon: typeof RectangleHorizontal }[] = [
    { key: "16:9", label: "16:9", sub: "Landscape", icon: RectangleHorizontal },
    { key: "9:16", label: "9:16", sub: "Portrait", icon: Smartphone },
    { key: "1:1", label: "1:1", sub: "Square", icon: Square },
  ];

  const leftPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="sr-only">Press Enter to generate. Shift+Enter for a new line.</p>
      <div className="studio-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-3">
        <div className="border-gradient-premium rounded-[1.25rem] p-[1px] shadow-[0_24px_64px_-36px_rgba(0,212,255,0.45)]">
          <div
            className="rounded-[1.2rem] p-3.5 sm:p-4"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--primary-cyan) 9%, var(--deep-black)) 0%, color-mix(in srgb, var(--rich-black) 96%, transparent) 100%)",
            }}
          >
            {/* Header Title */}
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/35 to-[var(--primary-cyan)]/45 ring-1 ring-white/20 shadow-[0_4px_16px_-4px_rgba(0,212,255,0.5)]">
                  <Clapperboard className="h-4.5 w-4.5 text-cyan-50" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-subtle)]">Motion deck</p>
                    <span className="h-1 w-1 rounded-full bg-[var(--primary-cyan)] animate-pulse" />
                  </div>
                  <p className="truncate font-display text-sm font-bold text-[var(--text-primary)]">Video studio</p>
                </div>
              </div>
              {imageUrl.trim() ? (
                <span className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-200">
                  Img-2-Video Active
                </span>
              ) : null}
            </div>

            {/* Creation Mode Tabs */}
            <div className="mb-4">
              <p className="mb-1.5 px-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Video mode</p>
              <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/[0.08] bg-black/40 p-1">
                {[
                  { id: "txt2video", label: "Text 2 Vid", icon: Sparkles },
                  { id: "img2video", label: "Img 2 Vid", icon: ImagePlus },
                  { id: "motion_control", label: "Motion", icon: Clapperboard },
                  { id: "frame_extender", label: "Extend", icon: Film },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = videoMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setVideoMode(m.id as any);
                        if (m.id === "img2video" && !imageUrl.trim()) {
                          refFileInput.current?.click();
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-center transition-all duration-200 cursor-pointer ${
                        active
                          ? "bg-gradient-to-b from-[var(--primary-cyan)]/30 to-[var(--primary-cyan)]/10 border border-[var(--primary-cyan)]/60 text-white shadow-[0_4px_12px_-4px_rgba(0,212,255,0.5)]"
                          : "border border-transparent text-[var(--text-muted)] hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? "text-[var(--primary-cyan)]" : "opacity-70"}`} strokeWidth={1.75} />
                      <span className="text-[10px] font-bold tracking-tight">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {/* Camera Motion Director Controls */}
              <StudioCollapsible title="Camera path & movement" subtitle="Direct virtual camera dynamics" defaultOpen>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: "dolly_in", label: "Dolly In", icon: "🎥", tag: "slow dolly in shot" },
                    { id: "pan_right", label: "Pan Right", icon: "➡️", tag: "smooth right pan camera movement" },
                    { id: "tilt_up", label: "Tilt Up", icon: "⬆️", tag: "vertical tilt up shot" },
                    { id: "orbit_360", label: "360 Orbit", icon: "🔄", tag: "360 degree orbit around hero subject" },
                    { id: "handheld", label: "Handheld", icon: "📱", tag: "cinematic handheld micro-shake" },
                    { id: "static", label: "Static Tripod", icon: "🔒", tag: "locked tripod static shot" },
                  ].map((cam) => {
                    const active = cameraMotion === cam.id;
                    return (
                      <button
                        key={cam.id}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setCameraMotion(cam.id);
                          appendPromptChip(cam.tag);
                        }}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left transition-all duration-200 cursor-pointer ${
                          active
                            ? "border-[var(--primary-cyan)] bg-[var(--primary-cyan)]/20 text-white shadow-[0_2px_8px_rgba(0,212,255,0.4)]"
                            : "border-white/[0.06] bg-white/[0.02] text-[var(--text-muted)] hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className="text-xs">{cam.icon}</span>
                        <span className="truncate text-[10px] font-bold tracking-tight">{cam.label}</span>
                      </button>
                    );
                  })}
                </div>
              </StudioCollapsible>

              {/* Timeline, Frame Rate & Quality */}
              <StudioCollapsible title="Timeline & quality" subtitle="Duration, FPS, and rendering tier" defaultOpen>
                <div className="space-y-3.5">
                  <div>
                    <div className="mb-2 flex items-end justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/25">
                          <Clock className="h-3 w-3 text-cyan-200" strokeWidth={2} />
                        </span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Clip length</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[var(--primary-cyan)]">
                        {duration * fps} frames @ {fps} fps
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/[0.08] bg-black/40 p-1.5">
                      {([5, 10] as const).map((d) => {
                        const on = duration === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            disabled={busy}
                            onClick={() => setDuration(d)}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2 transition-all cursor-pointer ${
                              on
                                ? "border border-[var(--primary-cyan)]/60 bg-[var(--primary-cyan)]/25 text-white shadow-[0_4px_12px_-4px_rgba(0,212,255,0.5)]"
                                : "border border-transparent text-[var(--text-muted)] hover:text-white"
                            }`}
                          >
                            <Film className={`h-3.5 w-3.5 ${on ? "text-[var(--primary-cyan)]" : "opacity-70"}`} />
                            <span className="font-display text-xs font-bold">{d} Seconds</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">
                        Frame Rate (FPS)
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/[0.08] bg-black/40 p-1.5">
                      {([24, 30, 60] as const).map((f) => {
                        const on = fps === f;
                        return (
                          <button
                            key={f}
                            type="button"
                            disabled={busy}
                            onClick={() => setFps(f)}
                            className={`rounded-lg py-1 text-center font-mono text-[11px] font-bold transition-all cursor-pointer ${
                              on
                                ? "border border-[var(--primary-cyan)]/60 bg-[var(--primary-cyan)]/25 text-white"
                                : "border border-transparent text-[var(--text-muted)] hover:text-white"
                            }`}
                          >
                            {f} FPS
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">
                      Quality Profile
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/[0.08] bg-black/40 p-1.5">
                      {QUALITY_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const on = quality === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={busy}
                            onClick={() => setQuality(opt.id)}
                            className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-center transition-all duration-200 cursor-pointer ${
                              on
                                ? "border border-[var(--primary-cyan)]/60 bg-[var(--primary-cyan)]/25 text-white shadow-[0_4px_12px_-4px_rgba(0,212,255,0.5)]"
                                : "border border-transparent text-[var(--text-muted)] hover:text-white"
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${on ? "text-[var(--primary-cyan)]" : "text-[var(--text-subtle)]"}`} />
                            <span className="font-display text-[11px] font-bold truncate">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 space-y-2 border-t border-white/[0.06] pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Saved presets</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={saveCurrentPreset}
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-100 transition-all hover:bg-cyan-500/20 cursor-pointer"
                    >
                      <BookmarkPlus className="h-2.5 w-2.5" />
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
                          className="max-w-[150px] truncate rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] hover:border-cyan-400/50 hover:text-white cursor-pointer"
                        >
                          {pr.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[var(--text-subtle)]">No presets saved yet.</p>
                  )}
                </div>
              </StudioCollapsible>

              {/* Frame Geometry */}
              <StudioCollapsible title="Frame geometry" subtitle="Aspect ratio for distribution" defaultOpen>
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Frame">
                  {aspectButtons.map(({ key, label, sub }) => {
                    const on = aspect === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={busy}
                        onClick={() => setAspect(key)}
                        className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 text-center transition-all duration-200 cursor-pointer ${
                          on
                            ? "border-[var(--primary-cyan)] bg-[var(--primary-cyan)]/20 text-white shadow-[0_4px_14px_-6px_rgba(0,212,255,0.6)]"
                            : "border-white/[0.08] bg-white/[0.02] text-[var(--text-muted)] hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className="font-display text-[11px] font-bold">{label}</span>
                        <span className="text-[9px] text-[var(--text-subtle)]">{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </StudioCollapsible>

              {/* Negative & Start Frame Conditioning */}
              <StudioCollapsible title="Negative & start frame" subtitle="Optional constraints and image keyframe" defaultOpen={false}>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="vid-negative" className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                      <span>Negative prompt</span>
                      <span className="tabular-nums text-[9px]">{negativePrompt.length}/2500</span>
                    </label>
                    <textarea
                      id="vid-negative"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value.slice(0, 2500))}
                      disabled={busy}
                      placeholder="What to suppress in video (e.g. flickering, morphing text, low quality)..."
                      rows={2}
                      className="w-full resize-none rounded-xl border border-border bg-card/60 px-3 py-2 text-xs outline-none transition-all focus:border-[#00D4FF]/50 focus:ring-2 focus:ring-[#00D4FF]/15"
                      style={{ color: "var(--text-primary)", minHeight: "3.2rem" }}
                    />
                  </div>

                  {/* Start Frame Upload Slot */}
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Start Frame Keyframe</span>
                      {imageUrl.trim() ? (
                        <button
                          type="button"
                          disabled={busy || refUploading}
                          onClick={() => {
                            setImageUrl("");
                            setRefUploadError(null);
                          }}
                          className="inline-flex h-5 items-center gap-1 rounded-md border border-border px-1.5 text-[9px] font-bold uppercase text-[var(--text-muted)] hover:bg-card hover:text-white cursor-pointer"
                        >
                          <X className="h-2.5 w-2.5" />
                          Remove
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
                          .then(({ url }) => {
                            setImageUrl(url);
                            setVideoMode("img2video");
                          })
                          .catch((err: unknown) => setRefUploadError(err instanceof Error ? err.message : "Upload failed."))
                          .finally(() => setRefUploading(false));
                      }}
                    />
                    <div className="flex items-center gap-3">
                      {imageUrl.trim() ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl.trim()} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy || refUploading}
                        onClick={() => refFileInput.current?.click()}
                        className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/40 px-3 text-[11px] font-bold text-[var(--text-primary)] transition-all hover:bg-card hover:border-[#00D4FF]/45 cursor-pointer"
                      >
                        {refUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00D4FF]" /> : <ImagePlus className="h-3.5 w-3.5 text-[#67e8f9]" strokeWidth={2} />}
                        {refUploading ? "Uploading…" : imageUrl.trim() ? "Change keyframe" : "Upload start frame"}
                      </button>
                    </div>
                    {refUploadError ? <p className="mt-1.5 text-[11px] text-rose-300">{refUploadError}</p> : null}
                  </div>
                </div>
              </StudioCollapsible>

              {/* Advanced Motion Parameters Accordion */}
              <StudioCollapsible title="Advanced motion engine" subtitle="Motion intensity, camera speed, and seed lock" defaultOpen={false}>
                <div className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="motion-intensity" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Motion Intensity
                      </label>
                      <span className="font-mono text-[10px] font-bold text-[var(--primary-cyan)]">{motionIntensity} / 10</span>
                    </div>
                    <input
                      id="motion-intensity"
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={motionIntensity}
                      onChange={(e) => setMotionIntensity(Number(e.target.value))}
                      disabled={busy}
                      className="studio-range-premium mt-1.5 w-full cursor-pointer"
                    />
                  </div>

                  <div>
                    <label htmlFor="vid-seed" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                      Seed lock
                    </label>
                    <input
                      id="vid-seed"
                      type="text"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ""))}
                      disabled={busy}
                      placeholder="Random (-1)"
                      className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                </div>
              </StudioCollapsible>

              {/* Motion Vocabulary Prompt Chips */}
              <StudioCollapsible title="Motion vocabulary" subtitle="Camera motion prompt modifiers" defaultOpen>
                <StudioPromptChips labels={PROMPT_CHIPS} onPick={appendPromptChip} disabled={busy} tone="cyan" />
              </StudioCollapsible>
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
        {/* Cost Preview Panel */}
        <div className="mb-2.5 flex items-center justify-between rounded-xl border border-border/50 bg-[color-mix(in_srgb,var(--text-primary)_3%,transparent)] px-3 py-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)]">Quality:</span>
            <span className="font-mono bg-[#00D4FF]/10 border border-[#00D4FF]/20 px-1.5 py-0.5 rounded text-[10px] text-[#00D4FF] dark:text-cyan-200">
              {QUALITY_OPTIONS.find((q) => q.id === quality)?.label ?? "Quality"} ({duration}s)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[var(--text-muted)]">
            <span>
              Available: <strong className="text-[var(--text-primary)] tabular-nums">{user.availableCredits ?? user.credits ?? 0}</strong>
            </span>
            <span>
              Cost: <strong className={(user.availableCredits ?? user.credits ?? 0) < currentCost ? "text-rose-400 font-bold" : "text-[#00D4FF] font-bold"}>{currentCost} credits</strong>
            </span>
          </div>
        </div>

        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Director prompt</span>
          <span className="text-[10px] tabular-nums text-[var(--text-subtle)]">{prompt.length}</span>
        </div>
        <div
          className="studio-prompt-focus-video rounded-xl border border-border bg-card/65 px-3 py-2"
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
                Generate ({currentCost} credits)
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
                          ? "bg-cyan-500/20 text-[var(--text-primary)] ring-1 ring-cyan-400/45"
                          : "border border-border bg-card/35 text-[var(--text-muted)] hover:border-border/80"
                      }`}
                    >
                      {f === "all" ? "All" : f === "running" ? "Live" : "Ready"}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card/45 p-0.5">
                <button
                  type="button"
                  onClick={() => setStudioView("feed")}
                  aria-pressed={studioView === "feed"}
                  aria-label="Feed view"
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                    studioView === "feed" ? "bg-[color-mix(in_srgb,var(--text-primary)_12%,transparent)] text-[var(--text-primary)] shadow-inner" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                    studioView === "gallery" ? "bg-[color-mix(in_srgb,var(--text-primary)_12%,transparent)] text-[var(--text-primary)] shadow-inner" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
              <div className="flex shrink-0 items-center gap-1 border-b border-border/30 px-3 py-1.5 sm:hidden">
                {(["all", "running", "ready"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFeedFilter(f)}
                    className={`flex-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                      feedFilter === f
                        ? "bg-cyan-500/20 text-[var(--text-primary)] ring-1 ring-cyan-400/45"
                        : "border border-border bg-card/35 text-[var(--text-muted)]"
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
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-cyan-500/15 to-violet-600/10 shadow-[0_0_60px_-20px_rgba(0,212,255,0.5)]">
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
                        className="group relative overflow-hidden rounded-2xl border border-border bg-card/45 text-left shadow-xl ring-1 ring-border/20 transition-transform hover:z-[1] hover:scale-[1.01] hover:ring-cyan-400/35"
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
                      Dial duration, aspect, and quality profile, then describe camera and energy. Clips stream into this canvas as they finish.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-[min(100%,960px)] flex-col gap-6 px-1 pb-2">
                  {messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <motion.div key={msg.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                          <div className="max-w-[min(100%,580px)] rounded-2xl rounded-br-md border border-cyan-400/25 bg-gradient-to-br from-cyan-500/15 to-card/40 px-4 py-3.5 shadow-[0_16px_48px_-28px_rgba(0,212,255,0.35)] ring-1 ring-border/20 backdrop-blur-md">
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text-primary)]">{msg.content}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <p className="text-[11px] font-medium text-[var(--text-subtle)]">{msg.meta}</p>
                              <button
                                type="button"
                                onClick={() => void copyText(msg.content, "Prompt copied")}
                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/50 px-2 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition-all hover:bg-card/90 active:scale-[0.98]"
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
                        <div
                          className={
                            msg.urls.length > 0 && !msg.loading
                              ? "w-full max-w-[min(100%,760px)]"
                              : "w-full max-w-[min(100%,760px)] rounded-2xl rounded-bl-md border border-border bg-card/45 px-4 py-3.5 shadow-xl ring-1 ring-border/20 backdrop-blur-md"
                          }
                        >
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
                            <div className="space-y-6">
                              {msg.urls.map((src, vidx) => (
                                <div key={src} className="group relative overflow-hidden rounded-xl bg-transparent">
                                  {/* The Video player container */}
                                  <div className="relative overflow-hidden rounded-xl bg-black w-full max-h-[min(70vh,560px)] lg:max-h-[520px]">
                                    <video
                                      src={src}
                                      controls
                                      playsInline
                                      className="w-full h-auto max-h-[min(70vh,560px)] lg:max-h-[520px] block object-contain"
                                    />
                                    
                                    {/* Top Right Action Overlay (Fullscreen/Maximize) */}
                                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 transition-all duration-300 translate-y-[-4px] group-hover:translate-y-0 group-hover:opacity-100 z-10">
                                      <button
                                        type="button"
                                        onClick={() => setLightbox({ src })}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/80"
                                        title="Fullscreen"
                                      >
                                        <Maximize2 className="h-3.5 w-3.5" />
                                      </button>
                                      <a
                                        href={src}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/80"
                                        title="Open in new tab"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 text-[var(--primary-cyan)]" />
                                      </a>
                                    </div>

                                    {/* Floating bottom overlay action triggers */}
                                    <div className="absolute inset-x-3 bottom-3 flex gap-1.5 opacity-0 transition-all duration-300 translate-y-[4px] group-hover:translate-y-0 group-hover:opacity-100 z-10">
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
                                        className="flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-black/60 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-[var(--primary-cyan)]/80 hover:border-[var(--primary-cyan)]/45 disabled:opacity-50"
                                      >
                                        {downloadingKey === `${msg.id}-${vidx}` ? (
                                          <Loader2 className="h-3 w-3 animate-spin text-[var(--primary-cyan)]" />
                                        ) : (
                                          <Download className="h-3 w-3" />
                                        )}
                                        {downloadingKey === `${msg.id}-${vidx}` ? "Saving…" : "Download"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void copyText(src, "Video URL copied")}
                                        className="flex h-8.5 px-3 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-black/60 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-black/80"
                                      >
                                        <Copy className="h-3 w-3" />
                                        Copy URL
                                      </button>
                                    </div>
                                  </div>

                                  {/* Mobile-only visible quick buttons underneath */}
                                  <div className="flex gap-2.5 mt-2 lg:hidden">
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
                                      className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card/60 text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-card/90 active:scale-[0.98]"
                                    >
                                      {downloadingKey === `${msg.id}-${vidx}` ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Download className="h-3 w-3" />
                                      )}
                                      Download
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void copyText(src, "Video URL copied")}
                                      className="flex h-8 px-2.5 items-center justify-center gap-1 rounded-lg border border-border bg-card/60 text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-card/90 active:scale-[0.98]"
                                    >
                                      <Copy className="h-3 w-3" />
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
                 <StudioGlowGenerate
                  tone="cyan"
                  size="icon"
                  disabled={busy || prompt.trim().length < 2 || user.generationDisabled || (user.availableCredits ?? user.credits ?? 0) < currentCost}
                  onClick={() => void run()}
                >
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
              {/* Cost Preview Panel Mobile */}
              <div className="mb-2 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-2 py-1 text-[11px]">
                <span className="font-semibold text-white">Cost: <strong className={(user.availableCredits ?? user.credits ?? 0) < currentCost ? "text-rose-400 font-bold" : "text-[#00D4FF] font-bold"}>{currentCost} credits</strong></span>
                <span className="text-[var(--text-subtle)]">Available: {user.availableCredits ?? user.credits ?? 0}</span>
              </div>

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
                <StudioGlowGenerate
                  tone="cyan"
                  size="lg"
                  disabled={busy || prompt.trim().length < 2 || user.generationDisabled || (user.availableCredits ?? user.credits ?? 0) < currentCost}
                  onClick={() => void run()}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Rendering…
                    </>
                  ) : user.generationDisabled ? (
                    <>
                      <X className="h-5 w-5" strokeWidth={2} />
                      Access Disabled
                    </>
                  ) : (user.availableCredits ?? user.credits ?? 0) < currentCost ? (
                    <>
                      <X className="h-5 w-5" strokeWidth={2} />
                      Insufficient
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" strokeWidth={2} />
                      Generate ({currentCost} credits)
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
        subtitle="Luxury glass workspace · quality-tiered rendering · tuned for cinema-grade clips."
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
              <span className="tabular-nums font-semibold">{user?.availableCredits ?? user?.credits ?? 0} </span>
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
