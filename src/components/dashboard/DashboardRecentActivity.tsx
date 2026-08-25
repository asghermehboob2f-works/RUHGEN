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
        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--rich-black)] p-5 sm:p-6 lg:p-7 shadow-sm transition-colors duration-200"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)]"
            >
              <History className="h-4 w-4" strokeWidth={1.75} />
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
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] px-3.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--glass-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {copiedAll ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied all prompts!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span>Copy all</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={shareBlank}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-3.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--glass-elevated)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Share to community
            </button>
          </div>
        </div>

        {recentLoading ? (
          <div
            className="mt-6 flex min-h-[140px] items-center justify-center gap-2.5 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--glass)] px-4 py-8 text-center text-xs text-[var(--text-muted)]"
          >
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-primary)]" />
            <span>Loading recent activity…</span>
          </div>
        ) : recent.length === 0 ? (
          <div
            className="mt-6 flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--glass)] px-4 py-8 text-center"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] text-[var(--text-primary)]"
            >
              <Wand2 className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">
              No generations yet. Open a studio and your recent prompts will show up here.
            </p>
            <div className="mt-3.5 flex items-center justify-center gap-3">
              <Link
                href="/dashboard/generate/image"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                Image studio
              </Link>
              <span className="text-[10px] text-[var(--text-subtle)]">·</span>
              <Link
                href="/dashboard/generate/video"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                Video studio
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-2.5">
            {recent.slice(0, visibleCount).map((item, idx) => {
              const alreadyShared = sharedUrlSet.has(item.previewUrl);
              const isCopied = copiedId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : 0.04 * idx }}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] p-3.5 transition-all duration-200 hover:border-[var(--border-subtle)] hover:bg-[var(--glass-elevated)]"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--glass)] text-[var(--text-muted)]"
                      title={item.kind === "image" ? "Image Prompt" : "Video Prompt"}
                    >
                      {item.kind === "image" ? (
                        <ImageIcon className="h-3.5 w-3.5" />
                      ) : (
                        <Video className="h-3.5 w-3.5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="max-h-24 overflow-y-auto pr-1 select-all whitespace-pre-wrap [scrollbar-width:thin]">
                        <p className="text-xs sm:text-sm font-medium leading-relaxed text-[var(--text-primary)]">
                          {item.prompt}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-subtle)] font-medium">
                        <span className="uppercase tracking-wider text-[var(--text-muted)]">{item.kind} workspace</span>
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
                      className="inline-flex min-h-[30px] items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--glass)] px-2.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--glass-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
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
                      className="inline-flex min-h-[30px] items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--glass)] px-2.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--glass-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      <span>Use</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => shareGeneration(item)}
                      className="inline-flex min-h-[30px] items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--glass)] px-2.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--glass-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <Send className="h-3 w-3 text-[var(--text-muted)]" strokeWidth={2} />
                      <span>{alreadyShared ? "Shared" : "Share"}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}

            <div className="flex justify-center gap-3 pt-3">
              {visibleCount > 4 && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(4)}
                  className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Show less
                </button>
              )}
              {recent.length > visibleCount && (
                <button
                  type="button"
                  onClick={loadMore}
                  className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass)] px-5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Load more
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
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
              className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              Open community →
            </Link>
          </div>

          {postsLoading ? (
            <div
              className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--glass)] px-4 py-5 text-xs text-[var(--text-muted)]"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-primary)]" /> Loading your posts…
            </div>
          ) : postsError ? (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {postsError}
            </p>
          ) : myPosts.length === 0 ? (
            <p
              className="mt-3 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--glass)] px-4 py-5 text-center text-xs text-[var(--text-muted)]"
            >
              You haven&apos;t shared anything yet. Pick a generation above and tap{" "}
              <span className="font-bold text-[var(--text-primary)]">Share</span>.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myPosts.slice(0, 6).map((p) => (
                <li
                  key={p.id}
                  className="group flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)] p-2.5 transition-all duration-200 hover:border-[var(--border-subtle)] hover:bg-[var(--glass-elevated)]"
                >
                  <Link
                    href={`/community#${p.id}`}
                    className="relative h-14 w-18 shrink-0 overflow-hidden rounded bg-[var(--deep-black)]"
                  >
                    {p.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URL
                      <img
                        src={p.mediaUrl}
                        alt={p.title || ""}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <video
                        src={p.mediaUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p
                      className="line-clamp-1 text-xs font-bold text-[var(--text-primary)] transition-colors duration-200"
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
                        <span className="text-rose-400">♥</span> {p.likes}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span>💬</span> {p.comments}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span>👁</span> {p.views}
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
