"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import HeroBackground from "@/components/HeroBackground";
import Hero from "@/components/Hero";
import { motion, useReducedMotion } from "framer-motion";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import type { GalleryCategory, SiteContent } from "@/backend/site-content/types";
import { PUBLIC_DEFAULT_SITE_CONTENT } from "@/backend/site-content/default-content";

export default function DashboardContentPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"hero" | "homepage" | "visualizer">("hero");

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/content", { cache: "no-store" });
        const data = (await res.json()) as SiteContent;
        if (!ok) return;
        
        // Ensure properties exist for older DB records
        if (!data.heroBackground) {
          data.heroBackground = PUBLIC_DEFAULT_SITE_CONTENT.heroBackground;
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
        if (!data.visualizerPresets) {
          data.visualizerPresets = PUBLIC_DEFAULT_SITE_CONTENT.visualizerPresets || [];
        }
        
        setContent(data);
      } catch {
        if (!ok) return;
        setStatus("Failed to load content.");
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
        <p className="text-sm font-semibold tracking-wide">Loading editor…</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-muted)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Admin sign-in required
          </p>
          <p className="mt-2 text-sm">
            Go to{" "}
            <Link className="font-semibold text-[#00D4FF] hover:underline" href="/admin/login?next=/admindashboard/content">
              admin login
            </Link>
            .
          </p>
        </div>

      </div>
    );
  }

  const save = async () => {
    if (!content) return;
    const h = authHeaders();
    if (!h.Authorization) {
      setStatus("Save failed: sign in again at /admin/login.");
      return;
    }
    setStatus("");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { ...h, "content-type": "application/json" },
      body: JSON.stringify(content),
    });
    const data = await res.json();
    setStatus(data.ok ? "Saved. Homepage updated." : `Save failed: ${data.error || "Unknown error"}`);
  };

  const upload = async (folder: "hero" | "gallery" | "img" | "showcase" | "homepage", file: File) => {
    const h = authHeaders();
    if (!h.Authorization) {
      setStatus("Upload failed: sign in again at /admin/login.");
      return null;
    }
    setStatus("");
    const form = new FormData();
    form.set("folder", folder);
    form.set("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: h,
      body: form,
    });
    const data = await res.json();
    if (!data.ok) {
      setStatus(`Upload failed: ${data.error || "Unknown error"}`);
      return null as string | null;
    }
    setStatus("Uploaded.");
    return data.src as string;
  };

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-[1100px]">
        <div className="flex flex-col gap-6 rounded-2xl border p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
              Admin · Site content
            </p>
            <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Content studio
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
              Hero previews, gallery tiles, and Spotlight clips. Favor landscape imagery and ~3s videos for a
              cinematic grid.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end lg:text-right">
            <p className="max-w-sm text-xs lg:text-right" style={{ color: "var(--text-muted)" }}>
              Signed in as <span className="font-mono text-[#00D4FF]">{admin.email}</span>
            </p>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                Dashboard
              </Link>
              <motion.button
                type="button"
                whileTap={reduce ? undefined : { scale: 0.98 }}
                onClick={save}
                disabled={!content}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 text-sm font-semibold disabled:opacity-60"
                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
              >
                Save changes
              </motion.button>
            </div>
            {status && (
              <p
                className="max-w-md text-xs lg:text-right"
                style={{
                  color:
                    status.startsWith("Save failed") || status.startsWith("Upload failed") ? "#FF2E9A" : "var(--text-muted)",
                }}
              >
                {status}
              </p>
            )}
          </div>
        </div>

        {!content ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Loading content…
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-8">
            {/* Premium Editorial Tab Controller */}
            <div className="flex border-b border-white/5 pb-2 overflow-x-auto select-none no-scrollbar gap-6 sm:gap-10">
              <button
                type="button"
                onClick={() => setActiveTab("hero")}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0"
                style={{ color: activeTab === "hero" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                Hero & Gallery
                {activeTab === "hero" && (
                  <motion.div layoutId="adminActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("homepage")}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0"
                style={{ color: activeTab === "homepage" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                Homepage Layout
                {activeTab === "homepage" && (
                  <motion.div layoutId="adminActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("visualizer")}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0"
                style={{ color: activeTab === "visualizer" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                Features Visualizer
                {activeTab === "visualizer" && (
                  <motion.div layoutId="adminActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>
            </div>

            <div className="grid gap-10">
              {/* Hero Background Management */}
              {activeTab === "hero" && (
                <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                  <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Hero Background</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Manage background media and visual settings for the hero section.</p>

              {/* Media Manager */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {content?.heroBackground?.media?.map((m, idx) => (
                  <div key={m.id} className="editor-card p-3 flex flex-col gap-2">
                    <div className="relative aspect-video overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
                      {m.type === "image" ? (
                        <Image src={m.src} alt={m.filename} fill className="object-cover" />
                      ) : (
                        <video src={m.src} autoPlay muted loop className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{m.type.toUpperCase()}</span>
                      <span className="font-mono text-[#00D4FF]">{m.filename}</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => {
                        if (!content) return;
                        const next = structuredClone(content);
                        if (!next.heroBackground) return;
                        next.heroBackground.media.splice(idx, 1);
                        setContent(next);
                      }} className="text-sm font-semibold text-[#FF2E9A] hover:underline">Remove</button>
                      <button type="button" onClick={() => {
                        if (!content || idx === 0) return;
                        const next = structuredClone(content);
                        if (!next.heroBackground) return;
                        const tmp = next.heroBackground.media[idx - 1];
                        next.heroBackground.media[idx - 1] = next.heroBackground.media[idx];
                        next.heroBackground.media[idx] = tmp;
                        setContent(next);
                      }} className="text-sm font-medium text-[#00D4FF]">↑</button>
                      <button type="button" onClick={() => {
                        if (!content || idx === content.heroBackground.media.length - 1) return;
                        const next = structuredClone(content);
                        if (!next.heroBackground) return;
                        const tmp = next.heroBackground.media[idx + 1];
                        next.heroBackground.media[idx + 1] = next.heroBackground.media[idx];
                        next.heroBackground.media[idx] = tmp;
                        setContent(next);
                      }} className="text-sm font-medium text-[#00D4FF]">↓</button>
                    </div>
                  </div>
                ))}
                {/* Add Media Card */}
                <div className="editor-card p-3 flex flex-col items-center justify-center border-dashed border-2" style={{ borderColor: "var(--border-subtle)" }}>
                  <label className="cursor-pointer">
                    <span className="text-sm font-medium text-[#00D4FF]">Add Media</span>
                    <input type="file" accept=".jpg,.png,.webp,.mp4,.webm" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const src = await upload("homepage", f);
                      if (!src || !content) return;
                      const next = structuredClone(content);
                      if (!next.heroBackground) {
                        next.heroBackground = {
                          media: [],
                          overlayOpacity: 0.55,
                          crossfadeDuration: 6,
                          staggerDelay: 0.8,
                          enableParallax: true,
                          parallaxIntensity: 10,
                        };
                      }
                      next.heroBackground.media.push({
                        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `bg-${Date.now()}`,
                        type: f.type.startsWith("video") ? "video" : "image",
                        src,
                        filename: f.name,
                      });
                      setContent(next);
                      e.target.value = "";
                    }} />
                  </label>
                </div>
              </div>

              {/* Settings Panel */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Overlay Opacity</label>
                  <input type="range" min={0} max={100} value={Math.round((content?.heroBackground?.overlayOpacity || 0) * 100)} onChange={(e) => {
                    const next = structuredClone(content);
                    if (!next.heroBackground) return;
                    next.heroBackground.overlayOpacity = Number(e.target.value) / 100;
                    setContent(next);
                  }} className="flex-1" />
                  <span className="text-sm">{Math.round((content?.heroBackground?.overlayOpacity || 0) * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Crossfade Duration (s)</label>
                  <input type="number" min={0} step={0.1} value={content?.heroBackground?.crossfadeDuration || 0} onChange={(e) => {
                    const next = structuredClone(content);
                    if (!next.heroBackground) return;
                    next.heroBackground.crossfadeDuration = Number(e.target.value);
                    setContent(next);
                  }} className="w-20 rounded px-2 py-1" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Stagger Delay (s)</label>
                  <input type="number" min={0} step={0.1} value={content?.heroBackground?.staggerDelay || 0} onChange={(e) => {
                    const next = structuredClone(content);
                    if (!next.heroBackground) return;
                    next.heroBackground.staggerDelay = Number(e.target.value);
                    setContent(next);
                  }} className="w-20 rounded px-2 py-1" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    <input type="checkbox" checked={content?.heroBackground?.enableParallax || false} onChange={(e) => {
                      const next = structuredClone(content);
                      if (!next.heroBackground) return;
                      next.heroBackground.enableParallax = e.target.checked;
                      setContent(next);
                    }} />
                    Enable Parallax
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Parallax Intensity (px)</label>
                  <input type="range" min={1} max={20} value={content?.heroBackground?.parallaxIntensity || 10} onChange={(e) => {
                    const next = structuredClone(content);
                    if (!next.heroBackground) return;
                    next.heroBackground.parallaxIntensity = Number(e.target.value);
                    setContent(next);
                  }} className="flex-1" />
                  <span className="text-sm">{content?.heroBackground?.parallaxIntensity || 10}px</span>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}>Preview Changes</button>
                  <button type="button" onClick={save} disabled={!content} className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium disabled:opacity-60" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}>Save &amp; Publish</button>
                </div>
              </div>
            </section>
          )}

          {/* Showcase gallery */}
          {activeTab === "homepage" && (
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Showcase gallery</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                All tiles are forced to landscape for a consistent look.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-subtle)" }}>
                  Add new images here — they show up on the landing page gallery.
                </p>
                <motion.button
                  type="button"
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={() => {
                    if (!content) return;
                    const next = structuredClone(content);
                    next.gallery.items.unshift({
                      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `gal-${Date.now()}`,
                      src: "",
                      alt: "New gallery image",
                      prompt: "New prompt",
                      category: "cinematic",
                    });
                    setContent(next);
                    setStatus("");
                  }}
                  className="shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--soft-black)",
                    color: "var(--text-primary)",
                  }}
                >
                  Add image
                </motion.button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {content.gallery.items.map((it, idx) => (
                  <div key={it.id} className="editor-card p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="text-xs font-mono" style={{ color: "var(--text-subtle)" }}>
                        {it.id}
                      </p>
                      <button
                        type="button"
                        className="shrink-0 text-xs font-semibold text-[#FF2E9A] hover:underline"
                        onClick={() => {
                          const next = structuredClone(content);
                          if (next.gallery.items.length <= 1) {
                            setStatus("Keep at least one gallery image.");
                            return;
                          }
                          next.gallery.items.splice(idx, 1);
                          setContent(next);
                          setStatus("");
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
                      {it.src ? (
                        <Image src={it.src} alt={it.alt} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 33vw" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: "var(--text-muted)" }}>
                          Upload an image
                        </div>
                      )}
                    </div>
                    <div className="mt-3 grid gap-2">
                      <select
                        value={it.category}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          next.gallery.items[idx].category = e.target.value as GalleryCategory;
                          setContent(next);
                        }}
                        className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                      >
                        <option value="cinematic">Cinematic</option>
                        <option value="sci-fi">Sci-Fi</option>
                        <option value="art">Art</option>
                        <option value="realistic">Realistic</option>
                      </select>
                      <input
                        value={it.prompt}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          next.gallery.items[idx].prompt = e.target.value;
                          setContent(next);
                        }}
                        className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Prompt"
                      />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const src = await upload("gallery", f);
                          if (!src) return;
                          const next = structuredClone(content);
                          next.gallery.items[idx].src = src;
                          next.gallery.items[idx].alt = f.name;
                          setContent(next);
                          e.target.value = "";
                        }}
                        className="block w-full text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}


          

          {/* Value Proposition Editor */}
          {activeTab === "homepage" && (
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Value Proposition Pillars</h2>
              <p className="mt-1 text-sm mb-6" style={{ color: "var(--text-muted)" }}>Customize the three core value feature pillars displayed on the homepage.</p>
              
              <div className="grid gap-6 md:grid-cols-3">
                {content.pillars?.map((p, idx) => (
                  <div key={p.id || idx} className="editor-card p-4 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#0a0a0d]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#7B61FF]">Pillar {idx + 1}</span>
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.accent }} />
                    </div>
                    <div className="grid gap-3">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Title</label>
                      <input
                        value={p.title}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.pillars) return;
                          next.pillars[idx].title = e.target.value;
                          setContent(next);
                        }}
                        className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Feature title"
                      />
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Body</label>
                      <textarea
                        value={p.body}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.pillars) return;
                          next.pillars[idx].body = e.target.value;
                          setContent(next);
                        }}
                        rows={3}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Feature description text"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/30">Spec 1 (Left)</label>
                          <input
                            value={p.cap1}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.pillars) return;
                              next.pillars[idx].cap1 = e.target.value;
                              setContent(next);
                            }}
                            className="min-h-[36px] w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                            placeholder="e.g. Core latency: 14ms"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/30">Spec 2 (Right Badge)</label>
                          <input
                            value={p.cap2}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.pillars) return;
                              next.pillars[idx].cap2 = e.target.value;
                              setContent(next);
                            }}
                            className="min-h-[36px] w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                            placeholder="e.g. Edge Rendering"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Accent Color</label>
                        <select
                          value={p.accent}
                          onChange={(e) => {
                            const next = structuredClone(content);
                            if (!next.pillars) return;
                            const val = e.target.value;
                            next.pillars[idx].accent = val;
                            next.pillars[idx].glowColor = val === "#00D4FF" 
                              ? "rgba(0, 212, 255, 0.04)" 
                              : val === "#7B61FF" 
                              ? "rgba(123, 97, 255, 0.04)" 
                              : "rgba(255, 46, 154, 0.04)";
                            setContent(next);
                          }}
                          className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none"
                          style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        >
                          <option value="#00D4FF">Brand Cyan</option>
                          <option value="#7B61FF">Brand Purple</option>
                          <option value="#FF2E9A">Brand Pink</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Metrics/Stats Editor */}
          {activeTab === "homepage" && (
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Homepage Metrics</h2>
              <p className="mt-1 text-sm mb-6" style={{ color: "var(--text-muted)" }}>Manage numeric statistics and progress values shown in the live stats bar.</p>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {content.stats?.map((s, idx) => (
                  <div key={s.id || idx} className="editor-card p-4 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#0a0a0d]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00D4FF]">Stat {idx + 1}</span>
                    <div className="grid gap-3">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Label</label>
                      <input
                        value={s.label}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.stats) return;
                          next.stats[idx].label = e.target.value;
                          setContent(next);
                        }}
                        className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Label"
                      />
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Value</label>
                      <input
                        value={s.value}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.stats) return;
                          next.stats[idx].value = e.target.value;
                          setContent(next);
                        }}
                        className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Value (e.g. 12.4M+)"
                      />
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Subtext</label>
                      <input
                        value={s.sub}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.stats) return;
                          next.stats[idx].sub = e.target.value;
                          setContent(next);
                        }}
                        className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Subtext"
                      />
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Percentage ({s.pct}%)</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={s.pct}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.stats) return;
                          next.stats[idx].pct = Number(e.target.value);
                          setContent(next);
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Testimonials Editor */}
          {activeTab === "homepage" && (
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Verified Testimonials</h2>
              <p className="mt-1 text-sm mb-6" style={{ color: "var(--text-muted)" }}>Edit the verified customer endorsements and quotes shown on the homepage.</p>
              
              <div className="grid gap-6 md:grid-cols-3">
                {content.testimonials?.map((t, idx) => (
                  <div key={t.id || idx} className="editor-card p-4 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#0a0a0d]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ff2e9a]">Testimonial {idx + 1}</span>
                    <div className="grid gap-3">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Quote Body</label>
                      <textarea
                        value={t.body}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.testimonials) return;
                          next.testimonials[idx].body = e.target.value;
                          setContent(next);
                        }}
                        rows={4}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Quote text"
                      />
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Name</label>
                      <input
                        value={t.name}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.testimonials) return;
                          next.testimonials[idx].name = e.target.value;
                          setContent(next);
                        }}
                        className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Client name"
                      />
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Role / Company</label>
                      <input
                        value={t.role}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.testimonials) return;
                          next.testimonials[idx].role = e.target.value;
                          setContent(next);
                        }}
                        className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Creative Director, Studio"
                      />
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Initials</label>
                      <input
                        value={t.initials}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          if (!next.testimonials) return;
                          next.testimonials[idx].initials = e.target.value.slice(0, 3).toUpperCase();
                          setContent(next);
                        }}
                        className="min-h-[40px] w-24 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="EV"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Features Visualizer Presets Editor */}
          {activeTab === "visualizer" && (
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Features Visualizer Presets</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Customize the interactive visual cards displayed in the Features page hero visualizer.</p>
                </div>
                <motion.button
                  type="button"
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={() => {
                    const next = structuredClone(content);
                    if (!next.visualizerPresets) {
                      next.visualizerPresets = [];
                    }
                    next.visualizerPresets.push({
                      id: `preset-${Date.now()}`,
                      name: "New Custom Preset",
                      lens: "50mm",
                      gap: "f/1.4",
                      iso: "ISO 400",
                      prompt: "Describe the custom latent generation details...",
                      image: "/media/features-monolith.png",
                      resolution: "3.5s"
                    });
                    setContent(next);
                    setStatus("");
                  }}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--deep-black)",
                    color: "var(--text-primary)",
                  }}
                >
                  Add preset card
                </motion.button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {content.visualizerPresets?.map((p, idx) => (
                  <div key={p.id} className="editor-card p-4 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#0a0a0d]">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-xs font-mono text-[#00D4FF]">Preset {idx + 1}</span>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const next = structuredClone(content);
                            if (!next.visualizerPresets) return;
                            const tmp = next.visualizerPresets[idx - 1];
                            next.visualizerPresets[idx - 1] = next.visualizerPresets[idx];
                            next.visualizerPresets[idx] = tmp;
                            setContent(next);
                          }}
                          className="text-xs text-neutral-400 hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === (content.visualizerPresets?.length || 0) - 1}
                          onClick={() => {
                            const next = structuredClone(content);
                            if (!next.visualizerPresets) return;
                            const tmp = next.visualizerPresets[idx + 1];
                            next.visualizerPresets[idx + 1] = next.visualizerPresets[idx];
                            next.visualizerPresets[idx] = tmp;
                            setContent(next);
                          }}
                          className="text-xs text-neutral-400 hover:text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = structuredClone(content);
                            if (!next.visualizerPresets) return;
                            if (next.visualizerPresets.length <= 1) {
                              setStatus("You must keep at least one preset.");
                              return;
                            }
                            next.visualizerPresets.splice(idx, 1);
                            setContent(next);
                            setStatus("");
                          }}
                          className="text-xs font-semibold text-[#FF2E9A] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 33vw" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                          No background image
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Preset Name</label>
                        <input
                          value={p.name}
                          onChange={(e) => {
                            const next = structuredClone(content);
                            if (!next.visualizerPresets) return;
                            next.visualizerPresets[idx].name = e.target.value;
                            setContent(next);
                          }}
                          className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                          style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                          placeholder="e.g. Sci-Fi Monolith"
                        />
                      </div>



                      <div>
                        <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Prompt Quote Text</label>
                        <textarea
                          value={p.prompt}
                          onChange={(e) => {
                            const next = structuredClone(content);
                            if (!next.visualizerPresets) return;
                            next.visualizerPresets[idx].prompt = e.target.value;
                            setContent(next);
                          }}
                          rows={3}
                          className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                          style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                          placeholder="cinematic prompt details..."
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Change Image</label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const src = await upload("gallery", f);
                            if (!src) return;
                            const next = structuredClone(content);
                            if (!next.visualizerPresets) return;
                            next.visualizerPresets[idx].image = src;
                            setContent(next);
                            e.target.value = "";
                          }}
                          className="block w-full text-xs mt-1"
                        />
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </section>
          )}

          </div>
        </div>
      )}

      </div>
{/* Preview Modal */}
{previewOpen && content && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <div className="relative w-full max-w-4xl rounded-lg overflow-hidden bg-black">
      <button className="absolute top-2 right-2 text-white text-xl" onClick={() => setPreviewOpen(false)}>✕</button>
      <HeroBackground config={content.heroBackground || PUBLIC_DEFAULT_SITE_CONTENT.heroBackground} />
      <Hero />
    </div>
  </div>
)}
    </div>
  );
}

