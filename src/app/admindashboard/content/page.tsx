"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import type { GalleryCategory, SiteContent } from "@/backend/site-content/types";

export default function DashboardContentPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/content", { cache: "no-store" });
        const data = (await res.json()) as SiteContent;
        if (!ok) return;
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

  const upload = async (folder: "hero" | "gallery" | "img" | "showcase", file: File) => {
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
          <div className="mt-10 grid gap-10">
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Hero previews</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                These are the 4 landscape tiles in the Hero section.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {content.hero.previews.map((p, idx) => (
                  <div key={p.id} className="editor-card p-3">
                    <div className="relative aspect-video overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
                      <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
                    </div>
                    <div className="mt-3 grid gap-2">
                      <input
                        value={p.prompt}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          next.hero.previews[idx].prompt = e.target.value;
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
                          const src = await upload("hero", f);
                          if (!src) return;
                          const next = structuredClone(content);
                          next.hero.previews[idx].src = src;
                          next.hero.previews[idx].alt = f.name;
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

            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    Spotlight slides
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
                    Homepage carousel (#showcase). Upload a short .mp4 or .webm (~3 seconds) plus a title and one-line description per card.
                  </p>
                </div>
                <motion.button
                  type="button"
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={() => {
                    if (!content) return;
                    const next = structuredClone(content);
                    next.showcase.slides.push({
                      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `show-${Date.now()}`,
                      title: "New capability",
                      caption: "Describe what users will see in this trial clip.",
                      videoSrc: "",
                    });
                    setContent(next);
                  }}
                  className="shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--soft-black)",
                    color: "var(--text-primary)",
                  }}
                >
                  Add slide
                </motion.button>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {content.showcase.slides.map((slide, idx) => (
                  <div key={slide.id} className="editor-card p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <p className="text-xs font-mono" style={{ color: "var(--text-subtle)" }}>{slide.id}</p>
                      <button
                        type="button"
                        className="shrink-0 text-xs font-semibold text-[#FF2E9A] hover:underline"
                        onClick={() => {
                          const next = structuredClone(content);
                          if (next.showcase.slides.length <= 1) {
                            setStatus("Keep at least one spotlight slide.");
                            return;
                          }
                          next.showcase.slides.splice(idx, 1);
                          setContent(next);
                          setStatus("");
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
                      {slide.videoSrc ? (
                        <video className="h-full w-full object-cover" src={slide.videoSrc} controls muted playsInline preload="metadata" />
                      ) : (
                        <div className="flex h-full min-h-[120px] items-center justify-center text-xs" style={{ color: "var(--text-muted)" }}>
                          No video yet
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <input
                        value={slide.title}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          next.showcase.slides[idx].title = e.target.value;
                          setContent(next);
                        }}
                        className="min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="Title (e.g. Face swap)"
                      />
                      <textarea
                        value={slide.caption}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          next.showcase.slides[idx].caption = e.target.value;
                          setContent(next);
                        }}
                        rows={3}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                        placeholder="One line under the card…"
                      />
                      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
                        Trial video (.mp4 / .webm, ~3s)
                      </label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const src = await upload("showcase", f);
                          if (!src) return;
                          const next = structuredClone(content);
                          next.showcase.slides[idx].videoSrc = src;
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
          </div>
        )}
      </div>
    </div>
  );
}

