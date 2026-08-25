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
  Palette,
  Brush,
  Box,
  Building2,
  ShoppingBag,
  User,
  Settings2,
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

/** Premium Aesthetic Styles with Monochrome Lucide Icons */
const AESTHETIC_STYLES = [
  { id: "cinematic", label: "Cinematic", icon: Film, tag: "cinematic 35mm lighting, anamorphic lens flare, shallow depth of field" },
  { id: "photorealistic", label: "Photorealistic", icon: Camera, tag: "photorealistic 8k, crisp detail, studio strobe lighting, ultra-realistic" },
  { id: "editorial", label: "Editorial", icon: Layers, tag: "high-fashion editorial photography, Vogue magazine style, clean ambient light" },
  { id: "minimal", label: "Minimal", icon: Palette, tag: "minimalist aesthetic, clean composition, soft pastel tones, negative space balance" },
  { id: "anime", label: "Anime", icon: Sparkles, tag: "vibrant anime illustration style, detailed cell shading, Makoto Shinkai atmosphere" },
  { id: "illustration", label: "Illustration", icon: Brush, tag: "artistic digital illustration, stylized linework, rich painterly textures" },
  { id: "3d", label: "3D", icon: Box, tag: "octane 3D render, raytraced glass & metal, Unreal Engine 5 aesthetic" },
  { id: "film", label: "Film", icon: Film, tag: "vintage 35mm film grain, Kodachrome color tone, nostalgic soft focus" },
  { id: "fantasy", label: "Fantasy", icon: Wand2, tag: "ethereal dark fantasy, glowing mystical particles, enchanted atmosphere" },
  { id: "architecture", label: "Architecture", icon: Building2, tag: "Architectural Digest interior, modern brutalist design, realistic raytracing" },
  { id: "product", label: "Product", icon: ShoppingBag, tag: "commercial product photoshoot, studio key lighting, pristine background" },
  { id: "portrait", label: "Portrait", icon: User, tag: "85mm portrait lens, Rembrandt studio lighting, sharp eye clarity" },
  { id: "custom", label: "Custom", icon: Settings2, tag: "" },
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
    <div className="flex flex-col w-full max-lg:min-h-max lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <p className="sr-only">Press Enter to generate. Shift+Enter for a new line.</p>
      <div className="p-2.5 sm:p-3 max-lg:min-h-max lg:studio-scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y">
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-3 sm:p-3.5 shadow-sm">
          {/* Control Deck Header */}
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800 text-zinc-100 shadow-sm">
                <Wand2 className="h-3.5 w-3.5 text-zinc-200" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">RUHGEN Studio</p>
                <p className="truncate font-display text-xs font-bold text-zinc-100">Image Creation Panel</p>
              </div>
            </div>
            {referenceImageUrl ? (
              <span className="shrink-0 rounded-full border border-zinc-700/80 bg-zinc-800 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-200">
                Ref Guided
              </span>
            ) : null}
          </div>

          {/* Slim Top RUHGEN Version Tier Selector */}
          <div className="mb-3.5 rounded-lg border border-zinc-800 bg-zinc-900/90 p-1 shadow-inner">
            <div className="mb-1 px-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">
              <span>Model Tier</span>
              <span className="text-zinc-200 font-mono">{selectedTier === "quality" ? "Premium (3 cr)" : "Standard (2 cr)"}</span>
            </div>
            <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="RUHGEN Version Tier">
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
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-[11px] font-bold transition-all cursor-pointer ${active
                        ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                      }`}
                  >
                    <Icon className={`h-3 w-3 ${active ? "text-zinc-100" : "text-zinc-400"}`} />
                    <span className="truncate">{tier.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {/* 1. REFERENCE IMAGE */}
            <StudioCollapsible title="1. Reference Image" subtitle="Optional guide photo for composition" defaultOpen={Boolean(referenceImageUrl)}>
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
                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/90 p-2">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={referenceImageUrl} alt="Reference" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-100">Active Reference</p>
                    <p className="text-[10px] text-zinc-400">Guides structure & composition</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={busy || refUploading}
                      onClick={() => refFileInput.current?.click()}
                      className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[9px] font-bold uppercase text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setReferenceImageUrl(null)}
                      className="rounded-md border border-rose-900/50 bg-rose-950/30 px-2 py-1 text-[9px] font-bold uppercase text-rose-300 hover:bg-rose-900/50 cursor-pointer"
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
                  className="flex min-h-[44px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 p-2.5 text-center transition-all hover:border-zinc-500 hover:bg-zinc-800/40 cursor-pointer"
                >
                  {refUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <ImagePlus className="h-4 w-4 text-zinc-300" />
                      <span className="text-xs font-bold text-zinc-200">Upload Reference Photo</span>
                    </div>
                  )}
                  <span className="text-[10px] text-zinc-400">JPEG, PNG or WebP · Optional guide</span>
                </button>
              )}
              {refUploadError ? <p className="mt-1.5 text-[10px] text-rose-400">{refUploadError}</p> : null}
            </StudioCollapsible>

            {/* 2. ASPECT RATIO */}
            <StudioCollapsible title="2. Aspect Ratio" defaultOpen>
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
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 px-1 text-center transition-all cursor-pointer ${on
                          ? "border-zinc-700 bg-zinc-800 text-zinc-100 shadow-sm font-semibold"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                    >
                      <div className="flex h-5 items-center justify-center">
                        <div
                          className={`rounded-[2px] border transition-all ${on ? "border-zinc-100 bg-zinc-300/40" : "border-zinc-500"
                            }`}
                          style={{ width: `${item.iconW}px`, height: `${item.iconH}px` }}
                        />
                      </div>
                      <div className="leading-none">
                        <p className="font-mono text-[11px] font-bold text-zinc-200">{item.ratio}</p>
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
                          className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] font-semibold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer disabled:opacity-40"
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
                  placeholder="Describe unwanted objects, text, watermarks, blurry details, deformities…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 outline-none transition-all focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700"
                />
              </div>
            </StudioCollapsible>

            {/* 5. AESTHETIC STYLES */}
            <StudioCollapsible title="5. Aesthetic Styles" subtitle="Curated visual directions & rendering engines" defaultOpen={false}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {AESTHETIC_STYLES.map((st) => {
                  const active = selectedStyle === st.id;
                  const StIcon = st.icon;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={busy}
                      onClick={() => setSelectedStyle(st.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left transition-all cursor-pointer ${active
                          ? "border-zinc-700 bg-zinc-800 text-zinc-100 shadow-sm font-semibold"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                    >
                      <StIcon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-zinc-100" : "text-zinc-400"}`} />
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
      {/* Sticky desktop prompt + generate (Section 8: Generation Area) */}
      <div className="hidden shrink-0 border-t border-zinc-800 bg-[#121215] px-3 pb-3 pt-3 backdrop-blur-xl lg:block">
        {/* Tier & Credit Summary */}
        <div className="mb-2.5 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Tier:</span>
            <span className="font-display font-bold text-zinc-100 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-zinc-300" />
              {activeTierObj.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
            <span>
              Available: <strong className="text-zinc-200 tabular-nums font-mono">{user?.availableCredits ?? user?.credits ?? 0}</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              Cost: <strong className={((user?.availableCredits ?? user?.credits ?? 0) < currentCost) ? "text-rose-400 font-bold font-mono" : "text-zinc-100 font-bold font-mono"}>{currentCost} credits</strong>
            </span>
          </div>
        </div>

        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Image Prompt</span>
          <span className="text-[10px] tabular-nums text-zinc-500 font-mono">{prompt.length}</span>
        </div>
        <div className="relative flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-inner">
          <label className="sr-only" htmlFor="img-prompt">Prompt</label>
          <textarea
            ref={imagePromptRef}
            id="img-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isEdit ? "Describe modifications to the reference image…" : "Describe your image concept in detail…"}
            rows={2}
            disabled={busy}
            className="no-scrollbar max-h-[160px] min-h-[44px] w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500"
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
                  if (imagePromptRef.current) {
                    imagePromptRef.current.scrollTop -= 32;
                  }
                }}
                className="flex h-5 w-5 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer disabled:opacity-30"
                title="Scroll Up"
                aria-label="Scroll Up"
              >
                <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (imagePromptRef.current) {
                    imagePromptRef.current.scrollTop += 32;
                  }
                }}
                className="flex h-5 w-5 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer disabled:opacity-30"
                title="Scroll Down"
                aria-label="Scroll Down"
              >
                <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
          ) : null}

          <button
            type="button"
            disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || (user?.availableCredits ?? user?.credits ?? 0) < currentCost}
            onClick={() => void run()}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 py-2.5 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-white active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                <span>Synthesizing Image…</span>
              </>
            ) : user?.generationDisabled ? (
              <>
                <X className="h-4 w-4 text-rose-600" strokeWidth={2} />
                <span>Access Disabled</span>
              </>
            ) : (user?.availableCredits ?? user?.credits ?? 0) < currentCost ? (
              <>
                <X className="h-4 w-4 text-rose-600" strokeWidth={2} />
                <span>Insufficient Credits</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-zinc-950" strokeWidth={2} />
                <span>Generate Image</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-zinc-500">Enter to generate · Shift+Enter for line break</p>
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
            className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-center text-xs font-semibold text-zinc-100 shadow-md"
            role="status"
          >
            {copyToast}
          </motion.p>
        ) : null}

        <div
          className={`flex min-h-0 flex-1 flex-col gap-2 ${showCanvasDock ? "min-h-0 overflow-y-auto overscroll-contain" : "overflow-hidden"
            }`}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-md">
            <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-zinc-800 bg-[#121215] px-3 py-2.5 backdrop-blur-xl">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase leading-none tracking-[0.2em] text-zinc-400">
                  Canvas Timeline
                </p>
                <p className="truncate font-display text-[13px] font-bold leading-tight text-zinc-100 sm:text-sm">
                  {messages.length === 0 ? "Awaiting your creative prompt" : `${galleryItems.length} frame${galleryItems.length === 1 ? "" : "s"} generated`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5">
                <button
                  type="button"
                  onClick={() => setStudioView("feed")}
                  aria-pressed={studioView === "feed"}
                  aria-label="Feed view"
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-bold uppercase tracking-wide transition-all ${studioView === "feed" ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                  <List className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setStudioView("gallery")}
                  aria-pressed={studioView === "gallery"}
                  aria-label="Gallery view"
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-bold uppercase tracking-wide transition-all ${studioView === "gallery" ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                  <Grid3x3 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
              <button
                type="button"
                onClick={chrome.toggleCollapsed}
                className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 lg:inline-flex"
                aria-label={chrome.collapsed ? "Show controls" : "Hide controls"}
                aria-pressed={chrome.collapsed}
                title={chrome.collapsed ? "Show controls" : "Hide controls"}
              >
                {chrome.collapsed ? <PanelLeft className="h-3.5 w-3.5" strokeWidth={2} /> : <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={2} />}
              </button>
            </div>
            <div
              ref={scrollRef}
              className="studio-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y px-3 py-3 sm:px-4 bg-[#09090b]"
            >
              {studioView === "gallery" ? (
                galleryItems.length === 0 ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-12 text-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 shadow-md">
                      <Grid3x3 className="h-8 w-8 text-zinc-300" strokeWidth={1.5} />
                    </div>
                    <div className="max-w-xs space-y-1.5">
                      <p className="font-display text-base font-bold text-zinc-100">Gallery Awaits</p>
                      <p className="text-xs leading-relaxed text-zinc-400">Generated frames accumulate in your personal RUHGEN studio gallery.</p>
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
                        className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-left shadow-md transition-transform hover:z-[1] hover:scale-[1.02] hover:border-zinc-600"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/90 text-zinc-100 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                          <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )
              ) : messages.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 py-16 text-center">
                  <motion.div
                    initial={reduce ? false : { scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-200 shadow-md"
                  >
                    <Sparkles className="h-7 w-7 text-zinc-200" strokeWidth={1.75} />
                  </motion.div>
                  <div className="max-w-md space-y-1.5 px-3">
                    <p className="font-display text-base font-bold tracking-tight text-zinc-100">RUHGEN Studio Ready</p>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      Select your desired aspect ratio, aesthetic style, and model tier. Upload an optional reference photo or type a prompt to synthesize images.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5 pb-2">
                  {messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <motion.div key={msg.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                          <div
                            className="max-w-[min(100%,580px)] rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 shadow-md"
                          >
                            <div className="flex gap-3">
                              {msg.refineFromUrl ? (
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-black">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={msg.refineFromUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-100">{msg.content}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <p className="text-[11px] font-medium text-zinc-400">{msg.meta}</p>
                                  <button
                                    type="button"
                                    onClick={() => void copyText(msg.content, "Prompt copied")}
                                    className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-200 hover:bg-zinc-700"
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
                              : "max-w-[min(100%,760px)] rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3.5 shadow-md"
                          }
                        >
                          {msg.loading ? (
                            <div className="space-y-3 py-2">
                              <p className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-300" />
                                <span className="font-medium">{msg.phase || "Synthesizing frame…"}</span>
                              </p>
                              <div className="relative h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-zinc-800">
                                <motion.div
                                  className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-zinc-300"
                                  animate={reduce ? undefined : { x: ["-100%", "280%"] }}
                                  transition={{ duration: 1.35, repeat: Infinity, ease: "linear" }}
                                />
                              </div>
                            </div>
                          ) : null}
                          {msg.error ? <p className="text-sm text-rose-400">{msg.error}</p> : null}
                          {msg.urls.length > 0 ? (
                            <div className={msg.urls.length === 1 ? "max-w-[580px]" : "grid gap-4 grid-cols-1 sm:grid-cols-2"}>
                              {msg.urls.map((src, idx) => (
                                <div
                                  key={`${msg.id}-${src}`}
                                  className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
                                >
                                  <div className="relative overflow-hidden rounded-xl bg-black">
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
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/90 text-zinc-100 backdrop-blur-md transition-colors hover:bg-zinc-800"
                                        title="Maximize"
                                      >
                                        <Maximize2 className="h-3.5 w-3.5" />
                                      </button>
                                      <a
                                        href={src}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/90 text-zinc-100 backdrop-blur-md transition-colors hover:bg-zinc-800"
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
                                        className="flex h-8 flex-1 min-w-[70px] items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-zinc-100 backdrop-blur-md transition-colors hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                                      >
                                        <Wand2 className="h-3 w-3 text-zinc-300" />
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
                                        className="flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-zinc-100 backdrop-blur-md transition-colors hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                                      >
                                        {downloadingIdx?.key === msg.id && downloadingIdx.idx === idx ? (
                                          <Loader2 className="h-3 w-3 animate-spin text-zinc-300" />
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
                                        className="flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-100 backdrop-blur-md transition-colors hover:bg-zinc-700 shadow-sm cursor-pointer"
                                        title="Share to Community"
                                      >
                                        <Share2 className="h-3 w-3 text-zinc-300" />
                                        Post
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void copyText(src, "Link copied")}
                                        className="flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-zinc-100 backdrop-blur-md transition-colors hover:bg-zinc-800 cursor-pointer"
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

            {/* Mobile Bottom Prompt Dock */}
            <div className="shrink-0 border-t border-zinc-800 bg-[#121215] px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-xl lg:hidden">
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
                  placeholder={isEdit ? "Describe image modifications…" : "Describe your image concept…"}
                  rows={1}
                  className="min-h-[44px] max-h-28 flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
                />
                <button
                  type="button"
                  disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || (user?.availableCredits ?? user?.credits ?? 0) < currentCost}
                  onClick={() => void run()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-950 shadow-sm transition-all hover:bg-white active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin text-zinc-950" /> : <ArrowUp className="h-5 w-5 text-zinc-950" strokeWidth={2.25} />}
                </button>
              </div>
            </div>
          </div>

          {showCanvasDock ? (
            <div
              ref={promptDockRef}
              className="shrink-0 rounded-xl border border-zinc-800 bg-[#121215] p-3 shadow-md"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="mb-2 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px]">
                <span className="font-semibold text-zinc-200">Cost: <strong className={((user?.availableCredits ?? user?.credits ?? 0) < currentCost) ? "text-rose-400 font-bold" : "text-zinc-100 font-bold font-mono"}>{currentCost} credits ({activeTierObj.label})</strong></span>
                <span className="text-zinc-400 font-mono">Available: {user?.availableCredits ?? user?.credits ?? 0}</span>
              </div>

              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">
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
                  placeholder="Describe your image concept…"
                  rows={2}
                  className="min-h-[44px] w-full flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
                />
                <button
                  type="button"
                  disabled={busy || prompt.trim().length < 2 || Boolean(user?.generationDisabled) || (user?.availableCredits ?? user?.credits ?? 0) < currentCost}
                  onClick={() => void run()}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-4 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-white active:scale-95 disabled:opacity-40 cursor-pointer sm:shrink-0"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                      <span>Synthesizing…</span>
                    </>
                  ) : user?.generationDisabled ? (
                    <>
                      <X className="h-4 w-4 text-rose-600" strokeWidth={2} />
                      <span>Access Disabled</span>
                    </>
                  ) : (user?.availableCredits ?? user?.credits ?? 0) < currentCost ? (
                    <>
                      <X className="h-4 w-4 text-rose-600" strokeWidth={2} />
                      <span>Insufficient</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-zinc-950" strokeWidth={2} />
                      <span>Generate Image</span>
                    </>
                  )}
                </button>
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
