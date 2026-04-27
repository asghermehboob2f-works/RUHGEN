"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CheckCheck,
  Clock,
  Copy,
  Crown,
  Eye,
  Flame,
  Heart,
  ImageIcon,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Play,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  Video as VideoIcon,
  Wand2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CommunityShareModal } from "@/components/community/CommunityShareModal";
import {
  type CommunityComment,
  type CommunityCreator,
  type CommunityKind,
  type CommunityPost,
  type CommunitySort,
  type CommunityStats,
  type CommunityTag,
  deletePost as apiDeletePost,
  deleteComment as apiDeleteComment,
  fetchComments,
  fetchCreators,
  fetchFeed,
  fetchMySaved,
  fetchStats,
  fetchTags,
  postComment,
  recordView,
  toggleLike,
  toggleSave,
} from "@/lib/community-api";
import { SITE_CONTAINER } from "@/lib/site-layout";

/* -------------------------------------------------------------------------- */
/*  Constants & helpers                                                       */
/* -------------------------------------------------------------------------- */

type FeedFilter = "all" | CommunityKind;

const TYPE_OPTIONS: { id: FeedFilter; label: string; icon: typeof LayoutGrid }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "video", label: "Videos", icon: VideoIcon },
];

const SORT_OPTIONS: { id: CommunitySort; label: string; icon: typeof Flame }[] = [
  { id: "trending", label: "Trending", icon: Flame },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "top", label: "Top", icon: Trophy },
];

const REFRESH_MS = 60_000;
const SEARCH_DEBOUNCE_MS = 320;

function fmtCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(n));
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const palettes = [
    ["#7B61FF", "#00D4FF"],
    ["#FF2E9A", "#7B61FF"],
    ["#00D4FF", "#34D399"],
    ["#F59E0B", "#FF2E9A"],
    ["#34D399", "#00D4FF"],
    ["#A855F7", "#22D3EE"],
    ["#F472B6", "#A855F7"],
    ["#FB7185", "#F59E0B"],
  ];
  const [a, b] = palettes[hash % palettes.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

/* -------------------------------------------------------------------------- */
/*  Top-level component                                                       */
/* -------------------------------------------------------------------------- */

export function CommunityPageContent() {
  const { user, ready } = useAuth();
  const reduce = useReducedMotion();

  const [type, setType] = useState<FeedFilter>("all");
  const [sort, setSort] = useState<CommunitySort>("trending");
  const [tag, setTag] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [tags, setTags] = useState<CommunityTag[]>([]);
  const [creators, setCreators] = useState<CommunityCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openPost, setOpenPost] = useState<CommunityPost | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState<CommunityPost[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const loadFeed = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true);
      setRefreshing(opts.silent ?? false);
      setError(null);
      try {
        const r = await fetchFeed({
          type,
          sort,
          tag: tag || undefined,
          q: search || undefined,
          limit: 36,
        });
        if (!aliveRef.current) return;
        setPosts(r.posts);
      } catch (e) {
        if (!aliveRef.current) return;
        setError(e instanceof Error ? e.message : "Couldn't load the feed.");
      } finally {
        if (aliveRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [type, sort, tag, search]
  );

  const loadAux = useCallback(async () => {
    try {
      const [s, t, c] = await Promise.all([
        fetchStats().catch(() => null),
        fetchTags(18).catch(() => [] as CommunityTag[]),
        fetchCreators(8).catch(() => [] as CommunityCreator[]),
      ]);
      if (!aliveRef.current) return;
      if (s) setStats(s);
      setTags(t);
      setCreators(c);
    } catch {
      /* aux is best-effort */
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    void loadAux();
  }, [loadAux]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") {
        void loadFeed({ silent: true });
        void loadAux();
      }
    };
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadFeed({ silent: true });
      }
    }, REFRESH_MS);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadFeed, loadAux]);

  const updatePost = useCallback((id: string, patch: Partial<CommunityPost>) => {
    const merge = (p: CommunityPost): CommunityPost => ({
      ...p,
      ...patch,
      viewer: { ...p.viewer, ...(patch.viewer || {}) },
    });
    setPosts((prev) => prev.map((p) => (p.id === id ? merge(p) : p)));
    setOpenPost((cur) => (cur && cur.id === id ? merge(cur) : cur));
    setSavedPosts((prev) => {
      const existing = prev.find((p) => p.id === id);
      const nextSavedFlag = patch.viewer?.saved;
      if (existing && nextSavedFlag === false) {
        return prev.filter((p) => p.id !== id);
      }
      if (!existing && nextSavedFlag === true) {
        const source = openPost && openPost.id === id ? openPost : posts.find((p) => p.id === id);
        if (source) return [merge(source), ...prev];
        return prev;
      }
      return prev.map((p) => (p.id === id ? merge(p) : p));
    });
  }, [openPost, posts]);

  const removePostLocal = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setSavedPosts((prev) => prev.filter((p) => p.id !== id));
    setOpenPost((cur) => (cur && cur.id === id ? null : cur));
  }, []);

  const handleShared = useCallback((post: CommunityPost) => {
    setPosts((prev) => [post, ...prev.filter((p) => p.id !== post.id)]);
    void loadAux();
  }, [loadAux]);

  const loadSaved = useCallback(async () => {
    if (!ready || !user) {
      setSavedPosts([]);
      return;
    }
    setSavedLoading(true);
    setSavedError(null);
    try {
      const list = await fetchMySaved();
      if (!aliveRef.current) return;
      setSavedPosts(list);
    } catch (e) {
      if (!aliveRef.current) return;
      setSavedError(e instanceof Error ? e.message : "Couldn't load your saves.");
    } finally {
      if (aliveRef.current) setSavedLoading(false);
    }
  }, [ready, user]);

  const openSaved = useCallback(() => {
    setSavedOpen(true);
    void loadSaved();
  }, [loadSaved]);

  const handleFilterJump = useCallback((kind: CommunityKind) => {
    setType(kind);
    setSort("trending");
    setTag(null);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const el = document.getElementById("community-feed");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  const visibleTags = useMemo(() => tags.slice(0, 14), [tags]);
  const heroPreview = useMemo(() => posts.slice(0, 5), [posts]);
  const filtersActive = type !== "all" || sort !== "trending" || !!tag || !!search;

  return (
    <div className="relative">
      <CommunityHero
        stats={stats}
        previewPosts={heroPreview}
        loading={loading && posts.length === 0}
        onShareClick={() => setShareOpen(true)}
        onOpenSaved={openSaved}
        onFilterJump={handleFilterJump}
        signedIn={ready && !!user}
      />

      <StatsStrip stats={stats} />

      <FeedSection
        posts={posts}
        loading={loading}
        refreshing={refreshing}
        error={error}
        type={type}
        sort={sort}
        tag={tag}
        searchInput={searchInput}
        tags={visibleTags}
        signedIn={ready && !!user}
        filtersActive={filtersActive}
        onTypeChange={setType}
        onSortChange={setSort}
        onTagChange={setTag}
        onSearchChange={setSearchInput}
        onClearFilters={() => {
          setType("all");
          setSort("trending");
          setTag(null);
          setSearchInput("");
          setSearch("");
        }}
        onRefresh={() => void loadFeed({ silent: true })}
        onOpen={(p) => setOpenPost(p)}
        onShareClick={() => setShareOpen(true)}
        currentUserId={user?.id ?? null}
      />

      <CreatorsSection creators={creators} />

      <FinalCta signedIn={ready && !!user} onShareClick={() => setShareOpen(true)} reduce={!!reduce} />

      <PostLightbox
        post={openPost}
        onClose={() => setOpenPost(null)}
        onUpdate={updatePost}
        onDelete={removePostLocal}
        currentUserId={user?.id ?? null}
        signedIn={ready && !!user}
      />

      <CommunityShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShared={handleShared}
      />

      <SavedPostsDrawer
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        posts={savedPosts}
        loading={savedLoading}
        error={savedError}
        signedIn={ready && !!user}
        onOpenPost={(p) => {
          setSavedOpen(false);
          setOpenPost(p);
        }}
        onShareClick={() => {
          setSavedOpen(false);
          setShareOpen(true);
        }}
        onRefresh={() => void loadSaved()}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function CommunityHero({
  stats,
  previewPosts,
  loading,
  onShareClick,
  onOpenSaved,
  onFilterJump,
  signedIn,
}: {
  stats: CommunityStats | null;
  previewPosts: CommunityPost[];
  loading: boolean;
  onShareClick: () => void;
  onOpenSaved: () => void;
  onFilterJump: (kind: CommunityKind) => void;
  signedIn: boolean;
}) {
  const reduce = useReducedMotion();
  const totalPosts = stats?.totalPosts ?? 0;
  const totalCreators = stats?.totalCreators ?? 0;
  const livePillLabel =
    totalPosts > 0
      ? `${fmtCount(totalCreators)} ${totalCreators === 1 ? "creator" : "creators"} · ${fmtCount(totalPosts)} ${totalPosts === 1 ? "post" : "posts"}`
      : "Just opened";

  return (
    <section
      id="community-hero"
      className="relative overflow-hidden border-b pt-20 sm:pt-24"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--soft-black) 55%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className={`relative ${SITE_CONTAINER} pb-14 sm:pb-20`}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <div className="text-center lg:text-left">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-subtle)",
              }}
            >
              <span className="relative inline-flex h-2 w-2 items-center justify-center" aria-hidden>
                {!reduce && (
                  <motion.span
                    className="absolute inline-flex h-full w-full rounded-full"
                    style={{ background: "rgba(34,197,94,0.5)" }}
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.9)", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }}
                />
              </span>
              Community
              <span
                className="ml-1 text-[10px] font-medium normal-case tracking-normal tabular-nums"
                style={{ color: "var(--text-muted)" }}
              >
                · {livePillLabel}
              </span>
            </motion.div>

            <motion.h1
              className="font-display mt-5 text-[clamp(2.1rem,5vw,3.85rem)] font-extrabold leading-[1.04] tracking-tight"
              style={{ color: "var(--text-primary)" }}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              Show your craft.
              <br />
              <span style={{ color: "var(--text-muted)" }}>Steal a little inspiration.</span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-5 max-w-xl text-sm leading-relaxed sm:text-base lg:mx-0"
              style={{ color: "var(--text-muted)" }}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              A live wall of photos and motion pieces shared by members from their own studio.
              Browse, remix prompts, follow makers — or post your own and put it in front of every creator here.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <button
                type="button"
                onClick={onShareClick}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white btn-gradient transition-transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                {signedIn ? "Share your work" : "Sign in to share"}
              </button>
              <a
                href="#community-feed"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-6 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--text-primary)_25%,var(--border-subtle))]"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                  background: "var(--glass)",
                }}
              >
                Browse the feed
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </a>
              {signedIn && (
                <button
                  type="button"
                  onClick={onOpenSaved}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary-cyan)_35%,var(--border-subtle))]"
                  style={{
                    borderColor: "color-mix(in srgb, var(--primary-cyan) 18%, var(--border-subtle))",
                    color: "var(--text-primary)",
                    background: "color-mix(in srgb, rgba(0,212,255,0.06), var(--glass))",
                  }}
                >
                  <Bookmark className="h-4 w-4" strokeWidth={1.75} style={{ color: "rgba(120,220,255,0.85)" }} />
                  Your saves
                </button>
              )}
            </motion.div>
          </div>

          <HeroMosaic
            posts={previewPosts}
            stats={stats}
            loading={loading}
            reduce={!!reduce}
            onShareClick={onShareClick}
            onFilterJump={onFilterJump}
          />
        </div>
      </div>
    </section>
  );
}

