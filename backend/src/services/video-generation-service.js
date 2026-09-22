/**
 * video-generation-service.js
 * Video Generation Service Adapter.
 * Bridges calls directly to the server-side Higgsfield AI generation pipeline.
 */

const { HiggsfieldProvider, sanitizeError } = require("./higgsfield-provider");
const { getHiggsfieldConfig } = require("../config");

class VideoGenerationService {
  /**
   * Create an asynchronous video generation task via Higgsfield
   */
  static async createVideoTask(params) {
    const {
      prompt,
      duration = 5,
      aspect_ratio = "16:9",
      tier = "standard",
      modelId,
      quality,
      mode,
      negative_prompt,
      image_url,
      reference_url,
      references,
      sound = true,
      resolution,
      camera_control,
      seed,
    } = params;

    const hf = getHiggsfieldConfig();
    if (!hf.isConfigured) {
      throw new Error("Video generation is not configured. Missing HIGGSFIELD_API_KEY.");
    }

    const isSeedance =
      (typeof modelId === "string" && modelId.toLowerCase().includes("seedance")) ||
      (typeof tier === "string" && tier.toLowerCase().includes("seedance")) ||
      (typeof tier === "string" && tier.toLowerCase().includes("prem")) ||
      quality === "quality" ||
      mode === "pro";

    const refImage = image_url || reference_url;
    const refArray = Array.isArray(references) ? references : refImage ? [refImage] : [];

    let providerModel = isSeedance
      ? "bytedance/seedance-2.5/text-to-video"
      : "bytedance/seedance-2.5/text-to-video";

    const input = {
      prompt: String(prompt || "").trim(),
      aspect_ratio: String(aspect_ratio || "16:9"),
      duration: Number(duration) || 5,
    };

    if (sound !== undefined) input.sound = Boolean(sound);
    if (negative_prompt) input.negative_prompt = String(negative_prompt).trim();
    if (resolution) input.resolution = String(resolution);
    if (camera_control && camera_control !== "none" && camera_control !== "static") {
      input.camera_control = String(camera_control);
    }
    if (seed !== undefined && seed !== null && seed !== "") {
      const numSeed = Number(seed);
      if (Number.isFinite(numSeed)) input.seed = numSeed;
    }

    if (refArray.length > 0) {
      providerModel = "bytedance/seedance-2.5/image-to-video";
      input.images = refArray;
      input.image_url = refArray[0];
    }

    try {
      const task = await HiggsfieldProvider.createTask({
        model: providerModel,
        input,
      });
      return {
        taskId: task.taskId,
        tier: isSeedance ? "premium" : "standard",
        model: providerModel,
      };
    } catch (err) {
      throw new Error(sanitizeError(err.message));
    }
  }

  /**
   * Poll status of an active video task via Higgsfield
   */
  static async getTaskStatus(taskId) {
    try {
      const record = await HiggsfieldProvider.getRecordInfo(taskId);
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
