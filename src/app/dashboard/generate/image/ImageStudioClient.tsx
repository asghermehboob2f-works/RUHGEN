"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  Check,
  Copy,
  Download,
  ExternalLink,
  Grid3x3,
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
  Zap,
  SlidersHorizontal,
  Info,
  ShieldCheck,
  Layers,
  Camera,
  Film,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LuxuryStudioLayout } from "@/components/studio/luxury/LuxuryStudioLayout";
import { StudioCollapsible, StudioGlowGenerate } from "@/components/studio/luxury/StudioPremiumUi";
import type { LuxuryStudioChromeValue } from "@/components/studio/luxury/studio-chrome-context";
import { useAuth } from "@/components/AuthProvider";
import { readUserToken } from "@/lib/auth-storage";
import { createImageTask, pollStudioTask, uploadStudioReferenceImage } from "@/lib/studio-client";
import { CommunityShareModal } from "@/components/community/CommunityShareModal";

/** Universal RUHGEN Model Abstraction Tiers */
const RUHGEN_IMAGE_TIERS = [
  {
    id: "standard",
    label: "RUHGEN Standard",
    sub: "Efficient generation model",
    icon: Zap,
    badge: "Standard",
  },
  {
    id: "quality",
    label: "RUHGEN Premium",
    sub: "Cinema-grade high quality model",
    icon: Sparkles,
    badge: "Premium",
  },
] as const;

/** Universal Aspect Ratios with clean previews */
const ASPECT_RATIOS = [
  { id: "1:1", label: "Square", ratio: "1:1", w: 1024, h: 1024, iconW: 16, iconH: 16 },
  { id: "4:5", label: "Portrait", ratio: "4:5", w: 896, h: 1152, iconW: 14, iconH: 18 },
  { id: "2:3", label: "Portrait", ratio: "2:3", w: 832, h: 1216, iconW: 12, iconH: 18 },
  { id: "16:9", label: "Landscape", ratio: "16:9", w: 1280, h: 720, iconW: 20, iconH: 11 },
  { id: "4:3", label: "Landscape", ratio: "4:3", w: 1152, h: 864, iconW: 18, iconH: 13 },
  { id: "3:2", label: "Wide", ratio: "3:2", w: 1216, h: 832, iconW: 19, iconH: 12 },
] as const;

/** Premium Aesthetic Styles */
const AESTHETIC_STYLES = [
  { id: "cinematic", label: "Cinematic", icon: "🎬", tag: "cinematic 35mm lighting, anamorphic lens flare, shallow depth of field" },
  { id: "photorealistic", label: "Photorealistic", icon: "📷", tag: "photorealistic 8k, crisp detail, studio strobe lighting, ultra-realistic" },
  { id: "editorial", label: "Editorial", icon: "📰", tag: "high-fashion editorial photography, Vogue magazine style, clean ambient light" },
  { id: "minimal", label: "Minimal", icon: "🎨", tag: "minimalist aesthetic, clean composition, soft pastel tones, negative space balance" },
  { id: "anime", label: "Anime", icon: "✨", tag: "vibrant anime illustration style, detailed cell shading, Makoto Shinkai atmosphere" },
  { id: "illustration", label: "Illustration", icon: "🖌️", tag: "artistic digital illustration, stylized linework, rich painterly textures" },
  { id: "3d", label: "3D", icon: "💎", tag: "octane 3D render, raytraced glass & metal, Unreal Engine 5 aesthetic" },
  { id: "film", label: "Film", icon: "🎞️", tag: "vintage 35mm film grain, Kodachrome color tone, nostalgic soft focus" },
  { id: "fantasy", label: "Fantasy", icon: "🔮", tag: "ethereal dark fantasy, glowing mystical particles, enchanted atmosphere" },
  { id: "architecture", label: "Architecture", icon: "🏛️", tag: "Architectural Digest interior, modern brutalist design, realistic raytracing" },
  { id: "product", label: "Product Photography", icon: "🛍️", tag: "commercial product photoshoot, studio key lighting, pristine background" },
  { id: "portrait", label: "Portrait", icon: "👤", tag: "85mm portrait lens, Rembrandt studio lighting, sharp eye clarity" },
  { id: "custom", label: "Custom", icon: "⚙️", tag: "" },
] as const;

