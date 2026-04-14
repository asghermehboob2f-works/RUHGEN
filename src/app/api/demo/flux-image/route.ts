import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const FLUX_URL = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b";

const MAX_PROMPT_LEN = 10_000;

/** Per OpenAPI schema for flux.2-klein-4b */
const ALLOWED_DIMS = new Set([768, 832, 896, 960, 1024, 1088, 1152, 1216, 1280, 1344]);

type FluxArtifact = {
  base64?: string;
  finishReason?: string;
  seed?: number;
};

type FluxResponseBody = {
  artifacts?: FluxArtifact[];
};

function resolveGenAiKey(): string | null {
  const k =
    process.env.NVIDIA_GENAI_API_KEY?.trim() ||
    process.env.NVIDIA_API_KEY?.trim() ||
    process.env.NGC_API_KEY?.trim();
  return k || null;
}

function formatUpstreamError(status: number, rawText: string): { error: string; detail: string } {
  let detail = rawText.slice(0, 2000).trim();
  try {
    const j = JSON.parse(rawText) as {
      detail?: Array<{ msg?: string; type?: string } | string> | string;
      message?: string;
    };
    if (typeof j.message === "string" && j.message) {
      detail = j.message;
    } else if (Array.isArray(j.detail)) {
      detail = j.detail
        .map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: string }).msg) : String(d)))
        .join("; ");
    } else if (typeof j.detail === "string") {
      detail = j.detail;
    }
  } catch {
    /* use raw slice */
  }
  return {
    error: `NVIDIA GenAI returned HTTP ${status}.`,
    detail: detail || "(empty response body)",
  };
}

/** Proxies NVIDIA GenAI FLUX image generation; bearer key stays server-side only. */
export async function POST(req: NextRequest) {
  const key = resolveGenAiKey();
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No NVIDIA API key found. Set NVIDIA_GENAI_API_KEY or NVIDIA_API_KEY in .env.local (same nvapi key as the NVIDIA dashboard).",
      },
      { status: 503 },
    );
  }

  let body: {
    prompt?: unknown;
    width?: unknown;
    height?: unknown;
    seed?: unknown;
    steps?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = typeof body.prompt === "string" ? body.prompt : "";
  const prompt = raw.trim().slice(0, MAX_PROMPT_LEN);
  if (!prompt) {
    return NextResponse.json({ ok: false, error: "Prompt is required." }, { status: 400 });
  }

  const width = typeof body.width === "number" ? body.width : 1024;
  const height = typeof body.height === "number" ? body.height : 1024;
  if (!ALLOWED_DIMS.has(width) || !ALLOWED_DIMS.has(height)) {
    return NextResponse.json(
      { ok: false, error: "width and height must be allowed pixel values (see NVIDIA API docs)." },
      { status: 400 },
    );
  }

  const seed = typeof body.seed === "number" && body.seed >= 0 ? Math.floor(body.seed) : 0;
  const steps =
    typeof body.steps === "number" ? Math.min(4, Math.max(1, Math.floor(body.steps))) : 4;

  // Omit optional fields that some keys reject; matches NVIDIA curl samples.
  const payload: Record<string, unknown> = {
    prompt,
    width,
    height,
    seed,
    steps,
  };

  const upstream = await fetch(FLUX_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await upstream.text();
  if (!upstream.ok) {
    const { error, detail } = formatUpstreamError(upstream.status, rawText);
    return NextResponse.json(
      {
        ok: false,
        error,
        detail,
      },
      { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 },
    );
  }

  let data: FluxResponseBody;
  try {
    data = JSON.parse(rawText) as FluxResponseBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON from image service.",
        detail: rawText.slice(0, 500),
      },
      { status: 502 },
    );
  }

  const art = data.artifacts?.[0];
  if (!art) {
    return NextResponse.json(
      { ok: false, error: "Empty artifacts in response.", detail: rawText.slice(0, 800) },
      { status: 502 },
    );
  }

  if (art.finishReason && art.finishReason !== "SUCCESS") {
    return NextResponse.json(
      {
        ok: false,
        error: `Generation finished with ${art.finishReason}.`,
        detail: rawText.slice(0, 1200),
      },
      { status: 502 },
    );
  }

  if (!art.base64 || typeof art.base64 !== "string") {
    return NextResponse.json(
      {
        ok: false,
        error: "No base64 image in artifact.",
        detail: rawText.slice(0, 800),
      },
      { status: 502 },
    );
  }

  const imageDataUrl = `data:image/jpeg;base64,${art.base64}`;

  return NextResponse.json({
    ok: true,
    imageDataUrl,
    seed: art.seed,
    finishReason: art.finishReason,
  });
}
