"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  Check,
  Clapperboard,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Film,
  Grid3x3,
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
  Wand2,
  X,
  Zap,
  MoveHorizontal,
  Video,
  Camera,
  Layers,
  Info,
  ChevronUp,
  ChevronDown,
  Share2,
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
import { createVideoTask, pollStudioTask, uploadStudioReference, uploadStudioReferenceImage } from "@/lib/studio-client";
import { CommunityShareModal } from "@/components/community/CommunityShareModal";

/** Universal RUHGEN Video Tiers */
const RUHGEN_VIDEO_TIERS = [
  {
    id: "standard",
    label: "RUHGEN Standard",
    sub: "Fast & efficient video model",
    icon: Zap,
    badge: "Standard",
  },
  {
    id: "quality",
    label: "RUHGEN Premium",
    sub: "Cinema-grade high-definition model",
    icon: Sparkles,
    badge: "Premium",
  },
] as const;

/** Universal Video Aspect Ratios */
const ASPECT_RATIOS = [
  { key: "16:9", label: "Landscape", ratio: "16:9", iconW: 20, iconH: 11, desc: "16:9 Widescreen video", icon: RectangleHorizontal },
  { key: "9:16", label: "Portrait", ratio: "9:16", iconW: 11, iconH: 20, desc: "9:16 Reels & Stories", icon: Smartphone },
  { key: "1:1", label: "Square", ratio: "1:1", iconW: 16, iconH: 16, desc: "1:1 Social feed format", icon: Square },
] as const;

/** Cinematic Camera Movements */
const CAMERA_MOVEMENTS = [
  { id: "static", label: "Static", icon: "🔒", desc: "Locked tripod shot", tag: "locked tripod static shot, steady composition" },
  { id: "push_in", label: "Push In", icon: "🔍", desc: "Dolly in towards subject", tag: "slow dolly push in camera movement" },
  { id: "pull_out", label: "Pull Out", icon: "⏪", desc: "Reverse dolly move", tag: "smooth reverse pull out camera shot" },
  { id: "pan_left", label: "Pan Left", icon: "⬅️", desc: "Horizontal left pan", tag: "cinematic smooth left pan shot" },
  { id: "pan_right", label: "Pan Right", icon: "➡️", desc: "Horizontal right pan", tag: "cinematic smooth right pan shot" },
  { id: "tilt_up", label: "Tilt Up", icon: "⬆️", desc: "Vertical upward tilt", tag: "vertical tilt up camera shot" },
  { id: "tilt_down", label: "Tilt Down", icon: "⬇️", desc: "Vertical downward tilt", tag: "vertical tilt down camera shot" },
  { id: "orbit", label: "Orbit", icon: "🔄", desc: "360° rotational camera", tag: "360 degree orbital camera sweep around subject" },
  { id: "tracking", label: "Tracking", icon: "🎯", desc: "Dynamic subject tracking", tag: "dynamic subject tracking camera move" },
  { id: "crane", label: "Crane", icon: "🏗️", desc: "Elevated sweeping crane", tag: "sweeping elevated crane shot" },
  { id: "handheld", label: "Handheld", icon: "📱", desc: "Organic micro-shake", tag: "cinematic handheld micro-shake feel" },
  { id: "dolly", label: "Dolly", icon: "🎥", desc: "Smooth tracking dolly", tag: "smooth tracking dolly shot" },
] as const;

/** Motion Vocabulary Concepts */
const MOTION_CHIPS = [
  "Slow Motion",
  "Fast Action",
  "Fluid Motion",
  "Explosive Particles",
  "Subtle Breathing",
  "Atmospheric Smoke",
  "Kinetic Tracking",
  "Cinematic Rim Motion",
  "Hypnotic Loop",
  "Time-Lapse Sweep",
] as const;

const CHAT_STORAGE_PREFIX = "ruhgen-video-studio-chat-v1:";

type UserMsg = { id: string; role: "user"; content: string; meta: string };
type AssistantMsg = { id: string; role: "assistant"; loading: boolean; phase: string; urls: string[]; error: string | null };
type ChatMsg = UserMsg | AssistantMsg;

