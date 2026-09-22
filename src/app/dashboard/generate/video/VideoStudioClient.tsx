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
  Plus,
  RotateCw,
  Smartphone,
  Sparkles,
  Square,
  Target,
  Trash2,
  Upload,
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
  Tv,
  Settings2,
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
import {
  createVideoTask,
  deleteStudioReference,
  fetchStudioModels,
  pollStudioTask,
  uploadStudioReference,
  uploadStudioReferenceFiles,
  uploadStudioReferenceImage,
  type StudioModel,
} from "@/lib/studio-client";
import { CommunityShareModal } from "@/components/community/CommunityShareModal";

/** Video Model Configurations */
export interface VideoModelDef {
  id: "standard" | "quality";
  modelId: string;
  label: string;
  sub: string;
  tag: string;
  icon: typeof Sparkles;
  badge: string;
  costPerSec: number;
  durations: number[];
  resolutions: { key: string; label: string }[];
  aspectRatios: { key: string; label: string; ratio: string; iconW: number; iconH: number }[];
  maxReferences: number;
  supportsSound: boolean;
  supportsCamera: boolean;
  supportsSeed: boolean;
}

export const VIDEO_MODELS: VideoModelDef[] = [
  {
    id: "standard",
    modelId: "video-genesis-premium",
    label: "RUHGEN Premium",
    sub: "High-fidelity video engine powered by Genesis 2",
    tag: "Genesis 2",
    icon: Sparkles,
    badge: "15–30 cr",
    costPerSec: 3,
    durations: [5, 10],
    resolutions: [
      { key: "720p", label: "720p HD" },
      { key: "1080p", label: "1080p Cinema" },
    ],
    aspectRatios: [
      { key: "16:9", label: "Landscape", ratio: "16:9", iconW: 20, iconH: 11 },
      { key: "9:16", label: "Portrait", ratio: "9:16", iconW: 11, iconH: 20 },
      { key: "1:1", label: "Square", ratio: "1:1", iconW: 16, iconH: 16 },
      { key: "4:3", label: "Classic", ratio: "4:3", iconW: 16, iconH: 12 },
      { key: "3:2", label: "Photo", ratio: "3:2", iconW: 18, iconH: 12 },
    ],
    maxReferences: 1,
    supportsSound: false,
    supportsCamera: false,
    supportsSeed: false,
  },
  {
    id: "quality",
    modelId: "video-seedance-2-5",
    label: "Seedance 2.5",
    sub: "Flagship cinematic model with native audio & multi-reference",
    tag: "Seedance 2.5",
    icon: Film,
    badge: "30–180 cr",
    costPerSec: 6,
    durations: [5, 10, 15, 30],
    resolutions: [
      { key: "720p", label: "720p HD" },
      { key: "1080p", label: "1080p Cinema" },
      { key: "4k", label: "4K Ultra" },
    ],
    aspectRatios: [
      { key: "16:9", label: "Landscape", ratio: "16:9", iconW: 20, iconH: 11 },
      { key: "9:16", label: "Portrait", ratio: "9:16", iconW: 11, iconH: 20 },
      { key: "1:1", label: "Square", ratio: "1:1", iconW: 16, iconH: 16 },
      { key: "4:3", label: "Classic", ratio: "4:3", iconW: 16, iconH: 12 },
      { key: "21:9", label: "Cinematic", ratio: "21:9", iconW: 22, iconH: 9 },
    ],
    maxReferences: 10,
    supportsSound: true,
    supportsCamera: true,
    supportsSeed: true,
  },
];

/** Cinematic Camera Movements (Seedance 2.5 & Advanced Models) */
const CAMERA_MOVEMENTS = [
  { id: "static", label: "Static", icon: Lock, desc: "Locked tripod composition", tag: "locked tripod static shot, steady composition" },
  { id: "push_in", label: "Push In", icon: ZoomIn, desc: "Dolly in toward subject", tag: "slow dolly push in camera movement" },
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

const CHAT_STORAGE_PREFIX = "ruhgen-video-studio-chat-v1:";

type UserMsg = { id: string; role: "user"; content: string; meta: string };
type AssistantMsg = { id: string; role: "assistant"; loading: boolean; phase: string; urls: string[]; error: string | null };
type ChatMsg = UserMsg | AssistantMsg;

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
      const j = JSON.parse(raw);
      if (j.error) msg = j.error;
    } catch {}
    throw new Error(msg);
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

