/**
 * RUHGEN Studio: image generation (Qwen / NVIDIA GenAI Engine), video generation, task polling, reference uploads, downloads.
 * Requires QWEN_API_KEY in environment and verifyUserToken from auth.
 */

const crypto = require("node:crypto");
const path = require("node:path");
const { verifyUserToken } = require("./auth");
const { getImageConfig, getVideoConfig } = require("./config");
const { ImageGenerationService } = require("./services/image-generation-service");
const { VideoGenerationService } = require("./services/video-generation-service");

const STUDIO_REF_TTL_MS = 2 * 60 * 60 * 1000;

/** @type {Map<string, { buffer: Buffer; mime: string; expires: number }>} */
const studioReferenceImages = new Map();

function getBearer(req) {
  const auth = String(req.headers.authorization || "").trim();
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

function requireUser(req, res, next) {
  const bearer = getBearer(req);
  if (!bearer) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
  try {
    const payload = verifyUserToken(bearer);
    if (payload.typ !== "user" || typeof payload.sub !== "string") {
      throw new Error("invalid");
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
}

function sweepStudioReferenceImages() {
  const now = Date.now();
  for (const [id, v] of studioReferenceImages.entries()) {
    if (v.expires <= now) studioReferenceImages.delete(id);
  }
}

function publicBaseUrlFromRequest(req) {
  const env = process.env.PUBLIC_BASE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const xfProto = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    ?.trim();
  const proto = xfProto || req.protocol || "http";
  const host = req.headers.host || "localhost";
  return `${proto}://${host}`.replace(/\/$/, "");
}

function isSafeExternalUrl(urlStr) {
  if (typeof urlStr !== "string" || !urlStr.trim()) return false;
  const trimmed = urlStr.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("/")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isAcceptableStudioReferenceUrl(urlStr) {
  if (typeof urlStr !== "string" || !urlStr.trim()) return false;
  const trimmed = urlStr.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("/")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isAcceptableStudioImageReferenceUrl(url) {
  return isAcceptableStudioReferenceUrl(url);
}

function safeUpstreamDetails(json) {
  if (!json || typeof json !== "object") return {};
  const err = json.data?.error ?? json.error;
  if (!err || typeof err !== "object") return {};
  const out = {};
  if (typeof err.code === "number") out.code = err.code;
  if (typeof err.message === "string") out.message = err.message;
  if (typeof err.raw_message === "string") out.raw_message = err.raw_message;
  return out;
}

function studioUpstreamError(json) {
  const msg =
    (json && typeof json.message === "string" && json.message) ||
    (json?.data && typeof json.data.message === "string" && json.data.message) ||
    "Generation service error.";
  return String(msg);
}

function studioConfigError() {
  return "Studio is not configured. Set QWEN_API_KEY in environment.";
}

function normalizePiStatus(status) {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  if (s === "complete" || s === "succeeded" || s === "success") return "completed";
  return s;
}

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



/**
 * @param {import("express").Express} app
 * @param {{ upload: import("multer").Multer, db: import("better-sqlite3").Database }} options
 */
function mountStudioRoutes(app, options) {
  const { upload, db } = options;

  setInterval(sweepStudioReferenceImages, 5 * 60 * 1000).unref?.();

  // Helper: Deduct user credits securely
  function deductCredits(userId, amount, actionType, reason, detailsObj = {}) {
    let finalBalance = 0;
    db.transaction(() => {
      const u = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId);
      if (!u || u.credits < amount) {
        throw new Error("INSUFFICIENT_CREDITS");
      }
      finalBalance = u.credits - amount;
      db.prepare("UPDATE users SET credits = ? WHERE id = ?").run(finalBalance, userId);
      db.prepare(`
        INSERT INTO credit_transactions (id, user_id, action_type, credits_added, credits_deducted, previous_balance, new_balance, timestamp, source, reason, details_json)
        VALUES (?, ?, ?, 0, ?, ?, ?, ?, 'studio', ?, ?)
      `).run(
        crypto.randomUUID(),
        userId,
        actionType,
        amount,
        u.credits,
        finalBalance,
        new Date().toISOString(),
        reason,
        JSON.stringify(detailsObj)
      );
    })();
    return finalBalance;
  }

  // Helper: Refund user credits securely
  function refundCredits(userId, amount, actionType, reason, detailsObj = {}) {
    let finalBalance = 0;
    db.transaction(() => {
      const u = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId);
      if (!u) return;
      finalBalance = u.credits + amount;
      db.prepare("UPDATE users SET credits = ? WHERE id = ?").run(finalBalance, userId);
      db.prepare(`
        INSERT INTO credit_transactions (id, user_id, action_type, credits_added, credits_deducted, previous_balance, new_balance, timestamp, source, reason, details_json)
        VALUES (?, ?, 'generation_refund', ?, 0, ?, ?, ?, 'studio', ?, ?)
      `).run(
        crypto.randomUUID(),
        userId,
        amount,
        u.credits,
        finalBalance,
        new Date().toISOString(),
        reason,
        JSON.stringify(detailsObj)
      );
    })();
    return finalBalance;
  }

  // Background worker for resolving pending tasks
  async function checkPendingTasks() {
    try {
      const pendingTasks = db.prepare("SELECT * FROM studio_tasks WHERE status = 'pending'").all();
      for (const t of pendingTasks) {
        // If task is extremely old, mark it failed
        const ageMs = Date.now() - new Date(t.created_at).getTime();
        if (ageMs > 2 * 60 * 60 * 1000) {
          let details = {};
          try {
            details = JSON.parse(t.details_json);
          } catch (e) {}
          details.error = { message: "Task timed out after 2 hours." };
          db.transaction(() => {
            db.prepare("UPDATE studio_tasks SET status = 'failed', details_json = ? WHERE id = ?").run(
              JSON.stringify(details),
              t.id
            );
            db.prepare(`
              INSERT INTO audit_logs (id, actor_id, actor_email, target_user_id, action_type, old_value, new_value, timestamp, details_json)
              VALUES (?, 'system', 'system', ?, 'generation_status', 'pending', 'failed', ?, ?)
            `).run(
              crypto.randomUUID(),
              t.user_id,
              new Date().toISOString(),
              JSON.stringify({ taskId: t.id, reason: "timeout" })
            );
          })();
          continue;
        }

        try {
          const r = await getTask(t.id);
          if (!r.ok) {
            console.error(`[checkPendingTasks] Error polling task ${t.id}:`, r.status, r.json);
            continue;
          }
          const data = r.json?.data;
          if (!data) continue;
          
          const status = normalizePiStatus(data.status);
          const urls = extractMediaUrls(data.output);

          if (status === "completed") {
            let details = {};
            try {
              details = JSON.parse(t.details_json);
            } catch (e) {}
            details.urls = urls;
            details.output = data.output;
            db.transaction(() => {
              const task = db.prepare("SELECT status, credits, user_id, type FROM studio_tasks WHERE id = ?").get(t.id);
              if (task && task.status === 'pending') {
                const u = db.prepare("SELECT credits FROM users WHERE id = ?").get(task.user_id);
                if (u) {
                  const finalBalance = Math.max(0, u.credits - task.credits);
                  db.prepare("UPDATE users SET credits = ? WHERE id = ?").run(finalBalance, task.user_id);
                  
                  db.prepare(`
                    INSERT INTO credit_transactions (id, user_id, action_type, credits_added, credits_deducted, previous_balance, new_balance, timestamp, source, reason, details_json)
                    VALUES (?, ?, ?, 0, ?, ?, ?, ?, 'studio', ?, ?)
                  `).run(
                    crypto.randomUUID(),
                    task.user_id,
                    task.type === "image" ? "image_generation" : "video_generation",
                    task.credits,
                    u.credits,
                    finalBalance,
                    new Date().toISOString(),
                    `${task.type === 'image' ? 'Image' : 'Video'} generation completed successfully`,
                    JSON.stringify({ taskId: t.id })
                  );

                  db.prepare(`
                    INSERT INTO audit_logs (id, actor_id, actor_email, target_user_id, action_type, old_value, new_value, timestamp, details_json)
                    VALUES (?, 'system', 'system', ?, 'generation_status', 'pending', 'completed', ?, ?)
                  `).run(
                    crypto.randomUUID(),
                    task.user_id,
                    new Date().toISOString(),
                    JSON.stringify({ taskId: t.id, creditsDeducted: task.credits })
                  );
                }
                db.prepare("UPDATE studio_tasks SET status = 'completed', details_json = ? WHERE id = ?").run(
                  JSON.stringify(details),
                  t.id
                );
              }
            })();
            console.log(`[checkPendingTasks] Task ${t.id} completed successfully`);
          } else if (status === "failed" || status === "cancelled") {
            let details = {};
            try {
              details = JSON.parse(t.details_json);
            } catch (e) {}
            details.error = data.error || { message: "Task failed upstream." };
            db.transaction(() => {
              const task = db.prepare("SELECT status FROM studio_tasks WHERE id = ?").get(t.id);
              if (task && task.status === 'pending') {
                db.prepare(`
                  INSERT INTO audit_logs (id, actor_id, actor_email, target_user_id, action_type, old_value, new_value, timestamp, details_json)
                  VALUES (?, 'system', 'system', ?, 'generation_status', 'pending', ?, ?, ?)
                `).run(
                  crypto.randomUUID(),
                  t.user_id,
                  status,
                  new Date().toISOString(),
                  JSON.stringify({ taskId: t.id, error: data.error })
                );
                db.prepare("UPDATE studio_tasks SET status = ?, details_json = ? WHERE id = ?").run(
                  status,
                  JSON.stringify(details),
                  t.id
                );
              }
            })();
            console.log(`[checkPendingTasks] Task ${t.id} ${status}`);
          }
        } catch (err) {
          console.error(`[checkPendingTasks] Exception polling task ${t.id}:`, err.message);
        }
      }
    } catch (e) {
      console.error("[checkPendingTasks] Worker error:", e);
    }
  }

  setInterval(checkPendingTasks, 15000).unref?.();

  app.post(
    "/api/studio/reference-upload",
    requireUser,
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "image", maxCount: 1 },
      { name: "video", maxCount: 1 },
      { name: "reference", maxCount: 1 },
    ]),
    (req, res) => {
      try {
        const file =
          req.file ||
          req.files?.file?.[0] ||
          req.files?.image?.[0] ||
          req.files?.video?.[0] ||
          req.files?.reference?.[0];

        if (!file?.buffer) {
          return res.status(400).json({ ok: false, error: "Missing reference file." });
        }
        const origName = String(file.originalname || "").toLowerCase();
        let mime = String(file.mimetype || "").toLowerCase();

        if (mime === "application/octet-stream" || !mime) {
          if (/\.(jpg|jpeg)$/.test(origName)) mime = "image/jpeg";
          else if (/\.png$/.test(origName)) mime = "image/png";
          else if (/\.webp$/.test(origName)) mime = "image/webp";
          else if (/\.mp4$/.test(origName)) mime = "video/mp4";
          else if (/\.webm$/.test(origName)) mime = "video/webm";
          else if (/\.(mov|qt)$/.test(origName)) mime = "video/quicktime";
        }

        let refType = null;
        if (/^image\/(jpeg|jpg|png|webp)$/.test(mime)) {
          refType = "image";
        } else if (/^video\/(mp4|webm|quicktime|x-matroska|mpeg|avi)$/.test(mime)) {
          refType = "video";
        } else {
          return res.status(400).json({
            ok: false,
            error: "Unsupported file format. Please upload a valid image (JPEG, PNG, WebP) or video (MP4, WebM, MOV).",
          });
        }

        const maxImgSize = 20 * 1024 * 1024;
        const maxVidSize = 50 * 1024 * 1024;
        if (refType === "image" && file.size > maxImgSize) {
          return res.status(400).json({ ok: false, error: "Image reference file exceeds 20MB limit." });
        }
        if (refType === "video" && file.size > maxVidSize) {
          return res.status(400).json({ ok: false, error: "Video reference file exceeds 50MB limit." });
        }

        const id = crypto.randomBytes(24).toString("hex");
        const expires = Date.now() + STUDIO_REF_TTL_MS;
        studioReferenceImages.set(id, { buffer: file.buffer, mime, type: refType, expires });
        const base = publicBaseUrlFromRequest(req);
        if (!base) {
          studioReferenceImages.delete(id);
          return res.status(503).json({
            ok: false,
            error:
              "Could not determine public URL for this upload. Set PUBLIC_BASE_URL (e.g. https://yourdomain.com) for production.",
          });
        }
        const url = `${base}/api/studio/reference/${id}`;
        return res.json({ ok: true, url, type: refType });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Server error.";
        return res.status(500).json({ ok: false, error: msg });
      }
    }
  );

  app.get("/api/studio/reference/:id", (req, res) => {
    const id = String(req.params.id || "");
    if (!id || id.includes("..") || id.includes("/")) {
      return res.status(404).end();
    }
    const entry = studioReferenceImages.get(id);
    if (!entry || entry.expires <= Date.now()) {
      if (entry) studioReferenceImages.delete(id);
      return res.status(404).end();
    }
    res.setHeader("Content-Type", entry.mime);
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.end(entry.buffer);
  });

  app.post("/api/studio/image", requireUser, async (req, res) => {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt || prompt.length < 2) {
      return res.status(400).json({ ok: false, error: "Enter a prompt (at least 2 characters)." });
    }
    const qualityRaw = typeof req.body?.quality === "string" ? req.body.quality.trim().toLowerCase() : "";
    const modelRaw = typeof req.body?.model === "string" ? req.body.model.trim() : "";
    let quality = "Quality";
    let model = "Qubico/flux1-dev";
    if (qualityRaw === "standard" || qualityRaw === "fast" || modelRaw.includes("schnell")) {
      quality = "Standard";
      model = "Qubico/flux1-schnell";
    } else if (qualityRaw === "ultra") {
      quality = "Ultra Quality";
      model = "Qubico/flux1-dev";
    } else {
      quality = "Quality";
      model = "Qubico/flux1-dev";
    }
    let width = Number(req.body?.width);
    let height = Number(req.body?.height);
    if (!Number.isFinite(width) || width <= 0) width = 1024;
    if (!Number.isFinite(height) || height <= 0) height = 1024;
    const w = Math.min(2048, Math.max(256, Math.round(width / 8) * 8));
    const h = Math.min(2048, Math.max(256, Math.round(height / 8) * 8));

    const imageRefRaw = typeof req.body?.image_url === "string" ? req.body.image_url.trim() : "";
    const useImg2Img = imageRefRaw.length > 0;
    if (useImg2Img && !isAcceptableStudioImageReferenceUrl(imageRefRaw)) {
      return res.status(400).json({ ok: false, error: "Invalid reference image URL (use HTTPS)." });
    }

    let denoise = Number(req.body?.denoise);
    if (!Number.isFinite(denoise) || denoise <= 0 || denoise >= 1) denoise = 0.65;

    let guidanceScale = Number(req.body?.guidance_scale);
    if (!Number.isFinite(guidanceScale) || guidanceScale < 1 || guidanceScale > 20) guidanceScale = 3.5;

    // Quality specific credit costs
    let costKey = "credits_per_image";
    if (quality === "Standard" || model.includes("schnell")) {
      costKey = "cost_image_schnell";
    } else {
      costKey = "cost_image_dev";
    }
    const costSetting = db.prepare("SELECT value FROM credit_settings WHERE key = ?").get(costKey)
      || db.prepare("SELECT value FROM credit_settings WHERE key = 'credits_per_image'").get();
    const finalCost = costSetting ? Number(costSetting.value) : (quality === "Standard" ? 2 : 3);

    const targetTier = (qualityRaw === "standard" || qualityRaw === "fast" || modelRaw.includes("schnell")) ? "standard" : "premium";
    const engineConfig = getImageConfig(targetTier);

    if (!engineConfig.apiKey) {
      return res.status(503).json({
        ok: false,
        error: `RUHGEN ${engineConfig.tier === 'standard' ? 'Standard' : 'Premium'} Image Engine is currently undergoing maintenance. Please try again shortly.`
      });
    }

    // Validate balance and eligibility
    const userRow = db.prepare("SELECT credits, suspended, generation_disabled FROM users WHERE id = ?").get(req.user.sub);
    if (!userRow) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    if (userRow.suspended === 1) {
      return res.status(403).json({ ok: false, error: "Your account has been suspended." });
    }
    if (userRow.generation_disabled === 1) {
      return res.status(403).json({ ok: false, error: "Image generation is disabled for your account." });
    }

    const pendingSumRow = db.prepare("SELECT SUM(credits) as pending FROM studio_tasks WHERE user_id = ? AND status = 'pending'").get(req.user.sub);
    const pendingCredits = pendingSumRow?.pending || 0;
    const availableCredits = userRow.credits - pendingCredits;
    if (availableCredits < finalCost) {
      return res.status(400).json({ 
        ok: false, 
        error: `Insufficient credits. You need ${finalCost} credits (available: ${availableCredits}, pending holds: ${pendingCredits}).` 
      });
    }

    try {
      const imgRes = await ImageGenerationService.generateImage({
        prompt,
        tier: quality,
        width: w,
        height: h,
        image_url: imageRefRaw,
      });

      const taskId = "img-" + crypto.randomUUID();

      db.prepare(`
        INSERT INTO studio_tasks (id, user_id, type, credits, status, created_at, details_json)
        VALUES (?, ?, 'image', ?, 'completed', ?, ?)
      `).run(
        taskId,
        req.user.sub,
        finalCost,
        new Date().toISOString(),
        JSON.stringify({
          prompt,
          quality,
          width: w,
          height: h,
          image_url: imageRefRaw,
          urls: [imgRes.imageDataUrl],
          configUsed: imgRes.configUsed,
          kind: "image"
        })
      );

      deductCredits(req.user.sub, finalCost, "image_generation", `Image generation (${imgRes.configUsed.tier})`, { taskId });

      return res.json({ ok: true, taskId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed.";
      return res.status(502).json({ ok: false, error: msg });
    }
  });

  app.post("/api/studio/video", requireUser, async (req, res) => {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt || prompt.length < 2) {
      return res.status(400).json({ ok: false, error: "Enter a prompt (at least 2 characters)." });
    }
    const duration = Number(req.body?.duration);
    const dur = duration === 10 ? 10 : 5;
    const aspectRaw = typeof req.body?.aspect_ratio === "string" ? req.body.aspect_ratio.trim() : "16:9";
    const aspect_ratio = ["16:9", "9:16", "1:1"].includes(aspectRaw) ? aspectRaw : "16:9";
    const qualityRaw = typeof req.body?.quality === "string" ? req.body.quality.trim().toLowerCase() : "";
    const modeRaw = typeof req.body?.mode === "string" ? req.body.mode.trim().toLowerCase() : "";
    
    let quality = "quality";
    let mode = "std";
    if (qualityRaw === "standard" || modeRaw === "std" || qualityRaw === "fast") {
      quality = "standard";
      mode = "std";
    } else {
      quality = "quality";
      mode = "pro";
    }

    const negative_prompt =
      typeof req.body?.negative_prompt === "string" ? req.body.negative_prompt.trim().slice(0, 2500) : "";

    const image_url = typeof req.body?.image_url === "string" ? req.body.image_url.trim() : "";
    const video_url = typeof req.body?.video_url === "string" ? req.body.video_url.trim() : "";
    const reference_url = typeof req.body?.reference_url === "string" ? req.body.reference_url.trim() : "";
    const reference_type = typeof req.body?.reference_type === "string" ? req.body.reference_type.trim().toLowerCase() : "";

    const activeRefUrl = video_url || image_url || reference_url;
    if (activeRefUrl && !isAcceptableStudioReferenceUrl(activeRefUrl)) {
      return res.status(400).json({ ok: false, error: "Invalid reference URL (use HTTPS, public URL)." });
    }

    // Quality specific credit costs
    let costKey = mode === "pro" ? "cost_video_pro" : "cost_video_std";
    const costSetting = db.prepare("SELECT value FROM credit_settings WHERE key = ?").get(costKey)
      || db.prepare("SELECT value FROM credit_settings WHERE key = 'credits_per_video_second'").get();
    const perSecond = costSetting ? Number(costSetting.value) : (mode === "pro" ? 8 : 5);
    const finalCost = perSecond * dur;

    const targetTier = (qualityRaw === "standard" || modeRaw === "std" || qualityRaw === "fast") ? "standard" : "premium";
    const engineConfig = getVideoConfig(targetTier);

    if (!engineConfig.apiKey || !engineConfig.apiUrl) {
      return res.status(503).json({
        ok: false,
        error: `RUHGEN ${engineConfig.tier === 'standard' ? 'Standard' : 'Premium'} Video Engine is currently undergoing maintenance. Please try again shortly.`
      });
    }

    // Validate balance and eligibility
    const userRow = db.prepare("SELECT credits, suspended, generation_disabled FROM users WHERE id = ?").get(req.user.sub);
    if (!userRow) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    if (userRow.suspended === 1) {
      return res.status(403).json({ ok: false, error: "Your account has been suspended." });
    }
    if (userRow.generation_disabled === 1) {
      return res.status(403).json({ ok: false, error: "Video generation is disabled for your account." });
    }

    const pendingSumRow = db.prepare("SELECT SUM(credits) as pending FROM studio_tasks WHERE user_id = ? AND status = 'pending'").get(req.user.sub);
    const pendingCredits = pendingSumRow?.pending || 0;
    const availableCredits = userRow.credits - pendingCredits;
    if (availableCredits < finalCost) {
      return res.status(400).json({ 
        ok: false, 
        error: `Insufficient credits. You need ${finalCost} credits (available: ${availableCredits}, pending holds: ${pendingCredits}).` 
      });
    }

    try {
      const taskResult = await VideoGenerationService.createVideoTask({
        prompt,
        duration: dur,
        aspect_ratio,
        tier: quality,
        mode,
        negative_prompt,
        image_url,
        video_url,
        reference_url,
        reference_type,
      });

      const taskId = taskResult.taskId;
      const initialStatus = taskResult.syncUrls ? "completed" : "pending";
      const details = {
        prompt,
        duration: dur,
        aspect_ratio,
        quality,
        tier: taskResult.tier,
        model: taskResult.model,
        negative_prompt,
        image_url,
        video_url,
        reference_url,
        reference_type,
        kind: "video",
      };
      if (taskResult.syncUrls) {
        details.urls = taskResult.syncUrls;
      }

      db.prepare(`
        INSERT INTO studio_tasks (id, user_id, type, credits, status, created_at, details_json)
        VALUES (?, ?, 'video', ?, ?, ?, ?)
      `).run(
        taskId,
        req.user.sub,
        finalCost,
        initialStatus,
        new Date().toISOString(),
        JSON.stringify(details)
      );

      deductCredits(req.user.sub, finalCost, "video_generation", `Video generation (${taskResult.tier})`, { taskId });

      return res.json({ ok: true, taskId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/studio/task/:taskId", requireUser, async (req, res) => {
    try {
      const taskId = String(req.params.taskId || "").trim();
      if (!taskId) {
        return res.status(400).json({ ok: false, error: "Missing task id." });
      }

      const dbTask = db.prepare("SELECT * FROM studio_tasks WHERE id = ?").get(taskId);
      if (!dbTask) {
        return res.status(404).json({ ok: false, error: "Task not found in ledger." });
      }
      if (dbTask.user_id !== req.user.sub) {
        return res.status(403).json({ ok: false, error: "Access denied." });
      }

      let dbDetails = {};
      try {
        dbDetails = JSON.parse(dbTask.details_json);
      } catch (e) {}

      if (dbTask.status === "completed" || dbTask.status === "failed") {
        const urls = dbDetails.urls || [];
        let cleanError = null;
        if (dbDetails.error) {
          const errMsg = typeof dbDetails.error?.message === "string" ? dbDetails.error.message.replace(/(kling|flux|qubico|checkpoint|provider)/gi, "Generation engine") : "Generation error.";
          cleanError = { message: errMsg };
        }
        return res.json({
          ok: true,
          status: dbTask.status,
          urls,
          error: cleanError
        });
      }

      const statusResult = await VideoGenerationService.getTaskStatus(taskId, dbDetails);
      const status = statusResult.status;
      const urls = statusResult.urls || [];

      if (status === "completed") {
        dbDetails.urls = urls;
        db.prepare("UPDATE studio_tasks SET status = 'completed', details_json = ? WHERE id = ?").run(
          JSON.stringify(dbDetails),
          taskId
        );
      } else if (status === "failed") {
        dbDetails.error = { message: statusResult.error || "Video generation failed." };
        db.prepare("UPDATE studio_tasks SET status = 'failed', details_json = ? WHERE id = ?").run(
          JSON.stringify(dbDetails),
          taskId
        );
        refundCredits(
          dbTask.user_id,
          dbTask.credits,
          "video_generation",
          "Refund: Video generation failed",
          { taskId }
        );
      }

      return res.json({
        ok: true,
        status,
        urls,
        progress: statusResult.progress || (status === "completed" ? 100 : 50),
        error: statusResult.error ? { message: statusResult.error } : null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get("/api/studio/recent-generations", requireUser, (req, res) => {
    try {
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
      const rows = db.prepare(`
        SELECT id, type, status, created_at, details_json
        FROM studio_tasks
        WHERE user_id = ? AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT ?
      `).all(req.user.sub, limit);

      const generations = rows.map(row => {
        let details = {};
        try {
          details = JSON.parse(row.details_json);
        } catch (e) {}
        const urls = details.urls || [];
        const previewUrl = urls[0] || "";
        const targetHref = row.type === "video" ? "/dashboard/generate/video" : "/dashboard/generate/image";
        return {
          id: row.id,
          kind: row.type, // 'image' or 'video'
          previewUrl: previewUrl,
          prompt: details.prompt || "",
          href: targetHref,
          createdAt: row.created_at
        };
      });

      const user = db.prepare("SELECT credits FROM users WHERE id = ?").get(req.user.sub);
      const balance = user ? user.credits : 0;

      return res.json({ ok: true, generations, balance });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  app.get("/api/credits/rates", requireUser, (req, res) => {
    try {
      const rows = db.prepare("SELECT key, value FROM credit_settings").all();
      const rates = {};
      for (const r of rows) {
        rates[r.key] = Number(r.value);
      }
      if (rates.credits_per_image === undefined) rates.credits_per_image = 2;
      if (rates.credits_per_video_second === undefined) rates.credits_per_video_second = 5;
      return res.json({ ok: true, rates });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  app.get("/api/credits/history", requireUser, (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT id, action_type as actionType, credits_added as creditsAdded, credits_deducted as creditsDeducted, previous_balance as previousBalance, new_balance as newBalance, timestamp, source, reason, details_json as detailsJson
        FROM credit_transactions
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 100
      `).all(req.user.sub);
      
      const user = db.prepare("SELECT credits FROM users WHERE id = ?").get(req.user.sub);
      const balance = user ? user.credits : 0;

      return res.json({ ok: true, history: rows, balance });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  app.get("/api/credits/dashboard", requireUser, (req, res) => {
    try {
      const userId = req.user.sub;
      const user = db.prepare("SELECT credits, suspended, subscription_plan, subscription_status FROM users WHERE id = ?").get(userId);
      if (!user) {
        return res.status(404).json({ ok: false, error: "User not found." });
      }

      // 1. Pending tasks & credits
      const pendingRow = db.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(credits), 0) as sum FROM studio_tasks WHERE user_id = ? AND status = 'pending'").get(userId);
      const pendingCount = pendingRow.cnt || 0;
      const pendingCredits = pendingRow.sum || 0;
      const availableCredits = Math.max(0, user.credits - pendingCredits);

      // 2. Lifetime credits
      const lifetimeDeductedRow = db.prepare("SELECT COALESCE(SUM(credits_deducted), 0) as total FROM credit_transactions WHERE user_id = ? AND action_type NOT IN ('generation_refund')").get(userId);
      const lifetimeDeducted = lifetimeDeductedRow.total || 0;

      const lifetimeAddedRow = db.prepare("SELECT COALESCE(SUM(credits_added), 0) as total FROM credit_transactions WHERE user_id = ?").get(userId);
      const lifetimeAdded = lifetimeAddedRow.total || 0;

      // 3. Transactions List (limit 50)
      const transactions = db.prepare(`
        SELECT id, action_type as actionType, credits_added as creditsAdded, credits_deducted as creditsDeducted, previous_balance as previousBalance, new_balance as newBalance, timestamp, source, reason, details_json as detailsJson
        FROM credit_transactions
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 50
      `).all(userId);

      // 4. Generations List (limit 50)
      const tasks = db.prepare(`
        SELECT id, type, credits, status, created_at, details_json
        FROM studio_tasks
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).all(userId);

      const generations = tasks.map(t => {
        let details = {};
        try {
          details = JSON.parse(t.details_json);
        } catch (e) {}
        let q = details.quality;
        if (!q) {
          if (t.type === "image") {
            q = (details.model && details.model.includes("schnell")) ? "Standard" : "Quality";
          } else {
            q = (details.mode === "pro" || details.quality === "Ultra Quality") ? "Ultra Quality" : "Quality";
          }
        }
        let cleanErr = null;
        if (details.error) {
          const errMsg = typeof details.error?.message === "string" ? details.error.message.replace(/(kling|flux|qubico|checkpoint|provider)/gi, "Generation engine") : "Generation error.";
          cleanErr = { message: errMsg };
        }
        return {
          id: t.id,
          type: t.type,
          credits: t.credits,
          status: t.status,
          createdAt: t.created_at,
          prompt: details.prompt || "",
          quality: q,
          error: cleanErr,
          urls: details.urls || []
        };
      });

      // 5. Monthly Stats & Current Month Count
      const thisMonthGenRow = db.prepare(`
        SELECT COUNT(*) as cnt FROM studio_tasks 
        WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
      `).get(userId);
      const thisMonthCount = thisMonthGenRow ? thisMonthGenRow.cnt : 0;

      const monthlyStats = db.prepare(`
        SELECT STRFTIME('%Y-%m', timestamp) as month, SUM(credits_deducted) as totalDeducted
        FROM credit_transactions
        WHERE user_id = ? AND credits_deducted > 0 AND action_type IN ('image_generation', 'video_generation')
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
      `).all(userId);

      return res.json({
        ok: true,
        metrics: {
          credits: user.credits,
          pendingCredits,
          availableCredits,
          lifetimeUsed: lifetimeDeducted,
          lifetimeAdded,
          pendingCount,
          thisMonthCount,
          subscriptionPlan: user.subscription_plan || "Free",
        },
        transactions,
        generations,
        monthlyStats
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  async function proxyDownload(req, res, fallbackName, fallbackCt) {
    try {
      const rawUrl = typeof req.body?.url === "string" ? req.body.url.trim() : "";
      if (!rawUrl) {
        return res.status(400).json({ ok: false, error: "Missing media URL." });
      }

      // 1. Handle base64 Data URIs directly
      if (rawUrl.startsWith("data:")) {
        const match = /^data:([^;]+);base64,(.+)$/.exec(rawUrl);
        if (!match) {
          return res.status(400).json({ ok: false, error: "Invalid base64 payload." });
        }
        const mime = match[1] || fallbackCt;
        const buf = Buffer.from(match[2], "base64");
        res.setHeader("Content-Type", mime);
        res.setHeader("Content-Disposition", `attachment; filename="${fallbackName}"`);
        return res.send(buf);
      }

      // 2. Resolve relative URLs or absolute URLs
      let fetchUrl = rawUrl;
      if (rawUrl.startsWith("/")) {
        const base = publicBaseUrlFromRequest(req) || "http://localhost:4000";
        fetchUrl = `${base}${rawUrl}`;
      } else {
        try {
          const parsed = new URL(rawUrl);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return res.status(400).json({ ok: false, error: "Invalid URL scheme." });
          }
        } catch {
          return res.status(400).json({ ok: false, error: "Invalid URL format." });
        }
      }

      const upstream = await fetch(fetchUrl);
      if (!upstream.ok) {
        return res.status(502).json({ ok: false, error: "Could not fetch remote file." });
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      let name = fallbackName;
      try {
        const pathName = new URL(fetchUrl).pathname;
        const baseSeg = path.basename(pathName);
        if (baseSeg && /\.[a-zA-Z0-9]{2,8}$/.test(baseSeg)) {
          name = baseSeg;
        }
      } catch {
        /* ignore */
      }

      const ct = upstream.headers.get("content-type") || fallbackCt;
      res.setHeader("Content-Type", ct);
      res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`);
      return res.send(buf);
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Download failed." });
    }
  }

  app.post("/api/studio/download-image", requireUser, async (req, res) => {
    await proxyDownload(req, res, "image.png", "image/png");
  });

  app.post("/api/studio/download-video", requireUser, async (req, res) => {
    await proxyDownload(req, res, "video.mp4", "video/mp4");
  });
}

module.exports = { mountStudioRoutes };
