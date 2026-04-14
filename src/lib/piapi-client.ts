import { readUserToken } from "@/lib/auth-storage";

export type PiApiTaskPollResult = {
  status: string;
  urls: string[];
  output?: unknown;
};

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = readUserToken();
  if (!token) {
    throw new Error("Sign in required.");
  }
  return fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

/** Create image task (via backend only). `image_url` triggers image-to-image (edit) on the server. */
export async function createImageTask(body: {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  image_url?: string;
  denoise?: number;
  negative_prompt?: string;
  /** Image-to-image only; typical range 1–20. */
  guidance_scale?: number;
}): Promise<{ taskId: string }> {
  const res = await authFetch("/api/studio/image", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok?: boolean; taskId?: string; error?: string };
  if (!res.ok || !data.ok || !data.taskId) {
    throw new Error(data.error || "Could not start image task.");
  }
  return { taskId: data.taskId };
}

/** Upload a reference image for image-to-video; returns a short-lived HTTPS URL the API can fetch. */
export async function uploadStudioReferenceImage(file: File): Promise<{ url: string }> {
  const token = readUserToken();
  if (!token) {
    throw new Error("Sign in required.");
  }
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("/api/studio/reference-upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
  if (!res.ok || !data.ok || !data.url) {
    throw new Error(data.error || "Could not upload reference image.");
  }
  return { url: data.url };
}

/** Create video task (via backend only). */
export async function createVideoTask(body: {
  prompt: string;
  duration?: 5 | 10;
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  mode?: "std" | "pro";
  version?: string;
  negative_prompt?: string;
  image_url?: string;
}): Promise<{ taskId: string }> {
  const res = await authFetch("/api/studio/video", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok?: boolean; taskId?: string; error?: string };
  if (!res.ok || !data.ok || !data.taskId) {
    throw new Error(data.error || "Could not start video task.");
  }
  return { taskId: data.taskId };
}

/** Provider may return status in different casings / synonyms. */
function normalizePiStatus(status: string | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "complete" || s === "succeeded" || s === "success") return "completed";
  return s;
}

/** Merge `urls` with explicit `image_url` / `video_url` on `output` when present. */
function collectResultUrls(data: {
  urls?: string[];
  output?: unknown;
}): string[] {
  const list: string[] = Array.isArray(data.urls) ? [...data.urls] : [];
  const seen = new Set(list);
  const out = data.output;
  if (out && typeof out === "object" && !Array.isArray(out)) {
    const o = out as Record<string, unknown>;
    for (const key of ["image_url", "video_url", "video", "url"] as const) {
      const v = o[key];
      if (typeof v === "string" && /^https?:\/\//i.test(v) && !seen.has(v)) {
        seen.add(v);
        list.push(v);
      }
    }
  }
  return list;
}

/** Poll until completed / failed / timeout. */
export async function pollPiApiTask(
  taskId: string,
  options?: {
    intervalMs?: number;
    maxAttempts?: number;
    onStatus?: (status: string) => void;
  }
): Promise<PiApiTaskPollResult> {
  const intervalMs = options?.intervalMs ?? 2500;
  const maxAttempts = options?.maxAttempts ?? 150;

  for (let i = 0; i < maxAttempts; i++) {
    const res = await authFetch(`/api/studio/task/${encodeURIComponent(taskId)}`);
    const data = (await res.json()) as {
      ok?: boolean;
      status?: string;
      urls?: string[];
      output?: unknown;
      error?: { code?: number; message?: string; raw_message?: string };
      message?: string;
    };
    if (!res.ok || !data.ok) {
      const err = (data as { error?: string }).error;
      throw new Error(
        (typeof err === "string" && err) ||
          (typeof data.message === "string" ? data.message : null) ||
          "Task status request failed."
      );
    }
    const statusRaw = data.status ?? "";
    options?.onStatus?.(statusRaw);
    const status = normalizePiStatus(statusRaw);

    if (status === "completed") {
      return {
        status: statusRaw || "completed",
        urls: collectResultUrls(data),
        output: data.output,
      };
    }
    if (status === "failed") {
      const errObj = data.error;
      const msg =
        (errObj && typeof errObj.message === "string" && errObj.message.trim()) ||
        (errObj && typeof errObj.raw_message === "string" && errObj.raw_message.trim()) ||
        (typeof data.message === "string" && data.message.trim() && data.message !== "success"
          ? data.message
          : "Generation failed.");
      throw new Error(msg || "Generation failed.");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Timed out. Try again later.");
}
