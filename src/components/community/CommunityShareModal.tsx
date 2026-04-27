"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ImageIcon,
  Link2,
  Loader2,
  Plus,
  Tag as TagIcon,
  Upload,
  Video as VideoIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  type CommunityKind,
  type CommunityPost,
  createPost,
} from "@/lib/community-api";
import { readRecentGenerations, type RecentGeneration } from "@/lib/studio-activity";

export type CommunityShareInitial = {
  mediaUrl?: string;
  kind?: CommunityKind;
  prompt?: string;
  title?: string;
  tags?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onShared?: (post: CommunityPost) => void;
  initial?: CommunityShareInitial;
  hideRecent?: boolean;
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;

function detectKindFromUrl(url: string): CommunityKind | null {
  const u = url.trim();
  if (!u) return null;
  if (VIDEO_EXT.test(u)) return "video";
  if (IMAGE_EXT.test(u)) return "image";
  return null;
}

function isValidUrl(value: string) {
  const v = value.trim();
  if (!v) return false;
  if (v.startsWith("/media/")) return true;
  return /^https:\/\//i.test(v) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(v);
}

export function CommunityShareModal({
  open,
  onClose,
  onShared,
  initial,
  hideRecent,
}: Props) {
  const { user, ready } = useAuth();
  const reduce = useReducedMotion();

  const [mediaUrl, setMediaUrl] = useState("");
  const [kind, setKind] = useState<CommunityKind>("image");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const titleId = "share-modal-title";

  const recent = useMemo<RecentGeneration[]>(() => {
    if (!user || hideRecent) return [];
    if (typeof window === "undefined") return [];
    return readRecentGenerations(user.id, 12);
  }, [user, hideRecent, open]);

  useEffect(() => {
    if (!open) return;
    setSuccess(false);
    setError(null);
    setSubmitting(false);
    setMediaUrl(initial?.mediaUrl || "");
    setKind(initial?.kind || (initial?.mediaUrl ? detectKindFromUrl(initial.mediaUrl) : null) || "image");
    setTitle(initial?.title || "");
    setPrompt(initial?.prompt || "");
    setTags(Array.isArray(initial?.tags) ? initial!.tags!.slice(0, 8) : []);
    setTagInput("");
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function selectRecent(g: RecentGeneration) {
    setMediaUrl(g.previewUrl);
    setKind(g.kind);
    setError(null);
    if (!prompt.trim()) setPrompt(g.prompt);
  }

  function commitTagInput(raw: string) {
    const parts = raw
      .split(/[,\n]/)
      .map((s) => s.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);
    if (parts.length === 0) return;
    setTags((prev) => {
      const next = [...prev];
      for (const p of parts) {
        const safe = p.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
        if (safe && !next.includes(safe) && next.length < 8) next.push(safe);
      }
      return next;
    });
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccess(false);
    if (!user) {
      setError("Sign in to share to the community.");
      return;
    }
    if (!isValidUrl(mediaUrl)) {
      setError("Paste an HTTPS media URL or pick a recent generation.");
      return;
    }
    if (prompt.trim().length < 2) {
      setError("Add a short description or prompt (2+ characters).");
      return;
    }
    const detected = detectKindFromUrl(mediaUrl);
    const finalKind: CommunityKind = detected || kind;
    setSubmitting(true);
    try {
      const post = await createPost({
        kind: finalKind,
        mediaUrl: mediaUrl.trim(),
        title: title.trim() || undefined,
        prompt: prompt.trim(),
        tags: [
          ...tags,
          ...tagInput
            .split(/[,\n]/)
            .map((s) => s.trim().toLowerCase().replace(/^#/, ""))
            .filter(Boolean),
        ],
      });
      setSuccess(true);
      onShared?.(post);
      window.setTimeout(() => onClose(), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    !submitting &&
    !!user &&
    isValidUrl(mediaUrl) &&
    prompt.trim().length >= 2;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="share-modal"
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
        >
          <button
            type="button"
            aria-label="Close share dialog"
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            className="relative flex max-h-[92dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-3xl border sm:rounded-3xl"
            style={{
              borderColor: "transparent",
              background:
                "linear-gradient(var(--soft-black), var(--soft-black)) padding-box, linear-gradient(135deg, rgba(123,97,255,0.5), rgba(0,212,255,0.3)) border-box",
              boxShadow: "0 40px 100px -30px rgba(0,0,0,0.6)",
            }}
            initial={reduce ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <header className="flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--text-subtle)" }}>
                  Community
                </p>
                <h2 id={titleId} className="font-display mt-0.5 text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>
                  Share your work
                </h2>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-primary)" }}
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {!ready ? (
                <div className="flex items-center justify-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : !user ? (
                <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}>
                  <p className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    Sign in to share
                  </p>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                    You need an account to publish work to the community feed.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/sign-in?next=/community"
                      onClick={onClose}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-semibold text-white"
                      style={{
                        background: "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
                      }}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/sign-up?next=/community"
                      onClick={onClose}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 text-sm font-semibold"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--glass)",
                        color: "var(--text-primary)",
                      }}
                    >
                      Create account
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  {!hideRecent && recent.length > 0 && (
                    <section>
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                        From your studio
                      </p>
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-1.5">
                        {recent.map((g) => {
                          const selected = mediaUrl === g.previewUrl;
                          return (
                            <button
                              type="button"
                              key={g.id}
                              onClick={() => selectRecent(g)}
                              className="group relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border transition-transform"
                              style={{
                                borderColor: selected
                                  ? "color-mix(in srgb, var(--primary-cyan) 65%, var(--border-subtle))"
                                  : "var(--border-subtle)",
                                background: "var(--deep-black)",
                                boxShadow: selected
                                  ? "0 0 0 2px color-mix(in srgb, var(--primary-cyan) 35%, transparent)"
                                  : undefined,
                              }}
                              aria-pressed={selected}
                            >
                              {g.kind === "image" ? (
                                // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URL
                                <img
                                  src={g.previewUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <video
                                  src={g.previewUrl}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  className="h-full w-full object-cover"
                                />
                              )}
                              <span
                                className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                                style={{ background: "rgba(0,0,0,0.55)" }}
                              >
                                {g.kind === "image" ? <ImageIcon className="h-2.5 w-2.5" /> : <VideoIcon className="h-2.5 w-2.5" />}
                                {g.kind}
                              </span>
                              {selected && (
                                <span
                                  className="absolute inset-0 flex items-center justify-center text-white"
                                  style={{ background: "color-mix(in srgb, var(--primary-cyan) 25%, rgba(0,0,0,0.55))" }}
                                >
                                  <Check className="h-5 w-5" strokeWidth={2.5} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  <section>
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 className="h-3 w-3" /> Media URL
                      </span>
                    </label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => {
                        setMediaUrl(e.target.value);
                        const det = detectKindFromUrl(e.target.value);
                        if (det) setKind(det);
                      }}
                      placeholder="https://… or /media/… (image or video URL)"
                      className="mt-2 w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-colors focus:border-[color-mix(in_srgb,var(--primary-cyan)_45%,var(--border-subtle))]"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--deep-black)",
                        color: "var(--text-primary)",
                      }}
                      required
                    />
                    <p className="mt-1.5 text-xs" style={{ color: "var(--text-subtle)" }}>
                      Use an HTTPS link from your studio output, or pick a recent one above.
                    </p>
                  </section>

                  <section className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                        Title <span className="font-normal normal-case opacity-70">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        maxLength={140}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give it a memorable name"
                        className="mt-2 w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-colors focus:border-[color-mix(in_srgb,var(--primary-cyan)_45%,var(--border-subtle))]"
                        style={{
                          borderColor: "var(--border-subtle)",
                          background: "var(--deep-black)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    <div className="flex shrink-0 items-end">
                      <div
                        role="radiogroup"
                        aria-label="Type"
                        className="inline-flex rounded-xl border p-1"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)" }}
                      >
                        {(["image", "video"] as CommunityKind[]).map((k) => {
                          const Icon = k === "image" ? ImageIcon : VideoIcon;
                          const active = kind === k;
                          return (
                            <button
                              key={k}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setKind(k)}
                              className="flex min-h-[40px] min-w-[78px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold capitalize transition-colors"
                              style={{
                                background: active
                                  ? "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)"
                                  : "transparent",
                                color: active ? "#fff" : "var(--text-muted)",
                              }}
                            >
                              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                              {k}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  <section>
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                      Prompt / description
                    </label>
                    <textarea
                      value={prompt}
                      maxLength={1200}
                      rows={4}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="What did you make? Drop the prompt or a note about the shot."
                      className="mt-2 w-full resize-y rounded-xl border px-3.5 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-[color-mix(in_srgb,var(--primary-cyan)_45%,var(--border-subtle))]"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--deep-black)",
                        color: "var(--text-primary)",
                      }}
                      required
                    />
                  </section>

                  <section>
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                      <span className="inline-flex items-center gap-1.5">
                        <TagIcon className="h-3 w-3" /> Tags <span className="font-normal normal-case opacity-70">(up to 8)</span>
                      </span>
                    </label>
                    <div
                      className="mt-2 flex min-h-[48px] flex-wrap items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors focus-within:border-[color-mix(in_srgb,var(--primary-cyan)_45%,var(--border-subtle))]"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--deep-black)",
                      }}
                    >
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold"
                          style={{
                            borderColor: "var(--border-subtle)",
                            background: "var(--glass)",
                            color: "var(--text-primary)",
                          }}
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                            aria-label={`Remove ${t}`}
                            className="opacity-60 transition-opacity hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            commitTagInput(tagInput);
                          } else if (e.key === "Backspace" && !tagInput) {
                            setTags((prev) => prev.slice(0, -1));
                          }
                        }}
                        onBlur={() => commitTagInput(tagInput)}
                        placeholder={tags.length === 0 ? "cinematic, portrait, neon" : "Add tag"}
                        className="min-w-[100px] flex-1 bg-transparent py-1 text-sm outline-none"
                        style={{ color: "var(--text-primary)" }}
                        disabled={tags.length >= 8}
                      />
                    </div>
                  </section>

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm"
                      style={{
                        borderColor: "color-mix(in srgb, #ff5d8f 50%, var(--border-subtle))",
                        background: "color-mix(in srgb, #ff2e9a 10%, var(--deep-black))",
                        color: "color-mix(in srgb, #ff8fb6 70%, var(--text-primary))",
                      }}
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div
                      className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm"
                      style={{
                        borderColor: "color-mix(in srgb, #34d399 50%, var(--border-subtle))",
                        background: "color-mix(in srgb, #34d399 10%, var(--deep-black))",
                        color: "color-mix(in srgb, #6ee7b7 70%, var(--text-primary))",
                      }}
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Posted! Your work is now live in the feed.</span>
                    </div>
                  )}

                  <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--glass)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white transition-transform disabled:cursor-not-allowed disabled:opacity-60 [&:not(:disabled):hover]:scale-[1.02] [&:not(:disabled):active]:scale-[0.99]"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
                        boxShadow: "0 18px 40px -12px rgba(123,97,255,0.55)",
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Sharing…
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" strokeWidth={2} /> Share to community
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CommunityShareTrigger({
  initial,
  className,
  children,
}: {
  initial?: CommunityShareInitial;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors"
        }
        style={
          className
            ? undefined
            : {
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-primary)",
              }
        }
      >
        {children ?? (
          <>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} /> Share
          </>
        )}
      </button>
      <CommunityShareModal open={open} onClose={() => setOpen(false)} initial={initial} />
    </>
  );
}