/** Bento mosaic for the hero — fills cells with real posts when available
 *  and elegant decorative panels otherwise (no awkward empty placeholders). */
function HeroMosaic({
  posts,
  stats,
  loading,
  reduce,
  onShareClick,
  onFilterJump,
}: {
  posts: CommunityPost[];
  stats: CommunityStats | null;
  loading: boolean;
  reduce: boolean;
  onShareClick: () => void;
  onFilterJump: (kind: CommunityKind) => void;
}) {
  const totalPosts = stats?.totalPosts ?? 0;
  const totalCreators = stats?.totalCreators ?? 0;
  const weeklyPosts = stats?.weeklyPosts ?? 0;
  const weeklyLikes = stats?.weeklyLikes ?? 0;

  const big = posts[0];
  const small1 = posts[1];
  const small2 = posts[2];

  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:mx-0 lg:max-w-none">
      <div className="relative grid h-[460px] grid-cols-6 grid-rows-6 gap-3 sm:h-[520px]">
        {/* BIG — latest post or signature decorative panel */}
        <div className="col-span-4 row-span-4">
          {big ? (
            <PostMosaicCard
              post={big}
              priority
              size="lg"
              reduce={reduce}
              delay={0.1}
            />
          ) : (
            <SignaturePanel loading={loading} reduce={reduce} />
          )}
        </div>

        {/* TOP RIGHT — live pulse */}
        <div className="col-span-2 row-span-2">
          <LivePulsePanel
            totalPosts={totalPosts}
            totalCreators={totalCreators}
            weeklyPosts={weeklyPosts}
            reduce={reduce}
          />
        </div>

        {/* MIDDLE RIGHT — small post or "Photos" filter shortcut */}
        <div className="col-span-2 row-span-2">
          {small1 ? (
            <PostMosaicCard post={small1} size="sm" reduce={reduce} delay={0.18} />
          ) : (
            <KindPanel kind="image" reduce={reduce} onClick={() => onFilterJump("image")} />
          )}
        </div>

        {/* BOTTOM LEFT — wide CTA card */}
        <div className="col-span-4 row-span-2">
          <StudioCtaPanel
            weeklyLikes={weeklyLikes}
            onShareClick={onShareClick}
            reduce={reduce}
          />
        </div>

        {/* BOTTOM RIGHT — small post or "Motion" filter shortcut */}
        <div className="col-span-2 row-span-2">
          {small2 ? (
            <PostMosaicCard post={small2} size="sm" reduce={reduce} delay={0.24} />
          ) : (
            <KindPanel kind="video" reduce={reduce} onClick={() => onFilterJump("video")} />
          )}
        </div>
      </div>
    </div>
  );
}

