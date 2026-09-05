/**
 * kie-provider.js
 * Production-Grade KIE.ai API Provider Adapter.
 * 
 * - Strictly server-side only.
 * - Enforces zero credentials in client bundles, errors, or public logs.
 * - Handles asynchronous job creation and status retrieval.
 * - Sanitizes all upstream error strings to prevent credentials disclosure.
 */

const { getKieConfig } = require("../config");

function sanitizeError(msg) {
  if (!msg || typeof msg !== "string") return "Generation service is temporarily busy. Please try again in a moment.";
  const config = getKieConfig();
  let sanitized = msg
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    .replace(/api[-_]?key=[a-zA-Z0-9_\-\.]+/gi, "api_key=[REDACTED]")
    .replace(/\b[0-9a-f]{32}\b/gi, "[REDACTED_KEY]");

  if (config.apiKey && config.apiKey.length > 8) {
    sanitized = sanitized.split(config.apiKey).join("[REDACTED_KEY]");
  }

  // Strip all technical provider or model mentions and replace with friendly, branded error
  if (/kie\.ai|kling|qwen|flux|provider|upstream|credits insufficient|balance is exhausted/i.test(sanitized)) {
    return "Generation service is temporarily busy due to high demand. Please try again in a moment. Your RUHGEN credits were not charged.";
  }

  return sanitized;
}

class KieProvider {
  /**
   * Submit an asynchronous task to KIE.ai
   * @param {Object} params
   * @param {string} params.model - KIE model ID (e.g. 'flux-2/flex-text-to-image')
   * @param {Object} params.input - Model-specific sanitized parameters
   * @param {string} [params.callBackUrl] - Optional webhook callback URL
   * @returns {Promise<{ taskId: string }>}
   */
  static async createTask({ model, input, callBackUrl }) {
    const config = getKieConfig();

    if (!config.apiKey || config.apiKey.includes("your_kie_api_key")) {
      throw new Error(
        "Generation engine is temporarily unavailable. Please try again shortly."
      );
    }

    const endpoint = `${config.baseUrl}/api/v1/jobs/createTask`;
    const payload = {
      model,
      input,
    };

    if (callBackUrl && typeof callBackUrl === "string" && callBackUrl.startsWith("http")) {
      payload.callBackUrl = callBackUrl;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
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
        throw new Error("Invalid response format received from generation service.");
      }

      if (!response.ok || (data.code && data.code !== 200)) {
        if (data.code === 402 || (data.msg && String(data.msg).toLowerCase().includes("credits insufficient"))) {
          console.error("[KieProvider] Upstream provider account balance exhausted (code 402). Admin top-up required in provider portal.");
          throw new Error("Generation service is temporarily busy due to high demand. Please try again in a moment. Your RUHGEN credits were not charged.");
        }
        const errorMsg = data.msg || data.message || data.error || `Service busy (code ${data.code || response.status})`;
        throw new Error(sanitizeError(errorMsg));
      }

      const taskId =
        data.taskId ||
        data.task_id ||
        data.id ||
        data.data?.taskId ||
        data.data?.task_id ||
        data.data?.id;

      if (!taskId) {
        const errorDetail = data.msg || data.message || "No taskId returned by generation provider.";
        throw new Error(sanitizeError(errorDetail));
      }

      return { taskId: String(taskId) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create generation task.";
      throw new Error(sanitizeError(msg));
    }
  }

