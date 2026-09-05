"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
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
  Lock,
  Maximize2,
  MoveUp,
  PanelLeft,
  PanelLeftClose,
  RectangleHorizontal,
  RotateCw,
  Smartphone,
  Sparkles,
  Square,
  Target,
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
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
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
    sub: "Fast & low-cost video (Kling 2.6)",
    icon: Zap,
    badge: "15 cr",
  },
  {
    id: "quality",
    label: "RUHGEN Premium",
    sub: "Omni cinema-grade video (Kling 3.0 Omni)",
    icon: Sparkles,
    badge: "30–60 cr",
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
  { id: "static", label: "Static", icon: Lock, desc: "Locked tripod shot", tag: "locked tripod static shot, steady composition" },
  { id: "push_in", label: "Push In", icon: ZoomIn, desc: "Dolly in towards subject", tag: "slow dolly push in camera movement" },
  { id: "pull_out", label: "Pull Out", icon: ZoomOut, desc: "Reverse dolly move", tag: "smooth reverse pull out camera shot" },
  { id: "pan_left", label: "Pan Left", icon: ArrowLeft, desc: "Horizontal left pan", tag: "cinematic smooth left pan shot" },
  { id: "pan_right", label: "Pan Right", icon: ArrowRight, desc: "Horizontal right pan", tag: "cinematic smooth right pan shot" },
  { id: "tilt_up", label: "Tilt Up", icon: ArrowUp, desc: "Vertical upward tilt", tag: "vertical tilt up camera shot" },
  { id: "tilt_down", label: "Tilt Down", icon: ArrowDown, desc: "Vertical downward tilt", tag: "vertical tilt down camera shot" },
  { id: "orbit", label: "Orbit", icon: RotateCw, desc: "360° rotational camera", tag: "360 degree orbital camera sweep around subject" },
  { id: "tracking", label: "Tracking", icon: Target, desc: "Dynamic subject tracking", tag: "dynamic subject tracking camera move" },
  { id: "crane", label: "Crane", icon: MoveUp, desc: "Elevated sweeping crane", tag: "sweeping elevated crane shot" },
  { id: "handheld", label: "Handheld", icon: Video, desc: "Organic micro-shake", tag: "cinematic handheld micro-shake feel" },
  { id: "dolly", label: "Dolly", icon: Camera, desc: "Smooth tracking dolly", tag: "smooth tracking dolly shot" },
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
  const [duration, setDuration] = useState<number>(5); // 5s or 10s
  const [aspect, setAspect] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [selectedTier, setSelectedTier] = useState<string>("quality");
  const [sound, setSound] = useState<boolean>(true);
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");
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

  const isStandard = selectedTier === "standard";
  const activeDuration: 5 | 10 = isStandard ? 5 : (duration >= 8 ? 10 : 5);
  const costPerSecond = isStandard ? (rates.cost_video_std ?? 3) : (rates.cost_video_pro ?? 6);
  const currentCost = costPerSecond * activeDuration;
  const activeTierObj = RUHGEN_VIDEO_TIERS.find((t) => t.id === selectedTier) ?? RUHGEN_VIDEO_TIERS[1];
  const isImg2Video = Boolean(referenceUrl.trim() && referenceType === "image" && !isStandard);
  const isVid2Video = Boolean(referenceUrl.trim() && referenceType === "video" && !isStandard);
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

    const idempotencyKey = crypto.randomUUID();
    try {
      // Map API duration (backend supports 5 or 10)
      const targetApiDuration: 5 | 10 = isStandard ? 5 : (duration >= 8 ? 10 : 5);
      const targetAspect = (["16:9", "9:16", "1:1"].includes(aspect) ? aspect : "16:9") as "16:9" | "9:16" | "1:1";

      const { taskId } = await createVideoTask({
        prompt: p,
        duration: targetApiDuration,
        aspect_ratio: targetAspect,
        quality: selectedTier,
        idempotencyKey,
        negative_prompt: neg || undefined,
        image_url: !isStandard ? (img || undefined) : undefined,
        video_url: !isStandard ? (vid || undefined) : undefined,
        reference_url: !isStandard ? (referenceUrl || undefined) : undefined,
        reference_type: !isStandard ? (referenceType || undefined) : undefined,
        sound,
        resolution: isStandard ? "720p" : resolution,
        camera_control: !isStandard ? selectedCamera : undefined,
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
  }, [prompt, negativePrompt, referenceUrl, referenceType, activeTierObj, duration, aspect, selectedTier, sound, resolution, selectedCamera, isStandard, busy, refreshUser]);

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
    <div className="flex flex-col w-full max-lg:min-h-max lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <p className="sr-only">Press Enter to generate video. Shift+Enter for newline.</p>
      <div className="p-2.5 sm:p-3 max-lg:min-h-max lg:studio-scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] p-3 sm:p-3.5 shadow-sm transition-colors duration-200">
          {/* Header Title */}
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm">
                <Clapperboard className="h-3.5 w-3.5 text-[var(--text-primary)]" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-subtle)]">RUHGEN Studio</p>
                <p className="truncate font-display text-xs font-bold text-[var(--text-primary)]">Video Creation Panel</p>
              </div>
            </div>
            {referenceUrl ? (
              <span className="shrink-0 rounded-md border border-[var(--border-subtle)] bg-[var(--soft-black)] px-2 py-0.5 text-[9px] font-mono text-[var(--text-primary)]">
                {referenceType === "video" ? "Video Guided" : "Image Guided"}
              </span>
            ) : null}
          </div>

          {/* Slim Top RUHGEN Version Tier Selector */}
          <div className="mb-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] p-1">
            <div className="mb-1 px-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              <span>Model Tier</span>
              <span className="font-mono text-[var(--text-primary)]">
                {isStandard ? `Standard (3 cr/s · 15 cr)` : `Premium Omni (6 cr/s · 30-60 cr)`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="RUHGEN Video Version Tier">
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
                    onClick={() => {
                      setSelectedTier(tier.id);
                      if (tier.id === "standard") {
                        setDuration(5);
                        setResolution("720p");
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-[11px] font-bold transition-all cursor-pointer ${active
                        ? "bg-[var(--soft-black)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass)]"
                      }`}
                  >
                    <Icon className={`h-3 w-3 ${active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`} />
                    <span className="truncate">{tier.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {/* 1. MEDIA REFERENCE (IMAGE / VIDEO) */}
            {isStandard ? (
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImagePlus className="h-3.5 w-3.5 text-[var(--text-muted)]" strokeWidth={2} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      1. Media Reference
                    </span>
                  </div>
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-amber-400">
                    Premium Omni Feature
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Image-to-video reference input is exclusive to the <strong>RUHGEN Premium Omni</strong> model (<code className="text-[10px]">kling-3.0-omni</code>). Standard video is optimized for fast text-to-video.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setSelectedTier("quality")}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--soft-black)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-primary)] hover:bg-[var(--glass-elevated)] cursor-pointer transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  Switch to RUHGEN Premium
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {activeRefTab === "video" ? (
                      <Film className="h-3.5 w-3.5 text-[var(--text-primary)]" strokeWidth={2} />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5 text-[var(--text-primary)]" strokeWidth={2} />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-primary)]">
                      1. Media Reference
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Optional</span>
                </div>

                {/* Reference Mode Selector */}
                <div className="mb-2.5 grid grid-cols-2 gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] p-1">
                  <button
                    type="button"
                    disabled={busy || refUploading}
                    onClick={() => setActiveRefTab("image")}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeRefTab === "image"
                        ? "bg-[var(--soft-black)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-elevated)]"
                      }`}
                  >
                    <ImagePlus className="h-3 w-3" />
                    <span>Image Ref</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy || refUploading}
                    onClick={() => setActiveRefTab("video")}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeRefTab === "video"
                        ? "bg-[var(--soft-black)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-elevated)]"
                      }`}
                  >
                    <Film className="h-3 w-3" />
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
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--soft-black)] p-2.5">
                    {referenceType === "image" ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-black shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={referenceUrl} alt="Image Reference" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-black shadow-md">
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
                        <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                          {referenceType === "image" ? "Image Reference" : "Video Reference"}
                        </p>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider ${referenceType === "image"
                            ? "bg-cyan-500/20 text-cyan-500 dark:text-cyan-200 border border-cyan-400/30"
                            : "bg-purple-500/20 text-purple-500 dark:text-purple-200 border border-purple-400/30"
                          }`}>
                          {referenceType === "image" ? "Image Guided" : "Video Guided"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
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
                        className="rounded-md border border-[var(--border-subtle)] bg-[var(--glass)] px-2 py-1 text-[9px] font-bold uppercase text-[var(--text-primary)] hover:bg-[var(--glass-elevated)] cursor-pointer transition-colors"
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
                        className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[9px] font-bold uppercase text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors"
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
                    className="flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--glass)] p-2.5 text-center transition-all hover:border-[var(--text-muted)] hover:bg-[var(--glass-elevated)] cursor-pointer"
                  >
                    {refUploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--text-primary)]" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          Uploading {activeRefTab === "image" ? "Image" : "Video"} Reference…
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          {activeRefTab === "image" ? (
                            <ImagePlus className="h-4 w-4 text-[var(--text-primary)]" />
                          ) : (
                            <Film className="h-4 w-4 text-[var(--text-primary)]" />
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
                  <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-medium text-rose-400">
                    {refUploadError}
                  </div>
                ) : null}
              </div>
            )}

            {/* 2. ASPECT RATIO */}
            <StudioCollapsible title="2. Aspect Ratio" defaultOpen={false}>
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
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-2 px-1.5 text-center transition-all cursor-pointer ${on
                          ? "border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm font-semibold"
                          : "border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                      <div className="flex h-5 items-center justify-center">
                        <div
                          className={`rounded-[2px] border transition-all ${on ? "border-[var(--text-primary)] bg-[var(--text-primary)]/20 shadow-sm" : "border-[var(--text-muted)]"
                            }`}
                          style={{ width: `${item.iconW}px`, height: `${item.iconH}px` }}
                        />
                      </div>
                      <div className="leading-none">
                        <p className="font-mono text-[11px] font-bold text-[var(--text-primary)]">{item.ratio}</p>
                        <p className="mt-0.5 text-[9px] font-medium text-[var(--text-muted)]">{item.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </StudioCollapsible>

            {/* 3. VIDEO DURATION */}
            <StudioCollapsible
              title="3. Video Duration"
              subtitle={isStandard ? "Standard model generates fixed 5s sequences" : "Choose 5-second or 10-second clip length"}
              defaultOpen={false}
            >
              {isStandard ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] p-2.5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[var(--text-primary)]" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">5 Seconds</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">15 credits fixed</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-subtle)]">
                    Standard video operates on 5-second sequences for maximum cost efficiency. Switch to Premium Omni for 10s extended generation.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDuration(5)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 px-3 text-center transition-all cursor-pointer ${
                        activeDuration === 5
                          ? "border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm font-semibold"
                          : "border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                        <Clock className="h-3 w-3" />
                        5 Seconds
                      </div>
                      <span className="text-[9px] text-[var(--text-subtle)]">30 Credits</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDuration(10)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 px-3 text-center transition-all cursor-pointer ${
                        activeDuration === 10
                          ? "border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm font-semibold"
                          : "border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                        <Clock className="h-3 w-3" />
                        10 Seconds
                      </div>
                      <span className="text-[9px] text-[var(--text-subtle)]">60 Credits</span>
                    </button>
                  </div>
                </div>
              )}
            </StudioCollapsible>

            {/* 4. SOUND & RESOLUTION */}
            <StudioCollapsible
              title="4. Sound & Resolution"
              subtitle="Native audio synthesis and visual quality"
              defaultOpen={false}
            >
              <div className="space-y-3">
                {/* Audio / Sound FX Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] p-2.5">
                  <div className="flex items-center gap-2">
                    {sound ? (
                      <Volume2 className="h-4 w-4 text-[var(--text-primary)]" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-[var(--text-muted)]" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">Synchronized Sound</p>
                      <p className="text-[9px] text-[var(--text-muted)]">Native AI audio & sound effects</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setSound(!sound)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      sound ? "bg-[var(--text-primary)]" : "bg-[var(--border-subtle)]"
                    }`}
                    role="switch"
                    aria-checked={sound}
                    aria-label="Toggle synchronized sound"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[var(--rich-black)] shadow ring-0 transition duration-200 ease-in-out ${
                        sound ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Resolution */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                    <span>Resolution</span>
                    <span className="font-mono text-[var(--text-primary)]">{isStandard ? "720p HD" : resolution}</span>
                  </div>
                  {isStandard ? (
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] p-2 text-center text-xs font-semibold text-[var(--text-muted)]">
                      720p HD Standard (1080p supported on Premium Omni)
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["720p", "1080p"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          disabled={busy}
                          onClick={() => setResolution(r)}
                          className={`rounded-lg border py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            resolution === r
                              ? "border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm font-semibold"
                              : "border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {r === "720p" ? "720p HD" : "1080p Cinema"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </StudioCollapsible>

            {/* 4. MOTION VOCABULARY */}
            <StudioCollapsible title="4. Motion Vocabulary" subtitle="Interactive kinetic action & atmospheric motion" defaultOpen={false}>
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
                    ],
                  },
                ].map((group) => (
                  <div key={group.category} className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
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
                          className="rounded-md border border-[var(--border-subtle)] bg-[var(--glass)] px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)] transition-all hover:bg-[var(--soft-black)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-40"
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
                  const CamIcon = cam.icon;
                  return (
                    <button
                      key={cam.id}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setSelectedCamera(cam.id);
                        appendPromptChip(cam.tag);
                      }}
                      className={`flex flex-col items-start gap-0.5 rounded-lg border p-2 transition-all text-left cursor-pointer ${active
                          ? "border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm font-semibold"
                          : "border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <CamIcon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`} />
                        <span className="truncate text-[10px] font-bold tracking-tight text-[var(--text-primary)]">{cam.label}</span>
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)] truncate w-full">{cam.desc}</span>
                    </button>
                  );
                })}
              </div>
            </StudioCollapsible>

            {/* 6. NEGATIVE PROMPT */}
            <StudioCollapsible title="6. Negative Prompt" subtitle="Exclude unwanted motion or visual artifacts" defaultOpen={false}>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="vid-neg" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                    Unwanted Motion & Artifacts
                  </label>
                  <span className="font-mono text-[9px] text-[var(--text-subtle)]">{negativePrompt.length}/2500</span>
                </div>
                <textarea
                  id="vid-neg"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value.slice(0, 2500))}
                  disabled={busy}
                  placeholder="Describe unwanted camera shake, morphing, flickering, artifacts, bad physics…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--text-muted)]"
                />
              </div>
            </StudioCollapsible>
          </div>
        </div>
      </div>

      {/* Sticky desktop prompt + generate (Section 8: Video Generation Area) */}
      <div className="hidden shrink-0 border-t border-[var(--border-subtle)] bg-[var(--rich-black)] px-3 pb-3 pt-3 backdrop-blur-xl lg:block transition-colors duration-200">
        {/* Tier & Credit Summary */}
        <div className="mb-2.5 flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Tier:</span>
            <span className="font-display font-bold text-[var(--text-primary)] flex items-center gap-1">
              <Clapperboard className="h-3 w-3 text-[var(--text-primary)]" />
              {activeTierObj.label} ({activeDuration}s · {isStandard ? "720p" : resolution} · {sound ? "Audio ON" : "Muted"})
            </span>
          </div>
          <div className="flex items-center gap-3 text-[var(--text-muted)] text-[11px]">
            <span>Available: <strong className="text-[var(--text-primary)] font-mono">{user?.availableCredits ?? user?.credits ?? 0}</strong></span>
            <span>Cost: <strong className={((user?.availableCredits ?? user?.credits ?? 0) < currentCost) ? "text-rose-400 font-bold" : "text-[var(--text-primary)] font-bold font-mono"}>{currentCost} cr</strong></span>
          </div>
        </div>

        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Video Motion Prompt</span>
          <span className="font-mono text-[10px] text-[var(--text-subtle)]">{prompt.length}</span>
        </div>
        <div className="relative flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-3 py-2">
          <label className="sr-only" htmlFor="vid-prompt">Prompt</label>
          <textarea
            ref={videoPromptRef}
            id="vid-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isImg2Video ? "Describe action & movement for reference image…" : "Describe cinematic video scene & motion…"}
            rows={2}
            disabled={busy}
            className="no-scrollbar max-h-[160px] min-h-[44px] w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void run();
              }
            }}
          />

          {prompt.length > 70 ? (
            <div className="flex flex-col gap-1 shrink-0 select-none">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (videoPromptRef.current) {
                    videoPromptRef.current.scrollTop -= 32;
                  }
                }}
                className="flex h-5 w-5 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-30"
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
                className="flex h-5 w-5 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-30"
                title="Scroll Down"
                aria-label="Scroll Down"
              >
                <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-2.5">
          <button
            type="button"
            disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || (user?.availableCredits ?? user?.credits ?? 0) < currentCost}
            onClick={() => void run()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] px-4 text-xs font-bold text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--glass-elevated)] active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[var(--text-primary)]" />
                <span>Rendering Video ({activeDuration}s)…</span>
              </>
            ) : user?.generationDisabled ? (
              <>
                <X className="h-4 w-4 text-rose-500" strokeWidth={2} />
                <span>Access Disabled</span>
              </>
            ) : (user?.availableCredits ?? user?.credits ?? 0) < currentCost ? (
              <>
                <X className="h-4 w-4 text-rose-500" strokeWidth={2} />
                <span>Insufficient Credits</span>
              </>
            ) : (
              <>
                <Clapperboard className="h-4 w-4 text-[var(--text-primary)]" strokeWidth={2} />
                <span>Generate Video</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[var(--text-subtle)]">Enter to generate · Shift+Enter for line break</p>
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
            className="shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--soft-black)] px-3 py-1.5 text-center text-xs font-medium text-[var(--text-primary)] shadow-md"
            role="status"
          >
            {copyToast}
          </motion.p>
        ) : null}

        <div
          className={`flex min-h-0 flex-1 flex-col gap-2 ${showCanvasDock ? "min-h-0 overflow-y-auto overscroll-contain" : "overflow-hidden"
            }`}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] shadow-md transition-colors duration-200">
            <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--rich-black)] px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase leading-none tracking-[0.2em] text-[var(--text-subtle)]">
                  Motion Canvas
                </p>
                <p className="truncate font-display text-[13px] font-bold leading-tight text-[var(--text-primary)] sm:text-sm">
                  {messages.length === 0 ? "Awaiting video motion description" : `${galleryItems.length} video clip${galleryItems.length === 1 ? "" : "s"} rendered`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] p-0.5">
                <button
                  type="button"
                  onClick={() => setStudioView("feed")}
                  aria-pressed={studioView === "feed"}
                  aria-label="Feed view"
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${studioView === "feed" ? "bg-[var(--soft-black)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                >
                  <List className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setStudioView("gallery")}
                  aria-pressed={studioView === "gallery"}
                  aria-label="Gallery view"
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${studioView === "gallery" ? "bg-[var(--soft-black)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                >
                  <Grid3x3 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
              <button
                type="button"
                onClick={chrome.toggleCollapsed}
                className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-elevated)] hover:text-[var(--text-primary)] lg:inline-flex"
                aria-label={chrome.collapsed ? "Show controls" : "Hide controls"}
                aria-pressed={chrome.collapsed}
                title={chrome.collapsed ? "Show controls" : "Hide controls"}
              >
                {chrome.collapsed ? <PanelLeft className="h-3.5 w-3.5" strokeWidth={2} /> : <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={2} />}
              </button>
            </div>
            <div
              ref={scrollRef}
              className="studio-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y px-3 py-3 sm:px-4 bg-[var(--deep-black)] transition-colors duration-200"
            >
              {studioView === "gallery" ? (
                galleryItems.length === 0 ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-12 text-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--soft-black)] shadow-sm">
                      <Grid3x3 className="h-9 w-9 text-[var(--text-primary)]" strokeWidth={1.5} />
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
                        className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--soft-black)] shadow-sm"
                      >
                        <video
                          src={item.src}
                          controls
                          className="w-full h-auto block rounded-xl bg-black"
                          preload="metadata"
                        />
                      </motion.div>
                    ))}
                  </div>
                )
              ) : messages.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-5 py-12 text-center">
                  <motion.div
                    initial={reduce ? false : { scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm"
                  >
                    <Clapperboard className="h-9 w-9 text-[var(--text-primary)]" strokeWidth={1.5} />
                  </motion.div>
                  <div className="max-w-md space-y-2 px-2">
                    <p className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">RUHGEN Video Studio Online</p>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      Set duration slider, camera path, aspect ratio, and RUHGEN tier. Upload an optional image reference to direct the scene.
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
                            className="max-w-[min(100%,580px)] rounded-xl border border-[var(--border-subtle)] bg-[var(--soft-black)] px-4 py-3 shadow-md transition-colors duration-200"
                          >
                            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--text-primary)]">{msg.content}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <p className="text-[11px] font-medium text-[var(--text-muted)]">{msg.meta}</p>
                              <button
                                type="button"
                                onClick={() => void copyText(msg.content, "Prompt copied")}
                                className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--glass)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--glass-elevated)] active:scale-[0.98]"
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
                              : "max-w-[min(100%,760px)] rounded-xl border border-[var(--border-subtle)] bg-[var(--soft-black)] px-4 py-3.5 shadow-md transition-colors duration-200"
                          }
                        >
                          {msg.loading ? (
                            <div className="space-y-3">
                              <p className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--text-primary)]" />
                                <span className="font-medium">{msg.phase || "Rendering video clip…"}</span>
                              </p>
                              <div className="relative h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-[var(--glass)]">
                                <motion.div
                                  className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-[var(--text-primary)]"
                                  animate={reduce ? undefined : { x: ["-100%", "280%"] }}
                                  transition={{ duration: 1.35, repeat: Infinity, ease: "linear" }}
                                />
                              </div>
                            </div>
                          ) : null}
                          {msg.error ? <p className="text-sm text-rose-400">{msg.error}</p> : null}
                          {msg.urls.length > 0 ? (
                            <div className="space-y-4">
                              {msg.urls.map((src, vidx) => (
                                <div key={`${msg.id}-${vidx}`} className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-black shadow-md">
                                  <video
                                    src={src}
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-auto block rounded-xl max-h-[560px] object-contain"
                                  />
                                  <div className="flex items-center justify-between gap-2 p-3 bg-[var(--rich-black)] border-t border-[var(--border-subtle)]">
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
                                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--soft-black)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] transition-all hover:bg-[var(--glass-elevated)] cursor-pointer"
                                      >
                                        {downloadingKey === `${msg.id}-${vidx}` ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Download className="h-3.5 w-3.5 text-[var(--text-primary)]" />
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
                                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--soft-black)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] transition-all hover:bg-[var(--glass-elevated)] cursor-pointer"
                                        title="Share to Community"
                                      >
                                        <Share2 className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                                        Post
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void copyText(src, "Video link copied")}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--soft-black)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] transition-all hover:bg-[var(--glass-elevated)] cursor-pointer"
                                      >
                                        <Copy className="h-3.5 w-3.5 text-[var(--text-primary)]" />
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
              className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--rich-black)] px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-xl lg:hidden transition-colors duration-200"
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
                  placeholder={isImg2Video ? "Describe action for reference photo…" : "Describe video motion scene…"}
                  rows={1}
                  className="studio-scrollbar min-h-[44px] max-h-28 flex-1 resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
                />
                <button
                  type="button"
                  disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || (user?.availableCredits ?? user?.credits ?? 0) < currentCost}
                  onClick={() => void run()}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--glass-elevated)] active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin text-[var(--text-primary)]" /> : <ArrowUp className="h-5 w-5 text-[var(--text-primary)]" strokeWidth={2.25} />}
                </button>
              </div>
            </div>
          </div>

          {showCanvasDock ? (
            <div
              ref={promptDockRef}
              className="shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] p-3 shadow-md transition-colors duration-200"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="mb-2 flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-2.5 py-1 text-[11px]">
                <span className="font-semibold text-[var(--text-primary)]">Cost: <strong className={((user?.availableCredits ?? user?.credits ?? 0) < currentCost) ? "text-rose-400 font-bold" : "text-[var(--text-primary)] font-bold font-mono"}>{currentCost} credits ({activeDuration}s clip)</strong></span>
                <span className="text-[var(--text-muted)] font-mono">Available: {user?.availableCredits ?? user?.credits ?? 0}</span>
              </div>

              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Video Motion Prompt
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
                  placeholder="Describe your video motion scene…"
                  rows={2}
                  className="min-h-[44px] w-full flex-1 resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--text-muted)]"
                />
                <button
                  type="button"
                  disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || (user?.availableCredits ?? user?.credits ?? 0) < currentCost}
                  onClick={() => void run()}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] px-4 text-xs font-bold text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--glass-elevated)] active:scale-95 disabled:opacity-40 cursor-pointer sm:shrink-0"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--text-primary)]" />
                      <span>Rendering…</span>
                    </>
                  ) : user?.generationDisabled ? (
                    <>
                      <X className="h-4 w-4 text-rose-500" strokeWidth={2} />
                      <span>Access Disabled</span>
                    </>
                  ) : (user?.availableCredits ?? user?.credits ?? 0) < currentCost ? (
                    <>
                      <X className="h-4 w-4 text-rose-500" strokeWidth={2} />
                      <span>Insufficient</span>
                    </>
                  ) : (
                    <>
                      <Clapperboard className="h-4 w-4 text-[var(--text-primary)]" strokeWidth={2} />
                      <span>Generate Video</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {downloadError ? (
          <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-400 sm:text-sm">{downloadError}</p>
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
        subtitle="Cinema motion synthesis · customizable clip duration · camera controls."
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] transition-all hover:bg-[var(--glass-elevated)] hover:text-[var(--text-primary)] disabled:opacity-40 cursor-pointer"
              aria-label="Clear session"
              title="Clear session"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
            <Link
              href="/dashboard/billing"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 sm:px-4 text-xs font-bold tracking-wider text-amber-600 dark:text-amber-300 shadow-sm backdrop-blur-md transition-all hover:scale-[1.03] hover:border-amber-500/60 active:scale-95 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="font-mono text-[var(--text-primary)] text-xs font-bold">{user?.availableCredits ?? user?.credits ?? 0}<span className="hidden sm:inline"> Credits</span></span>
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
