/**
 * higgsfield-provider.js
 * Production-Grade Higgsfield AI Video Generation Provider Adapter.
 * 
 * - Strictly server-side only. Never expose credentials in client bundles, errors, or public logs.
 * - Supports async generation task creation, request status polling, cancellation, and balance check.
 * - Handles both API Key formats (Key id:secret, Key API_KEY, or Bearer API_KEY).
 * - Sanitizes all upstream error strings to prevent credentials disclosure.
 */

const { getHiggsfieldConfig } = require("../config");

function sanitizeError(msg) {
  if (!msg || typeof msg !== "string") {
    return "Generation service temporarily unavailable. Please try again shortly.";
  }

  const config = getHiggsfieldConfig();
  let sanitized = msg
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    .replace(/key\s+[a-zA-Z0-9_\-\.:]+/gi, "Key [REDACTED]")
    .replace(/api[-_]?key=[a-zA-Z0-9_\-\.]+/gi, "api_key=[REDACTED]")
    .replace(/\b[0-9a-f]{32}\b/gi, "[REDACTED_KEY]");

  if (config.apiKey && config.apiKey.length > 6) {
    sanitized = sanitized.split(config.apiKey).join("[REDACTED_KEY]");
  }
  if (config.apiSecret && config.apiSecret.length > 6) {
    sanitized = sanitized.split(config.apiSecret).join("[REDACTED_SECRET]");
  }

  // Sanitize upstream balance/credits error into user-friendly message
  if (/credits insufficient|balance is exhausted|insufficient balance|payment required|out of credits/i.test(sanitized)) {
    return "Insufficient credits. Please top up your RUHGEN credits to continue generating.";
  }

  return sanitized;
}

class HiggsfieldProvider {
  /**
   * Helper to build appropriate Authorization header
   */
  static getAuthHeader() {
    const config = getHiggsfieldConfig();
    if (!config.isConfigured) {
      return null;
    }

    if (config.apiKey && config.apiSecret) {
      return `Key ${config.apiKey}:${config.apiSecret}`;
    }

    const single = config.apiKey || config.apiSecret;
    return `Key ${single}`;
  }

  /**
   * Submit an asynchronous video generation task to Higgsfield
   * @param {Object} params
   * @param {string} params.model - Higgsfield model endpoint path (e.g. 'bytedance/seedance-2-5/text-to-video', 'higgsfield-ai/genesis-2/text-to-video')
   * @param {Object} params.input - Sanitized model parameters
   * @param {string} [params.callBackUrl] - Optional webhook callback URL
   * @returns {Promise<{ taskId: string, statusUrl?: string, cancelUrl?: string }>}
   */
  static async createTask({ model, input, callBackUrl }) {
    const config = getHiggsfieldConfig();
    const authHeader = this.getAuthHeader();

    if (!authHeader) {
      throw new Error("Video generation engine is temporarily unavailable. Missing or placeholder HIGGSFIELD_API_KEY.");
    }

    // Normalize endpoint path
    const cleanModelPath = String(model || "").replace(/^\/+/, "");
    const endpoint = `${config.baseUrl}/${cleanModelPath}`;

    const payload = {
      ...input,
    };

    if (callBackUrl && typeof callBackUrl === "string" && callBackUrl.startsWith("http")) {
      payload.webhook_url = callBackUrl;
      payload.callback_url = callBackUrl;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        if (!response.ok) {
          throw new Error(`Service temporarily busy (HTTP ${response.status})`);
        }
        throw new Error("Invalid response format received from video generation service.");
      }

      if (!response.ok || data.error || (data.code && data.code >= 400)) {
        if (response.status === 402 || data.code === 402 || (data.message && String(data.message).toLowerCase().includes("balance"))) {
          console.error("[HiggsfieldProvider] Provider account balance depleted (code 402). Top-up required in Higgsfield Console.");
          throw new Error("Insufficient credits. Please top up your RUHGEN credits to continue generating.");
        }
        const errorMsg = data.message || data.error?.message || data.error || data.msg || `Service returned HTTP ${response.status}`;
        throw new Error(sanitizeError(errorMsg));
      }

      const taskId =
        data.request_id ||
        data.requestId ||
        data.id ||
        data.task_id ||
        data.taskId ||
        data.data?.request_id ||
        data.data?.id;

      if (!taskId) {
        const errorDetail = data.message || data.error || "No task/request ID returned by generation provider.";
        throw new Error(sanitizeError(errorDetail));
      }

      return {
        taskId: String(taskId),
        statusUrl: data.status_url || data.statusUrl || `${config.baseUrl}/requests/${taskId}/status`,
        cancelUrl: data.cancel_url || data.cancelUrl,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create video generation task.";
      throw new Error(sanitizeError(msg));
    }
  }

