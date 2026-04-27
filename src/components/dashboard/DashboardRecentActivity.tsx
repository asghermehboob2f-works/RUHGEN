"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
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
import { readRecentGenerations, type RecentGeneration } from "@/lib/studio-activity";

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

  useEffect(() => {
    const onFocus = () => setFocusBump((n) => n + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname / focusBump intentionally refresh reads from localStorage
  const recent = useMemo(() => readRecentGenerations(userId), [userId, pathname, focusBump]);

  const sharedUrlSet = useMemo(
    () => new Set(myPosts.map((p) => p.mediaUrl)),
    [myPosts]
  );

  const loadMyPosts = useCallback(async () => {
    if (!readUserToken()) {
      setMyPosts([]);
      setPostsLoading(false);
      return;
    }
    setPostsLoading(true);
    setPostsError(null);
    try {
      const posts = await fetchMyPosts();
      setMyPosts(posts);
    } catch (e) {
      setPostsError(e instanceof Error ? e.message : "Couldn't load your posts.");
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyPosts();
  }, [loadMyPosts, focusBump]);

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
        className="rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: "var(--border-subtle)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--soft-black) 100%, transparent) 0%, color-mix(in srgb, var(--deep-black) 100%, transparent) 100%)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: "var(--glass)" }}
            >
              <History className="h-5 w-5" style={{ color: "var(--text-muted)" }} strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Recent activity
              </h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {recent.length > 0
                  ? "Pick a generation to share it with the community."
                  : "Your generations will appear here once you start creating."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={shareBlank}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
              boxShadow: "0 12px 32px -10px rgba(123,97,255,0.55)",
            }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            Share to community
          </button>
        </div>

        {recent.length === 0 ? (
          <div
            className="mt-6 flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-10 text-center"
            style={{
              borderColor: "var(--border-subtle)",
              background: "color-mix(in srgb, var(--deep-black) 40%, transparent)",
            }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl border"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            >
              <Wand2 className="h-7 w-7 opacity-50" style={{ color: "var(--primary-purple)" }} strokeWidth={1.5} />
            </span>
            <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
              No generations yet. Open a studio and your recent work will show up here.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/dashboard/generate/image"
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--primary-cyan)] underline-offset-4 hover:underline"
              >
                Image studio
              </Link>
              <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
                ·
              </span>
              <Link
                href="/dashboard/generate/video"
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--primary-cyan)] underline-offset-4 hover:underline"
              >
                Video studio
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((item, idx) => {
              const alreadyShared = sharedUrlSet.has(item.previewUrl);
              return (
                <motion.li
                  key={item.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : 0.04 * idx }}
                  className="flex flex-col overflow-hidden rounded-2xl border transition-colors hover:border-[color-mix(in_srgb,var(--primary-cyan)_35%,var(--border-subtle))]"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "color-mix(in srgb, var(--deep-black) 55%, transparent)",
                  }}
                >
                  <Link
                    href={item.href}
                    className="group block"
                    aria-label={`Open ${item.kind} studio`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                      {item.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote generation URLs; not in next/image config
                        <img
                          src={item.previewUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <video
                          src={item.previewUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      )}
                      <span
                        className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: "color-mix(in srgb, var(--soft-black) 88%, transparent)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {item.kind === "image" ? (
                          <ImageIcon className="h-3 w-3" strokeWidth={2} />
                        ) : (
                          <Video className="h-3 w-3" strokeWidth={2} />
                        )}
                        {item.kind === "image" ? "Image" : "Video"}
                      </span>
                      {alreadyShared && (
                        <span
                          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
                          }}
                          title="Already shared to community"
                        >
                          <Sparkles className="h-3 w-3" strokeWidth={2} />
                          Shared
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p
                      className="line-clamp-2 text-left text-xs leading-snug"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {item.prompt}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-cyan)]"
                      >
                        Open
                        <ArrowRight className="h-3 w-3" strokeWidth={2} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => shareGeneration(item)}
                        className="inline-flex min-h-[28px] items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold transition-colors"
                        style={{
                          borderColor: alreadyShared
                            ? "color-mix(in srgb, var(--primary-cyan) 35%, var(--border-subtle))"
                            : "var(--border-subtle)",
                          background: alreadyShared
                            ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--soft-black))"
                            : "var(--glass)",
                          color: "var(--text-primary)",
                        }}
                        aria-label={alreadyShared ? "Share again" : "Share to community"}
                      >
                        <Send className="h-3 w-3" strokeWidth={2} />
                        {alreadyShared ? "Share again" : "Share"}
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 border-t pt-6" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4
                className="font-display text-base font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Your community posts
              </h4>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Track engagement on work you've shared with the feed.
              </p>
            </div>
            <Link
              href="/community"
              className="text-xs font-semibold text-[var(--primary-cyan)] underline-offset-4 hover:underline"
            >
              Open community →
            </Link>
          </div>
          {postsLoading ? (
            <div
              className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-xs"
              style={{
                borderColor: "var(--border-subtle)",
                background: "color-mix(in srgb, var(--deep-black) 40%, transparent)",
                color: "var(--text-muted)",
              }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your posts…
            </div>
          ) : postsError ? (
            <p className="mt-4 text-xs" style={{ color: "var(--text-subtle)" }}>
              {postsError}
            </p>
          ) : myPosts.length === 0 ? (
            <p
              className="mt-4 rounded-2xl border border-dashed px-4 py-6 text-center text-sm"
              style={{
                borderColor: "var(--border-subtle)",
                background: "color-mix(in srgb, var(--deep-black) 40%, transparent)",
                color: "var(--text-muted)",
              }}
            >
              You haven't shared anything yet. Pick a generation above and tap{" "}
              <span className="font-semibold text-[var(--text-primary)]">Share</span>.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myPosts.slice(0, 6).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border p-2.5"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "color-mix(in srgb, var(--deep-black) 55%, transparent)",
                  }}
                >
                  <Link
                    href={`/community#${p.id}`}
                    className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl"
                  >
                    {p.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URL
                      <img
                        src={p.mediaUrl}
                        alt={p.title || ""}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <video
                        src={p.mediaUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p
                      className="line-clamp-1 text-sm font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {p.title || p.prompt || "Untitled"}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-subtle)" }}>
                      {timeAgo(p.createdAt)}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-3 text-[11px] font-semibold tabular-nums"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span>♥ {p.likes}</span>
                      <span>💬 {p.comments}</span>
                      <span>👁 {p.views}</span>
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