const CHAT_STORAGE_PREFIX = "ruhgen-image-studio-chat-v1:";

type UserMsg = { id: string; role: "user"; content: string; meta: string; refineFromUrl?: string };
type AssistantMsg = { id: string; role: "assistant"; loading: boolean; phase: string; urls: string[]; error: string | null };
type ChatMsg = UserMsg | AssistantMsg;

type PersistedChat = {
  v: 1;
  timestamp?: number;
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

export default function ImageStudioClient() {
  const { user, ready, refreshUser } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [rates, setRates] = useState<{
    cost_image_schnell: number;
    cost_image_dev: number;
    credits_per_image: number;
  }>({
    cost_image_schnell: 2,
    cost_image_dev: 3,
    credits_per_image: 2,
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
  const imagePromptRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottomRef = useRef(true);
  const scrollGuardUntilRef = useRef(0);
  const prevLenForSnapRef = useRef<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refFileInput = useRef<HTMLInputElement>(null);

  // Studio Controls State
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("quality");
  const [selectedRatioIdx, setSelectedRatioIdx] = useState<number>(0);
  const [selectedStyle, setSelectedStyle] = useState<string>("cinematic");
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [refineGuidance, setRefineGuidance] = useState<number>(0.65);

  const [busy, setBusy] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingIdx, setDownloadingIdx] = useState<{ key: string; idx: number } | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [refUploading, setRefUploading] = useState(false);
  const [refUploadError, setRefUploadError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [mobileStudioPane, setMobileStudioPane] = useState<"output" | "controls">("output");
  const [studioView, setStudioView] = useState<"feed" | "gallery">("feed");
  const [feedFilter, setFeedFilter] = useState<"all" | "ready" | "running">("all");
  const [lightbox, setLightbox] = useState<{ src: string } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalData, setShareModalData] = useState<{ mediaUrl: string; prompt: string; kind: "image" | "video" } | null>(null);

  const costImageDev = rates.cost_image_dev ?? 3;
  const costImageSchnell = rates.cost_image_schnell ?? rates.credits_per_image ?? 2;
  const currentCost = selectedTier === "standard" ? costImageSchnell : costImageDev;
  const activeTierObj = RUHGEN_IMAGE_TIERS.find((t) => t.id === selectedTier) ?? RUHGEN_IMAGE_TIERS[1];
  const activeRatioObj = ASPECT_RATIOS[selectedRatioIdx] ?? ASPECT_RATIOS[0];
  const isEdit = Boolean(referenceImageUrl);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in?next=/dashboard/generate/image");
  }, [ready, user, router]);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryPrompt = params.get("prompt");
      if (queryPrompt) {
        setPrompt(queryPrompt);
        setTimeout(() => {
          imagePromptRef.current?.focus();
        }, 100);
        const url = new URL(window.location.href);
        url.searchParams.delete("prompt");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

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

  /** Manual Prompt Enhancer */
  const enhancePromptManually = useCallback(() => {
    let base = prompt.trim();
    if (!base) return;
    const styleObj = AESTHETIC_STYLES.find((s) => s.id === selectedStyle);
    const styleTag = styleObj?.tag || "";
    if (styleTag && !base.toLowerCase().includes(styleObj?.label.toLowerCase() || "")) {
      base = `${base}, ${styleTag}`;
    }
    if (!base.toLowerCase().includes("lighting")) {
      base += ", master stroke lighting, subtle ambient glow";
    }
    if (!base.toLowerCase().includes("detail")) {
      base += ", 8k resolution, crisp focal clarity";
    }
    setPrompt(base);
  }, [prompt, selectedStyle]);

  const run = useCallback(async () => {
    const p = prompt.trim();
    if (p.length < 2 || busy) return;

    const { w, h, ratio, label: ratioLabel } = activeRatioObj;
    const tierLabel = activeTierObj.label;
    const refUrl = referenceImageUrl?.trim() || null;
    const negTxt = negativePrompt.trim();

    let meta: string;
    if (refUrl) {
      meta = `Reference Edit · ${tierLabel} · ${ratioLabel} (${ratio})`;
      if (negTxt) meta += " · Negative filter";
    } else {
      meta = `${tierLabel} · ${ratioLabel} (${ratio}) · ${w}×${h}px`;
      if (negTxt) meta += " · Negative filter";
    }

    const userId = crypto.randomUUID();
    const asstId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: p, meta, refineFromUrl: refUrl ?? undefined },
      { id: asstId, role: "assistant", loading: true, phase: "Synthesizing with RUHGEN engine…", urls: [], error: null },
    ]);
    setPrompt("");
    setReferenceImageUrl(null);
    setBusy(true);
    setMobileStudioPane("output");
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const canvasEl = document.getElementById("mobile-studio-canvas") || document.getElementById("studio-canvas-feed");
        canvasEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    try {
      const { taskId } = await createImageTask({
        prompt: p,
        quality: selectedTier,
        ...(refUrl
          ? {
              image_url: refUrl,
              denoise: refineGuidance,
              ...(negTxt ? { negative_prompt: negTxt } : {}),
            }
          : { width: w, height: h, ...(negTxt ? { negative_prompt: negTxt } : {}) }),
      });
      void refreshUser();
      setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, phase: "Rendering canvas frames…" } : m)));
      const result = await pollStudioTask(taskId, {
        onStatus: (s) => {
          setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, phase: `RUHGEN Status: ${s}` } : m)));
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
                  error: "Generation completed but no image frame was returned. Please retry.",
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
      void refreshUser();
    }
  }, [prompt, selectedStyle, activeRatioObj, activeTierObj, selectedTier, referenceImageUrl, refineGuidance, negativePrompt, busy, refreshUser]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(label);
    } catch {
      setCopyToast("Could not copy");
    }
  };

  const leftPanel = (
    <div className="flex flex-col w-full h-full min-h-0 flex-1 overflow-hidden bg-[#121215]">
      <p className="sr-only">Press Enter to generate. Shift+Enter for a new line.</p>
      <div className="p-2.5 sm:p-3 min-h-0 flex-1 overflow-y-auto studio-scrollbar overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y">
        <div className="rounded-xl border border-white/10 bg-[#121215] p-3 sm:p-3.5 shadow-sm space-y-3">
            {/* Control Deck Header */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-zinc-800 text-zinc-100">
                  <Wand2 className="h-4 w-4 text-zinc-200" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">RUHGEN Studio</p>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="truncate font-display text-xs font-semibold text-zinc-100">Image Creation Panel</p>
                </div>
              </div>
              {referenceImageUrl ? (
                <span className="shrink-0 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-100">
                  Ref Guided
                </span>
              ) : null}
            </div>

            {/* Top Model / Version Tier Selector */}
            <div className="rounded-lg border border-white/10 bg-zinc-900/90 p-1.5">
              <div className="mb-1.5 px-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                <span>Select Model Tier</span>
                <span className="text-zinc-200 font-semibold">{selectedTier === "quality" ? "Premium (3 cr)" : "Standard (2 cr)"}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="RUHGEN Version Tier">
                {RUHGEN_IMAGE_TIERS.map((tier) => {
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
              {/* 1. REFERENCE IMAGE */}
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImagePlus className="h-3.5 w-3.5 text-zinc-300" strokeWidth={1.75} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">1. Reference Image</span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Optional</span>
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
                        setReferenceImageUrl(url);
                      })
                      .catch((err: unknown) => setRefUploadError(err instanceof Error ? err.message : "Upload failed."))
                      .finally(() => setRefUploading(false));
                  }}
                />

                {referenceImageUrl ? (
                  <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-zinc-900 p-2">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/20 bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={referenceImageUrl} alt="Reference" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white">Active Reference</p>
                      <p className="text-[10px] text-zinc-400">Guides structure & composition</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={busy || refUploading}
                        onClick={() => refFileInput.current?.click()}
                        className="rounded-md border border-white/15 bg-zinc-800 px-2 py-1 text-[9px] font-semibold uppercase text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setReferenceImageUrl(null)}
                        className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[9px] font-semibold uppercase text-rose-300 hover:bg-rose-500/20 cursor-pointer"
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
                    className="flex min-h-[44px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 bg-zinc-950/50 p-2 text-center transition-all hover:border-white/30 hover:bg-zinc-900 cursor-pointer"
                  >
                    {refUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <ImagePlus className="h-4 w-4 text-zinc-300" />
                        <span className="text-xs font-semibold text-zinc-200">Upload Reference Photo</span>
                      </div>
                    )}
                    <span className="text-[10px] text-zinc-400">JPEG, PNG or WebP · Optional guide</span>
                  </button>
                )}
                {refUploadError ? <p className="mt-1.5 text-[10px] text-rose-300">{refUploadError}</p> : null}
              </div>

              {/* 2. ASPECT RATIO */}
              <StudioCollapsible title="2. Aspect Ratio" defaultOpen={false}>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6" role="radiogroup" aria-label="Aspect Ratio">
                  {ASPECT_RATIOS.map((item, idx) => {
                    const on = selectedRatioIdx === idx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={busy}
                        onClick={() => setSelectedRatioIdx(idx)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-2 px-1.5 text-center transition-all cursor-pointer ${
                          on
                            ? "border-white/25 bg-white/10 text-white shadow-[0_2px_10px_rgba(255,255,255,0.08)] font-semibold"
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

              {/* 3. PROMPT INTELLIGENCE */}
              <StudioCollapsible title="3. Prompt Intelligence" subtitle="Interactive prompt refinement & detailed descriptors" defaultOpen={false}>
                <div className="space-y-3">
                  {[
                    {
                      category: "Lighting & Atmosphere",
                      items: [
                        {
                          label: "cinematic volumetric rays",
                          value: "cinematic volumetric rays piercing through ambient atmospheric haze, god rays, intense radiance",
                        },
                        {
                          label: "dramatic chiaroscuro lighting",
                          value: "dramatic chiaroscuro lighting, deep Rembrandt shadows, high contrast light and dark balance",
                        },
                        {
                          label: "golden hour soft radiance",
                          value: "golden hour warm sunlight, soft diffuse glow, amber atmospheric illumination",
                        },
                        {
                          label: "bioluminescent ambient glow",
                          value: "bioluminescent cyan and violet ambient glow, ethereal neon luminescence, subtle light leaks",
                        },
                        {
                          label: "studio rim lighting & softbox",
                          value: "professional studio 3-point rim lighting, softbox illumination, crisp highlight edges",
                        },
                        {
                          label: "moody neon reflections",
                          value: "moody cybernetic neon reflections, wet asphalt sheen, vibrant dark night ambiance",
                        },
                      ],
                    },
                    {
                      category: "Camera & Optics",
                      items: [
                        {
                          label: "35mm anamorphic lens",
                          value: "shot on 35mm anamorphic lens, subtle horizontal lens flare, oval bokeh, cinema scope depth",
                        },
                        {
                          label: "shallow depth of field",
                          value: "ultra shallow depth of field, f/1.4 aperture, creamy background blur, sharp subject isolation",
                        },
                        {
                          label: "macro texture detail",
                          value: "macro lens micro-texture clarity, extreme close-up detail, razor sharp surface focus",
                        },
                        {
                          label: "85mm portrait focal clarity",
                          value: "shot on 85mm prime lens, flattering portrait compression, crystal clear focal sharpness",
                        },
                        {
                          label: "wide-angle cinematic scope",
                          value: "16mm ultra wide-angle lens, expansive grand scale perspective, cinematic horizon framing",
                        },
                        {
                          label: "crisp optical bokeh",
                          value: "luminous circular optical bokeh, multi-layered background depth, crystal glass clarity",
                        },
                      ],
                    },
                    {
                      category: "Quality & Resolution",
                      items: [
                        {
                          label: "8k uhd photorealistic",
                          value: "8k UHD resolution, hyperrealistic masterwork, 32k texture fidelity, photorealistic depth",
                        },
                        {
                          label: "unreal engine 5 render",
                          value: "unreal engine 5 render, lumen global illumination, nanite detail, cinematic CG masterpiece",
                        },
                        {
                          label: "octane 3d raytraced",
                          value: "octane render, 3D path-traced reflections, physically accurate materials, studio quality",
                        },
                        {
                          label: "hyper-detailed micro texture",
                          value: "hyper-detailed skin and surface micro textures, pore level precision, zero noise clarity",
                        },
                        {
                          label: "masterpiece clarity",
                          value: "trending on artstation, masterpiece, award-winning visual craftsmanship, peak aesthetic quality",
                        },
                        {
                          label: "award winning photography",
                          value: "National Geographic award winning photography, raw unedited realism, authentic lighting",
                        },
                      ],
                    },
                    {
                      category: "Composition & Mood",
                      items: [
                        {
                          label: "architectural symmetrical framing",
                          value: "architectural symmetrical composition, perfect geometric balance, clean leading lines",
                        },
                        {
                          label: "moody dark elegance",
                          value: "moody obsidian dark elegance, luxury velvet tone, rich deep shadow gradient",
                        },
                        {
                          label: "vibrant regal color grading",
                          value: "vibrant regal color grading, royal indigo and gold accents, color calibrated balance",
                        },
                        {
                          label: "subtle metallic sheen",
                          value: "subtle polished metallic sheen, specular reflections, refined titanium glass finish",
                        },
                        {
                          label: "film grain cinema texture",
                          value: "subtle 35mm film grain texture, analog cinematic aesthetic, Kodak Portra 400 color science",
                        },
                        {
                          label: "rule of thirds composition",
                          value: "masterful rule of thirds composition, dynamic visual weight, cinematic storytelling angle",
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
                              setPrompt((prev) => {
                                const trimmed = prev.trim();
                                if (!trimmed) return item.value;
                                if (trimmed.toLowerCase().includes(item.value.toLowerCase()) || trimmed.toLowerCase().includes(item.label.toLowerCase())) {
                                  return trimmed;
                                }
                                return `${trimmed}, ${item.value}`;
                              });
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

              {/* 4. NEGATIVE PROMPT */}
              <StudioCollapsible title="4. Negative Prompt" subtitle="Optional elements to exclude from synthesis" defaultOpen={false}>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="img-neg" className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                      Unwanted Elements
                    </label>
                    <span className="tabular-nums text-[9px] text-zinc-500">{negativePrompt.length}/2000</span>
                  </div>
                  <textarea
                    id="img-neg"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value.slice(0, 2000))}
                    disabled={busy}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Describe unwanted objects, text, watermarks, blurry details, deformities…"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none transition-colors focus:border-white/20 focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </StudioCollapsible>

              {/* 5. AESTHETIC STYLES */}
              <StudioCollapsible title="5. Aesthetic Styles" subtitle="Curated visual directions & rendering engines" defaultOpen={false}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {AESTHETIC_STYLES.map((st) => {
                    const active = selectedStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={busy}
                        onClick={() => setSelectedStyle(st.id)}
                        className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-all cursor-pointer ${
                          active
                            ? "border-white/20 bg-zinc-800 text-white font-semibold shadow-sm"
                            : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className="text-xs">{st.icon}</span>
                        <span className="truncate text-[10px] font-bold tracking-tight">{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </StudioCollapsible>

              {/* 6. GENERATION SETTINGS */}
              {isEdit ? (
                <StudioCollapsible title="6. Generation Settings" subtitle="Reference influence & guidance" defaultOpen={false}>
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="refine-guidance" className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                        Reference Influence Strength
                      </label>
                      <span className="font-mono text-[10px] font-bold text-zinc-200">
                        {Math.round(refineGuidance * 100)}%
                      </span>
                    </div>
                    <input
                      id="refine-guidance"
                      type="range"
                      min={0.2}
                      max={0.9}
                      step={0.05}
                      value={refineGuidance}
                      onChange={(e) => setRefineGuidance(Number(e.target.value))}
                      disabled={busy}
                      className="studio-range-premium mt-2 w-full cursor-pointer"
                    />
                  </div>
                </StudioCollapsible>
              ) : null}
            </div>
          </div>
        </div>

      {/* Sticky Parameters Summary Footer */}
      <div className="shrink-0 border-t border-white/10 bg-[#121215] p-3">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-300">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-display font-semibold text-white flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              {selectedTier === "quality" ? "Premium Tier" : "Standard Tier"}
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-200 font-medium">{ASPECT_RATIOS[selectedRatioIdx]?.ratio || "1:1"}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs text-zinc-400">
            <span>
              Credits: <strong className="text-zinc-100 tabular-nums">{user?.availableCredits ?? user?.credits ?? 0}</strong>
            </span>
            <span>
              Cost: <strong className={((user?.availableCredits ?? user?.credits ?? 0) < currentCost) ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{currentCost} cr</strong>
            </span>
          </div>
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
                  Canvas Timeline
                </p>
                <p className="truncate font-display text-[13px] font-bold leading-tight sm:text-sm" style={{ color: "var(--text-primary)" }}>
                  {messages.length === 0 ? "Awaiting your creative prompt" : `${galleryItems.length} frame${galleryItems.length === 1 ? "" : "s"} generated`}
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
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-violet-600/15 to-cyan-500/10 shadow-[0_0_60px_-20px_rgba(123,97,255,0.55)]">
                      <Grid3x3 className="h-9 w-9 text-white/90" strokeWidth={1.5} />
                    </div>
                    <div className="max-w-xs space-y-2">
                      <p className="font-display text-lg font-bold text-[var(--text-primary)]">Gallery Awaits</p>
                      <p className="text-sm leading-relaxed text-[var(--text-muted)]">Generated frames accumulate in your personal RUHGEN studio gallery.</p>
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
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card/45 text-left shadow-lg ring-1 ring-border/20 transition-transform hover:z-[1] hover:scale-[1.02] hover:ring-[#7B61FF]/40"
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
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 py-14 text-center select-none">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
                    <Sparkles className="h-7 w-7 text-zinc-200" strokeWidth={1.5} />
                  </div>
                  <div className="max-w-sm space-y-1 px-4">
                    <h3 className="font-display text-lg font-bold tracking-tight text-zinc-100 sm:text-xl">
                      RUHGEN Image Studio
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-400 sm:text-[13px]">
                      Select your desired parameters in Controls or enter a prompt directly below to start generating images.
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
                            className="max-w-[min(100%,580px)] rounded-2xl rounded-br-md border border-violet-400/25 bg-gradient-to-br from-violet-500/15 to-card/40 px-4 py-3.5 shadow-[0_16px_48px_-28px_rgba(123,97,255,0.45)] ring-1 ring-border/20 backdrop-blur-md"
                          >
                            <div className="flex gap-3">
                              {msg.refineFromUrl ? (
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border">
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
                                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/50 px-2 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition-all hover:bg-card/90 active:scale-[0.98]"
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
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#7B61FF]" />
                                <span className="font-medium">{msg.phase || "Synthesizing frame…"}</span>
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
                            <div className={msg.urls.length === 1 ? "max-w-[580px]" : "grid gap-6 grid-cols-1 sm:grid-cols-2"}>
                              {msg.urls.map((src, idx) => (
                                <div
                                  key={`${msg.id}-${src}`}
                                  className="group relative overflow-hidden rounded-xl bg-transparent"
                                >
                                  <div className="relative overflow-hidden rounded-xl bg-neutral-950">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={src}
                                      alt="Generated Frame"
                                      className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-105"
                                    />
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-lg:opacity-100 pointer-events-none" />

                                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 transition-all duration-300 translate-y-[-4px] group-hover:translate-y-0 group-hover:opacity-100 max-lg:opacity-100 max-lg:translate-y-0">
                                      <button
                                        type="button"
                                        onClick={() => setLightbox({ src })}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/80"
                                        title="Maximize"
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
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    </div>

                                    <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5 opacity-0 transition-all duration-300 translate-y-[4px] group-hover:translate-y-0 group-hover:opacity-100 max-lg:opacity-100 max-lg:translate-y-0">
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => {
                                          setReferenceImageUrl(src);
                                          setPrompt("");
                                          document.getElementById("img-prompt")?.focus();
                                        }}
                                        className="flex h-8.5 flex-1 min-w-[80px] items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-black/60 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-[var(--primary-purple)]/80 hover:border-[var(--primary-purple)]/40 disabled:opacity-50 cursor-pointer"
                                      >
                                        <Wand2 className="h-3 w-3" />
                                        Refine
                                      </button>
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
                                        className="flex h-8.5 px-3 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-black/60 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-black/80 disabled:opacity-50 cursor-pointer"
                                      >
                                        {downloadingIdx?.key === msg.id && downloadingIdx.idx === idx ? (
                                          <Loader2 className="h-3 w-3 animate-spin text-[var(--primary-cyan)]" />
                                        ) : (
                                          <Download className="h-3 w-3" />
                                        )}
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const userPrompt = messages.slice(0, messages.findIndex((m) => m.id === msg.id)).reverse().find((m) => m.role === "user")?.content || prompt;
                                          setShareModalData({ mediaUrl: src, prompt: userPrompt, kind: "image" });
                                          setShareModalOpen(true);
                                        }}
                                        className="flex h-8.5 px-3 items-center justify-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-600/80 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-indigo-600 shadow-md cursor-pointer"
                                        title="Share to Community"
                                      >
                                        <Share2 className="h-3 w-3 text-cyan-200" />
                                        Post
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void copyText(src, "Link copied")}
                                        className="flex h-8.5 px-3 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-black/60 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-black/80 cursor-pointer"
                                      >
                                        <Copy className="h-3 w-3" />
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
                  placeholder={isEdit ? "Describe image modifications…" : "Describe your image concept…"}
                  rows={2}
                  className="studio-prompt-focus-image min-h-[44px] max-h-28 w-full resize-none rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
                />
                <StudioGlowGenerate
                  disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || (user?.availableCredits ?? user?.credits ?? 0) < currentCost}
                  onClick={() => void run()}
                  size="md"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                      <span className="font-bold text-xs text-zinc-950">Synthesizing Image…</span>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 font-bold text-zinc-950 text-xs py-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-zinc-950" strokeWidth={2.2} />
                      <span>Generate Image</span>
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
        eyebrow="RUHGEN AI"
        title="Image Studio"
        subtitle="Model-agnostic image studio · RUHGEN tier rendering · cinema quality stills."
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
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-violet-500/10 px-2.5 sm:px-4 text-xs font-bold tracking-wider text-amber-200 shadow-md backdrop-blur-md transition-all hover:scale-[1.03] hover:border-amber-400/60 hover:shadow-amber-500/20 active:scale-95 cursor-pointer"
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