  /**
   * Check live credit balance on KIE.ai
   */
  static async checkProviderBalance() {
    const config = getKieConfig();
    if (!config.apiKey || config.apiKey.includes("your_kie_api_key")) {
      return { ok: false, configured: false, credits: 0 };
    }
    try {
      const res = await fetch(`${config.baseUrl}/api/v1/chat/credit`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      if (!res.ok) return { ok: false, configured: true, credits: 0 };
      const data = await res.json();
      const credits = typeof data.data === "number" ? data.data : 0;
      return {
        ok: true,
        configured: true,
        credits,
        creditsUsd: Number((credits * 0.005).toFixed(4)),
        isSufficientForVideo: credits >= 55,
      };
    } catch (e) {
      return { ok: false, configured: true, error: e.message, credits: 0 };
    }
  }

  /**
   * Query status of an existing task on KIE.ai
   * @param {string} taskId
   * @returns {Promise<{ status: 'QUEUED'|'PROCESSING'|'COMPLETED'|'FAILED', urls: string[], progress: number, error: string|null }>}
   */
  static async getRecordInfo(taskId) {
    const config = getKieConfig();

    if (!config.apiKey || config.apiKey.includes("your_kie_api_key")) {
      throw new Error("KIE_API_KEY not configured.");
    }

    const endpoint = `${config.baseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`;

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`KIE recordInfo returned HTTP ${response.status}`);
      }

      const data = JSON.parse(responseText);
      const record = data.data || data;

      const rawStatus = String(record.status || record.state || "").toLowerCase().trim();

      let normalizedStatus = "PROCESSING";
      if (rawStatus === "success" || rawStatus === "completed" || rawStatus === "succeeded" || rawStatus === "done") {
        normalizedStatus = "COMPLETED";
      } else if (rawStatus === "fail" || rawStatus === "failed" || rawStatus === "error") {
        normalizedStatus = "FAILED";
      } else if (rawStatus === "waiting" || rawStatus === "queuing" || rawStatus === "queued") {
        normalizedStatus = "QUEUED";
      } else {
        normalizedStatus = "PROCESSING";
      }

      const urls = [];
      const extractUrl = (val) => {
        if (typeof val === "string" && /^(https?:\/\/|data:image\/)/i.test(val.trim())) {
          urls.push(val.trim());
        }
      };

      // 1. Check KIE.ai standard resultJson field (stringified JSON)
      if (record.resultJson) {
        try {
          const parsed = typeof record.resultJson === "string" ? JSON.parse(record.resultJson) : record.resultJson;
          if (Array.isArray(parsed?.resultUrls)) parsed.resultUrls.forEach(extractUrl);
          if (Array.isArray(parsed?.urls)) parsed.urls.forEach(extractUrl);
          if (parsed?.url) extractUrl(parsed.url);
          if (parsed?.video_url) extractUrl(parsed.video_url);
          if (parsed?.image_url) extractUrl(parsed.image_url);
        } catch {}
      }

      // 2. Check result object
      if (record.result) {
        if (typeof record.result === "string") extractUrl(record.result);
        else if (Array.isArray(record.result)) record.result.forEach(extractUrl);
        else if (typeof record.result === "object") {
          extractUrl(record.result.url);
          extractUrl(record.result.video_url);
          extractUrl(record.result.image_url);
          if (Array.isArray(record.result.urls)) record.result.urls.forEach(extractUrl);
          if (Array.isArray(record.result.resultUrls)) record.result.resultUrls.forEach(extractUrl);
        }
      }

      // 3. Direct top-level URL fields
      extractUrl(record.url);
      extractUrl(record.video_url);
      extractUrl(record.image_url);
      if (Array.isArray(record.urls)) record.urls.forEach(extractUrl);
      if (Array.isArray(record.resultUrls)) record.resultUrls.forEach(extractUrl);

      const errorMsg =
        normalizedStatus === "FAILED"
          ? sanitizeError(record.failMsg || record.error?.message || record.error || record.msg || "Generation failed upstream.")
          : null;

      const progress =
        normalizedStatus === "COMPLETED"
          ? 100
          : normalizedStatus === "QUEUED"
          ? 10
          : typeof record.progress === "number"
          ? Math.min(99, Math.max(15, record.progress))
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
        progress: 30,
        error: sanitizeError(msg),
      };
    }
  }
}

module.exports = { KieProvider, sanitizeError };
