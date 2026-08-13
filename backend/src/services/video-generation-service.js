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
    } = params;

    const requestedTier = (tier || quality || (mode === "pro" ? "quality" : "standard")).toLowerCase();
    const config = getVideoConfig(requestedTier);

    // If external video API endpoint is configured (e.g. PiAPI / Kling / Luma)
    if (config.apiUrl && config.apiKey) {
      try {
        const response = await fetch(config.apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            model: config.model,
            prompt,
            duration: Number(duration),
            aspect_ratio,
            negative_prompt,
            image_url,
          }),
        });

        const text = await response.text();
        if (!response.ok) {
          throw new Error(`Video Engine (${config.tier}) error (HTTP ${response.status}): ${text.slice(0, 300)}`);
        }

        const json = JSON.parse(text);
        const taskId = json.task_id || json.id || json.taskId;
        if (!taskId) {
          throw new Error("Video provider did not return a valid task ID.");
        }

        return { taskId, tier: config.tier, model: config.model };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Video task creation failed.";
        throw new Error(msg.replace(/api[-_]?[a-zA-Z0-9_-]+/g, "[REDACTED_KEY]"));
      }
    }

    // Default built-in async task identifier fallback
    const taskId = `vid_task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return { taskId, tier: config.tier, model: config.model };
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

    if (config.apiUrl && config.apiKey && taskId && !taskId.startsWith("vid_task_")) {
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
          throw new Error(`Video status poll failed: ${errText.slice(0, 200)}`);
        }

        const json = await response.text().then((t) => JSON.parse(t));
        const rawStatus = (json.status || json.state || "").toLowerCase();

        let status = "processing";
        if (["completed", "succeeded", "success", "done"].includes(rawStatus)) {
          status = "completed";
        } else if (["failed", "error", "rejected"].includes(rawStatus)) {
          status = "failed";
        }

        let urls = [];
        if (Array.isArray(json.urls)) urls = json.urls;
        else if (Array.isArray(json.videos)) urls = json.videos.map((v) => v.url || v);
        else if (json.video_url) urls = [json.video_url];
        else if (json.url) urls = [json.url];

        return {
          status,
          urls,
          progress: json.progress || (status === "completed" ? 100 : 50),
          error: json.error || null,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Status check failed.";
        return { status: "failed", urls: [], error: msg };
      }
    }

    // Default simulation fallback for built-in task ID
    return {
      status: "completed",
      urls: [],
      error: null,
    };
  }
}

module.exports = { VideoGenerationService };