export type ReferenceMediaItem = {
  id: string;
  url: string;
  name?: string;
  size?: number;
  type?: "image" | "video";
  uploading?: boolean;
  error?: string;
};

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
    cost_video_std: 3,
    cost_video_pro: 6,
    credits_per_video_second: 3,
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
  const multiImageInputRef = useRef<HTMLInputElement>(null);
  const singleImageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Model Selection
  const [selectedTier, setSelectedTier] = useState<"standard" | "quality">("quality");
  const activeModelDef = VIDEO_MODELS.find((m) => m.id === selectedTier) || VIDEO_MODELS[1];
  const isSeedance = selectedTier === "quality";

  // Studio Controls State
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState<number>(5);
  const [aspect, setAspect] = useState<string>("16:9");
  const [sound, setSound] = useState<boolean>(true);
  const [resolution, setResolution] = useState<string>("720p");
  const [selectedCamera, setSelectedCamera] = useState<string>("none");
  const [seed, setSeed] = useState<string>("");

  // Reference Media
  const [referenceMedia, setReferenceMedia] = useState<ReferenceMediaItem[]>([]);
  const [refUploading, setRefUploading] = useState(false);
  const [refUploadError, setRefUploadError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<StudioModel[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [mobileStudioPane, setMobileStudioPane] = useState<"output" | "controls">("output");
  const [studioView, setStudioView] = useState<"feed" | "gallery">("feed");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalData, setShareModalData] = useState<{ mediaUrl: string; prompt: string; kind: "image" | "video" } | null>(null);

  // Load models dynamically
  useEffect(() => {
    fetchStudioModels().then((models) => {
      if (models && models.length > 0) setAvailableModels(models);
    });
  }, []);

  // Sync state when switching models
  useEffect(() => {
    if (!activeModelDef.durations.includes(duration)) {
      setDuration(activeModelDef.durations[0] || 5);
    }
    if (!activeModelDef.resolutions.some((r) => r.key === resolution)) {
      setResolution(activeModelDef.resolutions[0]?.key || "720p");
    }
    if (!activeModelDef.aspectRatios.some((a) => a.key === aspect)) {
      setAspect(activeModelDef.aspectRatios[0]?.key || "16:9");
    }
    if (!isSeedance && referenceMedia.length > 1) {
      setReferenceMedia((prev) => prev.slice(0, 1));
    }
  }, [selectedTier, activeModelDef, duration, resolution, aspect, isSeedance, referenceMedia.length]);

  // Credit calculation
  const currentCostPerSec = isSeedance ? (rates.cost_video_pro ?? 6) : (rates.cost_video_std ?? 3);
  const estimatedCost = Math.max(1, duration * currentCostPerSec);
  const userBalance = user?.availableCredits ?? user?.credits ?? 0;
  const hasInsufficientCredits = userBalance < estimatedCost;

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;
    try {
      const key = `${CHAT_STORAGE_PREFIX}${user.id}`;
      localStorage.removeItem(key);
    } catch {}
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
  }, []);

  const handleUploadReferences = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      if (!fileArr.length) return;
      setRefUploadError(null);

      const maxAllowed = activeModelDef.maxReferences;
      const currentCount = referenceMedia.length;
      const remainingSlots = Math.max(0, maxAllowed - currentCount);

      if (remainingSlots <= 0) {
        setRefUploadError(`Maximum ${maxAllowed} reference media limit reached for ${activeModelDef.label}.`);
        return;
      }

      const toUpload = fileArr.slice(0, remainingSlots);
      if (fileArr.length > remainingSlots) {
        setRefUploadError(`Only ${remainingSlots} more reference item(s) could be added (max ${maxAllowed}).`);
      }

      const validFiles: File[] = [];
      for (const f of toUpload) {
        const isImg = f.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(f.name);
        const isVid = f.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(f.name);
        if (!isImg && !isVid) {
          setRefUploadError(`"${f.name}" is not supported. Use JPG, PNG, WebP, MP4, or WebM.`);
          return;
        }
        if (f.size > 50 * 1024 * 1024) {
          setRefUploadError(`"${f.name}" exceeds 50MB file size limit.`);
          return;
        }
        validFiles.push(f);
      }

      if (!validFiles.length) return;

      const tempItems: ReferenceMediaItem[] = validFiles.map((f) => ({
        id: `temp-${Math.random().toString(36).slice(2)}`,
        url: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
        type: f.type.startsWith("video/") ? "video" : "image",
        uploading: true,
      }));

      setReferenceMedia((prev) => [...prev, ...tempItems]);
      setRefUploading(true);

      try {
        const result = await uploadStudioReferenceFiles(validFiles);
        setReferenceMedia((prev) => {
          const updated = [...prev];
          for (let i = 0; i < tempItems.length; i++) {
            const temp = tempItems[i];
            const uploaded = result.files[i] || result.files[0];
            const idx = updated.findIndex((item) => item.id === temp.id);
            if (idx !== -1 && uploaded) {
              updated[idx] = {
                id: uploaded.id || `ref-${Date.now()}-${i}`,
                url: uploaded.url,
                name: uploaded.name || temp.name,
                size: uploaded.size || temp.size,
                type: uploaded.type || temp.type,
                uploading: false,
              };
            }
          }
          return updated;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed.";
        setRefUploadError(msg);
        setReferenceMedia((prev) => prev.filter((item) => !tempItems.some((t) => t.id === item.id)));
      } finally {
        setRefUploading(false);
      }
    },
    [activeModelDef, referenceMedia.length]
  );

  const handleRemoveReference = useCallback((index: number) => {
    setReferenceMedia((prev) => {
      const target = prev[index];
      if (target && target.url && !target.uploading) {
        deleteStudioReference(target.url || target.id).catch(() => {});
      }
      return prev.filter((_, i) => i !== index);
    });
    setRefUploadError(null);
  }, []);

  const handleMoveReference = useCallback((index: number, direction: "left" | "right") => {
    setReferenceMedia((prev) => {
      const nextIndex = direction === "left" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  }, []);

  const run = useCallback(async () => {
    const p = prompt.trim();
    if (p.length < 2 || busy) return;
    setMobileStudioPane("output");
    const neg = negativePrompt.trim();
    const refUrls = referenceMedia.map((r) => r.url).filter(Boolean);
    const modelName = activeModelDef.label;

    const parts = [`${duration}s clip`, aspect, resolution, modelName];
    if (isSeedance && sound) parts.push("Audio");
    if (refUrls.length === 1) parts.push("1 Reference");
    else if (refUrls.length > 1) parts.push(`${refUrls.length} References`);
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
      const numSeed = seed.trim() ? Number(seed.trim()) : undefined;

      const { taskId } = await createVideoTask({
        prompt: p,
        duration,
        aspect_ratio: aspect,
        model: activeModelDef.modelId,
        modelId: activeModelDef.modelId,
        quality: selectedTier,
        idempotencyKey,
        negative_prompt: neg || undefined,
        references: refUrls.length > 0 ? refUrls : undefined,
        image_urls: refUrls.length > 0 ? refUrls : undefined,
        image_url: refUrls[0] || undefined,
        reference_url: refUrls[0] || undefined,
        sound: isSeedance ? sound : undefined,
        resolution,
        camera_control: isSeedance && selectedCamera !== "none" ? selectedCamera : undefined,
        seed: Number.isFinite(numSeed) ? numSeed : undefined,
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
  }, [prompt, negativePrompt, referenceMedia, activeModelDef, duration, aspect, resolution, selectedTier, sound, selectedCamera, seed, isSeedance, busy, refreshUser]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(label);
      setTimeout(() => setCopyToast(null), 2500);
    } catch {
      setCopyToast("Could not copy");
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  if (!ready) return <DashboardLoading label="Loading RUHGEN Video Studio…" />;
  if (!user) return null;

  const leftPanel = (
    <div className="flex flex-col w-full max-lg:min-h-max lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <p className="sr-only">Press Enter to generate. Shift+Enter for a new line.</p>
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
            {referenceMedia.length > 0 ? (
              <span className="shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--soft-black)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                {referenceMedia.length} Ref{referenceMedia.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          {/* 1. MODEL SELECTION (SLIM SEGMENTED TABS) */}
          <div className="mb-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] p-1 shadow-inner">
            <div className="mb-1 px-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              <span>Model Tier</span>
              <span className="text-[var(--text-primary)] font-mono">{activeModelDef.label} ({activeModelDef.badge})</span>
            </div>
            <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="RUHGEN Video Model">
              {VIDEO_MODELS.map((m) => {
                const Icon = m.icon;
                const active = selectedTier === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={busy}
                    onClick={() => setSelectedTier(m.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-[11px] font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass)]"
                    }`}
                  >
                    <Icon className={`h-3 w-3 ${active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`} />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {/* 2. MEDIA REFERENCE INPUT (SLIM CARD) */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] p-2 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImagePlus className="h-3.5 w-3.5 text-[var(--text-primary)]" strokeWidth={2} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-primary)]">
                    Reference Media {isSeedance ? `(Max ${activeModelDef.maxReferences})` : "(Optional)"}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    referenceMedia.length > 0
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-[var(--soft-black)] border-[var(--border-subtle)] text-[var(--text-subtle)]"
                  }`}
                >
                  {referenceMedia.length}/{activeModelDef.maxReferences}
                </span>
              </div>

              <input
                ref={multiImageInputRef}
                type="file"
                multiple={isSeedance}
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                className="sr-only"
                tabIndex={-1}
                disabled={busy || refUploading || referenceMedia.length >= activeModelDef.maxReferences}
                onChange={(e) => {
                  if (e.target.files) handleUploadReferences(e.target.files);
                  e.target.value = "";
                }}
              />

              {referenceMedia.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.length) {
                      handleUploadReferences(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => multiImageInputRef.current?.click()}
                  className={`relative flex items-center justify-between gap-2 rounded-md border border-dashed px-2.5 py-1.5 transition-all cursor-pointer ${
                    isDragging
                      ? "border-amber-400 bg-amber-500/10 text-amber-300"
                      : "border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:bg-[var(--glass-elevated)]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {refUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400 shrink-0" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="text-[10px] font-bold text-[var(--text-primary)] truncate">
                      {refUploading ? "Uploading references…" : "+ Add Reference Media (Image / Video)"}
                    </span>
                  </div>
                  <span className="text-[8px] text-[var(--text-subtle)] shrink-0 font-mono">
                    {isSeedance ? "Multimodal" : "Image-to-Video"}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 pt-0.5">
                  {referenceMedia.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group relative flex flex-col rounded-md border border-[var(--border-subtle)] bg-[var(--soft-black)] overflow-hidden shadow-xs"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-black/50">
                        {item.type === "video" ? (
                          <video src={item.url} muted loop autoPlay playsInline className="h-full w-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.url} alt={item.name || `Reference ${idx + 1}`} className="h-full w-full object-cover" />
                        )}
                        {item.uploading ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                          </div>
                        ) : null}
                        <span className="absolute top-0.5 left-0.5 rounded bg-black/80 px-1 py-0.2 text-[7px] font-mono font-bold text-[var(--text-primary)] border border-white/10 leading-none">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={busy || item.uploading}
                          onClick={() => handleRemoveReference(idx)}
                          className="absolute top-0.5 right-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 p-0.5 text-rose-300 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                          title="Remove reference"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </div>
                      {isSeedance && referenceMedia.length > 1 ? (
                        <div className="flex items-center justify-between px-1 py-0.5 bg-[var(--soft-black)] border-t border-[var(--border-subtle)] text-[7px]">
                          <span className="truncate text-[var(--text-subtle)] font-mono">#{idx + 1}</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={busy || idx === 0}
                              onClick={() => handleMoveReference(idx, "left")}
                              className="rounded p-0.2 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer"
                              title="Move left"
                            >
                              <ArrowLeft className="h-2 w-2" />
                            </button>
                            <button
                              type="button"
                              disabled={busy || idx === referenceMedia.length - 1}
                              onClick={() => handleMoveReference(idx, "right")}
                              className="rounded p-0.2 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer"
                              title="Move right"
                            >
                              <ArrowRight className="h-2 w-2" />
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {referenceMedia.length < activeModelDef.maxReferences ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files?.length) {
                          handleUploadReferences(e.dataTransfer.files);
                        }
                      }}
                      onClick={() => multiImageInputRef.current?.click()}
                      className="relative flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--soft-black)] p-0.5 text-center transition-all cursor-pointer hover:border-[var(--text-muted)] hover:bg-[var(--glass-elevated)]"
                    >
                      {refUploading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                      ) : (
                        <>
                          <Plus className="h-3 w-3 text-amber-400" />
                          <span className="text-[7px] font-bold text-[var(--text-primary)] mt-0.5">+ Add</span>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {refUploadError ? (
                <div className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[9px] font-medium text-rose-400">
                  {refUploadError}
                </div>
              ) : null}
            </div>

            {/* 3. ASPECT RATIO (SLIM 5-COLUMN GRID) */}
            <StudioCollapsible title="Aspect Ratio" defaultOpen={true}>
              <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="Aspect Ratio">
                {activeModelDef.aspectRatios.map((item) => {
                  const on = aspect === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={busy}
                      onClick={() => setAspect(item.key)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-md border py-1.5 px-0.5 text-center transition-all cursor-pointer ${
                        on
                          ? "border-amber-500/40 bg-[var(--soft-black)] text-[var(--text-primary)] shadow-xs font-bold"
                          : "border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="flex h-3.5 items-center justify-center">
                        <div
                          className={`rounded-[1.5px] border transition-all ${
                            on ? "border-amber-400 bg-amber-400/30 shadow-xs" : "border-[var(--text-muted)]"
                          }`}
                          style={{ width: `${Math.round(item.iconW * 0.75)}px`, height: `${Math.round(item.iconH * 0.75)}px` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] font-bold leading-none">{item.ratio}</span>
                    </button>
                  );
                })}
              </div>
            </StudioCollapsible>

            {/* 4. DURATION & OUTPUT */}
            <StudioCollapsible title="Duration & Output" defaultOpen={true}>
              <div className="space-y-2">
                {/* Duration */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                    <span>Duration</span>
                    <span className="font-mono text-amber-400 font-semibold">{duration}s · {estimatedCost} Credits</span>
                  </div>
                  <div className={`grid ${activeModelDef.durations.length === 5 ? "grid-cols-5" : activeModelDef.durations.length === 4 ? "grid-cols-4" : "grid-cols-2"} gap-1`}>
                    {activeModelDef.durations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        disabled={busy}
                        onClick={() => setDuration(d)}
                        className={`flex flex-col items-center justify-center py-1 rounded-md border text-center transition-all cursor-pointer ${
                          duration === d
                            ? "border-amber-500/40 bg-[var(--soft-black)] text-[var(--text-primary)] shadow-xs font-bold"
                            : "border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="text-[11px] font-mono font-bold leading-none">{d}s</span>
                        <span className="text-[7px] text-[var(--text-subtle)] font-mono mt-0.5">{d * currentCostPerSec} cr</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                    <span>Resolution</span>
                    <span className="font-mono text-[var(--text-primary)]">{resolution}</span>
                  </div>
                  <div className={`grid ${activeModelDef.resolutions.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-1`}>
                    {activeModelDef.resolutions.map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        disabled={busy}
                        onClick={() => setResolution(r.key)}
                        className={`rounded-md border py-1 text-[10px] font-bold transition-all cursor-pointer ${
                          resolution === r.key
                            ? "border-amber-500/40 bg-[var(--soft-black)] text-[var(--text-primary)] shadow-xs"
                            : "border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Native Audio (Seedance 2.5 Only) */}
                {activeModelDef.supportsSound ? (
                  <div className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--soft-black)] px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      {sound ? (
                        <Volume2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <VolumeX className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                      )}
                      <div>
                        <p className="text-[10px] font-bold text-[var(--text-primary)] leading-tight">Native Sound</p>
                        <p className="text-[8px] text-[var(--text-subtle)] leading-tight">Motion-synced audio</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setSound(!sound)}
                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        sound ? "bg-amber-400" : "bg-[var(--border-subtle)]"
                      }`}
                      role="switch"
                      aria-checked={sound}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-[var(--rich-black)] shadow ring-0 transition duration-200 ease-in-out ${
                          sound ? "translate-x-3" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ) : null}
              </div>
            </StudioCollapsible>

            {/* 5. ADVANCED SETTINGS (EXPANDABLE) */}
            <StudioCollapsible
              title="Advanced Settings"
              subtitle={isSeedance ? "Camera control, negative prompt & seed" : "Negative prompt & fine tuning"}
              defaultOpen={false}
            >
              <div className="space-y-2">
                {/* Camera / Motion Control (Seedance 2.5) */}
                {activeModelDef.supportsCamera ? (
                  <div>
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                      Camera Motion Preset
                    </p>
                    <div className="grid grid-cols-4 gap-1">
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
                            className={`flex flex-col items-center gap-1 rounded-md border p-1 transition-all text-center cursor-pointer ${
                              active
                                ? "border-amber-500/40 bg-[var(--soft-black)] text-[var(--text-primary)] shadow-xs font-bold"
                                : "border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            <CamIcon className={`h-3 w-3 shrink-0 ${active ? "text-amber-400" : "text-[var(--text-muted)]"}`} />
                            <span className="truncate text-[8px] font-bold tracking-tight text-[var(--text-primary)] w-full">{cam.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Seed (Seedance 2.5) */}
                {activeModelDef.supportsSeed ? (
                  <div>
                    <div className="mb-0.5 flex items-center justify-between">
                      <label htmlFor="vid-seed" className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Seed (Optional)
                      </label>
                      <span className="font-mono text-[8px] text-[var(--text-subtle)]">Random if blank</span>
                    </div>
                    <input
                      id="vid-seed"
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      disabled={busy}
                      placeholder="e.g. 428912"
                      className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--glass)] px-2.5 py-1 text-[11px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--text-muted)] font-mono"
                    />
                  </div>
                ) : null}

                {/* Negative Prompt */}
                <div>
                  <div className="mb-0.5 flex items-center justify-between">
                    <label htmlFor="vid-neg" className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                      Negative Prompt
                    </label>
                    <span className="font-mono text-[8px] text-[var(--text-subtle)]">{negativePrompt.length}/2000</span>
                  </div>
                  <textarea
                    id="vid-neg"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value.slice(0, 2000))}
                    disabled={busy}
                    placeholder="Describe unwanted artifacts, blur, camera distortion, morphing…"
                    rows={2}
                    className="w-full resize-none rounded-md border border-[var(--border-subtle)] bg-[var(--glass)] px-2.5 py-1 text-[10px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--text-muted)]"
                  />
                </div>
              </div>
            </StudioCollapsible>

          </div>
        </div>
      </div>

      {/* Sticky desktop prompt + generate */}
      <div className="hidden shrink-0 border-t border-[var(--border-subtle)] bg-[var(--rich-black)] p-3 backdrop-blur-xl lg:block transition-colors duration-200">
        {/* Tier & Credit Summary */}
        <div className="mb-2 flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-2.5 py-1 text-[11px]">
          <span className="font-semibold text-[var(--text-primary)]">
            Cost: <strong className={hasInsufficientCredits ? "text-rose-400 font-bold" : "text-[var(--text-primary)] font-bold font-mono"}>{estimatedCost} credits ({activeModelDef.label})</strong>
          </span>
          <span className="text-[var(--text-muted)] font-mono">Available: {userBalance}</span>
        </div>

        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Video Prompt</span>
          <span className="text-[10px] tabular-nums text-[var(--text-subtle)] font-mono">{prompt.length}</span>
        </div>
        <div className="relative flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--glass)] p-3 shadow-inner">
          <label className="sr-only" htmlFor="vid-prompt">Prompt</label>
          <textarea
            ref={videoPromptRef}
            id="vid-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={referenceMedia.length > 0 ? "Describe action & movement for reference media…" : "Describe cinematic scene, lighting, action & mood…"}
            rows={2}
            disabled={busy}
            className="no-scrollbar max-h-[160px] min-h-[44px] w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
            style={{ scrollbarWidth: "none" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void run();
              }
            }}
          />

          {prompt.length > 70 ? (
            <div className="absolute right-3 top-3 flex flex-col gap-1 shrink-0 select-none">
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

          <button
            type="button"
            disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || hasInsufficientCredits}
            onClick={() => void run()}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] py-2.5 text-xs font-bold text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--glass-elevated)] active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[var(--text-primary)]" />
                <span>Rendering Video ({duration}s)…</span>
              </>
            ) : user?.generationDisabled ? (
              <>
                <X className="h-4 w-4 text-rose-500" strokeWidth={2} />
                <span>Access Disabled</span>
              </>
            ) : hasInsufficientCredits ? (
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
    return (
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2 overflow-hidden">
        {copyToast ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="shrink-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] px-3 py-1.5 text-center text-xs font-semibold text-[var(--text-primary)] shadow-md"
            role="status"
          >
            {copyToast}
          </motion.p>
        ) : null}

        <div className={`flex min-h-0 flex-1 flex-col gap-2 ${showCanvasDock ? "min-h-0 overflow-y-auto overscroll-contain" : "overflow-hidden"}`}>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] shadow-md transition-colors duration-200">
            <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--rich-black)] px-3 py-2.5 backdrop-blur-xl">
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
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                    studioView === "feed"
                      ? "bg-[var(--soft-black)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <List className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setStudioView("gallery")}
                  aria-pressed={studioView === "gallery"}
                  aria-label="Gallery view"
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                    studioView === "gallery"
                      ? "bg-[var(--soft-black)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-md">
                      <Grid3x3 className="h-8 w-8 text-[var(--text-primary)]" strokeWidth={1.5} />
                    </div>
                    <div className="max-w-xs space-y-1.5">
                      <p className="font-display text-base font-bold text-[var(--text-primary)]">Gallery Awaits</p>
                      <p className="text-xs leading-relaxed text-[var(--text-muted)]">Generated video clips accumulate in your personal RUHGEN studio gallery.</p>
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
                        <video src={item.src} controls className="w-full h-auto block rounded-xl bg-black" preload="metadata" />
                      </motion.div>
                    ))}
                  </div>
                )
              ) : messages.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-12 text-center">
                  <motion.div
                    initial={reduce ? false : { scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-md"
                  >
                    <Clapperboard className="h-8 w-8 text-[var(--text-primary)]" strokeWidth={1.5} />
                  </motion.div>
                  <div className="max-w-xs space-y-1.5">
                    <p className="font-display text-base font-bold text-[var(--text-primary)]">Motion Canvas Awaits</p>
                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">Describe a scene, pick your model, and generate cinematic video.</p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 pb-2">
                  {messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <motion.div key={msg.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                          <div className="max-w-[min(100%,580px)] rounded-xl border border-[var(--border-subtle)] bg-[var(--soft-black)] px-4 py-3 shadow-md transition-colors duration-200">
                            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--text-primary)]">{msg.content}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <p className="text-[11px] font-medium text-[var(--text-muted)]">{msg.meta}</p>
                              <button
                                type="button"
                                onClick={() => void copyText(msg.content, "Prompt copied")}
                                className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--glass)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-primary)] hover:bg-[var(--glass-elevated)]"
                              >
                                <Copy className="h-3 w-3" />
                                Copy
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }

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
                            <div className="space-y-3 py-2">
                              <p className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
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
                            <div className={msg.urls.length === 1 ? "max-w-[580px]" : "grid gap-4 grid-cols-1 sm:grid-cols-2"}>
                              {msg.urls.map((src, vidx) => (
                                <div key={`${msg.id}-${vidx}`} className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--soft-black)] shadow-md">
                                  <div className="relative overflow-hidden rounded-t-xl bg-black">
                                    <video src={src} controls autoPlay loop muted playsInline className="w-full h-auto block rounded-t-xl max-h-[520px] object-contain mx-auto" />
                                  </div>
                                  <div className="flex items-center justify-between gap-2 p-2.5 bg-[var(--rich-black)] border-t border-[var(--border-subtle)]">
                                    <span className="text-[11px] font-semibold text-[var(--text-muted)] truncate">Video Clip</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
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
                                        className="flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[11px] font-bold text-[var(--text-primary)] transition-all hover:bg-[var(--glass-elevated)] cursor-pointer"
                                      >
                                        {downloadingKey === `${msg.id}-${vidx}` ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Download className="h-3 w-3 text-[var(--text-primary)]" />
                                        )}
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const userPrompt = messages.slice(0, messages.findIndex((m) => m.id === msg.id)).reverse().find((m) => m.role === "user")?.content || prompt;
                                          setShareModalData({ mediaUrl: src, prompt: userPrompt, kind: "video" });
                                          setShareModalOpen(true);
                                        }}
                                        className="flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[11px] font-bold text-[var(--text-primary)] transition-all hover:bg-[var(--glass-elevated)] cursor-pointer"
                                        title="Share to Community"
                                      >
                                        <Share2 className="h-3 w-3 text-[var(--text-primary)]" />
                                        Post
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void copyText(src, "Video link copied")}
                                        className="flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[11px] font-bold text-[var(--text-primary)] transition-all hover:bg-[var(--glass-elevated)] cursor-pointer"
                                      >
                                        <Copy className="h-3 w-3 text-[var(--text-primary)]" />
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

            {/* Mobile Bottom Prompt Dock */}
            <div className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--rich-black)] px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-xl lg:hidden transition-colors duration-200">
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
                  placeholder={referenceMedia.length > 0 ? "Describe action for reference media…" : "Describe video motion scene…"}
                  rows={1}
                  className="min-h-[44px] max-h-28 flex-1 resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--text-muted)]"
                />
                <button
                  type="button"
                  disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || hasInsufficientCredits}
                  onClick={() => void run()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--glass-elevated)] active:scale-95 disabled:opacity-40 cursor-pointer"
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
                <span className="font-semibold text-[var(--text-primary)]">
                  Cost: <strong className={hasInsufficientCredits ? "text-rose-400 font-bold" : "text-[var(--text-primary)] font-bold font-mono"}>{estimatedCost} credits ({activeModelDef.label})</strong>
                </span>
                <span className="text-[var(--text-muted)] font-mono">Available: {userBalance}</span>
              </div>

              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Video Prompt
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
                  placeholder={referenceMedia.length > 0 ? "Describe action for reference media…" : "Describe video motion scene…"}
                  rows={2}
                  className="min-h-[44px] w-full flex-1 resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--text-muted)]"
                />
                <button
                  type="button"
                  disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || hasInsufficientCredits}
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
                      <span>Disabled</span>
                    </>
                  ) : hasInsufficientCredits ? (
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

  const handleClearHistory = () => {
    if (!user?.id || typeof window === "undefined") return;
    try {
      localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${user.id}`);
    } catch {}
    setMessages([]);
  };

  return (
    <motion.div className="flex min-h-0 flex-1 flex-col overflow-hidden" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <LuxuryStudioLayout
        mode="video"
        eyebrow="RUHGEN AI"
        title="Video Studio"
        subtitle="Higgsfield-powered next-generation motion synthesis · RUHGEN tier rendering · cinematic video."
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
                handleClearHistory();
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
              <span className="font-mono text-[var(--text-primary)] text-xs font-bold">
                {user?.availableCredits ?? user?.credits ?? 0}
                <span className="hidden sm:inline"> Credits</span>
              </span>
            </Link>
          </>
        }
        leftPanel={leftPanel}
        renderRightPanel={renderRightPanel}
      />
      <CommunityShareModal
        open={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setShareModalData(null);
        }}
        initial={
          shareModalData
            ? {
                mediaUrl: shareModalData.mediaUrl,
                prompt: shareModalData.prompt,
                kind: shareModalData.kind,
              }
            : undefined
        }
        onShared={() => {
          setCopyToast("Shared to Community!");
          setTimeout(() => setCopyToast(null), 2500);
        }}
      />
    </motion.div>
  );
}

