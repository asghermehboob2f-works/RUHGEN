"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, Loader2, RefreshCw, Sparkles, Video, Wand2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

type Tab = "image" | "video";

const demoImage =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85";

const SUGGESTIONS = {
  image: [
    "Alpine lake at dawn, 8K, mist, anamorphic flare",
    "Brutalist lobby, volumetric god rays, film grain",
  ],
  video: [
    "Slow dolly through neon rain alley, cinematic 24fps",
    "Drone orbit of coastal cliff, golden hour",
  ],
} as const;

export function LivePreview() {
  const [tab, setTab] = useState<Tab>("image");
  const [prompt, setPrompt] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const suggestions = useMemo(() => SUGGESTIONS[tab], [tab]);

  const runGenerate = useCallback(() => {
    if (status === "loading") return;
    const text = prompt.trim() || suggestions[0];
    setLastPrompt(text);
    setStatus("loading");
    window.setTimeout(() => setStatus("done"), 2200);
  }, [status, prompt, suggestions]);

  const resetDemo = useCallback(() => {
    setStatus("idle");
    setLastPrompt("");
  }, []);

  return (
    <section
      id="preview"
      className="mesh-section-muted relative scroll-mt-24 py-10 sm:py-16 md:py-20"
    >
      <div className="mx-auto max-w-[960px] px-3 sm:px-6 lg:px-8">
        <div className="mb-6 text-center sm:mb-10">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            Live studio
          </p>
          <h2
            className="font-display text-[clamp(1.5rem,3.8vw,3rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Watch AI create magic
          </h2>
          <p
            className="mx-auto mt-2 max-w-lg text-sm sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Experience real-time generation in action
          </p>
        </div>

        <div
          className="premium-ring relative mx-auto overflow-hidden rounded-2xl border p-4 sm:rounded-[1.35rem] sm:p-6 md:p-8"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--glass-elevated)",
            backdropFilter: "blur(40px) saturate(170%)",
            boxShadow:
              "0 32px 80px -28px rgba(123,97,255,0.28), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="mb-5 inline-flex w-full flex-col gap-3 sm:mb-6 sm:w-auto sm:flex-row sm:items-center sm:justify-between"
          >
            <div
              className="inline-flex w-full rounded-2xl border p-1 sm:w-auto"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
              }}
              role="tablist"
              aria-label="Generation type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "image"}
                onClick={() => {
                  setTab("image");
                  setStatus("idle");
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all sm:flex-initial sm:rounded-full sm:px-6 sm:py-2.5 ${
                  tab === "image" ? "text-white shadow-lg" : ""
                }`}
                style={
                  tab === "image"
                    ? {
                        background:
                          "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                        boxShadow: "0 0 28px rgba(123,97,255,0.4)",
                      }
                    : { color: "var(--text-muted)" }
                }
              >
                <ImageIcon className="h-4 w-4 shrink-0" />
                Image
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "video"}
                onClick={() => {
                  setTab("video");
                  setStatus("idle");
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all sm:flex-initial sm:rounded-full sm:px-6 sm:py-2.5 ${
                  tab === "video" ? "text-white shadow-lg" : ""
                }`}
                style={
                  tab === "video"
                    ? {
                        background:
                          "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                        boxShadow: "0 0 28px rgba(0,212,255,0.35)",
                      }
                    : { color: "var(--text-muted)" }
                }
              >
                <Video className="h-4 w-4 shrink-0" />
                Video
              </button>
            </div>
            <p className="hidden text-center text-xs sm:block sm:text-left sm:text-sm" style={{ color: "var(--text-subtle)" }}>
              Tap generate — demo simulates ~2s latency
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
            <label className="sr-only" htmlFor="demo-prompt">
              Prompt
            </label>
            <textarea
              id="demo-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision…"
              rows={2}
              className="min-h-[5rem] w-full flex-1 resize-y rounded-2xl border py-3.5 pl-3.5 pr-3.5 text-[15px] outline-none transition-shadow focus:ring-2 focus:ring-[#7B61FF]/40 sm:min-h-[3.5rem] sm:resize-y sm:py-3.5 sm:pl-5 sm:pr-5 sm:text-base md:text-lg"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-primary)",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  runGenerate();
                }
              }}
            />
            <button
              type="button"
              onClick={runGenerate}
              disabled={status === "loading"}
              className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white btn-gradient sm:w-auto sm:self-center sm:rounded-xl sm:px-5 sm:py-2.5"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-medium" style={{ color: "var(--text-subtle)" }}>
              Try:
            </span>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPrompt(s)}
                className="rounded-full border px-3 py-1 text-left text-xs font-medium transition-colors hover:border-[#7B61FF]/45"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-muted)",
                  background: "var(--glass)",
                }}
              >
                {s.length > 42 ? `${s.slice(0, 42)}…` : s}
              </button>
            ))}
          </div>

          <div
            className="relative mt-5 aspect-video overflow-hidden rounded-xl border sm:mt-6"
            style={{
              borderColor: "var(--border-subtle)",
              background:
                "linear-gradient(145deg, rgba(123,97,255,0.14) 0%, rgba(0,212,255,0.1) 50%, rgba(255,46,154,0.06) 100%)",
            }}
          >
            <AnimatePresence mode="wait">
              {status === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center"
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--glass)",
                    }}
                  >
                    <Wand2 className="h-7 w-7" style={{ color: "#7B61FF" }} />
                  </div>
                  <p className="max-w-xs text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
                    {tab === "image"
                      ? "Your image preview will appear here after you generate."
                      : "Your cinematic clip preview will appear here."}
                  </p>
                </motion.div>
              )}
              {status === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative flex h-full min-h-[220px] flex-col items-center justify-center gap-5 overflow-hidden"
                >
                  <div
                    className="absolute inset-y-0 -left-1/3 w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.12] to-transparent"
                  />
                  <Loader2
                    className="relative z-10 h-12 w-12 animate-spin"
                    style={{ color: "#00D4FF" }}
                  />
                  <div className="relative z-10 text-center">
                    <p className="font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                      Synthesizing…
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                      Routing to GPU cluster
                    </p>
                  </div>
                </motion.div>
              )}
              {status === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="relative h-full min-h-[200px] w-full"
                >
                  {tab === "image" ? (
                    <Image
                      src={demoImage}
                      alt="Demo generation"
                      fill
                      className="object-cover"
                      sizes="(max-width: 960px) 100vw, 960px"
                    />
                  ) : (
                    <div className="flex h-full min-h-[220px] items-center justify-center bg-gradient-to-br from-[#7B61FF]/35 via-[#0a0a12] to-[#00D4FF]/25">
                      <div className="mx-4 rounded-2xl border border-white/15 bg-black/50 px-6 py-8 text-center backdrop-blur-xl sm:px-10">
                        <Video className="mx-auto mb-4 h-14 w-14 text-white" />
                        <p className="font-display text-lg font-semibold text-white">
                          Cinematic clip ready
                        </p>
                        <p className="mt-2 text-sm text-white/65">
                          Prototype preview — full renderer in product
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/55 to-transparent p-4 sm:p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                      Prompt used
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug text-white sm:text-base">
                      {lastPrompt}
                    </p>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-2">
                    <button
                      type="button"
                      onClick={runGenerate}
                      className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/65"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={resetDemo}
                      className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur-md hover:bg-black/55"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
