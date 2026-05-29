"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import type { SiteContent, SpotlightFeatureItem, SpotlightTemplateItem, UpcomingFeatureItem } from "@/backend/site-content/types";
import { PUBLIC_DEFAULT_SITE_CONTENT } from "@/backend/site-content/default-content";
import { 
  ArrowDown, 
  ArrowUp, 
  Sparkles, 
  Trash2, 
  Plus, 
  Compass, 
  Layers, 
  Calendar, 
  UploadCloud, 
  Check, 
  AlertCircle,
  Film
} from "lucide-react";

export default function DashboardSpotlightCMS() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"reels" | "features" | "templates" | "roadmap">("reels");

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/content", { cache: "no-store" });
        const data = (await res.json()) as SiteContent;
        if (!ok) return;
        
        // Ensure properties exist for older DB records
        if (!data.showcase) {
          data.showcase = PUBLIC_DEFAULT_SITE_CONTENT.showcase || { slides: [] };
        }
        if (!data.showcase.slides) {
          data.showcase.slides = PUBLIC_DEFAULT_SITE_CONTENT.showcase?.slides || [];
        }
        if (!data.spotlightFeatures) {
          data.spotlightFeatures = PUBLIC_DEFAULT_SITE_CONTENT.spotlightFeatures || [];
        }
        if (!data.spotlightTemplates) {
          data.spotlightTemplates = PUBLIC_DEFAULT_SITE_CONTENT.spotlightTemplates || [];
        }
        if (!data.upcomingFeatures) {
          data.upcomingFeatures = PUBLIC_DEFAULT_SITE_CONTENT.upcomingFeatures || [];
        }
        
        setContent(data);
      } catch {
        if (!ok) return;
        setStatus("Failed to load content database.");
        setSaveSuccess(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4" style={{ color: "var(--text-muted)" }}>
        <span
          className="loading-orbit h-10 w-10 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#7B61FF", borderTopColor: "transparent" }}
          aria-hidden
        />
        <p className="text-sm font-semibold tracking-wide">Loading Spotlight CMS Database…</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-muted)" }}>
          <AlertCircle className="mx-auto h-12 w-12 text-[#FF2E9A] mb-3" />
          <p className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Admin Security Access Required
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Please log in first before attempting to manage Spotlight marketing assets.
          </p>
          <Link 
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#00D4FF] px-6 text-sm font-bold text-white transition-all hover:brightness-110" 
            href="/admin/login?next=/admindashboard/spotlight"
          >
            Authenticate Operator
          </Link>
        </div>
      </div>
    );
  }

  const save = async () => {
    if (!content) return;
    const h = authHeaders();
    if (!h.Authorization) {
      setStatus("Action revoked: Re-verify authorization credentials.");
      setSaveSuccess(false);
      return;
    }
    setStatus("Synchronizing databases...");
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("Successfully synchronized Spotlight CMS content!");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setStatus(`Update failure: ${data.error || "Unknown response"}`);
        setSaveSuccess(false);
      }
    } catch {
      setStatus("Failed to reach marketing API handler.");
      setSaveSuccess(false);
    }
  };

  const uploadTemplateImage = async (file: File, index: number) => {
    const h = authHeaders();
    if (!h.Authorization) {
      setStatus("Upload blocked: Session signature expired.");
      setSaveSuccess(false);
      return;
    }
    setStatus("Uploading showcase asset...");
    setSaveSuccess(null);

    try {
      const form = new FormData();
      form.set("folder", "gallery");
      form.set("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: h,
        body: form,
      });
      const data = await res.json();
      if (!data.ok) {
        setStatus(`Upload rejected: ${data.error || "Bad format"}`);
        setSaveSuccess(false);
        return;
      }

      if (!content || !content.spotlightTemplates) return;
      const next = structuredClone(content);
      if (next.spotlightTemplates) {
        next.spotlightTemplates[index].imageUrl = data.src;
      }
      setContent(next);
      setStatus("Showcase thumbnail uploaded successfully!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch {
      setStatus("Failed to upload image file to public/media.");
      setSaveSuccess(false);
    }
  };

  const uploadSlideVideo = async (file: File, index: number) => {
    const h = authHeaders();
    if (!h.Authorization) {
      setStatus("Upload blocked: Session signature expired.");
      setSaveSuccess(false);
      return;
    }
    setStatus("Uploading showcase reel video...");
    setSaveSuccess(null);

    try {
      const form = new FormData();
      form.set("folder", "showcase");
      form.set("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: h,
        body: form,
      });
      const data = await res.json();
      if (!data.ok) {
        setStatus(`Upload rejected: ${data.error || "Bad format"}`);
        setSaveSuccess(false);
        return;
      }

      if (!content || !content.showcase || !content.showcase.slides) return;
      const next = structuredClone(content);
      next.showcase.slides[index].videoSrc = data.src;
      setContent(next);
      setStatus("Showcase reel video uploaded successfully!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch {
      setStatus("Failed to upload video file.");
      setSaveSuccess(false);
    }
  };

  // List Reordering Helpers
  const moveItem = <T,>(list: T[], index: number, direction: "up" | "down"): T[] => {
    const result = [...list];
    if (direction === "up" && index > 0) {
      const tmp = result[index - 1];
      result[index - 1] = result[index];
      result[index] = tmp;
    } else if (direction === "down" && index < list.length - 1) {
      const tmp = result[index + 1];
      result[index + 1] = result[index];
      result[index] = tmp;
    }
    return result;
  };

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-[1100px]">
        {/* Banner Header */}
        <div className="flex flex-col gap-6 rounded-2xl border p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#7B61FF]/10 text-xs font-semibold text-[#7B61FF]">★</span>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Core Marketing Suite
              </p>
            </div>
            <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Spotlight CMS Page Editor
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Provide full administrative control over stylistic templates, glassmorphic platform feature cards, and the precise research pipeline roadmap timeline.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end lg:text-right">
            <p className="max-w-sm text-xs" style={{ color: "var(--text-muted)" }}>
              Identity Scope: <span className="font-mono text-[#00D4FF]">{admin.email}</span>
            </p>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                Overview
              </Link>
              <motion.button
                type="button"
                whileTap={reduce ? undefined : { scale: 0.98 }}
                onClick={save}
                disabled={!content}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 text-sm font-bold disabled:opacity-60 transition-all hover:border-[#00D4FF]/30"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                Save Live Database
              </motion.button>
            </div>
            {status && (
              <div className="flex items-center gap-1.5 lg:justify-end mt-1 text-xs">
                {saveSuccess === true && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                {saveSuccess === false && <AlertCircle className="h-3.5 w-3.5 text-[#FF2E9A] shrink-0" />}
                <p
                  style={{
                    color:
                      saveSuccess === false ? "#FF2E9A" : saveSuccess === true ? "#34D399" : "var(--text-muted)",
                  }}
                >
                  {status}
                </p>
              </div>
            )}
          </div>
        </div>

        {!content ? (
          <div className="py-16 text-center text-sm flex flex-col items-center justify-center gap-3" style={{ color: "var(--text-muted)" }}>
            <span className="loading-orbit h-8 w-8 rounded-full border border-t-transparent" style={{ borderColor: "#7B61FF" }} />
            <span>Synchronizing payload records...</span>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-8">
            {/* Elegant Tab Controller */}
            <div className="flex border-b border-white/5 pb-2 overflow-x-auto select-none no-scrollbar gap-6 sm:gap-10">
              <button
                type="button"
                onClick={() => { setActiveTab("reels"); setStatus(""); }}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0 flex items-center gap-2"
                style={{ color: activeTab === "reels" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                <Film className="h-4 w-4 shrink-0 text-[#00D4FF]" />
                Spotlight Reels (Slides)
                {activeTab === "reels" && (
                  <motion.div layoutId="spotlightActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("features"); setStatus(""); }}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0 flex items-center gap-2"
                style={{ color: activeTab === "features" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                <Layers className="h-4 w-4 shrink-0" />
                Spotlight Features
                {activeTab === "features" && (
                  <motion.div layoutId="spotlightActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("templates"); setStatus(""); }}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0 flex items-center gap-2"
                style={{ color: activeTab === "templates" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                <Compass className="h-4 w-4 shrink-0" />
                Workspace Presets
                {activeTab === "templates" && (
                  <motion.div layoutId="spotlightActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("roadmap"); setStatus(""); }}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0 flex items-center gap-2"
                style={{ color: activeTab === "roadmap" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                <Calendar className="h-4 w-4 shrink-0" />
                Research Roadmap
                {activeTab === "roadmap" && (
                  <motion.div layoutId="spotlightActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>
            </div>

            <div className="grid gap-10">
              
              {/* SECTION: SPOTLIGHT SHOWCASE REELS (SLIDES) EDITOR */}
              {activeTab === "reels" && (
                <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                      <h2 className="font-display text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Film className="h-5 w-5 text-[#00D4FF]" />
                        Spotlight Showcase Reels (Slides)
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Manage the cinematic looping video clips that highlight product capability at the top of the Spotlight page.
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      onClick={() => {
                        const next = structuredClone(content);
                        if (!next.showcase) next.showcase = { slides: [] };
                        if (!next.showcase.slides) next.showcase.slides = [];
                        next.showcase.slides.push({
                          id: `show-${Date.now()}`,
                          title: "Flux Temporal Render",
                          caption: "Hyper-realistic rendering pipelines powered by neural models.",
                          videoSrc: "",
                        });
                        setContent(next);
                        setStatus("New showcase reel slide added to local workspace state.");
                      }}
                      className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Showcase Reel
                    </motion.button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {content.showcase && content.showcase.slides && content.showcase.slides.length > 0 ? (
                      content.showcase.slides.map((slide, idx) => (
                        <div 
                          key={slide.id || idx} 
                          className="editor-card p-5 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#070709] transition-all hover:border-[#00D4FF]/20"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-[#00D4FF]/10 bg-[#00D4FF]/5 text-[#00D4FF]">
                                REEL // 0{idx + 1}
                              </span>
                              <span className="font-mono text-[10px] text-white/35">ID: {slide.id}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Reorder Buttons */}
                              <button
                                type="button"
                                title="Move Up"
                                disabled={idx === 0}
                                onClick={() => {
                                  if (!content.showcase || !content.showcase.slides) return;
                                  const next = structuredClone(content);
                                  next.showcase.slides = moveItem(next.showcase.slides!, idx, "up");
                                  setContent(next);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-white/5 disabled:opacity-30 text-white"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Move Down"
                                disabled={idx === (content.showcase?.slides?.length ?? 0) - 1}
                                onClick={() => {
                                  if (!content.showcase || !content.showcase.slides) return;
                                  const next = structuredClone(content);
                                  next.showcase.slides = moveItem(next.showcase.slides!, idx, "down");
                                  setContent(next);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-white/5 disabled:opacity-30 text-white"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                title="Delete Reel"
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-red-500/10 text-[#FF2E9A] transition-colors"
                                onClick={() => {
                                  const next = structuredClone(content);
                                  if (next.showcase && next.showcase.slides) {
                                    if (next.showcase.slides.length <= 1) {
                                      setStatus("Cannot delete the last remaining showcase reel.");
                                      setSaveSuccess(false);
                                      return;
                                    }
                                    next.showcase.slides.splice(idx, 1);
                                    setContent(next);
                                    setStatus("Removed showcase reel slide.");
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Video Preview */}
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-zinc-950 flex flex-col items-center justify-center" style={{ borderColor: "var(--border-subtle)" }}>
                            {slide.videoSrc ? (
                              <video 
                                className="h-full w-full object-cover" 
                                src={slide.videoSrc} 
                                controls 
                                muted 
                                playsInline 
                                preload="metadata" 
                              />
                            ) : (
                              <div className="text-[10px] text-zinc-600 text-center px-3 font-mono">
                                No video clip uploaded yet
                              </div>
                            )}
                          </div>

                          <div className="grid gap-3.5">
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Upload Loop Video (~3s, .mp4 / .webm)</label>
                              <label className="mt-1 flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/5 text-[11px] font-bold text-white transition-colors hover:bg-white/10">
                                <UploadCloud className="h-4 w-4 text-[#00D4FF]" />
                                Choose Video File
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadSlideVideo(f, idx);
                                  }}
                                />
                              </label>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Reel Title</label>
                              <input
                                value={slide.title}
                                onChange={(e) => {
                                  const next = structuredClone(content);
                                  if (next.showcase && next.showcase.slides) {
                                    next.showcase.slides[idx].title = e.target.value;
                                    setContent(next);
                                  }
                                }}
                                className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                placeholder="e.g. Cinematic Slow Motion"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">One-Line Caption</label>
                              <textarea
                                value={slide.caption}
                                onChange={(e) => {
                                  const next = structuredClone(content);
                                  if (next.showcase && next.showcase.slides) {
                                    next.showcase.slides[idx].caption = e.target.value;
                                    setContent(next);
                                  }
                                }}
                                rows={2}
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1 leading-relaxed"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                placeholder="Describe what users see in this video clip."
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Direct Video URL</label>
                              <input
                                value={slide.videoSrc}
                                onChange={(e) => {
                                  const next = structuredClone(content);
                                  if (next.showcase && next.showcase.slides) {
                                    next.showcase.slides[idx].videoSrc = e.target.value;
                                    setContent(next);
                                  }
                                }}
                                className="min-h-[36px] w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1 font-mono text-[#00D4FF]"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                                placeholder="/media/..."
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="md:col-span-2 py-8 text-center text-xs text-[var(--text-muted)]">
                        No showcase reels found. Click &quot;Add Showcase Reel&quot; to begin.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* SECTION A: SPOTLIGHT FEATURES CARD DESIGN EDITOR */}
              {activeTab === "features" && (
                <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                      <h2 className="font-display text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Layers className="h-5 w-5 text-[#7B61FF]" />
                        Spotlight Feature Cards
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Manage those premium, cyber-glassmorphic status features loaded with grid backgrounds.
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      onClick={() => {
                        const next = structuredClone(content);
                        if (!next.spotlightFeatures) next.spotlightFeatures = [];
                        next.spotlightFeatures.push({
                          id: `sf-${Date.now()}`,
                          title: "Next-gen Node Rendering",
                          description: "Leverage state of the art GPU synthesis cluster instances seamlessly.",
                          badge: "240 FPS",
                          glowColor: "#00D4FF",
                        });
                        setContent(next);
                        setStatus("New feature card added to local workspace state.");
                      }}
                      className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Feature Card
                    </motion.button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {content.spotlightFeatures && content.spotlightFeatures.length > 0 ? (
                      content.spotlightFeatures.map((feat, idx) => (
                        <div 
                          key={feat.id || idx} 
                          className="editor-card p-5 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#070709] transition-all hover:border-[#7B61FF]/20"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-white/5 bg-white/5 text-[var(--text-subtle)]">
                                CTRL // 0{idx + 1}
                              </span>
                              <span className="font-mono text-[10px] text-white/35">ID: {feat.id}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Reorder Buttons */}
                              <button
                                type="button"
                                title="Move Up"
                                disabled={idx === 0}
                                onClick={() => {
                                  if (!content.spotlightFeatures) return;
                                  const next = structuredClone(content);
                                  next.spotlightFeatures = moveItem(next.spotlightFeatures!, idx, "up");
                                  setContent(next);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-white/5 disabled:opacity-30 text-white"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Move Down"
                                disabled={idx === (content.spotlightFeatures?.length ?? 0) - 1}
                                onClick={() => {
                                  if (!content.spotlightFeatures) return;
                                  const next = structuredClone(content);
                                  next.spotlightFeatures = moveItem(next.spotlightFeatures!, idx, "down");
                                  setContent(next);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-white/5 disabled:opacity-30 text-white"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                title="Delete Feature"
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-red-500/10 text-[#FF2E9A] transition-colors"
                                onClick={() => {
                                  const next = structuredClone(content);
                                  if (next.spotlightFeatures) {
                                    next.spotlightFeatures.splice(idx, 1);
                                    setContent(next);
                                    setStatus("Removed feature item.");
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-3.5">
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Card Title</label>
                              <input
                                value={feat.title}
                                onChange={(e) => {
                                  const next = structuredClone(content);
                                  if (next.spotlightFeatures) {
                                    next.spotlightFeatures[idx].title = e.target.value;
                                    setContent(next);
                                  }
                                }}
                                className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                placeholder="Feature Title"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Card Description</label>
                              <textarea
                                value={feat.description}
                                onChange={(e) => {
                                  const next = structuredClone(content);
                                  if (next.spotlightFeatures) {
                                    next.spotlightFeatures[idx].description = e.target.value;
                                    setContent(next);
                                  }
                                }}
                                rows={3}
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1 leading-relaxed"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                placeholder="Feature Description"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Status Badge</label>
                                <input
                                  value={feat.badge || ""}
                                  onChange={(e) => {
                                    const next = structuredClone(content);
                                    if (next.spotlightFeatures) {
                                      next.spotlightFeatures[idx].badge = e.target.value;
                                      setContent(next);
                                    }
                                  }}
                                  className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1"
                                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                  placeholder="e.g. SYSTEM_NODE // active"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Interactive Radial Glow</label>
                                <select
                                  value={feat.glowColor}
                                  onChange={(e) => {
                                    const next = structuredClone(content);
                                    if (next.spotlightFeatures) {
                                      next.spotlightFeatures[idx].glowColor = e.target.value;
                                      setContent(next);
                                    }
                                  }}
                                  className="min-h-[40px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none mt-1"
                                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                >
                                  <option value="#7B61FF">Brand Velvet Purple (#7B61FF)</option>
                                  <option value="#00D4FF">Brand Aurora Cyan (#00D4FF)</option>
                                  <option value="#FF2E9A">Brand Hyper Pink (#FF2E9A)</option>
                                  <option value="#10B981">System Emerald Green (#10B981)</option>
                                  <option value="#F59E0B">System Warm Amber (#F59E0B)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="md:col-span-2 py-8 text-center text-xs text-[var(--text-muted)]">
                        No spotlight feature cards configured. Click &quot;Add Feature Card&quot; to begin.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* SECTION B: STYLE PRESETS & TEMPLATES GRID DESIGN EDITOR */}
              {activeTab === "templates" && (
                <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                      <h2 className="font-display text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Compass className="h-5 w-5 text-[#00D4FF]" />
                        Workspace Style Presets (Templates)
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Configure the 4-column wide desktop workspace template options with preview thumbnails.
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      onClick={() => {
                        const next = structuredClone(content);
                        if (!next.spotlightTemplates) next.spotlightTemplates = [];
                        next.spotlightTemplates.push({
                          id: `st-${Date.now()}`,
                          title: "Sci-Fi Cyberpunk Presets",
                          description: "Immersive dark environments loaded with high contrast elements.",
                          category: "Sci-Fi",
                          demoUrl: "/demo",
                          imageUrl: "",
                        });
                        setContent(next);
                        setStatus("New style preset added locally.");
                      }}
                      className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Style Preset
                    </motion.button>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {content.spotlightTemplates && content.spotlightTemplates.length > 0 ? (
                      content.spotlightTemplates.map((tmpl, idx) => (
                        <div 
                          key={tmpl.id || idx} 
                          className="editor-card p-5 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#070709] transition-all hover:border-[#00D4FF]/20"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-[#00D4FF]/10 bg-[#00D4FF]/5 text-[#00D4FF]">
                              PRESET // 0{idx + 1}
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Reorder Buttons */}
                              <button
                                type="button"
                                title="Move Up"
                                disabled={idx === 0}
                                onClick={() => {
                                  if (!content.spotlightTemplates) return;
                                  const next = structuredClone(content);
                                  next.spotlightTemplates = moveItem(next.spotlightTemplates!, idx, "up");
                                  setContent(next);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-white/5 disabled:opacity-30 text-white"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Move Down"
                                disabled={idx === (content.spotlightTemplates?.length ?? 0) - 1}
                                onClick={() => {
                                  if (!content.spotlightTemplates) return;
                                  const next = structuredClone(content);
                                  next.spotlightTemplates = moveItem(next.spotlightTemplates!, idx, "down");
                                  setContent(next);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-white/5 disabled:opacity-30 text-white"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                title="Delete Preset"
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-red-500/10 text-[#FF2E9A] transition-colors"
                                onClick={() => {
                                  const next = structuredClone(content);
                                  if (next.spotlightTemplates) {
                                    next.spotlightTemplates.splice(idx, 1);
                                    setContent(next);
                                    setStatus("Removed preset template.");
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-5">
                            {/* Preview Area */}
                            <div className="sm:col-span-2 flex flex-col gap-2">
                              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-zinc-950 flex items-center justify-center" style={{ borderColor: "var(--border-subtle)" }}>
                                {tmpl.imageUrl ? (
                                  <Image src={tmpl.imageUrl} alt={tmpl.title} fill className="object-cover" />
                                ) : (
                                  <div className="text-[10px] text-zinc-600 text-center px-3 font-mono">
                                    No preview image
                                  </div>
                                )}
                              </div>
                              <label className="flex min-h-[32px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/5 text-[10px] font-bold text-white transition-colors hover:bg-white/10">
                                <UploadCloud className="h-3.5 w-3.5 text-[#00D4FF]" />
                                Upload Frame
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadTemplateImage(f, idx);
                                  }}
                                />
                              </label>
                            </div>

                            {/* Forms Area */}
                            <div className="sm:col-span-3 grid gap-3">
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Preset Name</label>
                                <input
                                  value={tmpl.title}
                                  onChange={(e) => {
                                    const next = structuredClone(content);
                                    if (next.spotlightTemplates) {
                                      next.spotlightTemplates[idx].title = e.target.value;
                                      setContent(next);
                                    }
                                  }}
                                  className="min-h-[36px] w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1"
                                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                  placeholder="Preset Title"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Category Tag</label>
                                <input
                                  value={tmpl.category}
                                  onChange={(e) => {
                                    const next = structuredClone(content);
                                    if (next.spotlightTemplates) {
                                      next.spotlightTemplates[idx].category = e.target.value;
                                      setContent(next);
                                    }
                                  }}
                                  className="min-h-[36px] w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1"
                                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                  placeholder="e.g. Cinematic, Sci-Fi"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Showcase Image URL</label>
                                <input
                                  value={tmpl.imageUrl || ""}
                                  onChange={(e) => {
                                    const next = structuredClone(content);
                                    if (next.spotlightTemplates) {
                                      next.spotlightTemplates[idx].imageUrl = e.target.value;
                                      setContent(next);
                                    }
                                  }}
                                  className="min-h-[36px] w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1 font-mono text-[#00D4FF]"
                                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                                  placeholder="/media/..."
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Try-it Redirect URL</label>
                                <input
                                  value={tmpl.demoUrl || ""}
                                  onChange={(e) => {
                                    const next = structuredClone(content);
                                    if (next.spotlightTemplates) {
                                      next.spotlightTemplates[idx].demoUrl = e.target.value;
                                      setContent(next);
                                    }
                                  }}
                                  className="min-h-[36px] w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1"
                                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                  placeholder="e.g. /dashboard"
                                />
                              </div>
                            </div>

                            {/* Fullwidth description box inside card */}
                            <div className="sm:col-span-5">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Description Text</label>
                              <textarea
                                value={tmpl.description}
                                onChange={(e) => {
                                  const next = structuredClone(content);
                                  if (next.spotlightTemplates) {
                                    next.spotlightTemplates[idx].description = e.target.value;
                                    setContent(next);
                                  }
                                }}
                                rows={2}
                                className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1 leading-normal"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                placeholder="Pillar explanation text..."
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="lg:col-span-2 py-8 text-center text-xs text-[var(--text-muted)]">
                        No templates loaded in content database. Click &quot;Add Style Preset&quot;.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* SECTION C: ROADMAP TIMELINE NODE EDITOR */}
              {activeTab === "roadmap" && (
                <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                      <h2 className="font-display text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Calendar className="h-5 w-5 text-[#FF2E9A]" />
                        Innovation Timeline Nodes (Roadmap)
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Adjust timeline milestones to render in the connected, pixel-perfect vertical timeline chart.
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      onClick={() => {
                        const next = structuredClone(content);
                        if (!next.upcomingFeatures) next.upcomingFeatures = [];
                        next.upcomingFeatures.push({
                          id: `uf-${Date.now()}`,
                          title: "Temporal Super-Resolution",
                          description: "Up-convert framerates through neural frame synthesis pipelines smoothly.",
                          timeline: "Late 2026",
                          status: "planned",
                        });
                        setContent(next);
                        setStatus("New roadmap node initialized locally.");
                      }}
                      className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Milestone Node
                    </motion.button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {content.upcomingFeatures && content.upcomingFeatures.length > 0 ? (
                      content.upcomingFeatures.map((item, idx) => (
                        <div 
                          key={item.id || idx} 
                          className="editor-card p-5 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#070709] transition-all hover:border-[#FF2E9A]/20"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-[#FF2E9A]/10 bg-[#FF2E9A]/5 text-[#FF2E9A]">
                              MILESTONE // 0{idx + 1}
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Reorder Buttons */}
                              <button
                                type="button"
                                title="Move Up"
                                disabled={idx === 0}
                                onClick={() => {
                                  if (!content.upcomingFeatures) return;
                                  const next = structuredClone(content);
                                  next.upcomingFeatures = moveItem(next.upcomingFeatures!, idx, "up");
                                  setContent(next);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-white/5 disabled:opacity-30 text-white"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Move Down"
                                disabled={idx === (content.upcomingFeatures?.length ?? 0) - 1}
                                onClick={() => {
                                  if (!content.upcomingFeatures) return;
                                  const next = structuredClone(content);
                                  next.upcomingFeatures = moveItem(next.upcomingFeatures!, idx, "down");
                                  setContent(next);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-white/5 disabled:opacity-30 text-white"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                title="Delete Milestone"
                                className="h-7 w-7 flex items-center justify-center rounded border border-white/5 bg-[#0d0d12] hover:bg-red-500/10 text-[#FF2E9A] transition-colors"
                                onClick={() => {
                                  const next = structuredClone(content);
                                  if (next.upcomingFeatures) {
                                    next.upcomingFeatures.splice(idx, 1);
                                    setContent(next);
                                    setStatus("Removed roadmap node.");
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-3.5">
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Milestone Title</label>
                              <input
                                value={item.title}
                                onChange={(e) => {
                                  const next = structuredClone(content);
                                  if (next.upcomingFeatures) {
                                    next.upcomingFeatures[idx].title = e.target.value;
                                    setContent(next);
                                  }
                                }}
                                className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                placeholder="e.g. Flux Cinematic Synthesis"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Detailed Milestone Description</label>
                              <textarea
                                value={item.description}
                                onChange={(e) => {
                                  const next = structuredClone(content);
                                  if (next.upcomingFeatures) {
                                    next.upcomingFeatures[idx].description = e.target.value;
                                    setContent(next);
                                  }
                                }}
                                rows={3}
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1 leading-relaxed"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                placeholder="Milestone description..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Timeline Info Badge</label>
                                <input
                                  value={item.timeline}
                                  onChange={(e) => {
                                    const next = structuredClone(content);
                                    if (next.upcomingFeatures) {
                                      next.upcomingFeatures[idx].timeline = e.target.value;
                                      setContent(next);
                                    }
                                  }}
                                  className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 mt-1"
                                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                  placeholder="e.g. Q4 2026"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Roadmap Phase Status</label>
                                <select
                                  value={item.status}
                                  onChange={(e) => {
                                    const next = structuredClone(content);
                                    if (next.upcomingFeatures) {
                                      next.upcomingFeatures[idx].status = e.target.value as "planned" | "in-progress" | "released";
                                      setContent(next);
                                    }
                                  }}
                                  className="min-h-[40px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none mt-1"
                                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                                >
                                  <option value="planned">Planned (Hyper Pink Dot)</option>
                                  <option value="in-progress">In Progress (Velvet Purple Dot)</option>
                                  <option value="released">Released / Live (Aurora Cyan Dot)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="md:col-span-2 py-8 text-center text-xs text-[var(--text-muted)]">
                        No upcoming roadmap timeline milestone nodes found. Click &quot;Add Milestone Node&quot;.
                      </div>
                    )}
                  </div>
                </section>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
