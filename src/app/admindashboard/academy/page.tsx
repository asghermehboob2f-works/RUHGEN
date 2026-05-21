"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, Edit2, Trash2, BookOpen, Clock, Heart, Eye, 
  Lock, Unlock, LayoutDashboard, X, AlertCircle, Sparkles, Award
} from "lucide-react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { 
  ProSettingsHero, 
  ProSettingsCard, 
  proInputClass, 
  proInputStyle,
  ProLabel
} from "@/components/settings/ProSettingsShell";

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

function AcademyCmsContent() {
  const { authHeaders } = useAdminAuth();
  const reduce = useReducedMotion() === true;
  
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form / Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("features");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [views, setViews] = useState("0");
  const [likes, setLikes] = useState("0");
  const [premium, setPremium] = useState(false);
  const [instructor, setInstructor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const upload = async (folder: "academy", file: File) => {
    const h = authHeaders();
    if (!h.Authorization) {
      setError("Upload failed: sign in again.");
      return null;
    }
    setError("");
    const form = new FormData();
    form.set("folder", folder);
    form.set("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: h,
        body: form,
      });
      const data = await res.json();
      if (!data.ok) {
        setError(`Upload failed: ${data.error || "Unknown error"}`);
        return null;
      }
      return data.src as string;
    } catch {
      setError("Upload failed: network error.");
      return null;
    }
  };

  const fetchTutorials = async () => {
    try {
      const res = await fetch("/api/academy/tutorials");
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.tutorials)) {
          setTutorials(data.tutorials);
        }
      } else {
        setError("Failed to fetch tutorials list from database.");
      }
    } catch {
      setError("Network error fetching tutorials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTutorial(null);
    setTitle("");
    setDescription("");
    setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
    setThumbnailUrl("");
    setCategory("features");
    setDuration("15 min");
    setDifficulty("Beginner");
    setViews("0");
    setLikes("0");
    setPremium(false);
    setInstructor("Elena Voss (Creative Director)");
    setError("");
    setSuccess("");
    setUploadProgress("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Tutorial) => {
    setEditingTutorial(t);
    setTitle(t.title);
    setDescription(t.description);
    setVideoUrl(t.video_url);
    setThumbnailUrl(t.thumbnail_url);
    setCategory(t.category);
    setDuration(t.duration);
    setDifficulty(t.difficulty);
    setViews(t.views.toString());
    setLikes(t.likes.toString());
    setPremium(t.premium === 1);
    setInstructor(t.instructor);
    setError("");
    setSuccess("");
    setUploadProgress("");
    setIsModalOpen(true);
  };

  const handleSaveTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !description.trim() || !duration.trim() || !instructor.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const h = authHeaders();
      const method = editingTutorial ? "PUT" : "POST";
      const url = editingTutorial 
        ? `/api/admin/academy/tutorials/${editingTutorial.id}`
        : "/api/admin/academy/tutorials";

      const res = await fetch(url, {
        method,
        headers: {
          ...h,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          category,
          duration,
          difficulty,
          views,
          likes,
          premium,
          instructor
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess(editingTutorial ? "Tutorial updated successfully." : "New tutorial created successfully.");
        setIsModalOpen(false);
        fetchTutorials();
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
    if (!window.confirm("Are you sure you want to delete this tutorial? This action is permanent.")) return;

    setError("");
    setSuccess("");
    try {
      const h = authHeaders();
      const res = await fetch(`/api/admin/academy/tutorials/${id}`, {
        method: "DELETE",
        headers: h
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess("Tutorial deleted successfully.");
        fetchTutorials();
      } else {
        setError(data.error || "Failed to delete tutorial.");
      }
    } catch {
      setError("Network error while deleting tutorial.");
    }
  };

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-5xl space-y-8">
        
        {/* Hero Banner */}
        <ProSettingsHero
          eyebrow="Academy CMS"
          title="Educational Masterclasses"
          description="Manage video tutorials, monetization blueprints, and advanced workflow lessons stored in the SQLite database."
          actions={
            <div className="flex gap-3">
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#7B61FF]/35"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
                Dashboard Overview
              </Link>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)"
                }}
              >
                <Plus className="h-4 w-4" />
                Add Lesson
              </button>
            </div>
          }
        />

        {/* Global Alert Notices */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Tutorials Data Table */}
        <ProSettingsCard>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex py-16 flex-col items-center justify-center gap-4 text-zinc-400">
                <span
                  className="loading-orbit h-8 w-8 rounded-full border-2 border-t-transparent"
                  style={{ borderColor: "#7B61FF", borderTopColor: "transparent" }}
                />
                <p className="text-xs font-semibold tracking-wide">Loading tutorials from database...</p>
              </div>
            ) : tutorials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                <BookOpen className="h-12 w-12 opacity-30" />
                <p className="mt-3 text-sm font-semibold">No tutorials seeded or available.</p>
                <p className="mt-1 text-xs">Click the &apos;Add Lesson&apos; button above to create one.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">Lesson Category</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">Title & Instructor</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">Index Info</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">Access</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">Engagement</th>
                    <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {tutorials.map((t) => (
                    <tr key={t.id} className="group hover:bg-white/[0.01]">
                      {/* Category */}
                      <td className="py-4.5 pr-4">
                        <span className="inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black/40" style={{ borderColor: "var(--border-subtle)", color: "#7B61FF" }}>
                          {t.category}
                        </span>
                      </td>

                      {/* Title & Instructor */}
                      <td className="py-4.5 pr-4 max-w-sm">
                        <div className="font-semibold text-white text-sm leading-snug group-hover:text-[#7B61FF] transition-colors">
                          {t.title}
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">
                          By {t.instructor}
                        </div>
                      </td>

                      {/* Difficulty / Duration */}
                      <td className="py-4.5 pr-4">
                        <div className="flex flex-col gap-1 text-xs text-zinc-300">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 opacity-80" />
                            {t.duration}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <BookOpen className="h-3.5 w-3.5 opacity-80" />
                            {t.difficulty}
                          </span>
                        </div>
                      </td>

                      {/* Premium or Free */}
                      <td className="py-4.5 pr-4">
                        {t.premium === 1 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow-400">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-400">
                            <Unlock className="h-3 w-3" />
                            Free Access
                          </span>
                        )}
                      </td>

                      {/* Views & Likes */}
                      <td className="py-4.5 pr-4">
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span className="flex items-center gap-1" title="Views">
                            <Eye className="h-3.5 w-3.5 opacity-80" />
                            {t.views}
                          </span>
                          <span className="flex items-center gap-1" title="Likes">
                            <Heart className="h-3.5 w-3.5 opacity-80" />
                            {t.likes}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4.5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                            title="Edit Tutorial"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTutorial(t.id)}
                            className="p-2 rounded-lg border border-rose-950 bg-rose-950/20 text-rose-400 hover:text-white hover:bg-rose-900 transition-colors"
                            title="Delete Tutorial"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ProSettingsCard>
      </div>

      {/* CREATE & EDIT FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={reduce ? false : { scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-[600px] overflow-hidden rounded-2xl border bg-zinc-900 shadow-2xl"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              {/* Close Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 p-5">
                <h3 className="font-display font-bold text-lg text-white">
                  {editingTutorial ? "Edit Lesson Masterclass" : "Create New Lesson"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveTutorial} className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
                {/* Title */}
                <div>
                  <ProLabel htmlFor="title" required>Tutorial Title</ProLabel>
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Cinematic Light Vectors"
                    className={proInputClass}
                    style={proInputStyle}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <ProLabel htmlFor="description" required>Brief Description</ProLabel>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief outline of the lesson's target techniques..."
                    rows={3}
                    className={`${proInputClass} resize-none py-2.5`}
                    style={proInputStyle}
                    required
                  />
                </div>

                {/* Grid for Instructor, Category, Difficulty, Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Instructor */}
                  <div>
                    <ProLabel htmlFor="instructor" required>Instructor Name</ProLabel>
                    <input
                      id="instructor"
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                      placeholder="e.g. Elena Voss"
                      className={proInputClass}
                      style={proInputStyle}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <ProLabel htmlFor="category" required>Category</ProLabel>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={proInputClass}
                      style={{ ...proInputStyle, colorScheme: "dark" }}
                    >
                      <option value="features">Feature Understanding</option>
                      <option value="courses">Courses</option>
                      <option value="masterclasses">Masterclasses</option>
                      <option value="workflows">Advanced Workflows</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <ProLabel htmlFor="difficulty" required>Difficulty Rating</ProLabel>
                    <select
                      id="difficulty"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className={proInputClass}
                      style={{ ...proInputStyle, colorScheme: "dark" }}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <ProLabel htmlFor="duration" required>Lesson Duration</ProLabel>
                    <input
                      id="duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 15 min or 3 hours"
                      className={proInputClass}
                      style={proInputStyle}
                      required
                    />
                  </div>
                </div>

                {/* Video URL & File Upload */}
                <div className="space-y-2">
                  <ProLabel htmlFor="videoUrl">Lesson Video File / Stream URL</ProLabel>
                  <div className="flex gap-2">
                    <input
                      id="videoUrl"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://... or uploaded path"
                      className={proInputClass}
                      style={{ ...proInputStyle, flex: 1 }}
                    />
                    <label className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-850 px-4 text-xs font-semibold text-white transition-colors hover:bg-zinc-700">
                      Upload Video
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setUploadProgress("Uploading video...");
                          const src = await upload("academy", f);
                          if (src) {
                            setVideoUrl(src);
                            setUploadProgress("Video uploaded!");
                          } else {
                            setUploadProgress("Video upload failed.");
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Provide a streaming URL or click &quot;Upload Video&quot; to upload high-fidelity lessons directly.
                  </p>
                </div>

                {/* Thumbnail URL & File Upload */}
                <div className="space-y-2">
                  <ProLabel htmlFor="thumbnailUrl">Thumbnail Image / Cover URL</ProLabel>
                  <div className="flex gap-2">
                    <input
                      id="thumbnailUrl"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://... or uploaded cover path"
                      className={proInputClass}
                      style={{ ...proInputStyle, flex: 1 }}
                    />
                    <label className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-855 px-4 text-xs font-semibold text-white transition-colors hover:bg-zinc-700">
                      Upload Cover
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setUploadProgress("Uploading cover...");
                          const src = await upload("academy", f);
                          if (src) {
                            setThumbnailUrl(src);
                            setUploadProgress("Cover uploaded!");
                          } else {
                            setUploadProgress("Cover upload failed.");
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Provide a cover image URL or click &quot;Upload Cover&quot; to upload a custom cover image.
                  </p>
                </div>

                {/* Upload Status indicators */}
                {uploadProgress && (
                  <p className="text-xs font-semibold text-[#00D4FF]">
                    {uploadProgress}
                  </p>
                )}

                {/* Views & Likes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <ProLabel htmlFor="views">Live Views Counter Override</ProLabel>
                    <input
                      id="views"
                      type="number"
                      value={views}
                      onChange={(e) => setViews(e.target.value)}
                      placeholder="e.g. 1500"
                      className={proInputClass}
                      style={proInputStyle}
                    />
                  </div>
                  <div>
                    <ProLabel htmlFor="likes">Live Likes Counter Override</ProLabel>
                    <input
                      id="likes"
                      type="number"
                      value={likes}
                      onChange={(e) => setLikes(e.target.value)}
                      placeholder="e.g. 400"
                      className={proInputClass}
                      style={proInputStyle}
                    />
                  </div>
                </div>

                {/* Mastery Track Checkbox */}
                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/20 p-4">
                  <input
                    id="premium"
                    type="checkbox"
                    checked={premium}
                    onChange={(e) => setPremium(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-[#7B61FF]"
                  />
                  <div className="cursor-pointer flex-1" onClick={() => setPremium(!premium)}>
                    <ProLabel htmlFor="premium">Advanced Mastery Track</ProLabel>
                    <p className="text-[10px] text-zinc-500">
                      If checked, this lesson displays the prestigious Mastery Track badge to highlight advanced skills.
                    </p>
                  </div>
                </div>

                {/* Error/Success locally within form */}
                {error && (
                  <p className="text-xs font-semibold text-rose-400">
                    {error}
                  </p>
                )}

                {/* Form Action Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 px-5 text-xs font-semibold text-zinc-300 transition-colors hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl text-xs font-bold text-white px-6 transition-opacity hover:opacity-95 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)"
                    }}
                  >
                    {submitting ? "Saving..." : "Save Lesson"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AcademyCmsPage() {
  const { admin, ready } = useAdminAuth();

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-zinc-400">
        <span
          className="loading-orbit h-10 w-10 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#7B61FF", borderTopColor: "transparent" }}
        />
        <p className="text-xs font-semibold tracking-wide">Securing connection...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-muted)" }}>
          <Award className="mx-auto h-12 w-12 text-[#7B61FF] opacity-40" />
          <p className="font-display text-xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>CMS Login Required</p>
          <p className="mt-2 text-sm">
            Please log in first to manage resources.
          </p>
          <p className="mt-4">
            <Link className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 px-5 text-xs font-bold text-[#00D4FF] hover:underline" href="/admin/login?next=/admindashboard/academy">
              Operator Sign-in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <AcademyCmsContent />;
}