function PostMosaicCard({
  post,
  size,
  priority,
  reduce,
  delay,
}: {
  post: CommunityPost;
  size: "lg" | "sm";
  priority?: boolean;
  reduce: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay ?? 0 }}
      whileHover={reduce ? undefined : { y: -3 }}
      className="group relative h-full w-full overflow-hidden rounded-2xl border transition-colors hover:border-[color-mix(in_srgb,var(--primary-purple)_22%,var(--border-subtle))]"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--rich-black)",
      }}
    >
      {post.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URL
        <img
          src={post.mediaUrl}
          alt={post.title || post.prompt || ""}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      ) : (
        <video
          src={post.mediaUrl}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 38%, rgba(0,0,0,0.78) 100%)",
        }}
        aria-hidden
      />

      <div className={`absolute left-2.5 top-2.5 flex items-center gap-1.5`}>
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md"
          style={{
            borderColor: "rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.45)",
          }}
        >
          {post.kind === "image" ? <ImageIcon className="h-3 w-3" /> : <VideoIcon className="h-3 w-3" />}
          {post.kind}
        </span>
        {post.featured && (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md"
            style={{
              borderColor: "rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.45)",
            }}
          >
            <Crown className="h-3 w-3" strokeWidth={2} />
          </span>
        )}
      </div>

      {post.kind === "video" && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-white backdrop-blur-md"
          style={{
            width: size === "lg" ? 52 : 34,
            height: size === "lg" ? 52 : 34,
            borderColor: "rgba(255,255,255,0.22)",
            background: "rgba(0,0,0,0.45)",
          }}
          aria-hidden
        >
          <Play className={size === "lg" ? "h-4 w-4 translate-x-0.5 fill-white" : "h-3 w-3 translate-x-0.5 fill-white"} strokeWidth={0} />
        </span>
      )}

      <div className={`absolute inset-x-0 bottom-0 ${size === "lg" ? "p-3.5" : "p-2.5"}`}>
        <div className="flex items-center gap-2">
          <span
            className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${size === "lg" ? "h-7 w-7 text-[10px]" : "h-5 w-5 text-[8px]"}`}
            style={{ background: gradientFor(post.author.name || post.id) }}
          >
            {initials(post.author.name || "??")}
          </span>
          <p className={`min-w-0 flex-1 truncate font-bold text-white ${size === "lg" ? "text-xs" : "text-[10px]"}`}>
            {post.author.name || "Anonymous"}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full text-white backdrop-blur-md ${size === "lg" ? "px-2 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-[9px]"}`}
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <Heart className={size === "lg" ? "h-3 w-3 fill-white" : "h-2.5 w-2.5 fill-white"} strokeWidth={2} />
            {fmtCount(post.likes)}
          </span>
        </div>
        {size === "lg" && post.title && (
          <p className="mt-2 line-clamp-1 text-[12.5px] font-semibold text-white">{post.title}</p>
        )}
      </div>
    </motion.div>
  );
}

function SignaturePanel({ loading, reduce }: { loading: boolean; reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border p-5"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--soft-black)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
        aria-hidden
        style={{ background: "radial-gradient(circle, rgba(123,97,255,0.10), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full opacity-50 blur-3xl"
        aria-hidden
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.08), transparent 70%)" }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Studio drops
        </span>
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--text-subtle)" }} />
        )}
      </div>

      <div className="relative flex flex-col items-center justify-center text-center">
        <motion.span
          className="flex h-12 w-12 items-center justify-center rounded-xl border"
          style={{
            borderColor: "var(--border-subtle)",
            background: "linear-gradient(135deg, rgba(123,97,255,0.10), color-mix(in srgb, var(--deep-black) 60%, transparent))",
            color: "rgba(170,150,255,0.9)",
          }}
          animate={reduce ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Wand2 className="h-5 w-5" strokeWidth={1.6} />
        </motion.span>
        <p
          className="font-display mt-4 text-lg font-extrabold leading-tight tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Where members ship
        </p>
        <p className="mt-1.5 max-w-[26ch] text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>
          Real generations from real studios. The first drop sets the tone.
        </p>
      </div>

      <div className="relative flex items-center justify-end">
        <span
          className="text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Awaiting first drop
        </span>
      </div>
    </motion.div>
  );
}

function LivePulsePanel({
  totalPosts,
  totalCreators,
  weeklyPosts,
  reduce,
}: {
  totalPosts: number;
  totalCreators: number;
  weeklyPosts: number;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.14 }}
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border p-3.5 transition-colors hover:border-[color-mix(in_srgb,var(--text-primary)_18%,var(--border-subtle))]"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--soft-black)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-40 blur-2xl"
        aria-hidden
        style={{ background: "radial-gradient(circle, rgba(34,197,94,0.18), transparent 70%)" }}
      />
      <div className="relative flex items-center gap-1.5">
        <span
          className="relative inline-flex h-2 w-2 items-center justify-center"
          aria-hidden
        >
          {!reduce && (
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full"
              style={{ background: "rgba(34,197,94,0.55)" }}
              animate={{ scale: [1, 2.2], opacity: [0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: "rgba(34,197,94,0.85)", boxShadow: "0 0 6px rgba(34,197,94,0.45)" }}
          />
        </span>
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.22em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Live
        </span>
      </div>
      <div className="relative">
        <p
          className="font-display text-[clamp(1.4rem,2.6vw,1.8rem)] font-extrabold leading-none tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {fmtCount(totalCreators)}
        </p>
        <p
          className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--text-subtle)" }}
        >
          {totalCreators === 1 ? "creator" : "creators"}
        </p>
      </div>
      <div
        className="relative flex items-center justify-between rounded-lg border px-2 py-1.5"
        style={{
          borderColor: "var(--border-subtle)",
          background: "color-mix(in srgb, var(--deep-black) 55%, transparent)",
        }}
      >
        <span className="flex items-center gap-1 text-[10px] font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
          <TrendingUp className="h-3 w-3 opacity-70" strokeWidth={1.75} style={{ color: "rgba(0,212,255,0.85)" }} />
          {fmtCount(weeklyPosts)}/wk
        </span>
        <span className="text-[10px] tabular-nums" style={{ color: "var(--text-subtle)" }}>
          {fmtCount(totalPosts)} total
        </span>
      </div>
    </motion.div>
  );
}

