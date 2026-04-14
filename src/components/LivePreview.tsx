"use client";

import { Download, ImageIcon, Loader2, Sparkles, Video } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { SITE_CONTAINER } from "@/lib/site-layout";

type Mode = "image" | "video";
type DemoStatus = "idle" | "loading" | "done";

const ASPECT_PRESETS = [
  { label: "Square", sub: "1:1", w: 1024, h: 1024 },
  { label: "Landscape", sub: "16:9", w: 768, h: 1344 },
  { label: "Portrait", sub: "9:16", w: 1344, h: 768 },
  { label: "Tall", sub: "4:5", w: 1152, h: 896 },
  { label: "Wide", sub: "5:4", w: 896, h: 1152 },
  { label: "Classic", sub: "3:2", w: 832, h: 1216 },
  { label: "Poster", sub: "2:3", w: 1216, h: 832 },
] as const;

const DETAIL_LEVELS = [
  { label: "Fast", steps: 1 as const },
  { label: "Balanced", steps: 2 as const },
  { label: "Rich", steps: 3 as const },
  { label: "Ultra", steps: 4 as const },
];

const LOOK_CHIPS: { id: string; prefix: string }[] = [
  { id: "none", prefix: "" },
  { id: "photo", prefix: "Photorealistic, highly detailed. " },
  { id: "film", prefix: "Cinematic lighting, shallow depth of field. " },
  { id: "studio", prefix: "Clean studio lighting, crisp focus. " },
];

const VIDEO_FRAMES = [
  { label: "Landscape", value: "16:9" as const },
  { label: "Portrait", value: "9:16" as const },
  { label: "Square", value: "1:1" as const },
];

const VIDEO_LOOKS: { id: string; prefix: string }[] = [
  { id: "none", prefix: "" },
  { id: "cine", prefix: "Cinematic camera movement, film grain. " },
  { id: "slow", prefix: "Slow, smooth motion, atmospheric. " },
  { id: "product", prefix: "Clean commercial motion, stable camera. " },
];

const FRIENDLY_IMAGE_FAIL = "We couldn't create your image. Please try again in a moment.";