  /**
   * Query status of an existing task on Higgsfield
   * @param {string} taskId
   * @param {string} [customStatusUrl]
   * @returns {Promise<{ status: 'QUEUED'|'PROCESSING'|'COMPLETED'|'FAILED', urls: string[], progress: number, error: string|null }>}
   */
  static async getRecordInfo(taskId, customStatusUrl) {
    const config = getHiggsfieldConfig();
    const authHeader = this.getAuthHeader();

    if (!authHeader) {
      throw new Error("HIGGSFIELD_API_KEY not configured.");
    }

    const endpoint = customStatusUrl || `${config.baseUrl}/requests/${encodeURIComponent(taskId)}/status`;

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Higgsfield status endpoint returned HTTP ${response.status}`);
      }

      const data = JSON.parse(responseText);
      const record = data.data || data;

      const rawStatus = String(record.status || record.state || "").toLowerCase().trim();

      let normalizedStatus = "PROCESSING";
      if (rawStatus === "completed" || rawStatus === "success" || rawStatus === "succeeded" || rawStatus === "done") {
        normalizedStatus = "COMPLETED";
      } else if (rawStatus === "failed" || rawStatus === "fail" || rawStatus === "error" || rawStatus === "cancelled") {
        normalizedStatus = "FAILED";
      } else if (rawStatus === "queued" || rawStatus === "waiting" || rawStatus === "pending") {
        normalizedStatus = "QUEUED";
      } else {
        normalizedStatus = "PROCESSING";
      }

      const urls = [];
      const extractUrl = (val) => {
        if (typeof val === "string" && /^(https?:\/\/|data:video\/|data:image\/)/i.test(val.trim())) {
          urls.push(val.trim());
        }
      };

      // 1. Check output object / direct fields
      if (record.output) {
        if (typeof record.output === "string") extractUrl(record.output);
        else if (Array.isArray(record.output)) record.output.forEach(extractUrl);
        else if (typeof record.output === "object") {
          extractUrl(record.output.video_url);
          extractUrl(record.output.url);
          extractUrl(record.output.video);
          if (Array.isArray(record.output.urls)) record.output.urls.forEach(extractUrl);
          if (Array.isArray(record.output.video_urls)) record.output.video_urls.forEach(extractUrl);
        }
      }

      // 2. Direct top-level fields
      extractUrl(record.video_url);
      extractUrl(record.url);
      extractUrl(record.video);
      if (Array.isArray(record.urls)) record.urls.forEach(extractUrl);
      if (Array.isArray(record.videos)) record.videos.forEach(extractUrl);
      if (Array.isArray(record.resultUrls)) record.resultUrls.forEach(extractUrl);

      const errorMsg =
        normalizedStatus === "FAILED"
          ? sanitizeError(record.error?.message || record.error || record.failMsg || record.message || "Video generation failed upstream.")
          : null;

      const progress =
        normalizedStatus === "COMPLETED"
          ? 100
          : normalizedStatus === "QUEUED"
          ? 15
          : typeof record.progress === "number"
          ? Math.min(99, Math.max(20, record.progress))
          : 50;

      return {
        status: normalizedStatus,
        urls: [...new Set(urls)],
        progress,
        error: errorMsg,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error querying task info.";
      return {
        status: "PROCESSING",
        urls: [],
        progress: 35,
        error: sanitizeError(msg),
      };
    }
  }

  /**
   * Cancel an active task on Higgsfield
   */
  static async cancelTask(taskId, customCancelUrl) {
    const config = getHiggsfieldConfig();
    const authHeader = this.getAuthHeader();
    if (!authHeader) return { ok: false };

    const endpoint = customCancelUrl || `${config.baseUrl}/requests/${encodeURIComponent(taskId)}/cancel`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }
}

module.exports = { HiggsfieldProvider, sanitizeError };