function KindPanel({
  kind,
  reduce,
  onClick,
}: {
  kind: "image" | "video";
  reduce: boolean;
  onClick: () => void;
}) {
  const isImage = kind === "image";
  const tintBg = isImage ? "rgba(123,97,255,0.10)" : "rgba(0,212,255,0.10)";
  const tintIcon = isImage ? "rgba(170,150,255,0.9)" : "rgba(120,220,255,0.9)";
  const tintGlow = isImage ? "rgba(123,97,255,0.18)" : "rgba(0,212,255,0.18)";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: isImage ? 0.18 : 0.24 }}
      className="group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--text-primary)_22%,var(--border-subtle))]"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--soft-black)",
      }}
      aria-label={isImage ? "Browse photos in the feed" : "Browse motion in the feed"}
    >
      <span
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
        style={{ background: `radial-gradient(circle, ${tintGlow}, transparent 70%)` }}
      />
      <span
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border"
        style={{
          borderColor: "var(--border-subtle)",
          background: `linear-gradient(135deg, ${tintBg}, color-mix(in srgb, var(--deep-black) 60%, transparent))`,
          color: tintIcon,
        }}
      >
        {isImage ? (
          <ImageIcon className="h-4 w-4" strokeWidth={1.6} />
        ) : (
          <VideoIcon className="h-4 w-4" strokeWidth={1.6} />
        )}
      </span>

      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p
            className="font-display truncate text-[15px] font-extrabold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {isImage ? "Photos" : "Motion"}
          </p>
          <p
            className="mt-0.5 line-clamp-1 text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ color: "var(--text-subtle)" }}
          >
            Browse feed
          </p>
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          strokeWidth={1.75}
          style={{ color: "var(--text-muted)" }}
        />
      </div>
    </motion.button>
  );
}

function StudioCtaPanel({
  weeklyLikes,
  onShareClick,
  reduce,
}: {
  weeklyLikes: number;
  onShareClick: () => void;
  reduce: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onShareClick}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="group relative flex h-full w-full items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary-purple)_28%,var(--border-subtle))]"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--soft-black)",
      }}
      aria-label="Share your work to the community"
    >
      <span
        className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
        style={{ background: "radial-gradient(circle, rgba(123,97,255,0.18), transparent 70%)" }}
      />
      <span
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{
          background: "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
          boxShadow: "0 6px 20px -6px rgba(123,97,255,0.45)",
        }}
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <div className="relative min-w-0 flex-1">
        <p
          className="text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Share your work
        </p>
        <p
          className="font-display mt-0.5 truncate text-[15px] font-extrabold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Drop your latest in
        </p>
        <p
          className="mt-0.5 line-clamp-1 text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
          {weeklyLikes > 0
            ? `${fmtCount(weeklyLikes)} likes flowing this week`
            : "Be the first into trending"}
        </p>
      </div>
      <ArrowUpRight
        className="relative h-4 w-4 shrink-0 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
        strokeWidth={1.75}
        style={{ color: "var(--text-muted)" }}
      />
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stats strip                                                               */
/* -------------------------------------------------------------------------- */

function StatsStrip({ stats }: { stats: CommunityStats | null }) {
  const items: {
    label: string;
    value: number;
    icon: typeof LayoutGrid;
    tint: string;
    iconColor: string;
  }[] = [
    { label: "Posts shared", value: stats?.totalPosts ?? 0, icon: LayoutGrid, tint: "rgba(123,97,255,0.10)", iconColor: "rgba(170,150,255,0.85)" },
    { label: "Active creators", value: stats?.totalCreators ?? 0, icon: Users, tint: "rgba(0,212,255,0.10)", iconColor: "rgba(120,220,255,0.85)" },
    { label: "Weekly likes", value: stats?.weeklyLikes ?? 0, icon: Heart, tint: "rgba(255,95,162,0.10)", iconColor: "rgba(255,140,180,0.85)" },
    { label: "Tags in use", value: stats?.totalTags ?? 0, icon: TrendingUp, tint: "rgba(255,181,71,0.10)", iconColor: "rgba(255,200,120,0.85)" },
  ];
  return (
    <section className={`${SITE_CONTAINER} mt-10 sm:mt-14`}>
      <div
        className="grid grid-cols-2 overflow-hidden rounded-2xl border sm:grid-cols-4"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--soft-black)",
        }}
      >
        {items.map(({ label, value, icon: Icon, tint, iconColor }, i) => {
          const mobileLeft = i % 2 !== 0;
          const mobileTop = i >= 2;
          const desktopLeft = i !== 0;
          return (
            <div
              key={label}
              className={`group relative flex items-center gap-3 px-4 py-4 transition-colors hover:bg-[color-mix(in_srgb,var(--deep-black)_30%,transparent)] sm:px-5 sm:py-5 ${mobileLeft ? "border-l" : ""} ${mobileTop ? "border-t" : ""} ${desktopLeft ? "sm:border-l" : "sm:border-l-0"} sm:border-t-0`}
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:-translate-y-0.5"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: `linear-gradient(135deg, ${tint}, color-mix(in srgb, var(--deep-black) 60%, transparent))`,
                  color: iconColor,
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <p
                  className="font-display text-2xl font-extrabold tabular-nums leading-none"
                  style={{ color: "var(--text-primary)" }}
                >
                  {fmtCount(value)}
                </p>
                <p
                  className="mt-1.5 truncate text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-subtle)" }}
                >
                  {label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feed                                                                      */
/* -------------------------------------------------------------------------- */

function FeedSection({
  posts,
  loading,
  refreshing,
  error,
  type,
  sort,
  tag,
  searchInput,
  tags,
  signedIn,
  filtersActive,
  onTypeChange,
  onSortChange,
  onTagChange,
  onSearchChange,
  onClearFilters,
  onRefresh,
  onOpen,
  onShareClick,
  currentUserId,
}: {
  posts: CommunityPost[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  type: FeedFilter;
  sort: CommunitySort;
  tag: string | null;
  searchInput: string;
  tags: CommunityTag[];
  signedIn: boolean;
  filtersActive: boolean;
  onTypeChange: (v: FeedFilter) => void;
  onSortChange: (v: CommunitySort) => void;
  onTagChange: (v: string | null) => void;
  onSearchChange: (v: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onOpen: (p: CommunityPost) => void;
  onShareClick: () => void;
  currentUserId: string | null;
}) {
  return (
    <section id="community-feed" className={`${SITE_CONTAINER} mt-16 sm:mt-24`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative inline-flex h-2 w-2 items-center justify-center" aria-hidden>
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full"
                style={{ background: "rgba(34,197,94,0.5)" }}
                animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: "rgba(34,197,94,0.9)", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }}
              />
            </span>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: "var(--text-subtle)" }}>
              Live feed
            </p>
          </div>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            What the community is shipping
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--glass)",
              color: "var(--text-primary)",
            }}
            aria-label="Refresh feed"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onShareClick}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-white btn-gradient transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            Share
          </button>
        </div>
      </div>

      <FilterBar
        type={type}
        sort={sort}
        searchInput={searchInput}
        onTypeChange={onTypeChange}
        onSortChange={onSortChange}
        onSearchChange={onSearchChange}
      />

      {tags.length > 0 && (
        <TagsRail tags={tags} active={tag} onChange={onTagChange} />
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm"
          style={{
            borderColor: "color-mix(in srgb, #ff5d8f 40%, var(--border-subtle))",
            background: "color-mix(in srgb, #ff2e9a 8%, var(--deep-black))",
            color: "color-mix(in srgb, #ff8fb6 70%, var(--text-primary))",
          }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6">
        {loading && posts.length === 0 ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <FeedEmpty
            filtered={filtersActive}
            signedIn={signedIn}
            onClear={onClearFilters}
            onShare={onShareClick}
          />
        ) : (
          <div className="grid auto-rows-[1fr] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, idx) => (
              <FeedCard
                key={p.id}
                post={p}
                index={idx}
                onOpen={() => onOpen(p)}
                isOwn={!!currentUserId && p.author.id === currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FilterBar({
  type,
  sort,
  searchInput,
  onTypeChange,
  onSortChange,
  onSearchChange,
}: {
  type: FeedFilter;
  sort: CommunitySort;
  searchInput: string;
  onTypeChange: (v: FeedFilter) => void;
  onSortChange: (v: CommunitySort) => void;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-[auto_auto_1fr]">
      <div role="radiogroup" aria-label="Type" className="inline-flex gap-1 rounded-xl border p-1"
        style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
      >
        {TYPE_OPTIONS.map(({ id, label, icon: Icon }) => {
          const active = id === type;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onTypeChange(id)}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors"
              style={{
                background: active
                  ? "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)"
                  : "transparent",
                color: active ? "#fff" : "var(--text-muted)",
              }}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>

      <div role="radiogroup" aria-label="Sort" className="inline-flex gap-1 rounded-xl border p-1"
        style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
      >
        {SORT_OPTIONS.map(({ id, label, icon: Icon }) => {
          const active = id === sort;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSortChange(id)}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors"
              style={{
                background: active ? "color-mix(in srgb, var(--primary-purple) 18%, var(--deep-black))" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                borderColor: active ? "color-mix(in srgb, var(--primary-purple) 40%, var(--border-subtle))" : "transparent",
                borderWidth: active ? 1 : 0,
                borderStyle: "solid",
              }}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>

      <label className="relative flex min-h-[44px] items-center rounded-xl border px-3 transition-colors focus-within:border-[color-mix(in_srgb,var(--primary-cyan)_45%,var(--border-subtle))]"
        style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
      >
        <Search className="h-4 w-4 shrink-0 opacity-60" strokeWidth={2} style={{ color: "var(--text-muted)" }} />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search posts, prompts, creators…"
          className="ml-2 w-full bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        {searchInput && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange("")}
            className="ml-2 rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>
    </div>
  );
}

function TagsRail({
  tags,
  active,
  onChange,
}: {
  tags: CommunityTag[];
  active: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onChange(null)}
        className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors"
        style={{
          borderColor: !active ? "color-mix(in srgb, var(--primary-cyan) 45%, var(--border-subtle))" : "var(--border-subtle)",
          background: !active ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--soft-black))" : "var(--soft-black)",
          color: !active ? "var(--text-primary)" : "var(--text-muted)",
        }}
      >
        All tags
      </button>
      {tags.map((t) => {
        const on = active === t.label;
        return (
          <button
            key={t.label}
            type="button"
            onClick={() => onChange(on ? null : t.label)}
            className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors"
            style={{
              borderColor: on ? "color-mix(in srgb, var(--primary-purple) 45%, var(--border-subtle))" : "var(--border-subtle)",
              background: on ? "color-mix(in srgb, var(--primary-purple) 14%, var(--soft-black))" : "var(--soft-black)",
              color: on ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {t.hot && <Flame className="h-3 w-3" strokeWidth={2} style={{ color: "var(--primary-pink)" }} />}
            #{t.label}
            <span className="text-[10px] tabular-nums opacity-70">{fmtCount(t.count)}</span>
          </button>
        );
      })}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/5] animate-pulse rounded-2xl border"
          style={{
            borderColor: "var(--border-subtle)",
            background:
              "linear-gradient(120deg, color-mix(in srgb, var(--soft-black) 100%, transparent) 0%, color-mix(in srgb, var(--deep-black) 100%, transparent) 100%)",
          }}
        />
      ))}
    </div>
  );
}

function FeedEmpty({
  filtered,
  signedIn,
  onClear,
  onShare,
}: {
  filtered: boolean;
  signedIn: boolean;
  onClear: () => void;
  onShare: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-14 text-center"
      style={{
        borderColor: "var(--border-subtle)",
        background: "color-mix(in srgb, var(--deep-black) 50%, transparent)",
      }}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-muted)" }}
      >
        <Sparkles className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="font-display mt-5 text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
        {filtered ? "Nothing matches those filters" : "Be the first to share"}
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {filtered
          ? "Try clearing the filters or searching for something else — the feed updates as new work lands."
          : "The community feed is fresh and waiting for its first drop. Post a generation and kick it off."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {filtered ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--glass)",
              color: "var(--text-primary)",
            }}
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        ) : null}
        <button
          type="button"
          onClick={onShare}
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white btn-gradient"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          {signedIn ? "Share your work" : "Sign in to share"}
        </button>
      </div>
    </div>
  );
}

