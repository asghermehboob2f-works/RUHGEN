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
      video_url,
      reference_url,
      references,
      image_urls,
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
    const explicitRefs = Array.isArray(references)
      ? references
      : Array.isArray(image_urls)
      ? image_urls
      : refImage
      ? [refImage]
      : [];

    // Detect if a video reference is present for Motion Transfer
    const videoRef =
      (typeof video_url === "string" && video_url.trim()) ||
      explicitRefs.find((r) => typeof r === "string" && (/\.(mp4|webm|mov|m4v)/i.test(r) || r.includes("video")));

    const imageRefs = explicitRefs.filter((r) => r !== videoRef);

    let providerModel = "bytedance/seedance-2.5/text-to-video";
    let input = {};

    // 1. Genjutsu Motion Transfer workflow (video reference + character image references)
    if (videoRef && imageRefs.length > 0) {
      providerModel = "higgsfield/genjutsu/motion-transfer/v1.0";
      input = {
        video_url: videoRef,
        image_urls: imageRefs,
        prompt: String(prompt || "").trim(),
      };
    } else if (explicitRefs.length > 0) {
      // 2. Image-to-Video workflow
      providerModel = "bytedance/seedance-2.5/image-to-video";
      input = {
        prompt: String(prompt || "").trim(),
        aspect_ratio: String(aspect_ratio || "16:9"),
        duration: Number(duration) || 5,
        images: explicitRefs,
        image_url: explicitRefs[0],
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
    } else {
      // 3. Text-to-Video workflow
      providerModel = "bytedance/seedance-2.5/text-to-video";
      input = {
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
