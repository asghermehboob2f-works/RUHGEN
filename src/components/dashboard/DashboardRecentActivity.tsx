"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  History,
  Image as ImageIcon,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Video,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CommunityShareModal,
  type CommunityShareInitial,
} from "@/components/community/CommunityShareModal";
import { fetchMyPosts, type CommunityPost } from "@/lib/community-api";
import { readUserToken } from "@/lib/auth-storage";
import { fetchRecentGenerations, type RecentGeneration } from "@/lib/studio-activity";

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function DashboardRecentActivity({ userId }: { userId: string }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [focusBump, setFocusBump] = useState(0);
  const [share, setShare] = useState<CommunityShareInitial | null>(null);
  const [myPosts, setMyPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  // States for prompt viewing, copying, and paginated load more
  const [visibleCount, setVisibleCount] = useState(4);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const [recent, setRecent] = useState<RecentGeneration[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    const onFocus = () => setFocusBump((n) => n + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadRecent() {
      setRecentLoading(true);
      const data = await fetchRecentGenerations(100);
      if (active) {
        setRecent(data);
        setRecentLoading(false);
      }
    }
    void loadRecent();
    return () => {
      active = false;
    };
  }, [userId, pathname, focusBump]);

  const sharedUrlSet = useMemo(
    () => new Set(myPosts.map((p) => p.mediaUrl)),
    [myPosts]
  );

  useEffect(() => {
    let active = true;
    async function load() {
      if (!readUserToken()) {
        if (active) {
          setMyPosts([]);
          setPostsLoading(false);
        }
        return;
      }
      try {
        const posts = await fetchMyPosts();
        if (active) setMyPosts(posts);
      } catch (e) {
        if (active) setPostsError(e instanceof Error ? e.message : "Couldn't load your posts.");
      } finally {
        if (active) setPostsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [focusBump]);

  const copyPrompt = useCallback(async (prompt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  }, []);

  const copyAllPrompts = useCallback(async () => {
    try {
      const allText = recent.map((item) => item.prompt).join("\n\n");
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // ignore
    }
  }, [recent]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 4);
  }, []);

  function shareGeneration(g: RecentGeneration) {
    setShare({ mediaUrl: g.previewUrl, kind: g.kind, prompt: g.prompt });
  }

  function shareBlank() {
    setShare({});
  }

  function handleShared(post: CommunityPost) {
    setMyPosts((prev) => [post, ...prev.filter((p) => p.id !== post.id)]);
  }

  return (
    <>
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.25 }}
        className="rounded-2xl border p-5 sm:p-6 lg:p-7"
        style={{
          borderColor: "var(--border-subtle)",
          background:
            "linear-gradient(180deg, var(--soft-black) 0%, rgba(255,255,255,0.01) 100%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg border"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
              }}
            >
              <History className="h-4.5 w-4.5 text-[var(--primary-cyan)]" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                Recent prompts
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {recent.length > 0
                  ? "Quickly copy, reuse, or share your recent workspace prompts."
                  : "Your prompts will appear here once you start generating."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {recent.length > 0 && (
              <button
                type="button"
                onClick={copyAllPrompts}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-4.5 text-xs font-semibold transition-all hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  color: "var(--text-primary)",
                }}
              >
                {copiedAll ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied all prompts!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[var(--primary-cyan)]" />
                    <span>Copy all</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={shareBlank}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
                boxShadow: "0 8px 24px -8px rgba(123,97,255,0.45)",
              }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Share to community
            </button>
          </div>
        </div>

        {recentLoading ? (
          <div
            className="mt-6 flex min-h-[140px] items-center justify-center gap-2.5 rounded-xl border border-dashed px-4 py-8 text-center text-xs text-[var(--text-muted)]"
            style={{
              borderColor: "var(--border-subtle)",
              background: "color-mix(in srgb, var(--deep-black) 40%, transparent)",
            }}
          >
            <Loader2 className="h-4 w-4 animate-spin text-[var(--primary-cyan)]" />
            <span>Loading recent activity…</span>
          </div>
        ) : recent.length === 0 ? (
          <div
            className="mt-6 flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center"
            style={{
              borderColor: "var(--border-subtle)",
              background: "color-mix(in srgb, var(--deep-black) 40%, transparent)",
            }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl border"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            >
              <Wand2 className="h-6 w-6 opacity-60 text-[var(--primary-purple)]" strokeWidth={1.75} />
            </span>
            <p className="mt-3.5 max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">
              No generations yet. Open a studio and your recent prompts will show up here.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/dashboard/generate/image"
                className="text-xs font-bold uppercase tracking-wider text-[var(--primary-cyan)] transition-colors hover:text-white"
              >
                Image studio
              </Link>
              <span className="text-[10px] text-[var(--text-subtle)]">·</span>
              <Link
                href="/dashboard/generate/video"
                className="text-xs font-bold uppercase tracking-wider text-[var(--primary-cyan)] transition-colors hover:text-white"
              >
                Video studio
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {recent.slice(0, visibleCount).map((item, idx) => {
              const alreadyShared = sharedUrlSet.has(item.previewUrl);
              const isCopied = copiedId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : 0.04 * idx }}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-300 hover:border-brand-cyan/35"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "color-mix(in srgb, var(--deep-black) 55%, transparent)",
                  }}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card/40"
                      title={item.kind === "image" ? "Image Prompt" : "Video Prompt"}
                    >
                      {item.kind === "image" ? (
                        <ImageIcon className="h-4 w-4 text-[var(--primary-purple)]" />
                      ) : (
                        <Video className="h-4 w-4 text-[var(--primary-cyan)]" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="max-h-24 overflow-y-auto pr-1 select-all whitespace-pre-wrap [scrollbar-width:thin] scrollbar-thumb-[var(--border-subtle)]">
                        <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">
                          {item.prompt}
                        </p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-subtle)] font-medium">
                        <span className="uppercase tracking-wider text-[var(--primary-cyan)]">{item.kind} workspace</span>
                        {item.createdAt && (
                          <>
                            <span>·</span>
                            <span>{timeAgo(item.createdAt)}</span>
                          </>
                        )}
                        {alreadyShared && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400 font-semibold">Shared</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => copyPrompt(item.prompt, item.id)}
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 text-xs font-semibold text-[var(--text-primary)] transition-all hover:bg-card/90 active:scale-[0.98]"
                      title="Copy prompt"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400 animate-in fade-in zoom-in-75 duration-200" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`${item.href}?prompt=${encodeURIComponent(item.prompt)}`}
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 text-xs font-semibold text-[var(--text-primary)] transition-all hover:bg-card/90 active:scale-[0.98]"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-[var(--primary-purple)]" />
                      <span>Use</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => shareGeneration(item)}
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all duration-300"
                      style={{
                        borderColor: alreadyShared
                          ? "color-mix(in srgb, var(--primary-cyan) 35%, var(--border-subtle))"
                          : "var(--border-subtle)",
                        background: alreadyShared
                          ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--soft-black))"
                          : "var(--glass)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <Send className="h-3 w-3" strokeWidth={2.5} />
                      <span>{alreadyShared ? "Shared" : "Share"}</span>
                    </button>
                  </div>
                </motion.div>
              )
            })}

            <div className="flex justify-center gap-3 pt-4">
              {visibleCount > 4 && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(4)}
                  className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card/45 px-6 text-xs font-semibold text-[var(--text-primary)] transition-all hover:bg-card/85 active:scale-[0.98]"
                >
                  Show less
                </button>
              )}
              {recent.length > visibleCount && (
                <button
                  type="button"
                  onClick={loadMore}
                  className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card/45 px-6 text-xs font-semibold text-[var(--text-primary)] transition-all hover:bg-card/85 active:scale-[0.98]"
                >
                  Load more
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 border-t pt-6" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="font-display text-sm font-bold text-[var(--text-primary)]">
                Your community posts
              </h4>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Track engagement on work you&apos;ve shared with the feed.
              </p>
            </div>
            <Link
              href="/community"
              className="text-xs font-bold uppercase tracking-wider text-[var(--primary-cyan)] transition-colors hover:text-white"
            >
              Open community →
            </Link>
          </div>

          {postsLoading ? (
            <div
              className="mt-4 flex items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-xs text-[var(--text-muted)]"
              style={{
                borderColor: "var(--border-subtle)",
                background: "color-mix(in srgb, var(--deep-black) 40%, transparent)",
              }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--primary-cyan)]" /> Loading your posts…
            </div>
          ) : postsError ? (
            <p className="mt-4 text-xs text-[var(--text-subtle)]">
              {postsError}
            </p>
          ) : myPosts.length === 0 ? (
            <p
              className="mt-4 rounded-xl border border-dashed px-4 py-6 text-center text-xs text-[var(--text-muted)]"
              style={{
                borderColor: "var(--border-subtle)",
                background: "color-mix(in srgb, var(--deep-black) 40%, transparent)",
              }}
            >
              You haven&apos;t shared anything yet. Pick a generation above and tap{" "}
              <span className="font-bold text-[var(--text-primary)]">Share</span>.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myPosts.slice(0, 6).map((p) => (
                <li
                  key={p.id}
                  className="group flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-300 hover:border-brand-cyan/30"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "color-mix(in srgb, var(--deep-black) 55%, transparent)",
                  }}
                >
                  <Link
                    href={`/community#${p.id}`}
                    className="relative h-14 w-18 shrink-0 overflow-hidden rounded-lg bg-card/40"
                  >
                    {p.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URL
                      <img
                        src={p.mediaUrl}
                        alt={p.title || ""}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <video
                        src={p.mediaUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p
                      className="line-clamp-1 text-xs font-bold text-[var(--text-primary)] group-hover:text-white transition-colors duration-300"
                    >
                      {p.title || p.prompt || "Untitled"}
                    </p>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                      {timeAgo(p.createdAt)}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-2.5 text-[10px] font-bold tracking-tight tabular-nums text-[var(--text-muted)]"
                    >
                      <span className="flex items-center gap-0.5">
                        <span className="text-[var(--accent-pink)]">♥</span> {p.likes}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="text-[var(--primary-cyan)]">💬</span> {p.comments}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="text-[var(--primary-purple)]">👁</span> {p.views}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.section>

      <CommunityShareModal
        open={share !== null}
        onClose={() => setShare(null)}
        initial={share ?? undefined}
        onShared={handleShared}
      />
    </>
  );
}
