"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, Edit2, Trash2, BookOpen, Clock, Heart, Eye, 
  Lock, Unlock, LayoutDashboard, X, AlertCircle, Sparkles, Award,
  Video, Upload, Link as LinkIcon, FolderTree, BarChart3, CheckCircle2,
  Search, Filter, ChevronRight, Play, Globe, Shield, RefreshCw
} from "lucide-react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { 
  ProSettingsHero, 
  ProSettingsCard,
  ProFieldGroup, 
  proInputClass, 
  proInputStyle,
  ProLabel
} from "@/components/settings/ProSettingsShell";

interface Tutorial {
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

interface Course {
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

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
}

interface StatsData {
  totalTutorials: number;
  publishedTutorials: number;
  draftTutorials: number;
  totalCourses: number;
  totalCategories: number;
  totalViews: number;
  totalLikes: number;
  uniqueViewsRecorded: number;
  uniqueLikesRecorded: number;
  topTutorials: Array<{ id: string; title: string; views: number; likes: number }>;
}

function AcademyCmsContent() {
  const { authHeaders } = useAdminAuth();
  const reduce = useReducedMotion() === true;

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<"tutorials" | "courses" | "categories" | "analytics">("tutorials");

  // Data State
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal State for Tutorials
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoSource, setVideoSource] = useState<"upload" | "external">("external");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [category, setCategory] = useState("features");
  const [subcategory, setSubcategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [status, setStatus] = useState("published");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [views, setViews] = useState("0");
  const [likes, setLikes] = useState("0");
  const [premium, setPremium] = useState(false);
  const [instructor, setInstructor] = useState("RUHGEN Masterclass");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Modal State for Courses
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [cTitle, setCTitle] = useState("");
  const [cDescription, setCDescription] = useState("");
  const [cThumbnailUrl, setCThumbnailUrl] = useState("");
  const [cCategory, setCCategory] = useState("courses");
  const [cSubcategory, setCSubcategory] = useState("");
  const [cTagsInput, setCTagsInput] = useState("");
  const [cDifficulty, setCDifficulty] = useState("Intermediate");
  const [cPremium, setCPremium] = useState(false);
  const [cStatus, setCStatus] = useState("published");
  const [cDisplayOrder, setCDisplayOrder] = useState("0");
  const [cInstructor, setCInstructor] = useState("RUHGEN Founders & VFX Leads");

  // Modal State for Categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Modal State for Subcategories
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [subCatParentId, setSubCatParentId] = useState("");
  const [subCatName, setSubCatName] = useState("");
  const [subCatSlug, setSubCatSlug] = useState("");

  // Preview Modal
  const [previewTutorial, setPreviewTutorial] = useState<Tutorial | null>(null);

  // File Upload Helper to /api/admin/upload with real-time XHR progress & backend fallback
  const uploadFile = (file: File, folderName: string = "tutorials"): Promise<string | null> => {
    return new Promise((resolve) => {
      const h = authHeaders();
      if (!h.Authorization) {
        setError("Upload failed: Session expired. Please sign in again.");
        resolve(null);
        return;
      }

      setError("");
      setUploading(true);
      setUploadProgress(`Preparing ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

      const form = new FormData();
      form.set("folder", folderName);
      form.set("file", file);

      let isDone = false;

      const finish = (src: string | null, errorMsg?: string) => {
        if (isDone) return;
        isDone = true;
        setUploading(false);
        setUploadProgress("");

        if (src) {
          setSuccess(`Uploaded successfully: ${src}`);
          if (folderName === "tutorials") {
            setVideoUrl(src);
          } else {
            setThumbnailUrl(src);
          }
          resolve(src);
        } else {
          if (errorMsg) setError(errorMsg);
          resolve(null);
        }
      };

      // Determine candidate endpoints: hit direct backend port first to bypass Next.js proxy limits on large files
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
      const endpoints = [
        `${backendPort}/api/admin/upload`,
        "/api/admin/upload"
      ];

      const tryEndpoint = (index: number) => {
        if (index >= endpoints.length) {
          finish(null, "Upload failed: All backend endpoints timed out or dropped connection.");
          return;
        }

        const endpoint = endpoints[index];
        const xhr = new XMLHttpRequest();
        xhr.timeout = 90000; // 90 seconds timeout

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            const loadedMb = (event.loaded / (1024 * 1024)).toFixed(1);
            const totalMb = (event.total / (1024 * 1024)).toFixed(1);
            setUploadProgress(`Uploading ${file.name}: ${percent}% (${loadedMb} / ${totalMb} MB)`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.ok && data.src) {
                finish(data.src);
                return;
              } else {
                tryEndpoint(index + 1);
                return;
              }
            } catch {
              tryEndpoint(index + 1);
              return;
            }
          } else {
            tryEndpoint(index + 1);
          }
        };

        xhr.onerror = () => {
          tryEndpoint(index + 1);
        };

        xhr.ontimeout = () => {
          tryEndpoint(index + 1);
        };

        try {
          xhr.open("POST", endpoint, true);
          if (h.Authorization) xhr.setRequestHeader("Authorization", h.Authorization);
          xhr.send(form);
        } catch {
          tryEndpoint(index + 1);
        }
      };

      tryEndpoint(0);
    });
  };

  // Fetch all CMS Data
  const fetchData = async () => {
    const h = authHeaders();
    setLoading(true);
    try {
      const [resTut, resCourse, resCat, resStats] = await Promise.all([
        fetch("/api/admin/academy/tutorials", { headers: h }).catch(() => null),
        fetch("/api/admin/academy/courses", { headers: h }).catch(() => null),
        fetch("/api/academy/categories").catch(() => null),
        fetch("/api/admin/academy/stats", { headers: h }).catch(() => null)
      ]);

      if (resTut && resTut.ok) {
        const data = await resTut.json();
        if (data.ok && Array.isArray(data.tutorials)) setTutorials(data.tutorials);
      }
      if (resCourse && resCourse.ok) {
        const data = await resCourse.json();
        if (data.ok && Array.isArray(data.courses)) setCourses(data.courses);
      }
      if (resCat && resCat.ok) {
        const data = await resCat.json();
        if (data.ok && Array.isArray(data.categories)) setCategories(data.categories);
      }
      if (resStats && resStats.ok) {
        const data = await resStats.json();
        if (data.ok && data.stats) setStats(data.stats);
      }
    } catch {
      setError("Failed to sync backend data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- TUTORIAL CMS HANDLERS ---
  const handleOpenCreateTutorial = () => {
    setEditingTutorial(null);
    setTitle("");
    setDescription("");
    setVideoSource("upload");
    setVideoUrl("");
    setThumbnailUrl("");
    setCourseId("");
    setCategory("features");
    setSubcategory("");
    setTagsInput("Generative, Spatial, Lighting");
    setDuration("15 min");
    setDifficulty("Beginner");
    setStatus("published");
    setDisplayOrder("0");
    setViews("0");
    setLikes("0");
    setPremium(false);
    setInstructor("Elena Voss (Creative Director)");
    setError("");
    setSuccess("");
    setIsTutorialModalOpen(true);
  };

  const handleOpenEditTutorial = (t: Tutorial) => {
    setEditingTutorial(t);
    setTitle(t.title);
    setDescription(t.description);
    setVideoSource(t.video_source || (t.video_url.startsWith("/media/") ? "upload" : "external"));
    setVideoUrl(t.video_url);
    setThumbnailUrl(t.thumbnail_url);
    setCourseId(t.course_id || "");
    setCategory(t.category);
    setSubcategory(t.subcategory || "");
    setTagsInput(Array.isArray(t.tags) ? t.tags.join(", ") : "");
    setDuration(t.duration);
    setDifficulty(t.difficulty);
    setStatus(t.status || "published");
    setDisplayOrder((t.display_order || 0).toString());
    setViews(t.views.toString());
    setLikes(t.likes.toString());
    setPremium(t.premium === 1);
    setInstructor(t.instructor);
    setError("");
    setSuccess("");
    setIsTutorialModalOpen(true);
  };

  const handleSaveTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !category || !duration.trim()) {
      setError("Title, Category, and Duration are required.");
      return;
    }

    if (videoSource === "upload" && (!videoUrl || (!videoUrl.includes("/media/") && !videoUrl.startsWith("http")))) {
      setError("Please select and upload a video file before saving.");
      return;
    }

    if (videoSource === "external" && !videoUrl.trim()) {
      setError("Please enter a valid external video URL.");
      return;
    }

    setSubmitting(true);
    try {
      const h = authHeaders();
      const method = editingTutorial ? "PUT" : "POST";
      const url = editingTutorial
        ? `/api/admin/academy/tutorials/${editingTutorial.id}`
        : "/api/admin/academy/tutorials";

      const tagsArray = tagsInput
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

      const res = await fetch(url, {
        method,
        headers: {
          ...h,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          video_source: videoSource,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          course_id: courseId || null,
          category,
          subcategory,
          tags: tagsArray,
          duration,
          difficulty,
          status,
          display_order: parseInt(displayOrder, 10) || 0,
          views: parseInt(views, 10) || 0,
          likes: parseInt(likes, 10) || 0,
          premium,
          instructor
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess(editingTutorial ? "Tutorial updated successfully." : "New tutorial published.");
        setIsTutorialModalOpen(false);
        fetchData();
      } else {
        setError(data.error || "Failed to save tutorial.");
      }
    } catch {
      setError("Network error while saving tutorial.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTutorial = async (id: string) => {
    if (!window.confirm("Delete this lesson permanently? Replaced media files will also be cleaned up.")) return;
    setError("");
    setSuccess("");
    try {
      const h = authHeaders();
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

      let res = await fetch(`${backendPort}/api/admin/academy/tutorials/${id}`, {
        method: "DELETE",
        headers: h
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/api/admin/academy/tutorials/${id}`, {
          method: "DELETE",
          headers: h
        }).catch(() => null);
      }

      if (res && res.ok) {
        setSuccess("Tutorial deleted cleanly.");
        setTutorials(prev => prev.filter(t => t.id !== id));
        fetchData();
      } else {
        const data = res ? await res.json().catch(() => ({})) : {};
        setError(data.error || "Failed to delete tutorial.");
      }
    } catch {
      setError("Network error deleting tutorial.");
    }
  };

  // --- COURSE CMS HANDLERS ---
  const handleOpenCreateCourse = () => {
    setEditingCourse(null);
    setCTitle("");
    setCDescription("");
    setCThumbnailUrl("");
    setCCategory("courses");
    setCSubcategory("");
    setCTagsInput("Course, Production, Masterclass");
    setCDifficulty("Intermediate");
    setCPremium(false);
    setCStatus("published");
    setCDisplayOrder("0");
    setCInstructor("RUHGEN Founders & VFX Leads");
    setError("");
    setSuccess("");
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (c: Course) => {
    setEditingCourse(c);
    setCTitle(c.title);
    setCDescription(c.description);
    setCThumbnailUrl(c.thumbnail_url);
    setCCategory(c.category);
    setCSubcategory(c.subcategory || "");
    setCTagsInput(Array.isArray(c.tags) ? c.tags.join(", ") : "");
    setCDifficulty(c.difficulty);
    setCPremium(c.premium === 1);
    setCStatus(c.status || "published");
    setCDisplayOrder((c.display_order || 0).toString());
    setCInstructor(c.instructor);
    setError("");
    setSuccess("");
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim()) {
      setError("Course title is required.");
      return;
    }
    setSubmitting(true);
    try {
      const h = authHeaders();
      const method = editingCourse ? "PUT" : "POST";
      const url = editingCourse
        ? `/api/admin/academy/courses/${editingCourse.id}`
        : "/api/admin/academy/courses";

      const tagsArray = cTagsInput.split(",").map(t => t.trim()).filter(Boolean);

      const res = await fetch(url, {
        method,
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cTitle,
          description: cDescription,
          thumbnail_url: cThumbnailUrl,
          category: cCategory,
          subcategory: cSubcategory,
          tags: tagsArray,
          difficulty: cDifficulty,
          premium: cPremium,
          status: cStatus,
          display_order: parseInt(cDisplayOrder, 10) || 0,
          instructor: cInstructor
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess(editingCourse ? "Course updated." : "Course created.");
        setIsCourseModalOpen(false);
        fetchData();
      } else {
        setError(data.error || "Failed to save course.");
      }
    } catch {
      setError("Network error saving course.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm("Delete course? Lessons linked to this course will remain as standalone lessons.")) return;
    try {
      const h = authHeaders();
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

      let res = await fetch(`${backendPort}/api/admin/academy/courses/${id}`, { method: "DELETE", headers: h }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`/api/admin/academy/courses/${id}`, { method: "DELETE", headers: h }).catch(() => null);
      }

      if (res && res.ok) {
        setSuccess("Course deleted.");
        setCourses(prev => prev.filter(c => c.id !== id));
        fetchData();
      } else {
        setError("Failed to delete course.");
      }
    } catch {
      setError("Error deleting course.");
    }
  };

  // --- CATEGORIES HANDLERS ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      const h = authHeaders();
      const res = await fetch("/api/admin/academy/categories", {
        method: "POST",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, slug: catSlug, description: catDesc })
      });
      if (res.ok) {
        setSuccess("Category added.");
        setIsCategoryModalOpen(false);
        setCatName(""); setCatSlug(""); setCatDesc("");
        fetchData();
      }
    } catch {
      setError("Failed to create category.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Delete category and its subcategories?")) return;
    try {
      const h = authHeaders();
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

      let res = await fetch(`${backendPort}/api/admin/academy/categories/${id}`, { method: "DELETE", headers: h }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`/api/admin/academy/categories/${id}`, { method: "DELETE", headers: h }).catch(() => null);
      }

