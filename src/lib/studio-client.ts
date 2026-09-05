import { readUserToken } from "@/lib/auth-storage";

export type StudioTaskPollResult = {
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

export interface StudioModel {
  id: string;
  name: string;
  type: "image" | "video";
  tier: "standard" | "premium";
  creditCostType: "fixed" | "per_second";
  baseCreditCost: number;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
  supportedDurations: number[];
  supportedControls: string[];
  maxDuration?: number;
  maxResolution?: string;
  maxReferenceImages?: number;
}

export interface UploadedReferenceFile {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
  size: number;
}

export async function fetchStudioModels(): Promise<StudioModel[]> {
  try {
    const res = await authFetch("/api/studio/models");
    if (!res.ok) return [];
    const data = (await res.json()) as { ok?: boolean; models?: StudioModel[] };
    return data.models || [];
  } catch {
    return [];
  }
}

export async function estimateStudioCost(body: {
  modelId?: string;
  type: "image" | "video";
  duration?: number;
  quality?: string;
}): Promise<{ creditCost: number; marginSafe: boolean } | null> {
  try {
    const res = await authFetch("/api/studio/estimate-cost", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; creditCost?: number; marginSafe?: boolean };
    if (data.ok && typeof data.creditCost === "number") {
      return { creditCost: data.creditCost, marginSafe: Boolean(data.marginSafe) };
    }
    return null;
  } catch {
    return null;
  }
}

/** Create image task (via backend only). `image_url` triggers image-to-image (edit) on the server. */
export async function createImageTask(body: {
  prompt: string;
  quality?: string;
  model?: string;
  modelId?: string;
  idempotencyKey?: string;
  width?: number;
  height?: number;
  image_url?: string;
  denoise?: number;
  negative_prompt?: string;
  /** Image-to-image only; typical range 1–20. */
  guidance_scale?: number;
}): Promise<{ taskId: string }> {
  const headers: Record<string, string> = {};
  if (body.idempotencyKey) {
    headers["Idempotency-Key"] = body.idempotencyKey;
  }
  const res = await authFetch("/api/studio/image", {
    method: "POST",
    headers,
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
  const res = await uploadStudioReference(file);
  return { url: res.url };
}

/** Upload multiple reference images or files for video generation; returns array of uploaded items. */
export async function uploadStudioReferenceFiles(
  files: File[]
): Promise<{ files: UploadedReferenceFile[]; url: string; type: "image" | "video" }> {
  const token = readUserToken();
  if (!token) {
    throw new Error("Sign in required.");
  }
  if (!files.length) {
    throw new Error("No files selected.");
  }
  const fd = new FormData();
  for (const f of files) {
    fd.append("files", f);
  }
  const res = await fetch("/api/studio/reference-upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = (await res.json()) as {
    ok?: boolean;
    files?: UploadedReferenceFile[];
    url?: string;
    type?: "image" | "video";
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Could not upload reference files.");
  }
  const outFiles: UploadedReferenceFile[] = data.files || [];
  if (!outFiles.length && data.url) {
    outFiles.push({
      id: "ref-" + Date.now(),
      url: data.url,
      type: data.type || "image",
      name: files[0]?.name || "reference",
      size: files[0]?.size || 0,
    });
  }
  return {
    files: outFiles,
    url: data.url || outFiles[0]?.url || "",
    type: data.type || outFiles[0]?.type || "image",
  };
}

/** Upload a reference image or video for video generation; returns temporary URL and reference type. */
export async function uploadStudioReference(file: File): Promise<{ url: string; type: "image" | "video" }> {
  const token = readUserToken();
  if (!token) {
    throw new Error("Sign in required.");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("image", file);
  fd.append("video", file);
  fd.append("reference", file);
  const res = await fetch("/api/studio/reference-upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = (await res.json()) as { ok?: boolean; url?: string; type?: "image" | "video"; error?: string };
  if (!res.ok || !data.ok || !data.url) {
    throw new Error(data.error || "Could not upload reference file.");
  }
  const type = data.type || (file.type.startsWith("video/") ? "video" : "image");
  return { url: data.url, type };
}

/** Immediately delete an ephemeral reference from memory (e.g. user removed thumbnail) */
export async function deleteStudioReference(idOrUrl: string): Promise<boolean> {
  const token = readUserToken();
  if (!token || !idOrUrl) return false;
  // Extract ID if a full URL is passed
  const id = idOrUrl.split("/").filter(Boolean).pop() || idOrUrl;
  try {
    const res = await fetch(`/api/studio/reference/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Create video task (via backend only). */
export async function createVideoTask(body: {
  prompt: string;
  quality?: string;
  duration?: 5 | 10;
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  mode?: "std" | "pro";
  modelId?: string;
  idempotencyKey?: string;
  version?: string;
  negative_prompt?: string;
  image_url?: string;
  video_url?: string;
  reference_url?: string;
  references?: string[];
  image_urls?: string[];
  reference_type?: "image" | "video";
  sound?: boolean;
  camera_control?: string;
  resolution?: string;
}): Promise<{ taskId: string }> {
  const headers: Record<string, string> = {};
  if (body.idempotencyKey) {
    headers["Idempotency-Key"] = body.idempotencyKey;
  }
  const res = await authFetch("/api/studio/video", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok?: boolean; taskId?: string; error?: string };
  if (!res.ok || !data.ok || !data.taskId) {
    throw new Error(data.error || "Could not start video task.");
  }
  return { taskId: data.taskId };
}

/** Provider may return status in different casings / synonyms. */
function normalizeTaskStatus(status: string | undefined): string {
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
      if (typeof v === "string" && /^(https?:\/\/|data:image\/)/i.test(v) && !seen.has(v)) {
        seen.add(v);
        list.push(v);
      }
    }
  }
  return list;
}

/** Poll until completed / failed / timeout. */
export async function pollStudioTask(
  taskId: string,
  options?: {
    intervalMs?: number;
    maxAttempts?: number;
    onStatus?: (status: string) => void;
  }
): Promise<StudioTaskPollResult> {
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
    const status = normalizeTaskStatus(statusRaw);

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


