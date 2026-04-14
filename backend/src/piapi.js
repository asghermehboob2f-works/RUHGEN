/**
 * PiAPI only — all generation goes through https://api.piapi.ai (unified `/task` API).
 * We do not call Kling/Flux or any vendor API directly; `model` in the task body is
 * PiAPI’s routing field (e.g. kling-turbo, Qubico/flux1-dev), not a separate base URL.
 * Credentials: PI_API_KEY / pi_api_key / PIAPI_KEY in env (server-side only).
 */

const UPSTREAM_API_BASE = "https://api.piapi.ai/api/v1";

function getUpstreamApiKey() {
  const k = process.env.PI_API_KEY || process.env.pi_api_key || process.env.PIAPI_KEY;
  if (!k || !String(k).trim()) {
    throw new Error("STUDIO_CONFIG_MISSING");
  }
  return String(k).trim();
}

/**
 * Collect https URLs from provider `output` (shape varies by model).
 * @param {unknown} output
 * @returns {string[]}
 */
function extractMediaUrls(output) {
  if (!output || typeof output !== "object") return [];
  const urls = new Set();
  const walk = (v) => {
    if (typeof v === "string" && /^https?:\/\//i.test(v)) {
      urls.add(v);
    } else if (Array.isArray(v)) {
      for (const x of v) walk(x);
    } else if (v && typeof v === "object") {
      for (const x of Object.values(v)) walk(x);
    }
  };
  walk(output);
  return [...urls];
}

async function piapiRequest(path, options = {}) {
  const key = getUpstreamApiKey();
  const url = path.startsWith("http") ? path : `${UPSTREAM_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
        ...(options.headers || {}),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const cause =
      e instanceof Error && e.cause instanceof Error
        ? e.cause.message
        : e instanceof Error && typeof e.cause === "object" && e.cause && "code" in e.cause
          ? String(e.cause.code)
          : "";
    const hint = [msg, cause].filter(Boolean).join(" — ");
    throw new Error(
      `Cannot reach generation API (https://api.piapi.ai). ${hint || "Network error"}. Check internet, firewall, VPN, and that outbound HTTPS is allowed from this machine.`,
    );
  }
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    return { ok: res.ok, status: res.status, json: null, raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

async function createTask(body) {
  return piapiRequest("/task", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function getTask(taskId) {
  return piapiRequest(`/task/${encodeURIComponent(taskId)}`, { method: "GET" });
}

module.exports = {
  createTask,
  getTask,
  extractMediaUrls,
  UPSTREAM_API_BASE,
};
