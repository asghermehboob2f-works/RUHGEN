"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import HeroBackground from "@/components/HeroBackground";
import Hero from "@/components/Hero";
import { motion, useReducedMotion } from "framer-motion";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import type { SiteContent } from "@/backend/site-content/types";
import { PUBLIC_DEFAULT_SITE_CONTENT } from "@/backend/site-content/default-content";
import { UploadCloud, Plus } from "lucide-react";

export default function DashboardContentPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"hero" | "homepage" | "visualizer" | "features" | "pricing" | "socials">("hero");

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
        if (!data.featuresCalibration) {
          data.featuresCalibration = PUBLIC_DEFAULT_SITE_CONTENT.featuresCalibration;
        }
        if (!data.socialLinks) {
          data.socialLinks = PUBLIC_DEFAULT_SITE_CONTENT.socialLinks || [];
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
                Demo Page
                {activeTab === "visualizer" && (
                  <motion.div layoutId="adminActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("features")}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0"
                style={{ color: activeTab === "features" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                Features Page
                {activeTab === "features" && (
                  <motion.div layoutId="adminActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pricing")}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0"
                style={{ color: activeTab === "pricing" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                Pricing Page
                {activeTab === "pricing" && (
                  <motion.div layoutId="adminActiveTabLine" className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-[var(--primary-purple)] to-[var(--primary-cyan)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("socials")}
                className="pb-3.5 text-sm font-bold uppercase tracking-wider transition-all relative outline-none shrink-0"
                style={{ color: activeTab === "socials" ? "var(--text-primary)" : "var(--text-subtle)" }}
              >
                Social Links
                {activeTab === "socials" && (
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

          {/* Demo Page Presets Editor */}
          {activeTab === "visualizer" && (
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Demo Page Photos</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Customize the interactive visual cards displayed in the Demo page hero sandbox.</p>
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
                        <label className="mt-1 flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/5 text-[11px] font-bold text-white transition-colors hover:bg-white/10">
                          <UploadCloud className="h-4 w-4 text-[#00D4FF]" />
                          Upload Image
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
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Features Page Calibration Photos Editor */}
          {activeTab === "features" && (
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Features Page Photos</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Customize the high-fidelity photographic presets used in the Features page Aspect Calibration Rig.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {(["cinema", "landscape", "square", "portrait"] as const).map((key) => {
                  const currentImage = content.featuresCalibration?.[key] || "";
                  const label = key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <div key={key} className="editor-card p-4 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#0a0a0d]">
                      <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                        <span className="text-xs font-mono text-[#7B61FF] uppercase">{label} Preset</span>
                      </div>

                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
                        {currentImage ? (
                          <Image src={currentImage} alt={label} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                            No background image
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Aspect Ratio Preset URL</label>
                          <input
                            value={currentImage}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.featuresCalibration) {
                                next.featuresCalibration = { cinema: "", landscape: "", square: "", portrait: "" };
                              }
                              next.featuresCalibration[key] = e.target.value;
                              setContent(next);
                            }}
                            className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Change Image</label>
                          <label className="mt-1 flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/5 text-[11px] font-bold text-white transition-colors hover:bg-white/10">
                            <UploadCloud className="h-4 w-4 text-[#00D4FF]" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                const src = await upload("homepage", f);
                                if (!src) return;
                                const next = structuredClone(content);
                                if (!next.featuresCalibration) {
                                  next.featuresCalibration = { cinema: "", landscape: "", square: "", portrait: "" };
                                }
                                next.featuresCalibration[key] = src;
                                setContent(next);
                                e.target.value = "";
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Pricing Page Plans Editor */}
          {activeTab === "pricing" && (
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Pricing Plans</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Manage pricing packages, credits, and active features displayed on the pricing page.</p>
                </div>
                <motion.button
                  type="button"
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={() => {
                    const next = structuredClone(content);
                    if (!next.plans) {
                      next.plans = [];
                    }
                    next.plans.push({
                      id: `plan-${Date.now()}`,
                      name: "New Tier",
                      monthlyPrice: 299,
                      yearlyPrice: 2899,
                      credits: 300,
                      features: ["Feature Description 1", "Feature Description 2"],
                      cta: "Get Started",
                      available: true
                    });
                    setContent(next);
                    setStatus("");
                  }}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-white/5 active:scale-95"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--deep-black)",
                    color: "var(--text-primary)",
                  }}
                >
                  Add Plan Tier
                </motion.button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {content.plans?.map((p, idx) => (
                  <div key={p.id || idx} className="editor-card p-4 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#0a0a0d]">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-xs font-mono text-[#00D4FF]">Plan Tier {idx + 1}</span>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const next = structuredClone(content);
                            if (!next.plans) return;
                            const tmp = next.plans[idx - 1];
                            next.plans[idx - 1] = next.plans[idx];
                            next.plans[idx] = tmp;
                            setContent(next);
                          }}
                          className="text-xs text-neutral-400 hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === (content.plans?.length || 0) - 1}
                          onClick={() => {
                            const next = structuredClone(content);
                            if (!next.plans) return;
                            const tmp = next.plans[idx + 1];
                            next.plans[idx + 1] = next.plans[idx];
                            next.plans[idx] = tmp;
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
                            if (!next.plans) return;
                            if (next.plans.length <= 1) {
                              setStatus("You must keep at least one plan.");
                              return;
                            }
                            next.plans.splice(idx, 1);
                            setContent(next);
                            setStatus("");
                          }}
                          className="text-xs font-semibold text-[#FF2E9A] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Plan Name</label>
                        <input
                          value={p.name}
                          onChange={(e) => {
                            const next = structuredClone(content);
                            if (!next.plans) return;
                            next.plans[idx].name = e.target.value;
                            setContent(next);
                          }}
                          className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                          style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                          placeholder="e.g. Pro"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Monthly Price (₹)</label>
                          <input
                            type="number"
                            value={p.monthlyPrice}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.plans) return;
                              next.plans[idx].monthlyPrice = Number(e.target.value);
                              setContent(next);
                            }}
                            className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Yearly Price (₹)</label>
                          <input
                            type="number"
                            value={p.yearlyPrice}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.plans) return;
                              next.plans[idx].yearlyPrice = Number(e.target.value);
                              setContent(next);
                            }}
                            className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Credits</label>
                          <input
                            type="number"
                            value={p.credits}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.plans) return;
                              next.plans[idx].credits = Number(e.target.value);
                              setContent(next);
                            }}
                            className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Badge Label</label>
                          <input
                            value={p.badge || ""}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.plans) return;
                              next.plans[idx].badge = e.target.value;
                              setContent(next);
                            }}
                            className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                            placeholder="e.g. Most Popular"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">CTA Text</label>
                        <input
                          value={p.cta}
                          onChange={(e) => {
                            const next = structuredClone(content);
                            if (!next.plans) return;
                            next.plans[idx].cta = e.target.value;
                            setContent(next);
                          }}
                          className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                          style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                          placeholder="e.g. Upgrade to Pro"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Plan Description (for Custom plan)</label>
                        <textarea
                          value={p.description || ""}
                          onChange={(e) => {
                            const next = structuredClone(content);
                            if (!next.plans) return;
                            next.plans[idx].description = e.target.value;
                            setContent(next);
                          }}
                          rows={2}
                          className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                          style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                          placeholder="e.g. Tell us what you need..."
                        />
                      </div>

                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id={`available-${idx}`}
                          checked={p.available}
                          onChange={(e) => {
                            const next = structuredClone(content);
                            if (!next.plans) return;
                            next.plans[idx].available = e.target.checked;
                            setContent(next);
                          }}
                          className="rounded border-neutral-700 bg-neutral-900 text-[#7B61FF]"
                        />
                        <label htmlFor={`available-${idx}`} className="text-xs font-semibold select-none cursor-pointer" style={{ color: "var(--text-primary)" }}>Available for users</label>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Features List</label>
                          <button
                            type="button"
                            onClick={() => {
                              const next = structuredClone(content);
                              if (!next.plans) return;
                              next.plans[idx].features.push("New Feature");
                              setContent(next);
                            }}
                            className="text-[10px] font-bold text-[#00D4FF] hover:underline"
                          >
                            + Add Feature
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {p.features.map((f, fIdx) => (
                            <div key={fIdx} className="flex gap-1.5 items-center">
                              <input
                                value={f}
                                onChange={(e) => {
                                  const next = structuredClone(content);
                                  if (!next.plans) return;
                                  next.plans[idx].features[fIdx] = e.target.value;
                                  setContent(next);
                                }}
                                className="min-h-[30px] flex-1 rounded border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#7B61FF]/40"
                                style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = structuredClone(content);
                                  if (!next.plans) return;
                                  next.plans[idx].features.splice(fIdx, 1);
                                  setContent(next);
                                }}
                                className="text-[10px] text-[#FF2E9A] hover:underline shrink-0 px-1"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Social Media Links Editor */}
          {activeTab === "socials" && (
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Social Media Links</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Manage official platform social links displayed dynamically across the footer and contact pages.</p>
                </div>
                <motion.button
                  type="button"
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={() => {
                    const next = structuredClone(content);
                    if (!next.socialLinks) {
                      next.socialLinks = [];
                    }
                    next.socialLinks.push({
                      id: `soc-${Date.now()}`,
                      platform: "New Platform",
                      url: "https://",
                      enabled: true
                    });
                    setContent(next);
                    setStatus("");
                  }}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-white/5 active:scale-95 flex items-center gap-1.5"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--deep-black)",
                    color: "var(--text-primary)",
                  }}
                >
                  <Plus className="h-4 w-4 text-[#00D4FF]" /> Add Social Link
                </motion.button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {content.socialLinks?.map((soc, idx) => {
                  const isValidUrl = /^https?:\/\/.+/i.test(soc.url.trim());
                  return (
                    <div key={soc.id || idx} className="editor-card p-4 flex flex-col gap-3 rounded-xl border border-white/5 bg-[#0a0a0d]">
                      <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                        <span className="text-xs font-mono text-[#00D4FF]">Link {idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const next = structuredClone(content);
                              if (!next.socialLinks) return;
                              const tmp = next.socialLinks[idx - 1];
                              next.socialLinks[idx - 1] = next.socialLinks[idx];
                              next.socialLinks[idx] = tmp;
                              setContent(next);
                            }}
                            className="text-xs text-neutral-400 hover:text-white disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={idx === (content.socialLinks?.length || 0) - 1}
                            onClick={() => {
                              const next = structuredClone(content);
                              if (!next.socialLinks) return;
                              const tmp = next.socialLinks[idx + 1];
                              next.socialLinks[idx + 1] = next.socialLinks[idx];
                              next.socialLinks[idx] = tmp;
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
                              if (!next.socialLinks) return;
                              next.socialLinks.splice(idx, 1);
                              setContent(next);
                              setStatus("");
                            }}
                            className="text-xs font-semibold text-[#FF2E9A] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-2.5">
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Platform Name</label>
                          <input
                            value={soc.platform}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.socialLinks) return;
                              next.socialLinks[idx].platform = e.target.value;
                              setContent(next);
                            }}
                            className="min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                            style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                            placeholder="e.g. Instagram, X / Twitter, Discord"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">URL Address</label>
                            <span className={`text-[9px] font-semibold ${isValidUrl ? "text-[#5eead4]" : "text-[#fb7185]"}`}>
                              {isValidUrl ? "Valid URL" : "Invalid (requires http:// or https://)"}
                            </span>
                          </div>
                          <input
                            value={soc.url}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.socialLinks) return;
                              next.socialLinks[idx].url = e.target.value;
                              setContent(next);
                            }}
                            className={`min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 ${
                              isValidUrl ? "border-white/10 focus:ring-[#7B61FF]/40" : "border-rose-500/50 focus:ring-rose-500/40"
                            }`}
                            style={{ background: "var(--deep-black)", color: "var(--text-primary)" }}
                            placeholder="https://instagram.com/yourhandle"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`soc-enabled-${idx}`}
                            checked={soc.enabled}
                            onChange={(e) => {
                              const next = structuredClone(content);
                              if (!next.socialLinks) return;
                              next.socialLinks[idx].enabled = e.target.checked;
                              setContent(next);
                            }}
                            className="rounded border-neutral-700 bg-neutral-900 text-[#7B61FF]"
                          />
                          <label htmlFor={`soc-enabled-${idx}`} className="text-xs font-semibold select-none cursor-pointer" style={{ color: "var(--text-primary)" }}>
                            Visible on Public Site
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

