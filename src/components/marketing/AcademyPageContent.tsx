"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  Play, Sparkles, BookOpen, Clock, Heart, Eye, 
  ArrowRight, Lock, DollarSign, Brain, BarChart, 
  CheckCircle2, X, AlertCircle, Award, Search, User
} from "lucide-react";
import { SITE_CONTAINER } from "@/lib/site-layout";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  duration: string;
  difficulty: string;
  views: number;
  likes: number;
  premium: number;
  instructor: string;
  created_at: string;
}

// Bulletproof local fallbacks matching the seed data
const LOCAL_FALLBACK_TUTORIALS: Tutorial[] = [
  {
    id: "fallback-1",
    title: "Understanding Spatial Rendering & Lighting",
    description: "Deep dive into the platform's spatial rendering capabilities. Learn how to map lighting vectors for cinematic realism.",
    video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnail_url: "",
    category: "features",
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
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeVideo, setActiveVideo] = useState<Tutorial | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Fetch tutorials from the backend database on mount and poll for real-time stats
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      try {
        const res = await fetch("/api/academy/tutorials");
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          if (data.ok && Array.isArray(data.tutorials) && data.tutorials.length > 0) {
            // Keep local optimistic updates intact if they are higher, or just sync completely
            setTutorials(data.tutorials);
          }
          if (data.ok && typeof data.totalUsers === "number") {
            setTotalUsers(data.totalUsers);
          }
        }
      } catch (e) {
        console.error("Failed to load backend tutorials", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    // Initial load
    loadData();

    // Real-time polling every 5 seconds
    const intervalId = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    // Recover liked IDs from session/local storage on client mount
    try {
      const stored = localStorage.getItem("ruhgen_liked_tutorials");
      if (stored) {
        setLikedIds(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  const handlePlayVideo = async (tutorial: Tutorial) => {
    setActiveVideo(tutorial);
    // Increment view count in backend
    try {
      await fetch(`/api/academy/tutorials/${tutorial.id}/view`, { method: "POST" });
      setTutorials(prev => 
        prev.map(t => t.id === tutorial.id ? { ...t, views: t.views + 1 } : t)
      );
    } catch {}
  };

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
      await fetch(`/api/academy/tutorials/${id}/${isLiking ? 'like' : 'unlike'}`, { method: "POST" });
      setTutorials(prev => 
        prev.map(t => {
          if (t.id === id) {
            return { ...t, likes: Math.max(0, t.likes + (isLiking ? 1 : -1)) };
          }
          return t;
        })
      );
    } catch {}
  };

  // Filter tutorials
  const filteredTutorials = tutorials.filter(t => {
    const matchesCategory = activeCategory === "all" || t.category === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b pt-24 sm:pt-32" style={{ borderColor: "var(--border-subtle)", background: "var(--rich-black)" }}>
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
              RUHGEN Academy
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
              Dive deep into feature mechanics, explore comprehensive courses, and elevate your creative output through our specialized learning paths.
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
                <div className="text-xl font-extrabold text-white sm:text-2xl">{new Set(tutorials.map(t => t.category)).size} Modules</div>
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
      <section id="tutorials-grid" className="relative py-16 sm:py-24" style={{ background: "var(--deep-black)" }}>
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

            {/* Search Bar */}
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                placeholder="Search masterclasses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-[#7B61FF] focus:outline-none focus:ring-1 focus:ring-[#7B61FF]/50"
                style={{ borderColor: "var(--border-subtle)" }}
              />
            </div>
          </div>

          {/* Filter Tabs - Independent Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-10">
            {[
              { id: "all", label: "All Lessons" },
              { id: "features", label: "Feature Understanding" },
              { id: "courses", label: "Courses" },
              { id: "masterclasses", label: "Masterclasses" },
              { id: "workflows", label: "Advanced Workflows" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-wider font-bold transition-all border ${
                  activeCategory === tab.id 
                    ? "border-[#7B61FF] bg-[#7B61FF]/10 text-[#7B61FF] shadow-[0_0_15px_rgba(123,97,255,0.15)]" 
                    : "border-white/5 bg-black/20 text-white/40 hover:border-white/10 hover:text-white hover:bg-black/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filteredTutorials.map((tutorial, idx) => {
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
                      background: "var(--soft-black)",
                      boxShadow: "0 10px 30px -15px rgba(0,0,0,0.5)"
                    }}
                  >
                    {/* Thumbnail area with play button overlay */}
                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                      {/* Gradient overlay for premium feel */}
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
                      <h3 className="font-display text-lg font-bold text-white transition-colors duration-200 group-hover:text-[#7B61FF]">
                        {tutorial.title}
                      </h3>
                      <p className="mt-2.5 flex-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {tutorial.description}
                      </p>

                      <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }} />

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
                            {tutorial.instructor.split(" ")[0][0]}
                          </span>
                          <span className="text-[11px] font-semibold text-white/80">
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
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 4. CURRICULUM ROADMAP TIMELINE */}
      <section className="relative py-16 sm:py-24" style={{ background: "var(--deep-black)" }}>
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
            {/* Timeline center line */}
            <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-zinc-800 md:left-1/2" />

            <div className="space-y-12">
              {/* Step 1 */}
              <div className="relative flex flex-col md:flex-row md:justify-between">
                <div className="absolute left-2.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#7B61FF] ring-4 ring-black md:left-1/2 md:-ml-2" />
                <div className="pl-10 md:w-[45%] md:pl-0 md:text-right">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7B61FF]">Phase 01</span>
                  <h3 className="font-display mt-1 text-lg font-bold text-white">Understand Core Features</h3>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Learn the core functionality of the studio suite. Understand parameter tuning, aspect ratios, and the nuances of various generation models available on the platform.
                  </p>
                </div>
                <div className="hidden md:block md:w-[45%]" />
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col md:flex-row md:justify-between">
                <div className="absolute left-2.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00D4FF] ring-4 ring-black md:left-1/2 md:-ml-2" />
                <div className="hidden md:block md:w-[45%]" />
                <div className="pl-10 md:w-[45%] md:pl-0">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00D4FF]">Phase 02</span>
                  <h3 className="font-display mt-1 text-lg font-bold text-white">Unlock Cinematic Composition</h3>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Transition from single elements to complex scenes. Discover how to effectively map lighting, atmospheric effects, and depth of field to achieve photorealistic results.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col md:flex-row md:justify-between">
                <div className="absolute left-2.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF2E9A] ring-4 ring-black md:left-1/2 md:-ml-2" />
                <div className="pl-10 md:w-[45%] md:pl-0 md:text-right">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FF2E9A]">Phase 03</span>
                  <h3 className="font-display mt-1 text-lg font-bold text-white">Ensure Character & Style Consistency</h3>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Master advanced techniques to lock down character aesthetics and structural fidelity across multiple generations, enabling cohesive storytelling.
                  </p>
                </div>
                <div className="hidden md:block md:w-[45%]" />
              </div>

              {/* Step 4 */}
              <div className="relative flex flex-col md:flex-row md:justify-between">
                <div className="absolute left-2.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 ring-4 ring-black md:left-1/2 md:-ml-2" />
                <div className="hidden md:block md:w-[45%]" />
                <div className="pl-10 md:w-[45%] md:pl-0">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-yellow-500">Phase 04</span>
                  <h3 className="font-display mt-1 text-lg font-bold text-white">Full Workflow Integration</h3>
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
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-8 text-sm font-semibold transition-colors hover:bg-white/5"
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
              className="relative w-full max-w-5xl overflow-hidden rounded-3xl border bg-black/60 shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row"
              style={{ borderColor: "var(--border-subtle)", boxShadow: "0 25px 50px -12px rgba(123, 97, 255, 0.15)" }}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveVideo(null)}
                className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white transition-all hover:bg-white hover:text-black hover:scale-105"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Video Player (Left Side on large screens) */}
              <div className="relative w-full md:w-[65%] bg-black/95 flex-shrink-0 flex items-center justify-center min-h-[300px]">
                <video
                  src={activeVideo.video_url}
                  className="w-full max-h-[75vh] object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              </div>

              {/* Video Details & Dynamic Stats (Right Side) */}
              {(() => {
                // Ensure we use the latest state for real-time views/likes
                const liveVideo = tutorials.find(t => t.id === activeVideo.id) || activeVideo;
                return (
                  <div className="flex flex-col p-6 md:p-8 w-full border-t md:border-t-0 md:border-l bg-zinc-950/40" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="rounded-md border bg-[#7B61FF]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7B61FF]" style={{ borderColor: "rgba(123,97,255,0.2)" }}>
                        {liveVideo.category}
                      </span>
                      
                      {/* Real-time Dynamic Stats */}
                      <div className="flex items-center gap-4 text-xs font-semibold text-white/50 ml-auto md:mr-12">
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
                    
                    <h3 className="font-display text-2xl font-bold text-white tracking-tight leading-snug">
                      {liveVideo.title}
                    </h3>
                    
                    <div className="mt-4 flex flex-col gap-1.5 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#7B61FF]" />
                        <span className="text-xs font-bold text-white">
                          <span className="text-white/40 font-normal mr-1.5">By</span>
                          {liveVideo.instructor}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wide">
                        <Clock className="h-3.5 w-3.5" />
                        {liveVideo.duration}
                      </span>
                    </div>

                    <div className="mt-5 flex-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2.5">About This Masterclass</h4>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {liveVideo.description}
                      </p>
                    </div>

                    {liveVideo.premium === 1 && (
                      <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#7B61FF]/30 bg-[#7B61FF]/10 p-4 text-xs text-[#A291FF] shadow-[0_0_15px_rgba(123,97,255,0.1)]">
                        <Sparkles className="h-5 w-5 shrink-0 text-[#A291FF] mt-0.5" />
                        <div className="leading-relaxed">
                          <span className="font-bold text-white block mb-1">Interactive Learning Vector</span> 
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
    </>
  );
}
