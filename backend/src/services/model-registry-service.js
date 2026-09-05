/**
 * model-registry-service.js
 * Centralized Model Registry, Capability Validator, and Financial Margin Protector.
 * 
 * - Ensures frontends cannot submit unsupported or manipulated parameters.
 * - Protects RUHGEN against negative margins before generation is dispatched.
 * - Exposes sanitized model metadata for dynamic UI controls.
 */

class ModelRegistryService {
  /**
   * Get all models for admin management
   */
  static getAllModels(db) {
    return db.prepare("SELECT * FROM model_registry ORDER BY type ASC, tier ASC").all().map((m) => ({
      ...m,
      enabled: Boolean(m.enabled),
      supported_aspect_ratios: JSON.parse(m.supported_aspect_ratios || "[]"),
      supported_resolutions: JSON.parse(m.supported_resolutions || "[]"),
      supported_durations: JSON.parse(m.supported_durations || "[]"),
      supported_controls: JSON.parse(m.supported_controls || "[]"),
    }));
  }

  /**
   * Get public sanitized models for frontend display and dynamic controls
   */
  static getPublicModels(db) {
    const rows = db
      .prepare(
        `SELECT id, name, type, tier, credit_cost_type, base_credit_cost,
                supported_aspect_ratios, supported_resolutions, supported_durations,
                supported_controls, max_duration, max_resolution
         FROM model_registry
         WHERE enabled = 1
         ORDER BY type ASC, tier ASC`
      )
      .all();

    return rows.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      tier: m.tier,
      creditCostType: m.credit_cost_type,
      baseCreditCost: m.base_credit_cost,
      supportedAspectRatios: JSON.parse(m.supported_aspect_ratios || "[]"),
      supportedResolutions: JSON.parse(m.supported_resolutions || "[]"),
      supportedDurations: JSON.parse(m.supported_durations || "[]"),
      supportedControls: JSON.parse(m.supported_controls || "[]"),
      maxDuration: m.max_duration,
      maxResolution: m.max_resolution,
    }));
  }

  /**
   * Find a model by internal ID or tier fallback
   */
  static getModel(db, { modelId, type, tier }) {
    if (modelId) {
      const found = db.prepare("SELECT * FROM model_registry WHERE id = ?").get(modelId);
      if (found) {
        return {
          ...found,
          enabled: Boolean(found.enabled),
          supported_aspect_ratios: JSON.parse(found.supported_aspect_ratios || "[]"),
          supported_resolutions: JSON.parse(found.supported_resolutions || "[]"),
          supported_durations: JSON.parse(found.supported_durations || "[]"),
          supported_controls: JSON.parse(found.supported_controls || "[]"),
        };
      }
    }

    // Fallback by type and tier
    const resolvedTier = (tier || "standard").toLowerCase().includes("prem") || tier === "quality" || tier === "pro"
      ? "premium"
      : "standard";
    const resolvedType = type === "video" ? "video" : "image";

    const found = db
      .prepare("SELECT * FROM model_registry WHERE type = ? AND tier = ? AND enabled = 1 LIMIT 1")
      .get(resolvedType, resolvedTier);

    if (!found) {
      throw new Error(`No active AI model found for ${resolvedType} (${resolvedTier}).`);
    }

    return {
      ...found,
      enabled: Boolean(found.enabled),
      supported_aspect_ratios: JSON.parse(found.supported_aspect_ratios || "[]"),
      supported_resolutions: JSON.parse(found.supported_resolutions || "[]"),
      supported_durations: JSON.parse(found.supported_durations || "[]"),
      supported_controls: JSON.parse(found.supported_controls || "[]"),
    };
  }

  /**
   * Validate and sanitize client generation parameters against model capabilities
   */
  static validateAndSanitizeParams(model, rawParams) {
    const prompt = typeof rawParams.prompt === "string" ? rawParams.prompt.trim() : "";
    if (!prompt || prompt.length < 2) {
      throw new Error("Please provide a prompt with at least 2 characters.");
    }
    if (prompt.length > 4000) {
      throw new Error("Prompt is too long (maximum 4,000 characters).");
    }

    const sanitized = { prompt };

    // 1. Aspect Ratio
    if (model.supported_aspect_ratios.length > 0) {
      const requestedRatio = typeof rawParams.aspect_ratio === "string" ? rawParams.aspect_ratio.trim() : "";
      if (requestedRatio && model.supported_aspect_ratios.includes(requestedRatio)) {
        sanitized.aspect_ratio = requestedRatio;
      } else {
        sanitized.aspect_ratio = model.type === "video" ? "16:9" : "1:1";
      }
    }

    // 2. Video Duration
    if (model.type === "video") {
      const requestedDur = Number(rawParams.duration);
      if (model.supported_durations.includes(requestedDur)) {
        sanitized.duration = requestedDur;
      } else {
        sanitized.duration = model.supported_durations[0] || 5;
      }
    }

    // 3. Negative Prompt
    if (model.supported_controls.includes("negative_prompt")) {
      const neg = typeof rawParams.negative_prompt === "string" ? rawParams.negative_prompt.trim().slice(0, 2000) : "";
      if (neg) sanitized.negative_prompt = neg;
    }

    // 4. Reference Media (Image or Video)
    const refUrl = rawParams.image_url || rawParams.reference_url || rawParams.video_url;
    if (refUrl && typeof refUrl === "string" && refUrl.trim()) {
      const trimmed = refUrl.trim();
      if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
        sanitized.image_url = trimmed;
        if (model.type === "video") sanitized.reference_url = trimmed;
      }
    }

    // 5. Guidance Scale & Denoise (for image edits)
    if (model.type === "image") {
      if (model.supported_controls.includes("guidance_scale") && typeof rawParams.guidance_scale === "number") {
        const gs = Number(rawParams.guidance_scale);
        if (Number.isFinite(gs) && gs >= 1 && gs <= 20) sanitized.guidance_scale = gs;
      }
      if (model.supported_controls.includes("denoise") && typeof rawParams.denoise === "number") {
        const dn = Number(rawParams.denoise);
        if (Number.isFinite(dn) && dn > 0 && dn < 1) sanitized.denoise = dn;
      }
    }

    if (typeof rawParams.style === "string" && rawParams.style.trim()) {
      sanitized.style = rawParams.style.trim().slice(0, 50);
    }

    // 7. Sound toggle (for video models)
    if (model.type === "video") {
      sanitized.sound = Boolean(rawParams.sound === true || rawParams.sound === "true");
    }

    // 8. Video Resolution
    if (model.type === "video" && Array.isArray(model.supported_resolutions) && model.supported_resolutions.length > 0) {
      const requestedRes = typeof rawParams.resolution === "string" ? rawParams.resolution.trim().toLowerCase() : "";
      if (requestedRes && model.supported_resolutions.includes(requestedRes)) {
        sanitized.resolution = requestedRes;
      } else {
        sanitized.resolution = model.supported_resolutions[0] || "720p";
      }
    }

    // 9. Camera Control (Omni Video only)
    if (model.type === "video" && model.supported_controls?.includes("camera_control")) {
      const allowedCameras = ["none", "zoom_in", "zoom_out", "pan_left", "pan_right"];
      const requestedCam = typeof rawParams.camera_control === "string" ? rawParams.camera_control.trim().toLowerCase() : "";
      if (allowedCameras.includes(requestedCam)) {
        sanitized.camera_control = requestedCam;
      } else {
        sanitized.camera_control = "none";
      }
    }

    // 10. Image Resolution (for image models)
    if (model.type === "image") {
      const requestedRes = typeof rawParams.resolution === "string" ? rawParams.resolution.trim() : "";
      if (requestedRes && (requestedRes === "1K" || requestedRes === "2K")) {
        sanitized.resolution = requestedRes;
      } else {
        sanitized.resolution = model.tier === "premium" ? "2K" : "1K";
      }
    }

    return sanitized;
  }

  /**
   * Format and validate parameters into the exact schema expected by KIE.ai
   */
  static formatProviderInput(model, sanitizedParams) {
    if (model.type === "video") {
      const isOmni = model.tier === "premium";
      const hasRefImage = Boolean(sanitizedParams.image_url || sanitizedParams.reference_url);

      const input = {
        prompt: sanitizedParams.prompt,
        sound: Boolean(sanitizedParams.sound),
        duration: String(sanitizedParams.duration || 5),
        aspect_ratio: String(sanitizedParams.aspect_ratio || "16:9"),
        ...(sanitizedParams.negative_prompt ? { negative_prompt: sanitizedParams.negative_prompt } : {}),
      };

      if (isOmni) {
        if (sanitizedParams.resolution) input.resolution = sanitizedParams.resolution;
        if (sanitizedParams.camera_control && sanitizedParams.camera_control !== "none") {
          input.camera_control = sanitizedParams.camera_control;
        }
        if (hasRefImage) {
          input.image_urls = [sanitizedParams.image_url || sanitizedParams.reference_url];
        }
      } else {
        input.mode = "std";
      }

      // Determine the provider model (Omni reference-to-video vs text-to-video)
      let resolvedKieModel = model.kie_model_id;
      if (isOmni && hasRefImage) {
        resolvedKieModel = "kling-3.0-omni/reference-to-video";
      }

      return {
        providerModel: resolvedKieModel,
        input,
      };
    }

    if (model.type === "image") {
      return {
        providerModel: model.kie_model_id,
        input: {
          prompt: sanitizedParams.prompt,
          aspect_ratio: String(sanitizedParams.aspect_ratio || "1:1"),
          resolution: sanitizedParams.resolution || (model.tier === "premium" ? "2K" : "1K"),
          ...(sanitizedParams.negative_prompt ? { negative_prompt: sanitizedParams.negative_prompt } : {}),
        },
      };
    }

    return {
      providerModel: model.kie_model_id,
      input: { ...sanitizedParams },
    };
  }

  /**
   * Authoritative Server-Side Credit Calculation
   */
  static calculateCreditCost(model, sanitizedParams) {
    if (model.credit_cost_type === "per_second") {
      const dur = sanitizedParams.duration || 5;
      return Math.max(1, Math.round(dur * model.base_credit_cost));
    }
    return Math.max(1, Math.round(model.base_credit_cost));
  }

  /**
   * Validates positive economics and margin protection against provider costs
   */
  static validateEconomicMargin(model, creditCost, sanitizedParams, db) {
    try {
      const rows = db.prepare("SELECT key, value FROM pricing_settings").all();
      const settings = Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));

      const creditInrRate = settings.credit_inr_rate || 1.0;
      const inrUsdRate = settings.inr_usd_rate || 87.0;
      const pgFeePercent = settings.pg_fee_percent || 2.36;
      const infraPercent = settings.infra_allowance_percent || 10.0;
      const minMarginPercent = model.min_margin_percent || settings.min_platform_margin_percent || 60.0;

      // Revenue in INR from RUHGEN credits
      const revenueInr = creditCost * creditInrRate;

      // Provider Cost in USD and INR
      let providerCostUsd = model.base_provider_cost;
      if (model.credit_cost_type === "per_second") {
        const dur = sanitizedParams.duration || 5;
        // base_provider_cost is per second or base unit
        providerCostUsd = (model.base_provider_cost / 5) * dur;
      }
      const providerCostInr = providerCostUsd * inrUsdRate;

      // Variable deductions
      const pgFeeInr = revenueInr * (pgFeePercent / 100);
      const infraInr = revenueInr * (infraPercent / 100);

      // Remaining gross margin
      const grossMarginInr = revenueInr - providerCostInr - pgFeeInr - infraInr;
      const grossMarginPercent = (grossMarginInr / revenueInr) * 100;

      if (grossMarginPercent < 0) {
        return {
          safe: false,
          reason: `Negative margin detected (${grossMarginPercent.toFixed(1)}%). Generation blocked for financial protection.`,
          grossMarginPercent,
          providerCostUsd,
        };
      }

      return {
        safe: true,
        grossMarginPercent,
        providerCostUsd,
      };
    } catch (e) {
      return { safe: true, grossMarginPercent: 65.0, providerCostUsd: model.base_provider_cost };
    }
  }

  /**
   * Update model parameters (Admin only)
   */
  static updateModel(db, modelId, updates) {
    const current = db.prepare("SELECT * FROM model_registry WHERE id = ?").get(modelId);
    if (!current) throw new Error("Model not found.");

    const allowedFields = [
      "name",
      "enabled",
      "base_credit_cost",
      "base_provider_cost",
      "min_margin_percent",
      "supported_aspect_ratios",
      "supported_durations",
      "max_duration",
    ];

    const clauses = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        clauses.push(`${field} = ?`);
        let val = updates[field];
        if (Array.isArray(val)) val = JSON.stringify(val);
        else if (typeof val === "boolean") val = val ? 1 : 0;
        values.push(val);
      }
    }

    if (clauses.length === 0) return current;

    clauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(modelId);

    db.prepare(`UPDATE model_registry SET ${clauses.join(", ")} WHERE id = ?`).run(...values);
    return db.prepare("SELECT * FROM model_registry WHERE id = ?").get(modelId);
  }
}

module.exports = { ModelRegistryService };
