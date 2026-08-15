"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Play, Sparkles, BookOpen, Clock, Heart, Eye, 
  ArrowRight, Lock, DollarSign, Brain, BarChart, 
  CheckCircle2, X, AlertCircle, Award, Search, User,
  Layers, Tag, Filter, SlidersHorizontal, RefreshCw, ChevronRight, Video, FileText
} from "lucide-react";
import { SITE_CONTAINER } from "@/lib/site-layout";

export interface Tutorial {
  id: string;
  course_id?: string | null;
  title: string;
  description: string;
  video_source?: "upload" | "external";
  video_url: string;
  thumbnail_url: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  duration: string;
  difficulty: string;
  views: number;
  likes: number;
  premium: number;
  status?: string;
  display_order?: number;
  instructor: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  difficulty: string;
  premium: number;
  status?: string;
  display_order?: number;
  instructor: string;
  views: number;
  likes: number;
  tutorial_count?: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
}

// Fallback seed items
const LOCAL_FALLBACK_TUTORIALS: Tutorial[] = [
  {
    id: "fallback-1",
    title: "Understanding Spatial Rendering & Lighting",
    description: "Deep dive into the platform's spatial rendering capabilities. Learn how to map lighting vectors for cinematic realism.",
    video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnail_url: "",
    category: "features",
    subcategory: "spatial-rendering",
    tags: ["Spatial", "Lighting", "Rendering"],
    duration: "12 min",
    difficulty: "Beginner",
    views: 1420,
    likes: 342,
    premium: 0,
    instructor: "Elena Voss (Creative Director)",
    created_at: new Date().toISOString()
  },
  {
    id: "fallback-2",
    title: "Mastering Character Consistency",
    description: "Learn how to maintain perfect character traits across multiple scenes using reference plates and seed locking.",
    video_url: "https://www.w3schools.com/html/movie.mp4",
    thumbnail_url: "",
    category: "courses",
    subcategory: "character-design",
    tags: ["Character", "Consistency", "Seed Lock"],
    duration: "25 min",
    difficulty: "Intermediate",
    views: 3205,
    likes: 914,
    premium: 0,
    instructor: "Marcus Chen (VFX Lead)",
    created_at: new Date().toISOString()
  },
  {
    id: "fallback-3",
    title: "Advanced Workflow Integration",
    description: "A complete masterclass on stringing together image generation, upscale nodes, and custom aspect ratio controls.",
    video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnail_url: "",
    category: "masterclasses",
    subcategory: "vfx-pipelines",
    tags: ["VFX", "Workflow", "Masterclass"],
    duration: "42 min",
    difficulty: "Advanced",
    views: 852,
    likes: 271,
    premium: 1,
    instructor: "Priya Nair (Platform Head)",
    created_at: new Date().toISOString()
  },
  {
    id: "fallback-4",
    title: "Cinematic Film Composition & Rendering",
    description: "End-to-end blueprint for developing a fully animated, high-fidelity short film entirely within the studio suite.",
    video_url: "https://www.w3schools.com/html/movie.mp4",
    thumbnail_url: "",
    category: "workflows",
    subcategory: "film-production",
    tags: ["Film", "Composition", "Animation"],
    duration: "3.5 hours",
    difficulty: "Advanced",
    views: 685,
    likes: 212,
    premium: 1,
    instructor: "RUHGEN Founders",
    created_at: new Date().toISOString()
  }
];