type PersistedChat = {
  v: 1;
  timestamp?: number;
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
  const videoPromptRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottomRef = useRef(true);
  const scrollGuardUntilRef = useRef(0);
  const prevLenForSnapRef = useRef<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refFileInput = useRef<HTMLInputElement>(null);

  // Studio Controls State
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState<number>(5); // 5s to 10s slider
  const [aspect, setAspect] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [selectedTier, setSelectedTier] = useState<string>("quality");
  const [selectedCamera, setSelectedCamera] = useState<string>("push_in");
  const [referenceUrl, setReferenceUrl] = useState<string>("");
  const [referenceType, setReferenceType] = useState<"image" | "video">("image");
  const [activeRefTab, setActiveRefTab] = useState<"image" | "video">("image");
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalData, setShareModalData] = useState<{ mediaUrl: string; prompt: string; kind: "image" | "video" } | null>(null);

  const costPerSecond = selectedTier === "quality" ? (rates.cost_video_pro ?? 8) : (rates.cost_video_std ?? rates.credits_per_video_second ?? 5);
  const currentCost = costPerSecond * duration;
  const activeTierObj = RUHGEN_VIDEO_TIERS.find((t) => t.id === selectedTier) ?? RUHGEN_VIDEO_TIERS[1];
  const isImg2Video = Boolean(referenceUrl.trim() && referenceType === "image");
  const isVid2Video = Boolean(referenceUrl.trim() && referenceType === "video");
  const referenceImageUrl = referenceType === "image" ? referenceUrl : "";

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/generate/video");
  }, [ready, user, router]);

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
      if (typeof d.duration === "number" && d.duration >= 5 && d.duration <= 10) setDuration(d.duration);
      if (["16:9", "9:16", "1:1"].includes(d.aspect || "")) setAspect(d.aspect as any);
      if (d.mode === "pro" || d.mode === "std") setSelectedTier(d.mode === "pro" ? "quality" : "standard");
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryPrompt = params.get("prompt");
      if (queryPrompt) {
        setPrompt(queryPrompt);
        setTimeout(() => {
          videoPromptRef.current?.focus();
        }, 100);
        const url = new URL(window.location.href);
        url.searchParams.delete("prompt");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;
    try {
      const key = `${CHAT_STORAGE_PREFIX}${user.id}`;
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setMessages([]);
    setHistoryLoaded(true);
  }, [user?.id]);

  const appendPromptChip = useCallback((t: string) => {
    setPrompt((p) => (p.trim() ? `${p.trim()}, ${t}` : t));
  }, []);

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

  const handleFileUpload = useCallback(
    (file: File, expectedType?: "image" | "video") => {
      if (!file) return;
      setRefUploadError(null);

      const isVideoFile = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
      const isImageFile = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

      if (expectedType === "image" && !isImageFile) {
        setRefUploadError("Please select a valid image file (JPEG, PNG, WebP).");
        return;
      }
      if (expectedType === "video" && !isVideoFile) {
        setRefUploadError("Please select a valid video file (MP4, WebM, MOV).");
        return;
      }
      if (!isImageFile && !isVideoFile) {
        setRefUploadError("Unsupported file format. Please upload an image (JPEG, PNG, WebP) or video (MP4, WebM, MOV).");
        return;
      }

      const maxImgBytes = 20 * 1024 * 1024;
      const maxVidBytes = 50 * 1024 * 1024;
      if (isImageFile && file.size > maxImgBytes) {
        setRefUploadError("Image reference size exceeds 20MB limit.");
        return;
      }
      if (isVideoFile && file.size > maxVidBytes) {
        setRefUploadError("Video reference size exceeds 50MB limit.");
        return;
      }

      setRefUploading(true);
      uploadStudioReference(file)
        .then(({ url, type }) => {
          setReferenceUrl(url);
          setReferenceType(type);
          setActiveRefTab(type);
        })
        .catch((err: unknown) => {
          setRefUploadError(err instanceof Error ? err.message : "Upload failed.");
        })
        .finally(() => {
          setRefUploading(false);
        });
    },
    []
  );

  const run = useCallback(async () => {
    const p = prompt.trim();
    if (p.length < 2 || busy) return;
    const neg = negativePrompt.trim();
    const img = referenceUrl.trim() && referenceType === "image" ? referenceUrl.trim() : "";
    const vid = referenceUrl.trim() && referenceType === "video" ? referenceUrl.trim() : "";
    const tierLabel = activeTierObj.label;
    
    const parts = [`${duration}s clip`, aspect, tierLabel];
    if (neg) parts.push("negative filter");
    if (img) parts.push("reference image");
    if (vid) parts.push("reference video");
    const meta = parts.join(" · ");

    const userId = crypto.randomUUID();
    const asstId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: p, meta },
      { id: asstId, role: "assistant", loading: true, phase: "Initializing video engine…", urls: [], error: null },
    ]);
    setPrompt("");
    setBusy(true);
    setMobileStudioPane("output");
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const canvasEl = document.getElementById("mobile-studio-canvas") || document.getElementById("studio-canvas-feed");
        canvasEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    try {
      // Map API duration (backend supports 5 or 10)
      const targetApiDuration: 5 | 10 = duration >= 8 ? 10 : 5;
      const targetAspect = (["16:9", "9:16", "1:1"].includes(aspect) ? aspect : "16:9") as "16:9" | "9:16" | "1:1";

      const { taskId } = await createVideoTask({
        prompt: p,
        duration: targetApiDuration,
        aspect_ratio: targetAspect,
        quality: selectedTier,
        negative_prompt: neg || undefined,
        image_url: img || undefined,
        video_url: vid || undefined,
        reference_url: referenceUrl || undefined,
        reference_type: referenceType || undefined,
      });
      void refreshUser();
      setMessages((prev) => prev.map((x) => (x.id === asstId ? { ...x, phase: "Rendering video motion frames…" } : x)));
      const result = await pollStudioTask(taskId, {
        intervalMs: 3000,
        maxAttempts: 200,
        onStatus: (s) => {
          setMessages((prev) => prev.map((x) => (x.id === asstId ? { ...x, phase: `RUHGEN Status: ${s}` } : x)));
        },
      });
      if (!result.urls.length) {
        setMessages((prev) =>
          prev.map((x) =>
            x.id === asstId
              ? { ...x, loading: false, phase: "", urls: [], error: "Generation finished but no video clip was returned." }
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
  }, [prompt, negativePrompt, referenceImageUrl, activeTierObj, duration, aspect, selectedTier, busy, refreshUser]);

  const clearChatHistory = useCallback(() => {
    prevLenForSnapRef.current = null;
    setMessages([]);
    setReferenceUrl("");
    setReferenceType("image");
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

  if (!ready) return <DashboardLoading label="Loading RUHGEN Video Studio…" />;
  if (!user) return null;

  const leftPanel = (
    <div className="flex flex-col w-full h-full min-h-0 flex-1 overflow-hidden bg-[#121215]">
      <p className="sr-only">Press Enter to generate video. Shift+Enter for newline.</p>
      <div className="p-2.5 sm:p-3 min-h-0 flex-1 overflow-y-auto studio-scrollbar overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y">
        <div className="rounded-xl border border-white/10 bg-[#121215] p-3 sm:p-3.5 shadow-sm space-y-3">
            {/* Header Title */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-zinc-800 text-zinc-100">
                  <Clapperboard className="h-4 w-4 text-zinc-200" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">RUHGEN Studio</p>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="truncate font-display text-xs font-semibold text-zinc-100">Video Creation Panel</p>
                </div>
              </div>
              {referenceUrl ? (
                <span className="shrink-0 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-100">
                  {referenceType === "video" ? "Video Guided" : "Image Guided"}
                </span>
              ) : null}
            </div>

            {/* Model / Version Tier Selector */}
            <div className="rounded-lg border border-white/10 bg-zinc-900/90 p-1.5">
              <div className="mb-1.5 px-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                <span>Select Model Tier</span>
                <span className="text-zinc-200 font-semibold">{selectedTier === "quality" ? "Premium (8 cr/s)" : "Standard (5 cr/s)"}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="RUHGEN Video Version Tier">
                {RUHGEN_VIDEO_TIERS.map((tier) => {
                  const Icon = tier.icon;
                  const active = selectedTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={busy}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-md py-2 px-2.5 text-[11px] font-medium transition-all cursor-pointer ${
                        active
                          ? "bg-white/10 text-white border border-white/25 shadow-[0_2px_10px_rgba(255,255,255,0.08)] font-semibold"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-zinc-500"}`} />
                      <span className="truncate">{tier.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {/* 1. MEDIA REFERENCE (IMAGE / VIDEO) */}
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {activeRefTab === "video" ? (
                      <Film className="h-3.5 w-3.5 text-zinc-300" strokeWidth={1.75} />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5 text-zinc-300" strokeWidth={1.75} />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
                      1. Media Reference
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Optional</span>
                </div>

                {/* Reference Mode Selector */}
                <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-zinc-950 p-1">
                  <button
                    type="button"
                    disabled={busy || refUploading}
                    onClick={() => setActiveRefTab("image")}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-medium uppercase tracking-wider transition-all cursor-pointer ${
                      activeRefTab === "image"
                        ? "bg-white/10 text-white border border-white/25 shadow-sm font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <ImagePlus className="h-3 w-3 text-zinc-200" />
                    <span>Image Ref</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy || refUploading}
                    onClick={() => setActiveRefTab("video")}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-medium uppercase tracking-wider transition-all cursor-pointer ${
                      activeRefTab === "video"
                        ? "bg-white/10 text-white border border-white/25 shadow-sm font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Film className="h-3 w-3 text-zinc-200" />
                    <span>Video Ref</span>
                  </button>
                </div>
                
                <input
                  ref={refFileInput}
                  type="file"
                  accept={activeRefTab === "image" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm,video/quicktime"}
                  className="sr-only"
                  tabIndex={-1}
                  disabled={busy || refUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) handleFileUpload(f, activeRefTab);
                  }}
                />

                {referenceUrl ? (
                  <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-zinc-900 p-2">
                    {referenceType === "image" ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/20 bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={referenceUrl} alt="Image Reference" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-white/20 bg-black">
                        <video
                          src={referenceUrl}
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-white">
                          {referenceType === "image" ? "Image Reference" : "Video Reference"}
                        </p>
                        <span className="shrink-0 rounded-md bg-zinc-800 text-zinc-300 border border-white/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider">
                          {referenceType === "image" ? "Image Guided" : "Video Guided"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {referenceType === "image"
                          ? "Animates & directs motion frame"
                          : "Motion transfer & scene guidance"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={busy || refUploading}
                        onClick={() => refFileInput.current?.click()}
                        className="rounded-md border border-white/15 bg-zinc-800 px-2 py-1 text-[9px] font-semibold uppercase text-zinc-200 hover:bg-zinc-700 cursor-pointer transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setReferenceUrl("");
                          setReferenceType("image");
                        }}
                        className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[9px] font-bold uppercase text-rose-300 hover:bg-rose-500/20 cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy || refUploading}
                    onClick={() => refFileInput.current?.click()}
                    className="flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-2.5 text-center transition-all hover:border-[var(--primary-cyan)]/60 hover:bg-white/[0.05] cursor-pointer"
                  >
                    {refUploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--primary-cyan)]" />
                        <span className="text-xs font-bold text-cyan-200">
                          Uploading {activeRefTab === "image" ? "Image" : "Video"} Reference…
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          {activeRefTab === "image" ? (
                            <ImagePlus className="h-4 w-4 text-cyan-300" />
                          ) : (
                            <Film className="h-4 w-4 text-cyan-300" />
                          )}
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            Upload {activeRefTab === "image" ? "Image" : "Video"} Reference
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-subtle)]">
                          {activeRefTab === "image"
                            ? "JPEG, PNG or WebP (max 20MB) · Optional starting frame"
                            : "MP4, WebM or MOV (max 50MB) · Optional video motion guide"}
                        </span>
                      </>
                    )}
                  </button>
                )}
                {refUploadError ? (
                  <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-medium text-rose-200">
                    {refUploadError}
                  </div>
                ) : null}
              </div>

              {/* 2. ASPECT RATIO */}
              <StudioCollapsible title="2. Aspect Ratio" defaultOpen>
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Aspect Ratio">
                  {ASPECT_RATIOS.map((item) => {
                    const on = aspect === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={busy}
                        onClick={() => setAspect(item.key as any)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-2 px-1.5 text-center transition-all cursor-pointer ${
                          on
                            ? "border-white/20 bg-zinc-800 text-white shadow-sm font-semibold"
                            : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <div className="flex h-5 items-center justify-center">
                          <div
                            className={`rounded-[2px] border-2 transition-all ${
                              on ? "border-white bg-zinc-700" : "border-zinc-500"
                            }`}
                            style={{ width: `${item.iconW}px`, height: `${item.iconH}px` }}
                          />
                        </div>
                        <div className="leading-none">
                          <p className="font-mono text-[11px] font-bold text-white">{item.ratio}</p>
                          <p className="mt-0.5 text-[9px] font-medium text-zinc-400">{item.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </StudioCollapsible>

              {/* 3. VIDEO DURATION */}
              <StudioCollapsible title="3. Video Duration" subtitle="Select target clip duration in seconds" defaultOpen>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-300" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Clip Length</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-zinc-100 bg-zinc-800 px-2.5 py-0.5 rounded-md border border-white/10">
                      {duration} Seconds
                    </span>
                  </div>

                  {/* Ultra-Slim Minimalist Glass Slider */}
                  <div className="relative pt-2 pb-1">
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min={5}
                        max={10}
                        step={1}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        disabled={busy}
                        className="studio-range-premium h-[2px] w-full cursor-pointer appearance-none rounded-full bg-white/15 outline-none transition-all"
                      />
                    </div>
                    <div className="mt-2 flex justify-between px-0.5 font-mono text-[10px] font-bold text-zinc-400">
                      {[5, 6, 7, 8, 9, 10].map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={busy}
                          onClick={() => setDuration(s)}
                          className={`cursor-pointer transition-colors ${
                            duration === s
                              ? "text-white font-extrabold"
                              : "hover:text-white text-zinc-400"
                          }`}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </StudioCollapsible>

              {/* 4. MOTION VOCABULARY */}
              <StudioCollapsible title="4. Motion Vocabulary" subtitle="Interactive kinetic action, atmosphere & physical motion" defaultOpen={false}>
                <div className="space-y-3">
                  {[
                    {
                      category: "Camera Dynamics & Pace",
                      items: [
                        {
                          label: "slow motion 60fps",
                          value: "captured in ultra smooth slow motion at 60fps, high speed camera fluid dynamics, elegant motion cadence",
                        },
                        {
                          label: "fast action velocity",
                          value: "high velocity kinetic motion, rapid dynamic scene pacing, motion blur speed trail effect",
                        },
                        {
                          label: "subtle organic breathing",
                          value: "subtle natural breathing movement, gentle ambient swaying motion, soft life-like motion micro-dynamics",
                        },
                        {
                          label: "hypnotic infinite loop",
                          value: "seamless hypnotic looping motion, perfectly balanced cyclic movement, continuous fluid motion transition",
                        },
                        {
                          label: "time-lapse sky sweep",
                          value: "accelerated time-lapse motion sweep, fast moving cloud trails, shifting atmospheric shadows",
                        },
                      ],
                    },
                    {
                      category: "Environmental & Atmospheric Motion",
                      items: [
                        {
                          label: "volumetric smoke & haze",
                          value: "swirling volumetric smoke and misty haze, dense atmospheric fog drifting softly across light beams",
                        },
                        {
                          label: "explosive spark particles",
                          value: "bursting embers and luminous spark particles rising upward, fiery light reflections, dynamic drift",
                        },
                        {
                          label: "water splash & fluid ripples",
                          value: "crystal liquid water splash, fluid surface ripple dynamics, sparkling light refraction on droplets",
                        },
                        {
                          label: "wind-blown fabric motion",
                          value: "dramatic wind gusts blowing silk fabric, flowing organic wave movement, billowing clothing physics",
                        },
                        {
                          label: "glowing bioluminescent pulse",
                          value: "rhythmic bioluminescent light pulse, pulsing cyan and violet ambient glow, shimmering energy waves",
                        },
                      ],
                    },
                    {
                      category: "Lighting & Cinema FX",
                      items: [
                        {
                          label: "anamorphic lens streak",
                          value: "horizontal blue anamorphic streak lens flare, cinematic anamorphic bokeh, 2.39:1 scope motion focus",
                        },
                        {
                          label: "dramatic shutter sweep",
                          value: "180-degree cinema shutter angle, authentic motion blur, crisp optical dynamic range",
                        },
                        {
                          label: "rim light specular highlights",
                          value: "intense rear studio rim lighting, glinting specular edge highlights on moving surfaces",
                        },
                        {
                          label: "neon night reflections",
                          value: "cyberpunk wet street neon reflections, shimmering puddle light distortion, high-contrast night atmosphere",
                        },
                      ],
                    },
                  ].map((group) => (
                    <div key={group.category} className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {group.category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              appendPromptChip(item.value);
                            }}
                            className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-[10px] font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-zinc-800 hover:text-white cursor-pointer disabled:opacity-40"
                            title={`Inserts: "${item.value}"`}
                          >
                            + {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </StudioCollapsible>

              {/* 5. CAMERA MOVEMENT */}
              <StudioCollapsible title="5. Camera Movement" subtitle="Direct virtual camera paths & dynamics" defaultOpen={false}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {CAMERA_MOVEMENTS.map((cam) => {
                    const active = selectedCamera === cam.id;
                    return (
                      <button
                        key={cam.id}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setSelectedCamera(cam.id);
                          appendPromptChip(cam.tag);
                        }}
                        className={`flex flex-col items-start gap-0.5 rounded-lg border p-2 transition-all text-left cursor-pointer ${
                          active
                            ? "border-white/20 bg-zinc-800 text-white font-semibold shadow-sm"
                            : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="text-xs">{cam.icon}</span>
                          <span className="truncate text-[10px] font-bold tracking-tight text-white">{cam.label}</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 truncate w-full">{cam.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </StudioCollapsible>

              {/* 6. NEGATIVE PROMPT */}
              <StudioCollapsible title="6. Negative Prompt" subtitle="Exclude unwanted motion or visual artifacts" defaultOpen={false}>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="vid-neg" className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                      Unwanted Motion & Artifacts
                    </label>
                    <span className="tabular-nums text-[9px] text-zinc-500">{negativePrompt.length}/2500</span>
                  </div>
                  <textarea
                    id="vid-neg"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value.slice(0, 2500))}
                    disabled={busy}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Describe unwanted camera shake, morphing, flickering, artifacts, bad physics…"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none transition-colors focus:border-white/20 focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </StudioCollapsible>
            </div>
          </div>
        </div>

      {/* Sticky prompt + generate (Section 8: Video Generation Area) */}
      <div className="shrink-0 border-t border-white/10 bg-[#121215] px-3 pb-3 pt-2.5">
        {/* Slim Single-Line Tier & Credit Summary Badge */}
        <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-white/10 bg-zinc-900/90 px-2.5 py-1 text-[10px] text-zinc-300 whitespace-nowrap overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-display font-semibold text-white flex items-center gap-1.5">
              <Clapperboard className="h-3 w-3 text-zinc-300" />
              {selectedTier === "quality" ? "Prem Tier" : "Std Tier"}
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-200 font-medium">{duration}s</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[10px] text-zinc-400">
            <span>
              Avail: <strong className="text-zinc-100 tabular-nums">{user?.availableCredits ?? user?.credits ?? 0}</strong>
            </span>
            <span>
              Cost: <strong className={((user?.availableCredits ?? user?.credits ?? 0) < currentCost) ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{currentCost} cr</strong>
            </span>
          </div>
        </div>

        <div className="relative flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 transition-colors focus-within:border-white/25">
          <label className="sr-only" htmlFor="vid-prompt">Prompt</label>
          <textarea
            ref={videoPromptRef}
            id="vid-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={isImg2Video ? "Describe action & movement for reference image…" : "Describe cinematic video scene & motion…"}
            rows={2}
            disabled={busy}
            className="no-scrollbar max-h-[160px] min-h-[40px] w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500 sm:text-[13px]"
            style={{ scrollbarWidth: "none" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void run();
              }
            }}
          />

          {prompt.length > 70 ? (
            <div className="flex flex-col gap-1 shrink-0 select-none transition-opacity duration-200">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (videoPromptRef.current) {
                    videoPromptRef.current.scrollTop -= 32;
                  }
                }}
                className="flex h-5 w-5 items-center justify-center rounded-md border border-white/12 bg-white/[0.05] text-slate-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/25 hover:text-white active:scale-95 cursor-pointer disabled:opacity-30"
                title="Scroll Up"
                aria-label="Scroll Up"
              >
                <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (videoPromptRef.current) {
                    videoPromptRef.current.scrollTop += 32;
                  }
                }}
                className="flex h-5 w-5 items-center justify-center rounded-md border border-white/12 bg-white/[0.05] text-slate-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/25 hover:text-white active:scale-95 cursor-pointer disabled:opacity-30"
                title="Scroll Down"
                aria-label="Scroll Down"
              >
                <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-2">
          <StudioGlowGenerate
            disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || (user?.availableCredits ?? user?.credits ?? 0) < currentCost}
            onClick={() => void run()}
            size="md"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                <span className="font-bold tracking-wide text-zinc-950">Rendering Video ({duration}s)…</span>
              </>
            ) : user?.generationDisabled ? (
              <>
                <X className="h-4 w-4 text-rose-700" strokeWidth={2.5} />
                <span className="font-bold tracking-wide text-rose-800">Access Disabled</span>
              </>
            ) : (user?.availableCredits ?? user?.credits ?? 0) < currentCost ? (
              <>
                <X className="h-4 w-4 text-rose-700" strokeWidth={2.5} />
                <span className="font-bold tracking-wide text-rose-800">Insufficient Credits</span>
              </>
            ) : (
              <>
                <Clapperboard className="h-4 w-4 text-zinc-950" strokeWidth={2.2} />
                <span className="font-bold tracking-wide text-zinc-950">Generate Video</span>
              </>
            )}
          </StudioGlowGenerate>
        </div>
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
                  Motion Canvas
                </p>
                <p className="truncate font-display text-[13px] font-bold leading-tight sm:text-sm" style={{ color: "var(--text-primary)" }}>
                  {messages.length === 0 ? "Awaiting video motion description" : `${galleryItems.length} video clip${galleryItems.length === 1 ? "" : "s"} rendered`}
                </p>
              </div>
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
                aria-label={chrome.collapsed ? "Show controls" : "Hide controls"}
                aria-pressed={chrome.collapsed}
                title={chrome.collapsed ? "Show controls" : "Hide controls"}
              >
                {chrome.collapsed ? <PanelLeft className="h-3.5 w-3.5" strokeWidth={2} /> : <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={2} />}
              </button>
            </div>
            <div
              ref={scrollRef}
              className="studio-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y px-3 py-3 sm:px-4"
            >
              {studioView === "gallery" ? (
                galleryItems.length === 0 ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-12 text-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-cyan-600/15 to-violet-500/10 shadow-[0_0_60px_-20px_rgba(0,212,255,0.55)]">
                      <Grid3x3 className="h-9 w-9 text-white/90" strokeWidth={1.5} />
                    </div>
                    <div className="max-w-xs space-y-2">
                      <p className="font-display text-lg font-bold text-[var(--text-primary)]">Video Gallery Awaits</p>
                      <p className="text-sm leading-relaxed text-[var(--text-muted)]">Rendered video clips collect in your personal RUHGEN motion vault.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {galleryItems.map((item, gi) => (
                      <motion.div
                        key={item.key}
                        initial={reduce ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduce ? 0 : Math.min(gi * 0.03, 0.35) }}
                        className="group relative overflow-hidden rounded-2xl border border-border bg-card/45 shadow-lg ring-1 ring-border/20"
                      >
                        <video
                          src={item.src}
                          controls
                          className="w-full h-auto block rounded-2xl bg-black"
                          preload="metadata"
                        />
                      </motion.div>
                    ))}
                  </div>
                )
              ) : messages.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-5 py-14 text-center select-none">
                  <motion.div
                    initial={reduce ? false : { scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-tr from-cyan-950/80 via-indigo-900/40 to-blue-500/20 p-0.5 shadow-[0_0_100px_-20px_rgba(0,212,255,0.75)] backdrop-blur-2xl transition-transform duration-500 hover:scale-105"
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-[#0c0d12]/90 backdrop-blur-md">
                      <div className="relative">
                        <Clapperboard className="h-11 w-11 text-cyan-300 drop-shadow-[0_0_16px_rgba(0,212,255,0.85)] transition-transform duration-500 group-hover:rotate-6" strokeWidth={1.75} />
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-500 text-[8px] font-bold text-white shadow-[0_0_10px_rgba(0,212,255,0.8)]">▶</span>
                      </div>
                    </div>
                  </motion.div>
                  <div className="max-w-md space-y-2 px-4">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 backdrop-blur-md">
                      <Clapperboard className="h-3 w-3 text-cyan-300" />
                      RUHGEN Motion Engine
                    </div>
                    <h2 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                      RUHGEN Video Studio
                    </h2>
                    <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
                      Set duration slider, camera path, aspect ratio, and RUHGEN tier. Enter your motion description below to render video clips.
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
                            className="max-w-[min(100%,580px)] rounded-2xl rounded-br-md border border-cyan-400/25 bg-gradient-to-br from-cyan-500/15 to-card/40 px-4 py-3.5 shadow-[0_16px_48px_-28px_rgba(0,212,255,0.45)] ring-1 ring-border/20 backdrop-blur-md"
                          >
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
                              : "max-w-[min(100%,760px)] rounded-2xl rounded-bl-md border border-border bg-card/45 px-4 py-3.5 shadow-xl ring-1 ring-border/20 backdrop-blur-md"
                          }
                        >
                          {msg.loading ? (
                            <div className="space-y-3">
                              <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--primary-cyan)]" />
                                <span className="font-medium">{msg.phase || "Rendering video clip…"}</span>
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
                            <div className="space-y-4">
                              {msg.urls.map((src, vidx) => (
                                <div key={`${msg.id}-${vidx}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                                  <video
                                    src={src}
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-auto block rounded-2xl max-h-[560px] object-contain"
                                  />
                                  <div className="flex items-center justify-between gap-2 p-3 bg-card/80 backdrop-blur-md border-t border-white/10">
                                    <span className="text-xs font-semibold text-[var(--text-muted)]">RUHGEN Video Clip</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={downloadingKey === `${msg.id}-${vidx}`}
                                        onClick={() => {
                                          setDownloadError(null);
                                          setDownloadingKey(`${msg.id}-${vidx}`);
                                          void downloadVideoViaProxy(src, vidx)
                                            .catch((e: unknown) => {
                                              setDownloadError(e instanceof Error ? e.message : "Download failed.");
                                            })
                                            .finally(() => setDownloadingKey(null));
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/15 cursor-pointer"
                                      >
                                        {downloadingKey === `${msg.id}-${vidx}` ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Download className="h-3.5 w-3.5" />
                                        )}
                                        Save Video
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const userPrompt = messages.slice(0, messages.findIndex((m) => m.id === msg.id)).reverse().find((m) => m.role === "user")?.content || prompt;
                                          setShareModalData({ mediaUrl: src, prompt: userPrompt, kind: "video" });
                                          setShareModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-600/80 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-cyan-600 cursor-pointer shadow-md"
                                        title="Share to Community"
                                      >
                                        <Share2 className="h-3.5 w-3.5 text-cyan-200" />
                                        Post
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void copyText(src, "Video link copied")}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/15 cursor-pointer"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy Link
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
              ref={promptDockRef}
              className="shrink-0 border-t border-white/10 px-3 py-2.5 backdrop-blur-2xl"
              style={{
                borderColor: "color-mix(in srgb, white 8%, transparent)",
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--rich-black) 70%, transparent) 0%, color-mix(in srgb, var(--deep-black) 95%, transparent) 100%)",
                boxShadow: "0 -20px 40px -28px rgba(0,0,0,0.75)",
                paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="flex flex-col gap-2">
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
                  placeholder={isImg2Video ? "Describe action & movement for reference image…" : "Describe cinematic video scene & motion…"}
                  rows={2}
                  className="studio-prompt-focus-video min-h-[44px] max-h-28 w-full resize-none rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
                />
                <StudioGlowGenerate
                  disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || (user?.availableCredits ?? user?.credits ?? 0) < currentCost}
                  onClick={() => void run()}
                  size="md"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                      <span className="font-bold text-xs text-zinc-950">Rendering Video ({duration}s)…</span>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 font-bold text-zinc-950 text-xs py-0.5">
                      <Clapperboard className="h-3.5 w-3.5 text-zinc-950" strokeWidth={2.2} />
                      <span>Generate Video</span>
                    </div>
                  )}
                </StudioGlowGenerate>
              </div>
            </div>
          </div>
        </div>

        {downloadError ? (
          <p className="rounded-xl border border-[#FF2E9A]/35 bg-[#FF2E9A]/10 px-3 py-2 text-xs text-rose-100 sm:text-sm">{downloadError}</p>
        ) : null}
      </div>
    );
  };

  return (
    <motion.div className="flex min-h-0 flex-1 flex-col overflow-hidden" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <LuxuryStudioLayout
        mode="video"
        eyebrow="RUHGEN AI"
        title="Video Studio"
        subtitle="Model-agnostic video creation interface · RUHGEN tier rendering · cinematic motion control."
        mobilePane={mobileStudioPane}
        onMobilePaneChange={setMobileStudioPane}
        topActions={
          <>
            <button
              type="button"
              disabled={messages.length === 0}
              onClick={() => {
                if (messages.length === 0) return;
                if (!window.confirm("Clear session history?")) return;
                clearChatHistory();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-slate-400 transition-all hover:border-white/30 hover:bg-white/12 hover:text-white disabled:opacity-40 cursor-pointer"
              aria-label="Clear session"
              title="Clear session"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
            <Link
              href="/dashboard/billing"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 px-2.5 sm:px-4 text-xs font-bold tracking-wider text-amber-200 shadow-md backdrop-blur-md transition-all hover:scale-[1.03] hover:border-amber-400/60 hover:shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="font-mono text-white text-xs">{user?.availableCredits ?? user?.credits ?? 0}<span className="hidden sm:inline"> Credits</span></span>
            </Link>
          </>
        }
        leftPanel={leftPanel}
        renderRightPanel={renderRightPanel}
      />
      <CommunityShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        initial={shareModalData || undefined}
      />
    </motion.div>
  );
}