function FeedCard({
  post,
  index,
  onOpen,
  isOwn,
}: {
  post: CommunityPost;
  index: number;
  onOpen: () => void;
  isOwn: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ delay: reduce ? 0 : Math.min(index * 0.04, 0.4), duration: 0.35 }}
      whileHover={reduce ? undefined : { y: -3 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border text-left transition-colors hover:border-[color-mix(in_srgb,var(--primary-purple)_22%,var(--border-subtle))]"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--soft-black)",
      }}
      aria-label={`Open ${post.title || "post"} by ${post.author.name}`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/30">
        {post.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URL
          <img
            src={post.mediaUrl}
            alt={post.title || post.prompt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <video
            src={post.mediaUrl}
            muted
            playsInline
            preload="metadata"
            loop
            onMouseEnter={(e) => {
              const v = e.currentTarget;
              v.play().catch(() => {});
            }}
            onMouseLeave={(e) => {
              const v = e.currentTarget;
              v.pause();
              v.currentTime = 0;
            }}
            className="h-full w-full object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--deep-black)] via-transparent to-transparent" aria-hidden />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-md"
            style={{
              borderColor: "rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.45)",
            }}
          >
            {post.kind === "image" ? <ImageIcon className="h-3 w-3" /> : <VideoIcon className="h-3 w-3" />}
            {post.kind}
          </span>
          {post.featured && (
            <span
              className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-md"
              style={{
                borderColor: "rgba(255,255,255,0.22)",
                background: "rgba(0,0,0,0.45)",
              }}
            >
              <Crown className="h-3 w-3" strokeWidth={2} />
              Featured
            </span>
          )}
          {isOwn && (
            <span
              className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-md"
              style={{
                borderColor: "rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.45)",
              }}
            >
              You
            </span>
          )}
        </div>

        {post.kind === "video" && (
          <span
            className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
            style={{
              background: "color-mix(in srgb, var(--rich-black) 70%, transparent)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Play className="h-3 w-3" strokeWidth={2} />
            Preview
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: gradientFor(post.author.name || post.id) }}
            >
              {initials(post.author.name || "??")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                {post.author.name}
              </p>
              <p className="truncate text-[10px]" style={{ color: "var(--text-subtle)" }}>
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
            style={{
              background: "color-mix(in srgb, var(--rich-black) 65%, transparent)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Eye className="h-3 w-3" strokeWidth={2} /> {fmtCount(post.views)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {post.title && (
          <p className="font-display line-clamp-1 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {post.title}
          </p>
        )}
        <p className="line-clamp-2 text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
          {post.prompt}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-3 text-[11px] font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
            <span className="inline-flex items-center gap-1">
              <Heart
                className="h-3.5 w-3.5"
                strokeWidth={2}
                fill={post.viewer.liked ? "currentColor" : "none"}
                style={{ color: post.viewer.liked ? "var(--primary-pink)" : undefined }}
              />
              {fmtCount(post.likes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
              {fmtCount(post.comments)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bookmark
                className="h-3.5 w-3.5"
                strokeWidth={2}
                fill={post.viewer.saved ? "currentColor" : "none"}
                style={{ color: post.viewer.saved ? "var(--primary-cyan)" : undefined }}
              />
              {fmtCount(post.saves)}
            </span>
          </div>
          {post.tags.length > 0 && (
            <span className="truncate text-[11px] font-semibold" style={{ color: "var(--primary-cyan)" }}>
              #{post.tags[0]}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Creators                                                                  */
/* -------------------------------------------------------------------------- */

function CreatorsSection({ creators }: { creators: CommunityCreator[] }) {
  if (creators.length === 0) return null;
  return (
    <section className={`${SITE_CONTAINER} mt-20 sm:mt-28`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: "var(--text-subtle)" }}>
            Top creators
          </p>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            People shipping the most loved work
          </h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Ranked by the past 30 days of likes, saves, and views.
        </p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {creators.map((c, i) => {
          const rankTints: { bg: string; color: string; border: string } = (() => {
            if (i === 0) return { bg: "rgba(255,181,71,0.12)", color: "rgba(255,200,120,0.95)", border: "rgba(255,181,71,0.28)" };
            if (i === 1) return { bg: "rgba(0,212,255,0.10)", color: "rgba(120,220,255,0.9)", border: "rgba(0,212,255,0.24)" };
            if (i === 2) return { bg: "rgba(123,97,255,0.10)", color: "rgba(170,150,255,0.9)", border: "rgba(123,97,255,0.24)" };
            return { bg: "color-mix(in srgb, var(--deep-black) 60%, transparent)", color: "var(--text-muted)", border: "var(--border-subtle)" };
          })();
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border p-4 transition-colors hover:border-[color-mix(in_srgb,var(--text-primary)_22%,var(--border-subtle))]"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--soft-black)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: gradientFor(c.name || c.id) }}
                >
                  {initials(c.name || "??")}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-display truncate text-[15px] font-extrabold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {c.name || "Anonymous"}
                  </p>
                  <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--text-subtle)" }}>
                    Last post {timeAgo(c.lastPostAt)}
                  </p>
                </div>
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold tabular-nums"
                  style={{
                    borderColor: rankTints.border,
                    background: rankTints.bg,
                    color: rankTints.color,
                  }}
                  title={`#${i + 1} on the leaderboard`}
                >
                  {i + 1}
                </span>
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-3 text-[11px]"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
              >
                <span className="flex items-center gap-1.5 tabular-nums">
                  <LayoutGrid className="h-3 w-3" strokeWidth={1.75} style={{ color: "rgba(170,150,255,0.75)" }} />
                  {fmtCount(c.works)}
                </span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Heart className="h-3 w-3" strokeWidth={1.75} style={{ color: "rgba(255,140,180,0.8)" }} />
                  {fmtCount(c.likes)}
                </span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Eye className="h-3 w-3" strokeWidth={1.75} style={{ color: "rgba(120,220,255,0.8)" }} />
                  {fmtCount(c.views)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Final CTA                                                                 */
/* -------------------------------------------------------------------------- */

function FinalCta({
  signedIn,
  onShareClick,
  reduce,
}: {
  signedIn: boolean;
  onShareClick: () => void;
  reduce: boolean;
}) {
  return (
    <section className={`${SITE_CONTAINER} mt-20 mb-16 sm:mt-28 sm:mb-24`}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border p-8 text-center sm:p-14"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--soft-black)",
        }}
      >
        <motion.div
          className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[28rem] -translate-x-1/2 rounded-full blur-3xl"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 50% 50%, rgba(123,97,255,0.10), transparent 70%), radial-gradient(ellipse 50% 100% at 30% 50%, rgba(0,212,255,0.06), transparent 70%)",
          }}
          animate={reduce ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-2xl">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.22em]"
            style={{ color: "var(--text-subtle)" }}
          >
            Your turn
          </p>
          <h2
            className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: "var(--text-primary)" }}
          >
            Drop your latest into the feed
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-[15px]"
            style={{ color: "var(--text-muted)" }}
          >
            Open the studio, generate something you love, and share it with everyone here. New posts surface in trending instantly.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onShareClick}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white btn-gradient transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              {signedIn ? "Share your work" : "Sign in to share"}
            </button>
            <Link
              href="/dashboard/generate/image"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--text-primary)_22%,var(--border-subtle))]"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-primary)",
              }}
            >
              Open the studio
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Lightbox                                                                  */
/* -------------------------------------------------------------------------- */

function PostLightbox({
  post,
  onClose,
  onUpdate,
  onDelete,
  currentUserId,
  signedIn,
}: {
  post: CommunityPost | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<CommunityPost>) => void;
  onDelete: (id: string) => void;
  currentUserId: string | null;
  signedIn: boolean;
}) {
  const reduce = useReducedMotion();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [acting, setActing] = useState<null | "like" | "save">(null);
  const [copied, setCopied] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!post) return;
    setComments([]);
    setCommentBody("");
    setCommentsLoading(true);
    setShareNote(null);
    setCopied(false);
    setConfirmDelete(false);
    setActionError(null);
    void recordView(post.id)
      .then((r) => {
        if (!aliveRef.current || !post) return;
        if (r.views && r.views !== post.views) {
          onUpdate(post.id, { views: r.views });
        }
      })
      .catch(() => {});
    void fetchComments(post.id)
      .then((c) => {
        if (!aliveRef.current) return;
        setComments(c);
      })
      .catch(() => {})
      .finally(() => {
        if (aliveRef.current) setCommentsLoading(false);
      });
  }, [post?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [post, onClose]);

  useEffect(() => {
    if (!post) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [post]);

  if (!post) return null;

  const isOwn = !!currentUserId && post.author.id === currentUserId;

  async function onLike() {
    if (!post) return;
    if (!signedIn) {
      setActionError("Sign in to like posts.");
      return;
    }
    if (acting) return;
    setActing("like");
    setActionError(null);
    try {
      const r = await toggleLike(post.id);
      onUpdate(post.id, { likes: r.likes, viewer: { ...post.viewer, liked: r.liked } });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't update like.");
    } finally {
      setActing(null);
    }
  }

  async function onSave() {
    if (!post) return;
    if (!signedIn) {
      setActionError("Sign in to save posts.");
      return;
    }
    if (acting) return;
    setActing("save");
    setActionError(null);
    try {
      const r = await toggleSave(post.id);
      onUpdate(post.id, { saves: r.saves, viewer: { ...post.viewer, saved: r.saved } });
      setShareNote(r.saved ? "Saved to your collection" : "Removed from your saves");
      window.setTimeout(() => setShareNote(null), 1500);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't update save.");
    } finally {
      setActing(null);
    }
  }

  async function onCopyPrompt() {
    if (!post) return;
    try {
      await navigator.clipboard.writeText(post.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setShareNote("Couldn't copy — your browser blocked clipboard access.");
    }
  }

  async function onShare() {
    if (!post) return;
    const url = typeof window !== "undefined" ? `${window.location.origin}/community#${post.id}` : "";
    try {
      const nav = (typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }) : null);
      if (nav && nav.share) {
        await nav.share({ title: post.title || "Community post", text: post.prompt, url });
        setShareNote("Shared!");
      } else if (navigator?.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied.");
      }
    } catch {
      /* user cancelled */
    } finally {
      window.setTimeout(() => setShareNote(null), 1600);
    }
  }

  async function onPostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!post) return;
    if (!signedIn) {
      setActionError("Sign in to comment.");
      return;
    }
    const body = commentBody.trim();
    if (!body || posting) return;
    setPosting(true);
    setActionError(null);
    try {
      const c = await postComment(post.id, body);
      setComments((prev) => [c, ...prev]);
      setCommentBody("");
      onUpdate(post.id, { comments: post.comments + 1 });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't comment.");
    } finally {
      setPosting(false);
    }
  }

  async function onDeleteComment(commentId: string) {
    if (!post) return;
    try {
      await apiDeleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onUpdate(post.id, { comments: Math.max(0, post.comments - 1) });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't delete.");
    }
  }

  async function onDeletePost() {
    if (!post) return;
    if (deleting) return;
    setDeleting(true);
    try {
      await apiDeletePost(post.id);
      onDelete(post.id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't delete post.");
      setDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key={`lb-${post.id}`}
        className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={post.title || "Post details"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.18 }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />
        <motion.div
          initial={reduce ? false : { y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="relative grid max-h-[94dvh] w-full max-w-[1100px] grid-rows-[1fr_auto] overflow-hidden rounded-t-3xl border sm:rounded-3xl lg:grid-cols-[1.4fr_1fr] lg:grid-rows-1"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--soft-black)",
            boxShadow: "0 60px 120px -30px rgba(0,0,0,0.7)",
          }}
        >
          <div className="relative flex min-h-[260px] items-center justify-center bg-black/60">
            {post.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URL
              <img
                src={post.mediaUrl}
                alt={post.title || post.prompt}
                className="h-full max-h-[70dvh] w-full object-contain lg:max-h-none"
                loading="eager"
                decoding="async"
              />
            ) : (
              <video
                src={post.mediaUrl}
                controls
                autoPlay
                playsInline
                className="h-full max-h-[70dvh] w-full lg:max-h-none"
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md"
              style={{
                borderColor: "var(--border-subtle)",
                background: "color-mix(in srgb, var(--rich-black) 70%, transparent)",
                color: "var(--text-primary)",
              }}
              aria-label="Close"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>

          <div className="flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: gradientFor(post.author.name || post.id) }}
                  >
                    {initials(post.author.name || "??")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {post.author.name || "Anonymous"}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: "var(--text-subtle)" }}>
                      {timeAgo(post.createdAt)} · <Eye className="-mt-0.5 inline h-3 w-3" strokeWidth={2} /> {fmtCount(post.views)}
                    </p>
                  </div>
                </div>
                {post.title && (
                  <h3 className="font-display mt-3 text-lg font-extrabold leading-snug" style={{ color: "var(--text-primary)" }}>
                    {post.title}
                  </h3>
                )}
              </div>
              {isOwn && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete((v) => !v)}
                  className="flex h-9 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold transition-colors"
                  style={{
                    borderColor: "color-mix(in srgb, #ff5d8f 35%, var(--border-subtle))",
                    background: "var(--glass)",
                    color: "color-mix(in srgb, #ff8fb6 80%, var(--text-primary))",
                  }}
                  aria-label="Delete post"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Delete
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {post.prompt && (
                <section>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                    Prompt
                  </p>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl border px-3.5 py-3 text-sm leading-relaxed"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "color-mix(in srgb, var(--deep-black) 55%, transparent)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {post.prompt}
                  </p>
                </section>
              )}

              {post.tags.length > 0 && (
                <section className="mt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          borderColor: "var(--border-subtle)",
                          background: "var(--glass)",
                          color: "var(--text-primary)",
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                    Comments
                  </p>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {fmtCount(post.comments)}
                  </span>
                </div>

                <form onSubmit={onPostComment} className="mt-3 flex items-start gap-2">
                  <textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    rows={2}
                    maxLength={800}
                    placeholder={signedIn ? "Add a comment…" : "Sign in to comment"}
                    disabled={!signedIn || posting}
                    className="flex-1 resize-y rounded-xl border px-3.5 py-2 text-sm leading-relaxed outline-none transition-colors focus:border-[color-mix(in_srgb,var(--primary-cyan)_45%,var(--border-subtle))] disabled:opacity-60"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--deep-black)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!signedIn || posting || commentBody.trim().length === 0}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
                    }}
                    aria-label="Post comment"
                  >
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>

                {!signedIn && (
                  <p className="mt-2 text-xs" style={{ color: "var(--text-subtle)" }}>
                    <Link href="/sign-in?next=/community" className="font-semibold text-[var(--primary-cyan)] hover:underline">
                      Sign in
                    </Link>{" "}
                    to like, save and comment.
                  </p>
                )}

                <div className="mt-3 space-y-2.5">
                  {commentsLoading ? (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading comments…
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                      No comments yet — be the first to react.
                    </p>
                  ) : (
                    comments.map((c) => {
                      const own = currentUserId && c.authorId === currentUserId;
                      return (
                        <div
                          key={c.id}
                          className="rounded-xl border px-3 py-2"
                          style={{
                            borderColor: "var(--border-subtle)",
                            background: "color-mix(in srgb, var(--deep-black) 50%, transparent)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                                style={{ background: gradientFor(c.authorName || c.authorId) }}
                              >
                                {initials(c.authorName || "??")}
                              </span>
                              <p className="truncate text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                                {c.authorName || "Anonymous"}
                              </p>
                              <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>
                                · {timeAgo(c.createdAt)}
                              </span>
                            </div>
                            {own && (
                              <button
                                type="button"
                                onClick={() => void onDeleteComment(c.id)}
                                className="text-[10px] font-semibold opacity-60 transition-opacity hover:opacity-100"
                                style={{ color: "var(--text-muted)" }}
                                aria-label="Delete comment"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                            {c.body}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            <div className="border-t px-5 py-3 sm:px-6"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              {actionError && (
                <p className="mb-2 text-xs" style={{ color: "color-mix(in srgb, #ff8fb6 75%, var(--text-primary))" }}>
                  {actionError}
                </p>
              )}
              {confirmDelete && (
                <div
                  className="mb-3 rounded-xl border p-3"
                  style={{
                    borderColor: "color-mix(in srgb, #ff5d8f 35%, var(--border-subtle))",
                    background: "color-mix(in srgb, #ff2e9a 8%, var(--deep-black))",
                  }}
                >
                  <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                    Remove this post from the community feed? This can't be undone.
                  </p>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg border px-3 py-1 text-xs font-semibold"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--glass)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => void onDeletePost()}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #ff2e9a 0%, #f43f5e 100%)" }}
                    >
                      {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Delete
                    </button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onLike}
                  disabled={acting === "like"}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors disabled:opacity-60"
                  style={{
                    borderColor: post.viewer.liked
                      ? "color-mix(in srgb, var(--primary-pink) 40%, var(--border-subtle))"
                      : "var(--border-subtle)",
                    background: post.viewer.liked
                      ? "color-mix(in srgb, var(--primary-pink) 12%, var(--soft-black))"
                      : "var(--glass)",
                    color: post.viewer.liked ? "var(--primary-pink)" : "var(--text-primary)",
                  }}
                  aria-pressed={post.viewer.liked}
                >
                  <Heart
                    className="h-3.5 w-3.5"
                    strokeWidth={2}
                    fill={post.viewer.liked ? "currentColor" : "none"}
                  />
                  {fmtCount(post.likes)}
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={acting === "save"}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors disabled:opacity-60"
                  style={{
                    borderColor: post.viewer.saved
                      ? "color-mix(in srgb, var(--primary-cyan) 40%, var(--border-subtle))"
                      : "var(--border-subtle)",
                    background: post.viewer.saved
                      ? "color-mix(in srgb, var(--primary-cyan) 12%, var(--soft-black))"
                      : "var(--glass)",
                    color: post.viewer.saved ? "var(--primary-cyan)" : "var(--text-primary)",
                  }}
                  aria-pressed={post.viewer.saved}
                >
                  <Bookmark
                    className="h-3.5 w-3.5"
                    strokeWidth={2}
                    fill={post.viewer.saved ? "currentColor" : "none"}
                  />
                  {fmtCount(post.saves)}
                </button>
                {post.prompt && (
                  <button
                    type="button"
                    onClick={onCopyPrompt}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--glass)",
                      color: "var(--text-primary)",
                    }}
                    aria-label="Copy prompt"
                  >
                    {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy prompt"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-primary)",
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Share
                </button>
                <a
                  href={post.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
                  }}
                >
                  Open original
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
              {shareNote && (
                <p className="mt-2 text-xs" style={{ color: "var(--primary-cyan)" }}>
                  {shareNote}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*  Saved drawer                                                              */
/* -------------------------------------------------------------------------- */

function SavedPostsDrawer({
  open,
  onClose,
  posts,
  loading,
  error,
  signedIn,
  onOpenPost,
  onShareClick,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  posts: CommunityPost[];
  loading: boolean;
  error: string | null;
  signedIn: boolean;
  onOpenPost: (p: CommunityPost) => void;
  onShareClick: () => void;
  onRefresh: () => void;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="saved-drawer"
          className="fixed inset-0 z-[75] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Saved posts"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <motion.aside
            className="relative flex h-full w-full max-w-[640px] flex-col border-l shadow-2xl"
            style={{
              borderColor: "var(--border-subtle)",
              background:
                "linear-gradient(180deg, var(--soft-black) 0%, var(--rich-black) 100%)",
            }}
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduce ? undefined : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
          >
            <header
              className="flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: "rgba(0,212,255,0.22)",
                    background: "linear-gradient(135deg, rgba(0,212,255,0.10), color-mix(in srgb, var(--deep-black) 60%, transparent))",
                    color: "rgba(120,220,255,0.95)",
                  }}
                >
                  <Bookmark className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-medium uppercase tracking-[0.22em]"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    Your saves
                  </p>
                  <h2
                    className="font-display truncate text-lg font-extrabold leading-tight tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Saved from the community
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-60"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-primary)",
                  }}
                  aria-label="Refresh saved"
                >
                  <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-primary)",
                  }}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </header>

            {!signedIn ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--glass)", color: "var(--text-muted)" }}
                >
                  <Bookmark className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <p className="font-display mt-4 text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                  Sign in to access saves
                </p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Once you're signed in, posts you save show up here for quick access from any device.
                </p>
                <Link
                  href="/sign-in?next=/community"
                  className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-cyan) 100%)",
                  }}
                >
                  Sign in
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <AlertCircle className="h-6 w-6" style={{ color: "color-mix(in srgb, #ff8fb6 70%, var(--text-primary))" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border px-4 text-xs font-semibold"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-primary)",
                  }}
                >
                  <RefreshCcw className="h-3.5 w-3.5" strokeWidth={2} />
                  Try again
                </button>
              </div>
            ) : loading && posts.length === 0 ? (
              <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] animate-pulse rounded-2xl border"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background:
                        "linear-gradient(120deg, color-mix(in srgb, var(--soft-black) 100%, transparent) 0%, color-mix(in srgb, var(--deep-black) 100%, transparent) 100%)",
                    }}
                  />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: "rgba(0,212,255,0.22)",
                    background: "linear-gradient(135deg, rgba(0,212,255,0.10), var(--glass))",
                    color: "rgba(120,220,255,0.9)",
                  }}
                >
                  <Bookmark className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <p className="font-display mt-5 text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                  Nothing saved yet
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Open any post and tap the bookmark to keep it here. Your saves stay private to you.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border px-5 text-sm font-semibold"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-primary)",
                  }}
                >
                  Browse the feed
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={onShareClick}
                  className="mt-3 text-xs font-medium underline-offset-2 hover:underline"
                  style={{ color: "var(--text-muted)" }}
                >
                  or share your own work
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                <p
                  className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-subtle)" }}
                >
                  {posts.length} {posts.length === 1 ? "save" : "saves"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {posts.map((p) => (
                    <SavedThumbCard key={p.id} post={p} onOpen={() => onOpenPost(p)} />
                  ))}
                </div>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SavedThumbCard({ post, onOpen }: { post: CommunityPost; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex aspect-[4/5] w-full flex-col overflow-hidden rounded-2xl border text-left transition-transform hover:-translate-y-0.5"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--soft-black)",
      }}
      aria-label={`Open ${post.title || "saved post"}`}
    >
      {post.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URL
        <img
          src={post.mediaUrl}
          alt={post.title || post.prompt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <video
          src={post.mediaUrl}
          muted
          loop
          playsInline
          preload="metadata"
          onMouseEnter={(e) => {
            e.currentTarget.play().catch(() => {});
          }}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
        <span
          className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md"
          style={{
            borderColor: "rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.45)",
          }}
        >
          {post.kind === "image" ? <ImageIcon className="h-3 w-3" /> : <VideoIcon className="h-3 w-3" />}
          {post.kind}
        </span>
      </div>
      <span
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-md"
        style={{
          borderColor: "rgba(0,212,255,0.32)",
          background: "color-mix(in srgb, rgba(0,212,255,0.18), rgba(0,0,0,0.5))",
          color: "rgba(180,235,255,0.95)",
        }}
      >
        <Bookmark className="h-3 w-3 fill-current" strokeWidth={2} />
      </span>
      <div className="relative mt-auto p-3">
        {post.title && (
          <p className="line-clamp-1 text-xs font-bold text-white">{post.title}</p>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ background: gradientFor(post.author.name || post.id) }}
          >
            {initials(post.author.name || "??")}
          </span>
          <p className="truncate text-[10px] text-white/85">{post.author.name || "Anonymous"}</p>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-white/85">
            <Heart className="h-3 w-3" strokeWidth={2} />
            {fmtCount(post.likes)}
          </span>
        </div>
      </div>
    </button>
  );
}
