/**
 * Typed client for the community backend (mounted on the same origin via
 * the Next.js rewrite at /api/community/*). Reads are anonymous; writes need
 * the JWT stored under AUTH_USER_TOKEN_KEY.
 */

import { readUserToken } from "@/lib/auth-storage";

export type CommunityKind = "image" | "video";
export type CommunitySort = "trending" | "recent" | "top";

export type CommunityAuthor = {
  id: string;
  name: string;
};

export type CommunityViewer = {
  liked: boolean;
  saved: boolean;
  isAuthor: boolean;
};

export type CommunityPost = {
  id: string;
  kind: CommunityKind;
  mediaUrl: string;
  thumbnailUrl: string;
  title: string;
  prompt: string;
  tags: string[];
  width: number;
  height: number;
  likes: number;
  saves: number;
  comments: number;
  views: number;
  featured: boolean;
  createdAt: string;
  author: CommunityAuthor;
  viewer: CommunityViewer;
};

export type CommunityComment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
};

export type CommunityTag = {
  label: string;
  count: number;
  hot: boolean;
};

export type CommunityCreator = {
  id: string;
  name: string;
  works: number;
  likes: number;
  views: number;
  comments: number;
  lastPostAt: string;
};

export type CommunityStats = {
  totalPosts: number;
  totalCreators: number;
  totalLikes: number;
  weeklyPosts: number;
  weeklyLikes: number;
  totalTags: number;
};

type FeedQuery = {
  type?: "all" | CommunityKind;
  sort?: CommunitySort;
  tag?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

type FeedResponse = {
  posts: CommunityPost[];
  total: number;
  limit: number;
  offset: number;
  viewerSignedIn: boolean;
};

const API_BASE = "/api/community";

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const h: Record<string, string> = { ...(extra || {}) };
  const token = readUserToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function parseJson<T>(res: Response): Promise<{ ok: boolean; data?: T; error?: string }> {
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return { ok: false, error: "Server returned an unexpected response." };
  }
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Server returned an unexpected response." };
  }
  const obj = payload as Record<string, unknown>;
  if (obj.ok === true) {
    return { ok: true, data: payload as T };
  }
  const err = typeof obj.error === "string" ? obj.error : `Request failed (${res.status}).`;
  return { ok: false, error: err };
}

export async function fetchFeed(query: FeedQuery = {}): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (query.type && query.type !== "all") params.set("type", query.type);
  if (query.sort) params.set("sort", query.sort);
  if (query.tag) params.set("tag", query.tag);
  if (query.q) params.set("q", query.q);
  if (typeof query.limit === "number") params.set("limit", String(query.limit));
  if (typeof query.offset === "number") params.set("offset", String(query.offset));
  const res = await fetch(`${API_BASE}/feed?${params.toString()}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const r = await parseJson<FeedResponse & { ok: true }>(res);
  if (!r.ok || !r.data) {
    throw new Error(r.error || "Failed to load feed.");
  }
  return {
    posts: r.data.posts,
    total: r.data.total,
    limit: r.data.limit,
    offset: r.data.offset,
    viewerSignedIn: r.data.viewerSignedIn,
  };
}

export async function fetchStats(): Promise<CommunityStats> {
  const res = await fetch(`${API_BASE}/stats`, { cache: "no-store" });
  const r = await parseJson<{ stats: CommunityStats }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Failed to load stats.");
  return r.data.stats;
}

export async function fetchTags(limit = 18): Promise<CommunityTag[]> {
  const res = await fetch(`${API_BASE}/tags?limit=${limit}`, { cache: "no-store" });
  const r = await parseJson<{ tags: CommunityTag[] }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Failed to load tags.");
  return r.data.tags;
}

export async function fetchCreators(limit = 8): Promise<CommunityCreator[]> {
  const res = await fetch(`${API_BASE}/creators?limit=${limit}`, { cache: "no-store" });
  const r = await parseJson<{ creators: CommunityCreator[] }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Failed to load creators.");
  return r.data.creators;
}

export async function fetchPost(id: string): Promise<CommunityPost> {
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const r = await parseJson<{ post: CommunityPost }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Post not found.");
  return r.data.post;
}

export async function fetchComments(id: string, limit = 50): Promise<CommunityComment[]> {
  const res = await fetch(
    `${API_BASE}/posts/${encodeURIComponent(id)}/comments?limit=${limit}`,
    { cache: "no-store" }
  );
  const r = await parseJson<{ comments: CommunityComment[] }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Failed to load comments.");
  return r.data.comments;
}

export async function postComment(id: string, body: string): Promise<CommunityComment> {
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ body }),
  });
  const r = await parseJson<{ comment: CommunityComment }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Could not add comment.");
  return r.data.comment;
}

export async function deleteComment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const r = await parseJson<Record<string, never>>(res);
  if (!r.ok) throw new Error(r.error || "Could not delete comment.");
}

export async function toggleLike(id: string): Promise<{ liked: boolean; likes: number }> {
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  const r = await parseJson<{ liked: boolean; likes: number }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Could not like.");
  return { liked: r.data.liked, likes: r.data.likes };
}

export async function toggleSave(id: string): Promise<{ saved: boolean; saves: number }> {
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}/save`, {
    method: "POST",
    headers: authHeaders(),
  });
  const r = await parseJson<{ saved: boolean; saves: number }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Could not save.");
  return { saved: r.data.saved, saves: r.data.saves };
}

export async function recordView(id: string): Promise<{ views: number }> {
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}/view`, {
    method: "POST",
    headers: authHeaders(),
  });
  const r = await parseJson<{ views: number }>(res);
  if (!r.ok || !r.data) return { views: 0 };
  return { views: r.data.views };
}

export type CreatePostInput = {
  kind: CommunityKind;
  mediaUrl: string;
  thumbnailUrl?: string;
  title?: string;
  prompt: string;
  tags?: string[];
  width?: number;
  height?: number;
};

export async function createPost(input: CreatePostInput): Promise<CommunityPost> {
  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });
  const r = await parseJson<{ post: CommunityPost }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Could not share to community.");
  return r.data.post;
}

export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const r = await parseJson<Record<string, never>>(res);
  if (!r.ok) throw new Error(r.error || "Could not delete post.");
}

export async function fetchMyPosts(): Promise<CommunityPost[]> {
  const res = await fetch(`${API_BASE}/me/posts`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const r = await parseJson<{ posts: CommunityPost[] }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Could not load your posts.");
  return r.data.posts;
}

export async function fetchMySaved(): Promise<CommunityPost[]> {
  const res = await fetch(`${API_BASE}/me/saved`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const r = await parseJson<{ posts: CommunityPost[] }>(res);
  if (!r.ok || !r.data) throw new Error(r.error || "Could not load your saved posts.");
  return r.data.posts;
}
