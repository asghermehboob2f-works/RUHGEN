"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import type { GalleryCategory, SiteContent } from "@/lib/site-content-types";

function adminEmailAllowed(userEmail: string | null) {
  const allow = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
  if (!allow) return true;
  return !!userEmail && userEmail.trim().toLowerCase() === allow;
}

export default function DashboardContentPage() {
  const { user, ready } = useAuth();
  const reduce = useReducedMotion();
  const [secret, setSecret] = useState("");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<string>("");
  const canUse = useMemo(() => adminEmailAllowed(user?.email ?? null), [user?.email]);

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
      <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20" style={{ color: "var(--text-muted)" }}>
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Sign in required</p>
        <p className="mt-2">Go to <Link className="text-[#00D4FF] hover:underline" href="/sign-in?next=/dashboard/content">sign in</Link>.</p>
      </div>
    );
  }

  if (!canUse) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20" style={{ color: "var(--text-muted)" }}>
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Access denied</p>
        <p className="mt-2">This editor is restricted to <span className="font-mono text-[#00D4FF]">{process.env.NEXT_PUBLIC_ADMIN_EMAIL}</span>.</p>
      </div>
    );
  }

  const adminHeaders = (extra: Record<string, string> = {}) => {
    const s = secret.trim();
    return {
      ...extra,
      "x-admin-secret": s,
      ...(s ? { Authorization: `Bearer ${s}` } : {}),
    };
  };

  const save = async () => {
    if (!content) return;
    if (!secret.trim()) {
      setStatus("Save failed: Enter the same Admin secret as ADMIN_SECRET in .env.local (then restart dev server).");
      return;
    }
    setStatus("");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: adminHeaders({ "content-type": "application/json" }),
      body: JSON.stringify(content),
    });
    const data = await res.json();
    if (!data.ok && data.error === "ADMIN_SECRET is not configured.") {
      setStatus("Save failed: Create .env.local in the project root with ADMIN_SECRET=your_secret and restart npm run dev. Do not rely on .env.example alone.");
      return;
    }
    setStatus(data.ok ? "Saved. Homepage updated." : `Save failed: ${data.error || "Unknown error"}`);
  };

  const upload = async (folder: "hero" | "gallery" | "img" | "showcase", file: File) => {
    if (!secret.trim()) {
      setStatus("Upload failed: Enter Admin secret first (must match ADMIN_SECRET in .env.local).");
      return null;
    }
    setStatus("");
    const form = new FormData();
    form.set("folder", folder);
    form.set("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: adminHeaders(),
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
    <div className="mesh-section relative flex-1 overflow-x-clip px-4 pb-24 pt-[max(5.5rem,env(safe-area-inset-top)+4.5rem)] sm:px-6 sm:pt-28 lg:px-10">
      <div className="relative mx-auto max-w-[1100px]">
        <div className="flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>Admin</p>
            <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Content editor
            </h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
              Hero, gallery, and Spotlight carousel (short trial videos + copy). Landscape images and ~3s
              clips work best.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
              Admin secret
            </label>
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Set ADMIN_SECRET in .env.local"
              className="min-h-[44px] w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B61FF]/40 sm:w-[360px]"
              style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
            />
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}
              >
                Back
              </Link>
              <motion.button
                type="button"
                whileTap={reduce ? undefined : { scale: 0.98 }}
                onClick={save}
                disabled={!content}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-semibold text-white btn-gradient disabled:opacity-60"
              >
                Save changes
              </motion.button>
            </div>
            {status && <p className="text-xs" style={{ color: status.startsWith("Save failed") || status.startsWith("Upload failed") ? "#FF2E9A" : "var(--text-muted)" }}>{status}</p>}
          </div>
        </div>

        {!content ? (
          <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>Loading content…</div>
        ) : (
          <div className="mt-10 grid gap-10">
            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Hero previews</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                These are the 4 landscape tiles in the Hero section.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {content.hero.previews.map((p, idx) => (
                  <div key={p.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
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

            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Showcase gallery</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                All tiles are forced to landscape for a consistent look.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {content.gallery.items.map((it, idx) => (
                  <div key={it.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
                    <div className="relative aspect-video overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
                      <Image src={it.src} alt={it.alt} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 33vw" />
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

            <section className="rounded-2xl border p-5 sm:p-7" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
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
                  <div key={slide.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
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

