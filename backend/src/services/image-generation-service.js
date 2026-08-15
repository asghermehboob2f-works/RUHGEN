/**
 * RUHGEN Image Generation Service & Provider Adapter
 * Decouples backend from direct vendor dependencies.
 * Supports RUHGEN Standard and RUHGEN Premium independent configurations.
 */

const { getImageConfig } = require("../config");

function snapToNvidiaDim(val) {
  const allowed = [768, 832, 896, 960, 1024, 1088, 1152, 1216, 1280, 1344];
  let best = allowed[0];
  let minDiff = Math.abs(val - best);
  for (const a of allowed) {
    const diff = Math.abs(val - a);
    if (diff < minDiff) {
      minDiff = diff;
      best = a;
    }
  }
  return best;
}

class ImageGenerationService {
  /**
   * Generate an image using configured Standard or Premium provider adapter.
   * @param {Object} params
   * @param {string} params.prompt
   * @param {string} [params.tier] 'standard' or 'premium'
   * @param {string} [params.quality] fallback tier indicator
   * @param {number} [params.width]
   * @param {number} [params.height]
   * @param {string} [params.image_url] reference image for img2img
   * @param {number} [params.denoise]
   * @param {number} [params.guidance_scale]
   * @returns {Promise<{ imageDataUrl: string, configUsed: { tier: string, model: string } }>}
   */
  static async generateImage(params) {
    const {
      prompt,
      tier,
      quality,
      width = 1024,
      height = 1024,
      image_url,
    } = params;

    const requestedTier = (tier || quality || "quality").toLowerCase();
    const config = getImageConfig(requestedTier);

    if (!config.apiKey) {
      throw new Error(
        `Image generation service is not configured for engine tier '${config.tier}'. Missing API Key.`
      );
    }

    const nvW = snapToNvidiaDim(width);
    const nvH = snapToNvidiaDim(height);

    // Call Provider Adapter (NVIDIA / Generic OpenAI-compatible Image API)
    try {
      const reqBody = {
        prompt,
        width: nvW,
        height: nvH,
        seed: Math.floor(Math.random() * 1000000),
        steps: 4,
        ...(image_url ? { image_url } : {}),
      };

      // Include model in body only if API URL doesn't already contain model path (NVIDIA endpoints reject extra body fields)
      if (config.model && !config.apiUrl.includes("nvidia.com") && !config.apiUrl.includes(config.model)) {
        reqBody.model = config.model;
      }

      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let detail = "Upstream provider error.";
        try {
          const parsed = JSON.parse(responseText);
          if (typeof parsed.detail === "string") detail = parsed.detail;
          else if (Array.isArray(parsed.detail) && parsed.detail[0]?.msg) detail = parsed.detail[0].msg;
          else if (parsed.message) detail = parsed.message;
          else if (parsed.error?.message) detail = parsed.error.message;
          else if (typeof parsed.error === "string") detail = parsed.error;
        } catch {
          if (responseText && responseText.length < 200) detail = responseText;
        }
        // Sanitize error detail to never leak API keys
        const cleanDetail = detail.replace(/nvapi-[a-zA-Z0-9_-]+/g, "[REDACTED_KEY]");
        throw new Error(`Generation Engine (${config.tier}) returned error: ${cleanDetail}`);
      }

      const json = JSON.parse(responseText);

      // 1. Artifacts format (NVIDIA / Stability style)
      if (Array.isArray(json.artifacts) && json.artifacts.length > 0) {
        const art = json.artifacts[0];
        if (art.finishReason === "CONTENT_FILTERED") {
          throw new Error("The prompt was blocked by safety filters. Please refine your prompt and try again.");
        }
        if (art.base64) {
          const imageDataUrl = art.base64.startsWith("data:") ? art.base64 : `data:image/jpeg;base64,${art.base64}`;
          return { imageDataUrl, configUsed: { tier: config.tier, model: config.model } };
        }
        if (art.b64_json) {
          const imageDataUrl = art.b64_json.startsWith("data:") ? art.b64_json : `data:image/jpeg;base64,${art.b64_json}`;
          return { imageDataUrl, configUsed: { tier: config.tier, model: config.model } };
        }
        if (art.url) {
          return { imageDataUrl: art.url, configUsed: { tier: config.tier, model: config.model } };
        }
      }

      // 2. Standard OpenAI image format
      if (Array.isArray(json.data) && json.data.length > 0) {
        const item = json.data[0];
        if (item.b64_json) {
          const imageDataUrl = item.b64_json.startsWith("data:") ? item.b64_json : `data:image/jpeg;base64,${item.b64_json}`;
          return { imageDataUrl, configUsed: { tier: config.tier, model: config.model } };
        }
        if (item.url) {
          return { imageDataUrl: item.url, configUsed: { tier: config.tier, model: config.model } };
        }
      }

      // 3. Direct b64_json or url fields
      if (json.b64_json) {
        const imageDataUrl = json.b64_json.startsWith("data:") ? json.b64_json : `data:image/jpeg;base64,${json.b64_json}`;
        return { imageDataUrl, configUsed: { tier: config.tier, model: config.model } };
      }
      if (json.url) {
        return { imageDataUrl: json.url, configUsed: { tier: config.tier, model: config.model } };
      }

      throw new Error("Generation service completed but returned no valid image payload.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Image generation failed.";
      throw new Error(msg.replace(/nvapi-[a-zA-Z0-9_-]+/g, "[REDACTED_KEY]"));
    }
  }
}

module.exports = { ImageGenerationService };