      if (res && res.ok) {
        setSuccess("Category deleted.");
        setCategories(prev => prev.filter(c => c.id !== id));
        fetchData();
      }
    } catch {
      setError("Failed deleting category.");
    }
  };

  // --- SUBCATEGORIES HANDLERS ---
  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCatName.trim() || !subCatParentId) return;
    try {
      const h = authHeaders();
      const res = await fetch("/api/admin/academy/subcategories", {
        method: "POST",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: subCatParentId, name: subCatName, slug: subCatSlug })
      });
      if (res.ok) {
        setSuccess("Subcategory added.");
        setIsSubcategoryModalOpen(false);
        setSubCatName(""); setSubCatSlug("");
        fetchData();
      }
    } catch {
      setError("Failed to create subcategory.");
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!window.confirm("Delete subcategory?")) return;
    try {
      const h = authHeaders();
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

      let res = await fetch(`${backendPort}/api/admin/academy/subcategories/${id}`, { method: "DELETE", headers: h }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`/api/admin/academy/subcategories/${id}`, { method: "DELETE", headers: h }).catch(() => null);
      }

      if (res && res.ok) {
        setSuccess("Subcategory deleted.");
        fetchData();
      }
    } catch {
      setError("Failed deleting subcategory.");
    }
  };

  // Filtered Tutorials for List
  const filteredTutorials = tutorials.filter(t => {
    const matchCat = filterCategory === "all" || t.category === filterCategory;
    const matchStat = filterStatus === "all" || (t.status || "published") === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    return matchCat && matchStat && matchQ;
  });

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-6xl space-y-8">
        
        {/* Header Hero */}
        <ProSettingsHero
          eyebrow="RUHGEN Academy CMS"
          title="Academy Management Platform"
          description="Full control over educational courses, video lessons, multi-tiered categories, video uploads, and viewer engagement statistics."
          actions={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#7B61FF]/35"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
                Admin Dashboard
              </Link>
              <button
                onClick={handleOpenCreateTutorial}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 shadow-lg"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)"
                }}
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                New Video Lesson
              </button>
            </div>
          }
        />

        {/* Global Feedback Notifications */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Admin CMS Navigation Tabs */}
        <div className="flex border-b border-border/40 space-x-2">
          <button
            onClick={() => setActiveTab("tutorials")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              activeTab === "tutorials"
                ? "border-[#7B61FF] text-[#7B61FF]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="h-4 w-4" />
            Video Lessons ({tutorials.length})
          </button>

          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              activeTab === "courses"
                ? "border-[#7B61FF] text-[#7B61FF]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Structured Courses ({courses.length})
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              activeTab === "categories"
                ? "border-[#7B61FF] text-[#7B61FF]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderTree className="h-4 w-4" />
            Categories & Subcategories ({categories.length})
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              activeTab === "analytics"
                ? "border-[#7B61FF] text-[#7B61FF]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics & Engagement Metrics
          </button>
        </div>

        {/* TAB 1: VIDEO LESSONS MANAGEMENT */}
        {activeTab === "tutorials" && (
          <div className="space-y-6">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border bg-card/50 py-2 pl-9 pr-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#7B61FF]"
                    style={{ borderColor: "var(--border-subtle)" }}
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-xl border bg-card/50 py-2 px-3 text-xs font-semibold text-foreground focus:outline-none"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border bg-card/50 py-2 px-3 text-xs font-semibold text-foreground focus:outline-none"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="text-xs text-muted-foreground font-semibold">
                Showing {filteredTutorials.length} of {tutorials.length} lessons
              </div>
            </div>

            {/* Tutorials Table / Grid */}
            <ProSettingsCard>
              <ProFieldGroup title="Published & Draft Lessons" description="Manage video source, duration, difficulty, and publish status.">
                {loading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">Loading academy content database...</div>
                ) : filteredTutorials.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No video lessons found matching criteria. Click "New Video Lesson" to publish one.
                  </div>
                ) : (
                  <div className="divide-y border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    {filteredTutorials.map((t) => (
                      <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                        <div className="flex items-start gap-4">
                          {/* Thumbnail / Video Source Icon */}
                          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-900 border" style={{ borderColor: "var(--border-subtle)" }}>
                            {t.thumbnail_url ? (
                              <img src={t.thumbnail_url} alt={t.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[#7B61FF]/10 text-[#7B61FF]">
                                <Video className="h-6 w-6" />
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[9px] font-bold text-white">
                              {t.duration}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-foreground text-sm">{t.title}</h4>
                              <span className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                t.status === "draft" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}>
                                {t.status || "published"}
                              </span>
                              {t.premium === 1 && (
                                <span className="rounded-md border border-[#7B61FF]/30 bg-[#7B61FF]/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#A291FF]">
                                  Masterclass
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">{t.description}</p>

                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold pt-1">
                              <span>Category: <strong className="text-foreground">{t.category}</strong></span>
                              <span>Source: <strong className="text-foreground">{t.video_source === 'upload' ? 'Direct File Upload' : 'External Link'}</strong></span>
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {t.views}</span>
                              <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-500" /> {t.likes}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => setPreviewTutorial(t)}
                            className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold text-foreground hover:bg-card/80 transition-colors"
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            <Play className="h-3.5 w-3.5 text-[#00D4FF]" /> Preview
                          </button>
                          <button
                            onClick={() => handleOpenEditTutorial(t)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border text-foreground hover:border-[#7B61FF] hover:text-[#7B61FF] transition-colors"
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTutorial(t.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border text-rose-400 hover:border-rose-500 hover:bg-rose-500/10 transition-colors"
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ProFieldGroup>
            </ProSettingsCard>
          </div>
        )}

        {/* TAB 2: STRUCTURED COURSES MANAGEMENT */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Structured Learning Courses</h3>
                <p className="text-xs text-muted-foreground">Group multiple video lessons into structured multi-module courses.</p>
              </div>
              <button
                onClick={handleOpenCreateCourse}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7B61FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#684cf0]"
              >
                <Plus className="h-4 w-4" /> Create Course
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {courses.map((course) => (
                <div key={course.id} className="flex flex-col rounded-2xl border p-5 bg-card/60 space-y-4" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded bg-[#00D4FF]/10 text-[#00D4FF] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        {course.category}
                      </span>
                      <h4 className="font-bold text-base text-foreground mt-2">{course.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="font-semibold">{course.tutorial_count || 0} Attached Lessons</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEditCourse(course)} className="text-foreground hover:text-[#7B61FF]">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteCourse(course.id)} className="text-rose-400 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES & SUBCATEGORIES MANAGEMENT */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Categories & Subcategories Taxonomy</h3>
                <p className="text-xs text-muted-foreground">Manage dynamic curriculum categories and subcategory tags.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsCategoryModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-card">
                  <Plus className="h-3.5 w-3.5" /> Add Category
                </button>
                <button onClick={() => setIsSubcategoryModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#7B61FF] px-3 py-1.5 text-xs font-bold text-white">
                  <Plus className="h-3.5 w-3.5" /> Add Subcategory
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {categories.map((cat) => (
                <ProSettingsCard key={cat.id}>
                  <ProFieldGroup title={cat.name} description={`Slug: ${cat.slug}`}>
                    <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                      <span className="text-xs font-bold text-foreground">{cat.description || "No description"}</span>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-rose-400 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="pt-3 space-y-2">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subcategories:</h5>
                      {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {cat.subcategories.map(sub => (
                            <span key={sub.id} className="inline-flex items-center gap-1.5 rounded-lg border bg-card/80 px-2.5 py-1 text-xs font-semibold text-foreground" style={{ borderColor: "var(--border-subtle)" }}>
                              {sub.name}
                              <button onClick={() => handleDeleteSubcategory(sub.id)} className="text-muted-foreground hover:text-rose-400">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">No subcategories defined yet.</div>
                      )}
                    </div>
                  </ProFieldGroup>
                </ProSettingsCard>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ANALYTICS & METRICS */}
        {activeTab === "analytics" && stats && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border p-5 bg-card/60" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Video Views</div>
                <div className="text-3xl font-extrabold text-[#00D4FF] mt-2">{stats.totalViews}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{stats.uniqueViewsRecorded} Unique IP Views</div>
              </div>
              <div className="rounded-2xl border p-5 bg-card/60" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Likes</div>
                <div className="text-3xl font-extrabold text-[#FF2E9A] mt-2">{stats.totalLikes}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{stats.uniqueLikesRecorded} Viewer Likes</div>
              </div>
              <div className="rounded-2xl border p-5 bg-card/60" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Published Lessons</div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2">{stats.publishedTutorials}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{stats.draftTutorials} Drafts Pending</div>
              </div>
              <div className="rounded-2xl border p-5 bg-card/60" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Courses</div>
                <div className="text-3xl font-extrabold text-[#7B61FF] mt-2">{stats.totalCourses}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{stats.totalCategories} Active Categories</div>
              </div>
            </div>

            <ProSettingsCard>
              <ProFieldGroup title="Top Performing Lessons" description="Most viewed lessons across the Academy suite.">
                <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {stats.topTutorials.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7B61FF]/20 text-[#7B61FF] font-bold text-xs">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-foreground">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-[#00D4FF]" /> {item.views}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-[#FF2E9A]" /> {item.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ProFieldGroup>
            </ProSettingsCard>
          </div>
        )}

      </div>

      {/* --- TUTORIAL EDIT/CREATE MODAL --- */}
      <AnimatePresence>
        {isTutorialModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={reduce ? false : { scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-4xl my-auto max-h-[88vh] flex flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7B61FF]/15 text-[#7B61FF]">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      {editingTutorial ? "Edit Video Lesson" : "Create New Video Lesson"}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Configure video asset, taxonomy metadata, and masterclass settings.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTutorialModalOpen(false)}
                  className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadProgress && (
                <div className="mx-6 mt-4 rounded-xl border border-[#00D4FF]/30 bg-[#00D4FF]/10 p-3 text-xs font-bold text-[#00D4FF] flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {uploadProgress}
                </div>
              )}

              {/* 2-Column Form Body */}
              <form onSubmit={handleSaveTutorial} className="flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto max-h-[calc(88vh-130px)]">
                  
                  {/* LEFT COLUMN: Media Source & Upload Inspector (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <ProLabel htmlFor="source-picker" required>Video Source</ProLabel>
                        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-1">
                          <button
                            type="button"
                            onClick={() => {
                              setVideoSource("upload");
                              if (videoUrl.startsWith("http")) setVideoUrl("");
                            }}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                              videoSource === "upload"
                                ? "bg-[#7B61FF] text-white"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            <Upload className="h-3 w-3" />
                            Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoSource("external");
                              if (videoUrl.startsWith("/media/")) setVideoUrl("");
                            }}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                              videoSource === "external"
                                ? "bg-[#7B61FF] text-white"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            <Globe className="h-3 w-3" />
                            URL Link
                          </button>
                        </div>
                      </div>

                      {videoSource === "upload" ? (
                        <div className="space-y-3">
                          <div className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                            uploading
                              ? "border-[#7B61FF] bg-[#7B61FF]/10"
                              : videoUrl
                              ? "border-emerald-500/60 bg-emerald-950/20"
                              : "border-zinc-800 bg-zinc-950/60 hover:border-[#7B61FF]/60"
                          }`}>
                            {uploading ? (
                              <>
                                <RefreshCw className="h-7 w-7 text-[#7B61FF] mb-1.5 animate-spin" />
                                <p className="text-xs font-bold text-white">Uploading Video...</p>
                                <p className="text-[10px] text-[#00D4FF] mt-0.5 font-mono">{uploadProgress || "Processing..."}</p>
                              </>
                            ) : videoUrl ? (
                              <>
                                <CheckCircle2 className="h-7 w-7 text-emerald-400 mb-1.5" />
                                <p className="text-xs font-bold text-emerald-300">Video File Ready & Attached</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">Click to replace with a different file</p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-7 w-7 text-[#7B61FF] mb-1.5" />
                                <p className="text-xs font-bold text-white">Select Video File</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">.mp4, .webm, .mov (Max 500MB)</p>
                              </>
                            )}
                            <input
                              id="video-file-inp"
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              disabled={uploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  await uploadFile(file, "tutorials");
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                              Uploaded Video Path
                            </label>
                            <input
                              type="text"
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              placeholder="/media/tutorials/your-video.mp4"
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 font-mono focus:border-[#7B61FF] focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            External Video URL
                          </label>
                          <input
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://www.w3schools.com/html/mov_bbb.mp4 or YouTube"
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-[#7B61FF] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Live Media Player Preview Card */}
                    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-zinc-400 uppercase text-[10px] tracking-wider">Live Video Stream</span>
                        {videoUrl ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                          </span>
                        ) : (
                          <span className="text-amber-400 text-[10px]">No Video File Loaded</span>
                        )}
                      </div>

                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                        {videoUrl ? (
                          videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                            <iframe
                              src={`${videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}?rel=0`}
                              className="w-full h-full border-0"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              key={videoUrl}
                              className="w-full h-full object-contain"
                              controls
                              playsInline
                              preload="auto"
                            >
                              <source src={videoUrl.startsWith("/media/") ? `http://localhost:4000${videoUrl}` : videoUrl} type="video/mp4" />
                              <source src={videoUrl.startsWith("http") || videoUrl.startsWith("/") ? videoUrl : "/" + videoUrl} type="video/mp4" />
                              <source src={videoUrl.startsWith("/media/") ? `http://localhost:4000${videoUrl}` : videoUrl} type="video/quicktime" />
                              <source src={videoUrl.startsWith("http") || videoUrl.startsWith("/") ? videoUrl : "/" + videoUrl} type="video/quicktime" />
                              Your browser cannot stream this video format directly.
                            </video>
                          )
                        ) : (
                          <div className="text-center p-4">
                            <Play className="h-8 w-8 text-zinc-700 mx-auto mb-1" />
                            <p className="text-[11px] text-zinc-500 font-medium">Upload or enter video link to preview stream</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cover Thumbnail Image Box */}
                    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-2">
                      <ProLabel htmlFor="thumb-file-inp">Cover Thumbnail Image</ProLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          id="thumb-file-inp"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const src = await uploadFile(file, "tutorials");
                              if (src) setThumbnailUrl(src);
                            }
                          }}
                          className="w-full text-[11px] text-zinc-400 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-2.5 file:py-1.5 file:text-[11px] file:font-bold file:text-white"
                        />
                        <input
                          type="text"
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          placeholder="/media/tutorials/..."
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 font-mono focus:border-[#7B61FF] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Metadata & Content Taxonomy (7 cols) */}
                  <div className="lg:col-span-7 space-y-4 text-xs">
                    <div>
                      <ProLabel htmlFor="title-inp" required>Lesson Title</ProLabel>
                      <input
                        id="title-inp"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Understanding Spatial Rendering & Lighting"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#7B61FF] focus:outline-none focus:ring-1 focus:ring-[#7B61FF]"
                        required
                      />
                    </div>

                    <div>
                      <ProLabel htmlFor="desc-inp" required>Description</ProLabel>
                      <textarea
                        id="desc-inp"
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed explanation of what students will learn..."
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#7B61FF] focus:outline-none focus:ring-1 focus:ring-[#7B61FF]"
                        required
                      />
                    </div>

                    {/* Taxonomy: Category & Course */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <ProLabel htmlFor="category-select" required>Category</ProLabel>
                        <select
                          id="category-select"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white focus:border-[#7B61FF] focus:outline-none"
                          required
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <ProLabel htmlFor="course-select">Attach to Course (Optional)</ProLabel>
                        <select
                          id="course-select"
                          value={courseId}
                          onChange={(e) => setCourseId(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white focus:border-[#7B61FF] focus:outline-none"
                        >
                          <option value="">-- Standalone Lesson (No Course) --</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Instructor & Tags */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <ProLabel htmlFor="instructor-inp">Instructor Name</ProLabel>
                        <input
                          id="instructor-inp"
                          type="text"
                          value={instructor}
                          onChange={(e) => setInstructor(e.target.value)}
                          placeholder="Elena Voss (Creative Director)"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#7B61FF] focus:outline-none"
                        />
                      </div>
                      <div>
                        <ProLabel htmlFor="tags-inp">Tags (Comma Separated)</ProLabel>
                        <input
                          id="tags-inp"
                          type="text"
                          value={tagsInput}
                          onChange={(e) => setTagsInput(e.target.value)}
                          placeholder="Spatial, Lighting, Rendering"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#7B61FF] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Duration, Difficulty & Status */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <ProLabel htmlFor="duration-inp" required>Duration</ProLabel>
                        <input
                          id="duration-inp"
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="12 min"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#7B61FF] focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <ProLabel htmlFor="diff-select">Difficulty Level</ProLabel>
                        <select
                          id="diff-select"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white focus:border-[#7B61FF] focus:outline-none"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <ProLabel htmlFor="status-select">Publish Status</ProLabel>
                        <select
                          id="status-select"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white font-bold focus:border-[#7B61FF] focus:outline-none"
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft (Unpublished)</option>
                        </select>
                      </div>
                    </div>

                    {/* Premium / Masterclass Flag */}
                    <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                      <input
                        type="checkbox"
                        id="prem-check"
                        checked={premium}
                        onChange={(e) => setPremium(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-[#7B61FF] accent-[#7B61FF]"
                      />
                      <label htmlFor="prem-check" className="font-semibold text-white cursor-pointer text-xs">
                        Flag as Masterclass / Premium Lesson
                      </label>
                    </div>
                  </div>

                </div>

                {/* Sticky Footer */}
                <div className="flex items-center justify-between border-t border-zinc-800/80 px-6 py-3 bg-zinc-900/50">
                  <span className="text-[11px] text-zinc-500">
                    All video uploads auto-proxy to local media storage.
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsTutorialModalOpen(false)}
                      className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || uploading}
                      className="rounded-xl bg-[#7B61FF] px-6 py-2 text-xs font-bold text-white hover:bg-[#684cf0] disabled:opacity-50 transition-all shadow-lg shadow-[#7B61FF]/20"
                    >
                      {submitting ? "Saving..." : editingTutorial ? "Update Lesson" : "Publish Lesson"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- COURSE EDIT/CREATE MODAL --- */}
      <AnimatePresence>
        {isCourseModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={reduce ? false : { scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg my-auto max-h-[85vh] overflow-y-auto rounded-3xl border bg-zinc-900 p-6 shadow-2xl space-y-4"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
                <h3 className="font-bold text-white text-lg">{editingCourse ? "Edit Course" : "Create New Course"}</h3>
                <button onClick={() => setIsCourseModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
                <div>
                  <ProLabel htmlFor="ctitle-inp" required>Course Title</ProLabel>
                  <input id="ctitle-inp" type="text" value={cTitle} onChange={(e) => setCTitle(e.target.value)} required className={proInputClass} style={proInputStyle} />
                </div>
                <div>
                  <ProLabel htmlFor="cdesc-inp">Description</ProLabel>
                  <textarea id="cdesc-inp" rows={3} value={cDescription} onChange={(e) => setCDescription(e.target.value)} className={proInputClass} style={proInputStyle} />
                </div>
                <div>
                  <ProLabel htmlFor="cthumb-inp">Cover Image Upload</ProLabel>
                  <input
                    id="cthumb-inp"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const src = await uploadFile(file);
                        if (src) setCThumbnailUrl(src);
                      }
                    }}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <button type="button" onClick={() => setIsCourseModalOpen(false)} className="px-4 py-2 text-zinc-400 font-bold">Cancel</button>
                  <button type="submit" disabled={submitting} className="rounded-xl bg-[#7B61FF] px-5 py-2 text-white font-bold">Save Course</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CATEGORY CREATION MODAL --- */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 border border-zinc-800 space-y-4">
              <h4 className="text-base font-bold text-white">New Category</h4>
              <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
                <div>
                  <ProLabel htmlFor="catname-inp" required>Category Name</ProLabel>
                  <input id="catname-inp" type="text" value={catName} onChange={(e) => setCatName(e.target.value)} required className={proInputClass} style={proInputStyle} />
                </div>
                <div>
                  <ProLabel htmlFor="catslug-inp">Slug (Optional)</ProLabel>
                  <input id="catslug-inp" type="text" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} placeholder="e.g. spatial-vfx" className={proInputClass} style={proInputStyle} />
                </div>
                <div>
                  <ProLabel htmlFor="catdesc-inp">Description</ProLabel>
                  <textarea id="catdesc-inp" rows={2} value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className={proInputClass} style={proInputStyle} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-3 py-1.5 text-zinc-400 font-bold">Cancel</button>
                  <button type="submit" className="rounded-xl bg-[#7B61FF] px-4 py-1.5 text-white font-bold">Save Category</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SUBCATEGORY CREATION MODAL --- */}
      <AnimatePresence>
        {isSubcategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 border border-zinc-800 space-y-4">
              <h4 className="text-base font-bold text-white">New Subcategory</h4>
              <form onSubmit={handleSaveSubcategory} className="space-y-3 text-xs">
                <div>
                  <ProLabel htmlFor="subcatparent-select" required>Parent Category</ProLabel>
                  <select id="subcatparent-select" value={subCatParentId} onChange={(e) => setSubCatParentId(e.target.value)} required className={proInputClass} style={proInputStyle}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <ProLabel htmlFor="subcatname-inp" required>Subcategory Name</ProLabel>
                  <input id="subcatname-inp" type="text" value={subCatName} onChange={(e) => setSubCatName(e.target.value)} required className={proInputClass} style={proInputStyle} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsSubcategoryModalOpen(false)} className="px-3 py-1.5 text-zinc-400 font-bold">Cancel</button>
                  <button type="submit" className="rounded-xl bg-[#7B61FF] px-4 py-1.5 text-white font-bold">Save Subcategory</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PREVIEW PLAYER MODAL --- */}
      <AnimatePresence>
        {previewTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 p-6 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <Play className="h-4 w-4 text-[#00D4FF]" /> Previewing: {previewTutorial.title}
                </span>
                <button onClick={() => setPreviewTutorial(null)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                {previewTutorial.video_url.includes("youtube.com") || previewTutorial.video_url.includes("youtu.be") ? (
                  <iframe src={previewTutorial.video_url.replace("watch?v=", "embed/")} className="w-full h-full border-0" allowFullScreen />
                ) : (
                  <video src={previewTutorial.video_url} controls autoPlay className="w-full h-full object-contain" />
                )}
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">{previewTutorial.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function AdminAcademyCmsPage() {
  return <AcademyCmsContent />;
}
