/**
 * RUHGEN Video Generation Service & Provider Adapter
 * Manages async video creation tasks and status polling with provider abstraction.
 * Supports Video Standard and Video Premium configurations.
 */

const { getVideoConfig } = require("../config");

class VideoGenerationService {
  /**
   * Create an asynchronous video generation task.
   * @param {Object} params
   * @param {string} params.prompt
   * @param {number} [params.duration] 5 or 10
   * @param {string} [params.aspect_ratio] '16:9', '9:16', '1:1'
   * @param {string} [params.tier] 'standard' or 'premium'
   * @param {string} [params.quality] fallback tier indicator
   * @param {string} [params.mode] fallback tier indicator ('std' | 'pro')
   * @param {string} [params.negative_prompt]
   * @param {string} [params.image_url]
   * @param {string} [params.video_url]
   * @param {string} [params.reference_url]
   * @param {string} [params.reference_type]
   * @returns {Promise<{ taskId: string, tier: string, model: string }>}
   */
  static async createVideoTask(params) {
    const {
      prompt,
      duration = 5,
      aspect_ratio = "16:9",
      tier,
      quality,
      mode,
      negative_prompt,
      image_url,
      video_url,
      reference_url,
      reference_type,
    } = params;

    const requestedTier = (tier || quality || (mode === "pro" ? "quality" : "standard")).toLowerCase();
    const config = getVideoConfig(requestedTier);

    if (!config.apiKey) {
      throw new Error(
        `Video generation service is not configured for engine tier '${config.tier}'. Missing API Key in .env (VIDEO_${config.tier.toUpperCase()}_API_KEY).`
      );
    }
    if (!config.apiUrl) {
      throw new Error(
        `Video generation service is not configured for engine tier '${config.tier}'. Missing API URL in .env (VIDEO_${config.tier.toUpperCase()}_API_URL).`
      );
    }

    try {
      const payload = {
        prompt,
        duration: Number(duration),
        duration_seconds: Number(duration),
        aspect_ratio,
        aspectRatio: aspect_ratio,
      };

      if (config.model) {
        payload.model = config.model;
      }
      if (negative_prompt) {
        payload.negative_prompt = negative_prompt;
        payload.negativePrompt = negative_prompt;
      }

      const activeRefUrl = video_url || reference_url || image_url;
      const activeRefType = reference_type || (video_url ? "video" : (image_url ? "image" : null));

      if (activeRefType === "video" || (activeRefUrl && /\.(mp4|webm|mov)(\?.*)?$/i.test(activeRefUrl))) {
        payload.video_url = activeRefUrl;
        payload.video = activeRefUrl;
        payload.input_video = activeRefUrl;
        payload.reference_video = activeRefUrl;
        payload.start_video_url = activeRefUrl;
      } else if (activeRefUrl) {
        payload.image_url = activeRefUrl;
        payload.image = activeRefUrl;
        payload.input_image = activeRefUrl;
        payload.start_image_url = activeRefUrl;
      }

      if (image_url) {
        payload.image_url = image_url;
        payload.image = image_url;
        payload.input_image = image_url;
        payload.start_image_url = image_url;
      }
      if (video_url) {
        payload.video_url = video_url;
        payload.video = video_url;
        payload.input_video = video_url;
        payload.reference_video = video_url;
        payload.start_video_url = video_url;
      }

      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Video Engine (${config.tier}) error (HTTP ${response.status}): ${text.slice(0, 300)}`);
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error("Video provider returned invalid JSON response.");
      }

      // Check for inline synchronous video URLs
      const inlineUrl =
        (typeof json.video_url === "string" && json.video_url) ||
        (typeof json.url === "string" && json.url) ||
        (typeof json.data?.video_url === "string" && json.data.video_url) ||
        (typeof json.data?.url === "string" && json.data.url) ||
        (typeof json.output === "string" && json.output) ||
        (typeof json.data?.output === "string" && json.data.output);

      if (inlineUrl && typeof inlineUrl === "string") {
        const syncTaskId = `vid_sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        return {
          taskId: syncTaskId,
          tier: config.tier,
          model: config.model,
          syncUrls: [inlineUrl],
        };
      }

      // Extract task ID across provider standard formats
      const taskId =
        json.task_id ||
        json.id ||
        json.taskId ||
        json.data?.task_id ||
        json.data?.id ||
        json.data?.taskId ||
        json.result?.id ||
        json.result?.task_id;

      if (!taskId) {
        throw new Error("Video provider did not return a valid task ID or video URL.");
      }

      return { taskId, tier: config.tier, model: config.model };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Video task creation failed.";
      throw new Error(msg.replace(/api[-_]?[a-zA-Z0-9_-]+/g, "[REDACTED_KEY]"));
    }
  }

  /**
   * Check status of a video generation task.
   * @param {string} taskId
   * @param {Object} [storedTaskDetails] task metadata saved in DB
   * @returns {Promise<{ status: string, urls: string[], progress?: number, error?: string }>}
   */
  static async getTaskStatus(taskId, storedTaskDetails = {}) {
    const tier = storedTaskDetails.tier || "quality";
    const config = getVideoConfig(tier);

    // If task was generated synchronously, return cached URLs directly
    if (storedTaskDetails.urls && storedTaskDetails.urls.length > 0) {
      return {
        status: "completed",
        urls: storedTaskDetails.urls,
        progress: 100,
        error: null,
      };
    }

    if (config.apiUrl && config.apiKey && taskId && !taskId.startsWith("vid_sync_")) {
      try {
        const statusUrl = `${config.apiUrl.replace(/\/$/, "")}/${taskId}`;
        const response = await fetch(statusUrl, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Video status poll failed (HTTP ${response.status}): ${errText.slice(0, 200)}`);
        }

        const text = await response.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          throw new Error("Video status poll returned invalid JSON.");
        }

        const rawStatus = String(
          json.status ||
          json.state ||
          json.task_status ||
          json.data?.status ||
          json.data?.state ||
          json.data?.task_status ||
          ""
        ).toLowerCase();

        let status = "processing";
        if (
          ["completed", "succeeded", "success", "done", "finished", "successful"].includes(rawStatus)
        ) {
          status = "completed";
        } else if (
          ["failed", "error", "rejected", "canceled", "cancelled"].includes(rawStatus)
        ) {
          status = "failed";
        }

        let urls = [];
        if (Array.isArray(json.urls)) {
          urls = json.urls.filter((u) => typeof u === "string");
        } else if (Array.isArray(json.data?.urls)) {
          urls = json.data.urls.filter((u) => typeof u === "string");
        } else if (Array.isArray(json.videos)) {
          urls = json.videos.map((v) => (typeof v === "string" ? v : v.url || v.video_url)).filter(Boolean);
        } else if (Array.isArray(json.data?.videos)) {
          urls = json.data.videos.map((v) => (typeof v === "string" ? v : v.url || v.video_url)).filter(Boolean);
        } else if (typeof json.video_url === "string" && json.video_url) {
          urls = [json.video_url];
        } else if (typeof json.data?.video_url === "string" && json.data.video_url) {
          urls = [json.data.video_url];
        } else if (typeof json.url === "string" && json.url) {
          urls = [json.url];
        } else if (typeof json.data?.url === "string" && json.data.url) {
          urls = [json.data.url];
        } else if (typeof json.output === "string" && json.output) {
          urls = [json.output];
        } else if (Array.isArray(json.output)) {
          urls = json.output.filter((u) => typeof u === "string");
        } else if (typeof json.output?.video === "string") {
          urls = [json.output.video];
        } else if (typeof json.output?.video_url === "string") {
          urls = [json.output.video_url];
        } else if (typeof json.data?.output?.video_url === "string") {
          urls = [json.data.output.video_url];
        } else if (typeof json.data?.works?.[0]?.resource === "string") {
          urls = [json.data.works[0].resource];
        }

        const errMsg =
          (json.error && (typeof json.error === "string" ? json.error : json.error.message)) ||
          json.data?.error?.message ||
          (status === "failed" ? "Video task execution failed." : null);

        return {
          status,
          urls,
          progress: json.progress || json.data?.progress || (status === "completed" ? 100 : 50),
          error: errMsg,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Status check failed.";
        return { status: "failed", urls: [], error: msg.replace(/api[-_]?[a-zA-Z0-9_-]+/g, "[REDACTED_KEY]") };
      }
    }

    return {
      status: "completed",
      urls: storedTaskDetails.urls || [],
      error: null,
    };
  }
}

module.exports = { VideoGenerationService };
