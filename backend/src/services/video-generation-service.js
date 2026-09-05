/**
 * video-generation-service.js
 * Video Generation Service Adapter.
 * Bridges any legacy calls directly to the server-side KIE.ai generation pipeline.
 */

const { KieProvider, sanitizeError } = require("./kie-provider");
const { getKieConfig } = require("../config");

class VideoGenerationService {
  /**
   * Create an asynchronous video generation task via KIE.ai
   */
  static async createVideoTask(params) {
    const {
      prompt,
      duration = 5,
      aspect_ratio = "16:9",
      tier = "standard",
      quality,
      mode,
      negative_prompt,
      image_url,
      reference_url,
      sound = true,
    } = params;

    const kie = getKieConfig();
    if (!kie.isConfigured) {
      throw new Error("Video generation is not configured. Missing KIE_API_KEY.");
    }

    const isPremium =
      (typeof tier === "string" && tier.toLowerCase().includes("prem")) ||
      quality === "quality" ||
      mode === "pro";

    const modelId = isPremium ? "kling-3.0-omni/text-to-video" : "kling-2.6/text-to-video";

    const input = {
      prompt: String(prompt || "").trim(),
      sound: Boolean(sound),
      duration: String(duration),
      aspect_ratio: String(aspect_ratio),
    };

    if (negative_prompt) input.negative_prompt = String(negative_prompt).trim();

    const refImage = image_url || reference_url;
    let providerModel = modelId;
    if (isPremium && refImage) {
      providerModel = "kling-3.0-omni/reference-to-video";
      input.image_urls = [refImage];
    } else if (!isPremium && refImage) {
      providerModel = "kling-2.6/image-to-video";
      input.image_urls = [refImage];
    }

    try {
      const task = await KieProvider.createTask({
        model: providerModel,
        input,
      });
      return {
        taskId: task.taskId,
        tier: isPremium ? "premium" : "standard",
        model: providerModel,
      };
    } catch (err) {
      throw new Error(sanitizeError(err.message));
    }
  }

  /**
   * Poll status of an active video task via KIE.ai
   */
  static async getTaskStatus(taskId) {
    try {
      const record = await KieProvider.getRecordInfo(taskId);
      return {
        status: record.status.toLowerCase(),
        urls: record.urls,
        progress: record.progress,
        error: record.error,
      };
    } catch (err) {
      return {
        status: "failed",
        urls: [],
        progress: 0,
        error: sanitizeError(err.message),
      };
    }
  }
}

module.exports = { VideoGenerationService };
