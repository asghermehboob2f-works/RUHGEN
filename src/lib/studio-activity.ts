/**
 * Reads persisted studio chat from localStorage (same shape as Image/Video studio clients).
 */

export const IMAGE_STUDIO_CHAT_KEY = "ruhgen-image-studio-chat-v1:";
export const VIDEO_STUDIO_CHAT_KEY = "ruhgen-video-studio-chat-v1:";

type StoredMsg =
  | { role: "user"; id: string; content: string; meta: string; refineFromUrl?: string }
  | { role: "assistant"; id: string; loading: false; phase: string; urls: string[]; error: string | null };

export type RecentGeneration = {
  id: string;
  kind: "image" | "video";
  previewUrl: string;
  prompt: string;
  href: string;
};

function parseMessages(raw: string | null): StoredMsg[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { v?: number; messages?: unknown };
    if (parsed?.v !== 1 || !Array.isArray(parsed.messages)) return null;
    return parsed.messages as StoredMsg[];
  } catch {
    return null;
  }
}

function generationsFromMessages(messages: StoredMsg[], kind: "image" | "video"): RecentGeneration[] {
  const href = kind === "image" ? "/dashboard/generate/image" : "/dashboard/generate/video";
  const out: RecentGeneration[] = [];
  let lastUserPrompt = "";
  for (const m of messages) {
    if (m.role === "user") {
      lastUserPrompt = typeof m.content === "string" ? m.content : "";
    } else if (m.role === "assistant" && Array.isArray(m.urls) && m.urls.length > 0 && !m.error) {
      const previewUrl = m.urls[0];
      if (typeof previewUrl === "string" && previewUrl.trim()) {
        const prompt = lastUserPrompt.trim() || (kind === "image" ? "Image generation" : "Video generation");
        out.push({
          id: `${kind}-${m.id}`,
          kind,
          previewUrl: previewUrl.trim(),
          prompt: prompt.length > 140 ? `${prompt.slice(0, 137)}…` : prompt,
          href,
        });
      }
    }
  }
  return out.reverse();
}

/** Merge newest-first lists by alternating so both studios surface in “recent”. */
function interleave<T>(a: T[], b: T[], limit: number): T[] {
  const merged: T[] = [];
  let i = 0;
  let j = 0;
  while (merged.length < limit && (i < a.length || j < b.length)) {
    if (i < a.length) merged.push(a[i++]);
    if (merged.length >= limit) break;
    if (j < b.length) merged.push(b[j++]);
  }
  return merged;
}

export function readRecentGenerations(userId: string, limit = 8): RecentGeneration[] {
  if (typeof window === "undefined") return [];
  const imageMsgs = parseMessages(window.localStorage.getItem(`${IMAGE_STUDIO_CHAT_KEY}${userId}`));
  const videoMsgs = parseMessages(window.localStorage.getItem(`${VIDEO_STUDIO_CHAT_KEY}${userId}`));
  const image = generationsFromMessages(imageMsgs ?? [], "image");
  const video = generationsFromMessages(videoMsgs ?? [], "video");
  return interleave(image, video, limit);
}