export function AcademyPageContent() {
  const reduce = useReducedMotion() === true;
  const [tutorials, setTutorials] = useState<Tutorial[]>(LOCAL_FALLBACK_TUTORIALS);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: "cat-features", name: "Feature Understanding", slug: "features" },
    { id: "cat-courses", name: "Courses", slug: "courses" },
    { id: "cat-masterclasses", name: "Masterclasses", slug: "masterclasses" },
    { id: "cat-workflows", name: "Advanced Workflows", slug: "workflows" }
  ]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter & Search Controls State
  const [viewMode, setViewMode] = useState<"lessons" | "courses">("lessons");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "likes" | "title">("recent");

  // Modal & Selection State
  const [activeVideo, setActiveVideo] = useState<Tutorial | null>(null);
  const [activeCourseModal, setActiveCourseModal] = useState<Course | null>(null);

  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("ruhgen_liked_tutorials");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Fetch Academy bundle content from backend
  const loadData = async () => {
    try {
      const [resContent, resUserLikes] = await Promise.all([
        fetch("/api/academy/content"),
        fetch("/api/academy/user-likes").catch(() => null)
      ]);

      if (resContent.ok) {
        const data = await resContent.json();
        if (data.ok) {
          if (Array.isArray(data.tutorials) && data.tutorials.length > 0) {
            setTutorials(data.tutorials);
          }
          if (Array.isArray(data.courses)) {
            setCourses(data.courses);
          }
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
          if (data.stats && typeof data.stats.totalUsers === "number") {
            setTotalUsers(data.stats.totalUsers);
          }
        }
      }

      if (resUserLikes && resUserLikes.ok) {
        const dataLikes = await resUserLikes.json();
        if (dataLikes.ok && Array.isArray(dataLikes.likedIds)) {
          setLikedIds(new Set(dataLikes.likedIds));
        }
      }
    } catch (e) {
      console.error("Failed to load backend academy content", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadData();

    const intervalId = setInterval(() => {
      loadData();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Compute available subcategories for current category selection
  const currentCategoryObj = useMemo(() => {
    if (activeCategory === "all") return null;
    return categories.find(c => c.slug === activeCategory || c.id === activeCategory);
  }, [categories, activeCategory]);

  const currentSubcategories = useMemo(() => {
    if (!currentCategoryObj || !currentCategoryObj.subcategories) return [];
    return currentCategoryObj.subcategories;
  }, [currentCategoryObj]);

  // Compute all tags
  useEffect(() => {
    const tagsSet = new Set<string>();
    tutorials.forEach(t => {
      if (Array.isArray(t.tags)) t.tags.forEach(tag => tagsSet.add(tag));
    });
    courses.forEach(c => {
      if (Array.isArray(c.tags)) c.tags.forEach(tag => tagsSet.add(tag));
    });
    setAvailableTags(Array.from(tagsSet));
  }, [tutorials, courses]);

  // Handle Play Video & Backend View Tracking
  const handlePlayVideo = async (tutorial: Tutorial) => {
    setActiveVideo(tutorial);
    try {
      const res = await fetch(`/api/academy/tutorials/${tutorial.id}/view`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && typeof data.views === "number") {
          setTutorials(prev =>
            prev.map(t => t.id === tutorial.id ? { ...t, views: data.views } : t)
          );
        }
      }
    } catch (err) {
      console.error("Failed to record view:", err);
    }
  };

  // Handle Like/Unlike & Backend Sync
  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    const isLiking = !likedIds.has(id);
    const newLiked = new Set(likedIds);
    if (isLiking) {
      newLiked.add(id);
    } else {
      newLiked.delete(id);
    }
    setLikedIds(newLiked);

    try {
      localStorage.setItem("ruhgen_liked_tutorials", JSON.stringify(Array.from(newLiked)));
      const res = await fetch(`/api/academy/tutorials/${id}/${isLiking ? 'like' : 'unlike'}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && typeof data.likes === "number") {
          setTutorials(prev =>
            prev.map(t => t.id === id ? { ...t, likes: data.likes } : t)
          );
        }
      }
    } catch (err) {
      console.error("Failed to sync like:", err);
    }
  };

  // Filtered & Sorted Tutorials
  const filteredTutorials = useMemo(() => {
    let list = tutorials.filter(t => {
      const matchesCategory = activeCategory === "all" || t.category === activeCategory;
      const matchesSubcategory = activeSubcategory === "all" || t.subcategory === activeSubcategory;
      const matchesTag = activeTag === "all" || (Array.isArray(t.tags) && t.tags.includes(activeTag));
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        t.instructor.toLowerCase().includes(q) ||
        (Array.isArray(t.tags) && t.tags.some(tag => tag.toLowerCase().includes(q)));
      
      return matchesCategory && matchesSubcategory && matchesTag && matchesSearch;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === "popular") return b.views - a.views;
      if (sortBy === "likes") return b.likes - a.likes;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tutorials, activeCategory, activeSubcategory, activeTag, searchQuery, sortBy]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesCategory = activeCategory === "all" || c.category === activeCategory;
      const matchesSubcategory = activeSubcategory === "all" || c.subcategory === activeSubcategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q);
      return matchesCategory && matchesSubcategory && matchesSearch;
    });
  }, [courses, activeCategory, activeSubcategory, searchQuery]);

  const resetFilters = () => {
    setActiveCategory("all");
    setActiveSubcategory("all");
    setActiveTag("all");
    setSearchQuery("");
    setSortBy("recent");
  };

  // Helper for rendering video player source
  const renderVideoMedia = (rawUrl: string) => {
    if (!rawUrl) return null;
    let videoUrl = rawUrl.trim();
    if (!videoUrl.startsWith("http") && !videoUrl.startsWith("/")) {
      videoUrl = "/" + videoUrl;
    }

    const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
    const isVimeo = videoUrl.includes("vimeo.com");

    if (isYouTube) {
      const embedUrl = videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
      return (
        <iframe
          src={`${embedUrl}?autoplay=1&rel=0`}
          className="w-full h-full min-h-[360px] md:min-h-[480px] rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    } else if (isVimeo) {
      const vimeoId = videoUrl.split("/").pop();
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
          className="w-full h-full min-h-[360px] md:min-h-[480px] rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    } else {
      const ext = videoUrl.split('.').pop()?.toLowerCase() || '';
      const primaryType = ext === 'webm' ? 'video/webm' : 'video/mp4';
      const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
      const directUrl = videoUrl.startsWith("/media/") ? `${backendOrigin}${videoUrl}` : videoUrl;

      return (
        <video
          key={videoUrl}
          className="w-full max-h-[75vh] object-contain rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
          controls
          autoPlay
          playsInline
          preload="auto"
        >
          <source src={directUrl} type={primaryType} />
          <source src={videoUrl} type={primaryType} />
          <source src={directUrl} type="video/quicktime" />
          <source src={videoUrl} type="video/quicktime" />
          Your browser does not support playing this video file.
        </video>
      );
    }
  };

  return (
    <>
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b pt-24 sm:pt-32" style={{ borderColor: "var(--border-subtle)", background: "var(--background)" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(123,97,255,0.18), transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute -left-40 top-40 h-[400px] w-[400px] rounded-full opacity-10 blur-[100px]"
          style={{ background: "#00D4FF" }}
        />
        
        <div className={`relative ${SITE_CONTAINER} pb-16 sm:pb-24`}>
          <div className="mx-auto max-w-3xl text-center">
            {/* Academy Badge */}
            <motion.div 
              initial={reduce ? false : { opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
              style={{
                borderColor: "rgba(123,97,255,0.3)",
                background: "rgba(123,97,255,0.06)",
                color: "#7B61FF"
              }}
            >
              <Award className="h-4.5 w-4.5" />
              RUHGEN Academy & Tutorials
            </motion.div>

            <motion.h1 
              initial={reduce ? false : { opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-display mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl" 
              style={{ color: "var(--text-primary)" }}
            >
              Master Generative AI & <span className="text-gradient-primary">Unlock Your Creativity</span>
            </motion.h1>

            <motion.p 
              initial={reduce ? false : { opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-6 text-sm leading-relaxed sm:text-base md:text-lg" 
              style={{ color: "var(--text-muted)" }}
            >
              Explore our video tutorials, structured courses, and advanced workflows stored in dedicated backend pipelines.
            </motion.p>

            {/* Quick Stat Bar */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 rounded-2xl border p-4 sm:p-6"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            >
              <div className="text-center">
                <div className="text-xl font-extrabold text-foreground sm:text-2xl">{categories.length} Categories</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>Curriculum</div>
              </div>
              <div className="border-x text-center" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="text-xl font-extrabold text-[#00D4FF] sm:text-2xl">{totalUsers > 0 ? `${totalUsers}+` : "Active"}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>Student Hub</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-[#FF2E9A] sm:text-2xl">{tutorials.length} Lessons</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>Mastery Courses</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. COURSE FILTER & GRID */}
      <section id="tutorials-grid" className="relative py-16 sm:py-24" style={{ background: "var(--background)" }}>
        <div className={SITE_CONTAINER}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                Active Tutorials & Masterclasses
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Browse live lessons, check duration indices, and learn spatial rendering.
              </p>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
              {/* View Mode Switch (Lessons vs Courses) */}
              <div className="flex items-center rounded-full border p-1 bg-card/60" style={{ borderColor: "var(--border-subtle)" }}>
                <button
                  onClick={() => setViewMode("lessons")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === "lessons" 
                      ? "bg-[#7B61FF] text-white shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  Lessons ({tutorials.length})
                </button>
                <button
                  onClick={() => setViewMode("courses")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === "courses" 
                      ? "bg-[#7B61FF] text-white shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Courses ({courses.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 md:w-64 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder="Search masterclasses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border bg-card/50 py-2 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground/50 transition-all focus:border-[#7B61FF] focus:outline-none focus:ring-1 focus:ring-[#7B61FF]/50"
                  style={{ borderColor: "var(--border-subtle)" }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              {viewMode === "lessons" && (
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-full border bg-card/50 py-2 px-3 text-xs font-semibold text-foreground transition-all focus:border-[#7B61FF] focus:outline-none"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Viewed</option>
                    <option value="likes">Top Liked</option>
                    <option value="title">Alphabetical</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Filter Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => { setActiveCategory("all"); setActiveSubcategory("all"); }}
              className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-wider font-bold transition-all border ${
                activeCategory === "all" 
                  ? "border-[#7B61FF] bg-[#7B61FF]/10 text-[#7B61FF] shadow-[0_0_15px_rgba(123,97,255,0.15)]" 
                  : "border-border/30 bg-card/25 text-muted-foreground/70 hover:border-border hover:text-foreground hover:bg-card/45"
              }`}
            >
              All Content
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.slug || cat.id); setActiveSubcategory("all"); }}
                className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-wider font-bold transition-all border ${
                  activeCategory === cat.slug || activeCategory === cat.id
                    ? "border-[#7B61FF] bg-[#7B61FF]/10 text-[#7B61FF] shadow-[0_0_15px_rgba(123,97,255,0.15)]" 
                    : "border-border/30 bg-card/25 text-muted-foreground/70 hover:border-border hover:text-foreground hover:bg-card/45"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Subcategory Pills */}
          {currentSubcategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-6 pl-1 border-l-2 border-[#7B61FF]/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-2 pl-2">Subcategory:</span>
              <button
                onClick={() => setActiveSubcategory("all")}
                className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  activeSubcategory === "all"
                    ? "border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white"
                }`}
              >
                All Subcategories
              </button>
              {currentSubcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubcategory(sub.slug || sub.id)}
                  className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    activeSubcategory === (sub.slug || sub.id)
                      ? "border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* Tag Filter Chips */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-8">
              <Tag className="h-3.5 w-3.5 text-muted-foreground/60 mr-1" />
              <button
                onClick={() => setActiveTag("all")}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                  activeTag === "all" ? "bg-white/15 text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Tags
              </button>
              {availableTags.slice(0, 10).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTag(t === activeTag ? "all" : t)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                    activeTag === t ? "bg-[#7B61FF] text-white" : "bg-card/40 text-muted-foreground hover:bg-card/80 hover:text-foreground"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          {/* LOADING STATE */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 mt-8">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
                  <div className="aspect-video w-full rounded-xl bg-zinc-800" />
                  <div className="h-5 w-3/4 rounded bg-zinc-800" />
                  <div className="h-4 w-1/2 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : viewMode === "courses" ? (
            /* COURSES GRID */
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filteredCourses.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-zinc-400">
                    <BookOpen className="mx-auto h-12 w-12 opacity-30" />
                    <p className="mt-4 text-base font-semibold">No courses match your filter.</p>
                    <button onClick={resetFilters} className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#7B61FF] hover:underline font-bold">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  filteredCourses.map((course, idx) => (
                    <motion.div
                      key={course.id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, delay: idx * 0.05 }}
                      className="group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:translate-y-[-4px] cursor-pointer"
                      style={{ 
                        borderColor: "var(--border-subtle)", 
                        background: "var(--card)",
                        boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)"
                      }}
                      onClick={() => setActiveCourseModal(course)}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent z-10" />
                        
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0F1D2E] to-[#081018]">
                            <BookOpen className="h-20 w-20 text-[#00D4FF] opacity-30" />
                          </div>
                        )}

                        <div className="absolute left-3 top-3 z-20 rounded-md border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00D4FF]">
                          Structured Course
                        </div>

                        <div className="absolute right-3 top-3 z-20 rounded-md border bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#7B61FF]" style={{ borderColor: "var(--border-subtle)" }}>
                          {course.tutorial_count || 0} Lessons
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-display text-lg font-bold text-foreground transition-colors duration-200 group-hover:text-[#00D4FF]">
                          {course.title}
                        </h3>
                        <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>

                        <div className="mt-4 border-t pt-4 flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
                          <span className="text-xs font-semibold text-foreground/80">
                            By {course.instructor}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00D4FF] group-hover:translate-x-1 transition-transform">
                            View Syllabus <ChevronRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* LESSONS / TUTORIALS GRID */
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filteredTutorials.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-zinc-400">
                    <Video className="mx-auto h-12 w-12 opacity-30" />
                    <p className="mt-4 text-base font-semibold">No tutorials found matching your search.</p>
                    <button onClick={resetFilters} className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#7B61FF] hover:underline font-bold">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  filteredTutorials.map((tutorial, idx) => {
                    const isLiked = likedIds.has(tutorial.id);
                    return (
                      <motion.div
                        key={tutorial.id}
                        layout={!reduce}
                        initial={reduce ? false : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35, delay: idx * 0.05 }}
                        className="group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:translate-y-[-4px]"
                        style={{ 
                          borderColor: "var(--border-subtle)", 
                          background: "var(--card)",
                          boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)"
                        }}
                      >
                        {/* Thumbnail area with play button overlay */}
                        <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent z-10" />
                          
                          {/* Mastery badge */}
                          {tutorial.premium === 1 && (
                            <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-[#7B61FF]/30 bg-[#7B61FF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A291FF]">
                              <Award className="h-3 w-3 text-[#A291FF]" />
                              Mastery Track
                            </div>
                          )}

                          {/* Course badge */}
                          <div className="absolute right-3 top-3 z-20 rounded-md border bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border-subtle)", color: "#7B61FF" }}>
                            {tutorial.category}
                          </div>

                          {/* Image / Gradient Placeholder */}
                          {tutorial.thumbnail_url ? (
                            <img src={tutorial.thumbnail_url} alt={tutorial.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div 
                              className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                              style={{
                                background: tutorial.premium === 1 
                                  ? "linear-gradient(135deg, #180F2E 0%, #0c0818 100%)" 
                                  : "linear-gradient(135deg, #0F1D2E 0%, #081018 100%)"
                              }}
                            >
                              <div className="flex h-full w-full items-center justify-center opacity-30">
                                {tutorial.premium === 1 ? (
                                  <Brain className="h-20 w-20 text-[#7B61FF]" />
                                ) : (
                                  <Sparkles className="h-20 w-20 text-[#00D4FF]" />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Floating metadata */}
                          <div className="absolute bottom-3 left-4 z-20 flex items-center gap-4 text-xs font-semibold text-white/90">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {tutorial.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />
                              {tutorial.difficulty}
                            </span>
                          </div>

                          {/* Action hover overlay */}
                          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/45 backdrop-blur-[2px]">
                            <button
                              onClick={() => handlePlayVideo(tutorial)}
                              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black"
                            >
                              <Play className="h-6 w-6 translate-x-[2px]" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>

                        {/* Meta info & Description */}
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-display text-lg font-bold text-foreground transition-colors duration-200 group-hover:text-[#7B61FF]">
                            {tutorial.title}
                          </h3>
                          <p className="mt-2.5 flex-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            {tutorial.description}
                          </p>

                          {/* Tags */}
                          {Array.isArray(tutorial.tags) && tutorial.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {tutorial.tags.map(tag => (
                                <span key={tag} className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-medium text-zinc-400">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }} />

                          <div className="flex items-center justify-between">
                            {/* Instructor */}
                            <div className="flex items-center gap-2">
                              <span 
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                                style={{
                                  background: tutorial.premium === 1 
                                    ? "linear-gradient(135deg, #7B61FF, #FF2E9A)" 
                                    : "linear-gradient(135deg, #00D4FF, #7B61FF)"
                                }}
                              >
                                {tutorial.instructor ? tutorial.instructor.split(" ")[0][0] : "R"}
                              </span>
                              <span className="text-[11px] font-semibold text-foreground/80">
                                {tutorial.instructor}
                              </span>
                            </div>

                            {/* Views & Likes */}
                            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-subtle)" }}>
                              <span className="flex items-center gap-1" title="Views">
                                <Eye className="h-3.5 w-3.5" />
                                {tutorial.views}
                              </span>
                              <button 
                                onClick={(e) => handleLike(e, tutorial.id)}
                                className={`flex items-center gap-1 transition-colors ${
                                  isLiked ? "text-rose-500 font-bold" : "hover:text-rose-400"
                                }`}
                                title={isLiked ? "Unlike Lesson" : "Like Lesson"}
                              >
                                <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-rose-500" : ""}`} />
                                {tutorial.likes}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* 4. CURRICULUM ROADMAP TIMELINE */}
      <section className="relative py-16 sm:py-24" style={{ background: "var(--background)" }}>
        <div className={SITE_CONTAINER}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              The Platform Mastery Roadmap
            </h2>
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Four milestones to transition from beginner generation to executing a highly sophisticated creative vision.
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-4xl">
            <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-border md:left-1/2" />

            <div className="space-y-12">
              <div className="relative flex flex-col md:flex-row md:justify-between">
                <div className="absolute left-2.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#7B61FF] ring-4 ring-background md:left-1/2 md:-ml-2" />
                <div className="pl-10 md:w-[45%] md:pl-0 md:text-right">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7B61FF]">Phase 01</span>
                  <h3 className="font-display mt-1 text-lg font-bold text-foreground">Understand Core Features</h3>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Learn the core functionality of the studio suite. Understand parameter tuning, aspect ratios, and the nuances of various generation models available on the platform.
                  </p>
                </div>
                <div className="hidden md:block md:w-[45%]" />
              </div>

              <div className="relative flex flex-col md:flex-row md:justify-between">
                <div className="absolute left-2.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00D4FF] ring-4 ring-background md:left-1/2 md:-ml-2" />
                <div className="hidden md:block md:w-[45%]" />
                <div className="pl-10 md:w-[45%] md:pl-0">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00D4FF]">Phase 02</span>
                  <h3 className="font-display mt-1 text-lg font-bold text-foreground">Unlock Cinematic Composition</h3>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Transition from single elements to complex scenes. Discover how to effectively map lighting, atmospheric effects, and depth of field to achieve photorealistic results.
                  </p>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row md:justify-between">
                <div className="absolute left-2.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF2E9A] ring-4 ring-background md:left-1/2 md:-ml-2" />
                <div className="pl-10 md:w-[45%] md:pl-0 md:text-right">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FF2E9A]">Phase 03</span>
                  <h3 className="font-display mt-1 text-lg font-bold text-foreground">Ensure Character & Style Consistency</h3>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Master advanced techniques to lock down character aesthetics and structural fidelity across multiple generations, enabling cohesive storytelling.
                  </p>
                </div>
                <div className="hidden md:block md:w-[45%]" />
              </div>

              <div className="relative flex flex-col md:flex-row md:justify-between">
                <div className="absolute left-2.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 ring-4 ring-background md:left-1/2 md:-ml-2" />
                <div className="hidden md:block md:w-[45%]" />
                <div className="pl-10 md:w-[45%] md:pl-0">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-yellow-500">Phase 04</span>
                  <h3 className="font-display mt-1 text-lg font-bold text-foreground">Full Workflow Integration</h3>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Unify your knowledge by designing end-to-end workflows that combine generation, editing, upscale processing, and final output assembly seamlessly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER */}
      <section className="mesh-section py-16 md:py-24">
        <div className={`${SITE_CONTAINER} flex flex-col items-center text-center`}>
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--text-primary)" }}>
            Master the Creative Pipeline
          </h2>
          <p className="mt-4 max-w-xl text-sm md:text-base" style={{ color: "var(--text-muted)" }}>
            Deepen your mastery of the studio suite with high-resolution masterclasses, feature deep-dives, and structured workflow guides.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                const element = document.getElementById("tutorials-grid");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                } else {
                  window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
                }
              }}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-8 text-sm font-semibold text-white btn-gradient cursor-pointer"
            >
              Browse All Lessons
            </button>
            <Link
              href="/dashboard"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-8 text-sm font-semibold transition-colors hover:bg-card/45"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)", background: "var(--glass)" }}
            >
              Launch Studio Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 6. IMMERSIVE MODAL VIDEO PLAYER */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={reduce ? false : { scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-3xl border bg-card/90 shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row max-h-[90vh]"
              style={{ borderColor: "var(--border-subtle)", boxShadow: "0 25px 50px -12px rgba(123, 97, 255, 0.15)" }}
            >
              <button
                onClick={() => setActiveVideo(null)}
                className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 text-foreground transition-all hover:bg-foreground hover:text-background hover:scale-105"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative w-full md:w-[65%] bg-black flex-shrink-0 flex items-center justify-center min-h-[220px] sm:min-h-[300px]">
                {renderVideoMedia(activeVideo.video_url)}
              </div>

              {(() => {
                const liveVideo = tutorials.find(t => t.id === activeVideo.id) || activeVideo;
                return (
                  <div className="flex flex-col p-6 md:p-8 w-full border-t md:border-t-0 md:border-l bg-card/45 overflow-y-auto" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="rounded-md border bg-[#7B61FF]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7B61FF]" style={{ borderColor: "rgba(123,97,255,0.2)" }}>
                        {liveVideo.category}
                      </span>
                      
                      <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground ml-auto md:mr-12">
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          <span>{liveVideo.views}</span>
                        </div>
                        <button 
                          onClick={(e) => handleLike(e, liveVideo.id)}
                          className={`flex items-center gap-1.5 transition-all hover:scale-110 ${likedIds.has(liveVideo.id) ? 'text-[#FF2E9A]' : 'hover:text-[#FF2E9A]'}`}
                        >
                          <Heart className="h-4 w-4" fill={likedIds.has(liveVideo.id) ? "currentColor" : "none"} />
                          <span>{liveVideo.likes}</span>
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-display text-2xl font-bold text-foreground tracking-tight leading-snug">
                      {liveVideo.title}
                    </h3>
                    
                    <div className="mt-4 flex flex-col gap-1.5 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#7B61FF]" />
                        <span className="text-xs font-bold text-foreground">
                          <span className="text-muted-foreground/60 font-normal mr-1.5">By</span>
                          {liveVideo.instructor}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                        <Clock className="h-3.5 w-3.5" />
                        {liveVideo.duration}
                      </span>
                    </div>

                    <div className="mt-5 flex-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-2.5">About This Masterclass</h4>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {liveVideo.description}
                      </p>
                    </div>

                    {liveVideo.premium === 1 && (
                      <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#7B61FF]/30 bg-[#7B61FF]/10 p-4 text-xs text-[#A291FF] shadow-[0_0_15px_rgba(123,97,255,0.1)]">
                        <Sparkles className="h-5 w-5 shrink-0 text-[#A291FF] mt-0.5" />
                        <div className="leading-relaxed">
                          <span className="font-bold text-foreground block mb-1">Interactive Learning Vector</span> 
                          Recreate these advanced effects directly inside the Generation Studio dashboard using the specific prompt vectors outlined in this masterclass.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. COURSE SYLLABUS MODAL */}
      <AnimatePresence>
        {activeCourseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={reduce ? false : { scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <button
                onClick={() => setActiveCourseModal(null)}
                className="absolute right-4 top-4 z-50 rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <span className="rounded-md border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00D4FF]">
                  Course Syllabus & Blueprint
                </span>
                <h3 className="font-display text-2xl font-bold text-white mt-3">{activeCourseModal.title}</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{activeCourseModal.description}</p>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">Included Lessons</h4>
                
                {(() => {
                  const courseTutorials = tutorials.filter(t => t.course_id === activeCourseModal.id);
                  if (courseTutorials.length === 0) {
                    return <p className="text-xs text-zinc-500 py-4">No lessons currently attached to this course.</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {courseTutorials.map((tut, i) => (
                        <div
                          key={tut.id}
                          onClick={() => { setActiveCourseModal(null); handlePlayVideo(tut); }}
                          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 hover:border-[#7B61FF]/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7B61FF]/20 text-[#7B61FF] text-xs font-bold">
                              {i + 1}
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-white group-hover:text-[#7B61FF] transition-colors">{tut.title}</div>
                              <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                                <span>{tut.duration}</span>
                                <span>•</span>
                                <span>{tut.difficulty}</span>
                              </div>
                            </div>
                          </div>
                          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7B61FF] text-white shadow transition-transform group-hover:scale-110">
                            <Play className="h-3.5 w-3.5 translate-x-[1px]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