export function LivePreview({ hideHeading = false }: { hideHeading?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("image");
  const [prompt, setPrompt] = useState("");
  const [aspectIdx, setAspectIdx] = useState(0);
  const [detailIdx, setDetailIdx] = useState(3);
  const [lookId, setLookId] = useState("none");
  const [randomVariation, setRandomVariation] = useState(true);
  const [customVariation, setCustomVariation] = useState("");

  const [videoSeconds, setVideoSeconds] = useState<5 | 10>(5);
  const [videoFrame, setVideoFrame] = useState<(typeof VIDEO_FRAMES)[number]["value"]>("16:9");
  const [videoLookId, setVideoLookId] = useState("none");
  const [videoQuality, setVideoQuality] = useState<"std" | "pro">("std");

  const [status, setStatus] = useState<DemoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [videoNotice, setVideoNotice] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const aspect = ASPECT_PRESETS[aspectIdx] ?? ASPECT_PRESETS[0];
  const steps = DETAIL_LEVELS[detailIdx]?.steps ?? 4;
  const detailLabel = DETAIL_LEVELS[detailIdx]?.label ?? "Ultra";
  const lookPrefix = LOOK_CHIPS.find((x) => x.id === lookId)?.prefix ?? "";

  const placeholder = useMemo(
    () =>
      mode === "image"
        ? "What should we create?"
        : "Describe the motion, setting, and mood…",
    [mode],
  );

  const resetOutput = useCallback(() => {
    setError(null);
    setImageUrl(null);
    setStatus("idle");
  }, []);

  const switchMode = useCallback(
    (m: Mode) => {
      setMode(m);
      setVideoNotice(null);
      resetOutput();
      abortRef.current?.abort();
    },
    [resetOutput],
  );

  const buildImagePrompt = useCallback(() => {
    const text = prompt.trim();
    if (!text) return "";
    return `${lookPrefix}${text}`;
  }, [prompt, lookPrefix]);

  const runImage = useCallback(async () => {
    const text = buildImagePrompt();
    if (!text.trim()) {
      setError("Add a short description first.");
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setError(null);
    setImageUrl(null);
    setStatus("loading");

    let seed = 0;
    if (!randomVariation) {
      const n = parseInt(customVariation.trim(), 10);
      seed = Number.isFinite(n) && n >= 0 ? n : 0;
    }

    try {
      const res = await fetch("/api/demo/flux-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
        body: JSON.stringify({
          prompt: text,
          width: aspect.w,
          height: aspect.h,
          seed,
          steps,
        }),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        error?: string;
        detail?: string;
        imageDataUrl?: string;
      };
      if (ac.signal.aborted) return;
      if (!res.ok || j.ok === false) {
        setError(FRIENDLY_IMAGE_FAIL);
        setStatus("idle");
        return;
      }
      if (!j.imageDataUrl) {
        setError(FRIENDLY_IMAGE_FAIL);
        setStatus("idle");
        return;
      }
      setImageUrl(j.imageDataUrl);
      setStatus("done");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(FRIENDLY_IMAGE_FAIL);
      setStatus("idle");
    }
  }, [buildImagePrompt, aspect.w, aspect.h, steps, randomVariation, customVariation]);

  const downloadImage = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `ruhgen-still-${Date.now()}.jpg`;
    a.rel = "noopener";
    a.click();
  }, [imageUrl]);

  const goToVideoWorkspace = useCallback(() => {
    const base = prompt.trim();
    const prefix = VIDEO_LOOKS.find((x) => x.id === videoLookId)?.prefix ?? "";
    const full = `${prefix}${base}`.trim();
    if (full.length < 2) {
      setVideoNotice("Add a short description first.");
      return;
    }
    setVideoNotice(null);
    try {
      sessionStorage.setItem(
        "ruhgen.videoDemo.handoff",
        JSON.stringify({
          prompt: full,
          duration: videoSeconds,
          aspect: videoFrame,
          mode: videoQuality,
        }),
      );
    } catch {
      /* ignore */
    }
    router.push("/dashboard/generate/video");
  }, [prompt, videoSeconds, videoFrame, videoQuality, videoLookId, router]);

  return (
    <section
      id="preview"
      className={
        hideHeading
          ? "mesh-section relative scroll-mt-24 py-8 sm:py-10"
          : "mesh-section relative scroll-mt-24 border-t border-white/[0.06] py-20 sm:py-28"
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(123,97,255,0.12),transparent)]" />

      <div className={`relative z-[1] ${SITE_CONTAINER}`}>
        {!hideHeading && (
          <header className="mb-10 grid gap-6 text-center sm:mb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:text-left">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] lg:mx-0" style={{ borderColor: "var(--border-subtle)", color: "var(--text-subtle)" }}>
                <Sparkles className="h-3.5 w-3.5 text-[#7B61FF]" aria-hidden />
                Try it
              </div>
              <h2
                className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem]"
                style={{ color: "var(--text-primary)" }}
              >
                Demo session
              </h2>
            </div>
            <p className="text-sm leading-relaxed sm:text-base lg:max-w-none" style={{ color: "var(--text-muted)" }}>
              Pick image or video, tune a few options, and create. No jargon—just results.
            </p>
          </header>
        )}

        <div
          className="overflow-hidden rounded-[1.75rem] border shadow-2xl sm:rounded-[2rem]"
          style={{
            borderColor: "var(--border-subtle)",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--soft-black) 88%, transparent) 0%, color-mix(in srgb, var(--deep-black) 96%, transparent) 100%)",
            boxShadow: "0 0 0 1px color-mix(in srgb, var(--border-subtle) 50%, transparent), 0 32px 80px -24px rgba(0,0,0,0.55)",
          }}
        >
          <div
            className="flex gap-1 p-1.5 sm:p-2"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
            role="tablist"
            aria-label="Mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "image"}
              onClick={() => switchMode("image")}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all sm:min-h-[44px] sm:text-[15px]"
              style={
                mode === "image"
                  ? {
                      background: "linear-gradient(135deg, #7B61FF, #5B4FD9)",
                      color: "#fff",
                      boxShadow: "0 8px 28px -8px rgba(123,97,255,0.55)",
                    }
                  : { color: "var(--text-muted)" }
              }
            >
              <ImageIcon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
              Image
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "video"}
              onClick={() => switchMode("video")}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all sm:min-h-[44px] sm:text-[15px]"
              style={
                mode === "video"
                  ? {
                      background: "linear-gradient(135deg, #00C8F0, #5B4FD9)",
                      color: "#fff",
                      boxShadow: "0 8px 28px -8px rgba(0,200,255,0.4)",
                    }
                  : { color: "var(--text-muted)" }
              }
            >
              <Video className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
              Video
            </button>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col gap-5 p-6 sm:p-8 lg:border-r" style={{ borderColor: "var(--border-subtle)" }}>
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                  Prompt
                </span>
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setVideoNotice(null);
                  }}
                  placeholder={placeholder}
                  rows={4}
                  disabled={mode === "image" && status === "loading"}
                  className="w-full resize-y rounded-2xl border px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-shadow focus:ring-2 focus:ring-[#7B61FF]/30 disabled:opacity-50 sm:text-base"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-primary)",
                    minHeight: "7rem",
                  }}
                />
              </label>

              {mode === "image" && (
                <>
                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                      Frame
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_PRESETS.map((a, i) => (
                        <button
                          key={a.sub}
                          type="button"
                          onClick={() => setAspectIdx(i)}
                          className="min-h-[42px] rounded-xl border px-3 py-2 text-left transition-colors"
                          style={{
                            borderColor: aspectIdx === i ? "rgba(123,97,255,0.5)" : "var(--border-subtle)",
                            background:
                              aspectIdx === i
                                ? "color-mix(in srgb, var(--primary-purple) 16%, var(--deep-black))"
                                : "color-mix(in srgb, var(--deep-black) 45%, transparent)",
                          }}
                        >
                          <span className="block text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            {a.label}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>
                            {a.sub}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                      Look
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {LOOK_CHIPS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setLookId(c.id)}
                          className="min-h-[40px] rounded-xl border px-3.5 py-2 text-xs font-semibold sm:text-[13px]"
                          style={{
                            borderColor: lookId === c.id ? "rgba(123,97,255,0.5)" : "var(--border-subtle)",
                            background:
                              lookId === c.id
                                ? "color-mix(in srgb, var(--primary-purple) 16%, var(--deep-black))"
                                : "color-mix(in srgb, var(--deep-black) 45%, transparent)",
                            color: lookId === c.id ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {c.id === "none" ? "None" : c.id === "photo" ? "Photoreal" : c.id === "film" ? "Film" : "Studio"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                      Detail
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DETAIL_LEVELS.map((d, i) => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => setDetailIdx(i)}
                          className="min-h-[44px] rounded-xl border px-2 py-2 text-center text-xs font-semibold sm:text-sm"
                          style={{
                            borderColor: detailIdx === i ? "rgba(123,97,255,0.5)" : "var(--border-subtle)",
                            background:
                              detailIdx === i
                                ? "color-mix(in srgb, var(--primary-purple) 16%, var(--deep-black))"
                                : "color-mix(in srgb, var(--deep-black) 45%, transparent)",
                            color: detailIdx === i ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                      Variation
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                        <input
                          type="checkbox"
                          checked={randomVariation}
                          onChange={(e) => setRandomVariation(e.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-transparent"
                        />
                        Surprise me each time
                      </label>
                    </div>
                    {!randomVariation && (
                      <input
                        type="number"
                        min={0}
                        placeholder="Use the same number to recreate a look"
                        value={customVariation}
                        onChange={(e) => setCustomVariation(e.target.value)}
                        className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/25"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={runImage}
                    disabled={status === "loading"}
                    className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #7B61FF 0%, #5B4FD9 55%, #00A8CC 100%)",
                      boxShadow: "0 12px 36px -12px rgba(123,97,255,0.5)",
                    }}
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Generate"
                    )}
                  </button>
                </>
              )}

              {mode === "video" && (
                <>
                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                      Frame
                    </span>
                    <div className="flex gap-2">
                      {VIDEO_FRAMES.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setVideoFrame(f.value)}
                          className="min-h-[44px] flex-1 rounded-xl border px-2 text-sm font-semibold"
                          style={{
                            borderColor: videoFrame === f.value ? "rgba(0,200,255,0.45)" : "var(--border-subtle)",
                            background:
                              videoFrame === f.value
                                ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--deep-black))"
                                : "color-mix(in srgb, var(--deep-black) 45%, transparent)",
                            color: videoFrame === f.value ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                      Length
                    </span>
                    <div className="flex gap-2">
                      {[5, 10].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setVideoSeconds(sec as 5 | 10)}
                          className="min-h-[44px] flex-1 rounded-xl border px-4 text-sm font-semibold"
                          style={{
                            borderColor: videoSeconds === sec ? "rgba(0,200,255,0.45)" : "var(--border-subtle)",
                            background:
                              videoSeconds === sec
                                ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--deep-black))"
                                : "color-mix(in srgb, var(--deep-black) 45%, transparent)",
                            color: videoSeconds === sec ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {sec} seconds
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                      Motion style
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {VIDEO_LOOKS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setVideoLookId(c.id)}
                          className="min-h-[40px] rounded-xl border px-3 py-2 text-xs font-semibold sm:text-[13px]"
                          style={{
                            borderColor: videoLookId === c.id ? "rgba(0,200,255,0.4)" : "var(--border-subtle)",
                            background:
                              videoLookId === c.id
                                ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--deep-black))"
                                : "color-mix(in srgb, var(--deep-black) 45%, transparent)",
                            color: videoLookId === c.id ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {c.id === "none"
                            ? "None"
                            : c.id === "cine"
                              ? "Cinematic"
                              : c.id === "slow"
                                ? "Gentle"
                                : "Commercial"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-subtle)" }}>
                      Output
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVideoQuality("std")}
                        className="min-h-[44px] flex-1 rounded-xl border px-3 text-sm font-semibold"
                        style={{
                          borderColor: videoQuality === "std" ? "rgba(0,200,255,0.45)" : "var(--border-subtle)",
                          background:
                            videoQuality === "std"
                              ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--deep-black))"
                              : "color-mix(in srgb, var(--deep-black) 45%, transparent)",
                          color: videoQuality === "std" ? "var(--text-primary)" : "var(--text-muted)",
                        }}
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoQuality("pro")}
                        className="min-h-[44px] flex-1 rounded-xl border px-3 text-sm font-semibold"
                        style={{
                          borderColor: videoQuality === "pro" ? "rgba(0,200,255,0.45)" : "var(--border-subtle)",
                          background:
                            videoQuality === "pro"
                              ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--deep-black))"
                              : "color-mix(in srgb, var(--deep-black) 45%, transparent)",
                          color: videoQuality === "pro" ? "var(--text-primary)" : "var(--text-muted)",
                        }}
                      >
                        Pro
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={goToVideoWorkspace}
                    className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl text-[15px] font-semibold text-white transition-opacity hover:opacity-95"
                    style={{
                      background: "linear-gradient(135deg, #00C8F0 0%, #7B61FF 100%)",
                      boxShadow: "0 12px 36px -12px rgba(0,200,255,0.35)",
                    }}
                  >
                    Continue in workspace
                  </button>
                  {videoNotice && (
                    <p className="text-center text-xs" style={{ color: "#f87171" }}>
                      {videoNotice}
                    </p>
                  )}
                  <p className="text-center text-[11px] leading-snug" style={{ color: "var(--text-subtle)" }}>
                    Sign in if asked—your choices carry over.
                  </p>
                </>
              )}
            </div>

            <div
              className="flex min-h-[280px] flex-col justify-center border-t p-6 sm:min-h-[360px] sm:p-8 lg:min-h-[420px] lg:border-t-0"
              style={{ borderColor: "var(--border-subtle)", background: "color-mix(in srgb, var(--deep-black) 40%, transparent)" }}
            >
              {mode === "image" && error && status === "idle" && (
                <p className="text-center text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {error}
                </p>
              )}

              {mode === "image" && status === "loading" && (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <Loader2 className="h-11 w-11 animate-spin text-[#7B61FF]" />
                  <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    Creating your image…
                  </p>
                </div>
              )}

              {mode === "image" && status === "done" && imageUrl && (
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src={imageUrl}
                    alt="Generated artwork"
                    width={aspect.w}
                    height={aspect.h}
                    unoptimized
                    className="max-h-[min(55vh,520px)] w-full rounded-xl object-contain shadow-xl"
                  />
                  <p className="text-center text-[11px]" style={{ color: "var(--text-subtle)" }}>
                    {aspect.label} · {detailLabel} detail
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={runImage}
                      className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/[0.04]"
                      style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={downloadImage}
                      className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/[0.04]"
                      style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={resetOutput}
                      className="text-sm font-medium underline-offset-4 hover:underline"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Start over
                    </button>
                  </div>
                </div>
              )}

              {mode === "image" && status === "idle" && !error && (
                <p className="text-center text-sm" style={{ color: "var(--text-subtle)" }}>
                  Your image will show here.
                </p>
              )}

              {mode === "video" && (
                <div className="flex flex-col items-center justify-center gap-6 py-10 text-center">
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-3xl border"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
                  >
                    <Video className="h-12 w-12 opacity-85" style={{ color: "var(--primary-cyan)" }} strokeWidth={1.15} />
                  </div>
                  <div className="max-w-sm space-y-2">
                    <p className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                      Ready when you are
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Set frame, length, and style on the left, then continue to the full workspace to render your clip.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
