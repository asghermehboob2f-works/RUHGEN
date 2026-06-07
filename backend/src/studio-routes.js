/**
 * PiAPI studio: image (txt2img / img2img), video (Kling), task polling, reference uploads, downloads.
 * Requires PI_API_KEY (or pi_api_key / PIAPI_KEY) and verifyUserToken from auth.
 */

const crypto = require("node:crypto");
const path = require("node:path");
const { verifyUserToken } = require("./auth");
const { createTask, getTask, extractMediaUrls } = require("./piapi");

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

function isAcceptableStudioImageReferenceUrl(url) {
  return typeof url === "string" && /^https:\/\//i.test(url.trim());
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
  return "Studio is not configured. Set PI_API_KEY (PiAPI) in the server environment.";
}

function normalizePiStatus(status) {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  if (s === "complete" || s === "succeeded" || s === "success") return "completed";
  return s;
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
        // If task is extremely old, mark it failed and refund credits
        const ageMs = Date.now() - new Date(t.created_at).getTime();
        if (ageMs > 2 * 60 * 60 * 1000) {
          let details = {};
          try {
            details = JSON.parse(t.details_json);
          } catch (e) {}
          details.error = { message: "Task timed out after 2 hours." };
          db.prepare("UPDATE studio_tasks SET status = 'failed', details_json = ? WHERE id = ?").run(
            JSON.stringify(details),
            t.id
          );
          refundCredits(
            t.user_id,
            t.credits,
            t.type === "image" ? "image_generation" : "video_generation",
            `Refund: Task timed out`,
            { taskId: t.id }
          );
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
            db.prepare("UPDATE studio_tasks SET status = 'completed', details_json = ? WHERE id = ?").run(
              JSON.stringify(details),
              t.id
            );
            console.log(`[checkPendingTasks] Task ${t.id} completed successfully`);
          } else if (status === "failed" || status === "cancelled") {
            let details = {};
            try {
              details = JSON.parse(t.details_json);
            } catch (e) {}
            details.error = data.error || { message: "Task failed upstream." };
            db.prepare("UPDATE studio_tasks SET status = 'failed', details_json = ? WHERE id = ?").run(
              JSON.stringify(details),
              t.id
            );
            refundCredits(
              t.user_id,
              t.credits,
              t.type === "image" ? "image_generation" : "video_generation",
              `Refund: Task ${status} upstream`,
              { taskId: t.id, error: data.error }
            );
            console.log(`[checkPendingTasks] Task ${t.id} ${status}, refunded ${t.credits} credits`);
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

  app.post("/api/studio/reference-upload", requireUser, upload.single("image"), (req, res) => {
    try {
      const file = req.file;
      if (!file?.buffer) {
        return res.status(400).json({ ok: false, error: "Missing image file." });
      }
      const mime = String(file.mimetype || "");
      if (!/^image\/(jpeg|png|webp)$/.test(mime)) {
        return res.status(400).json({ ok: false, error: "Only JPEG, PNG, or WebP are allowed." });
      }
      const id = crypto.randomBytes(24).toString("hex");
      const expires = Date.now() + STUDIO_REF_TTL_MS;
      studioReferenceImages.set(id, { buffer: file.buffer, mime, expires });
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
      return res.json({ ok: true, url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      return res.status(500).json({ ok: false, error: msg });
    }
  });

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
    const modelRaw = typeof req.body?.model === "string" ? req.body.model.trim() : "";
    const model = modelRaw || "Qubico/flux1-dev";
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

    const costSetting = db.prepare("SELECT value FROM credit_settings WHERE key = 'credits_per_image'").get();
    const finalCost = costSetting ? Number(costSetting.value) : 2;

    try {
      deductCredits(req.user.sub, finalCost, "image_generation", `Image generation: ${prompt.slice(0, 50)}`, { prompt, model });
    } catch (e) {
      if (e.message === "INSUFFICIENT_CREDITS") {
        const u = db.prepare("SELECT credits FROM users WHERE id = ?").get(req.user.sub);
        return res.status(400).json({ ok: false, error: `Insufficient credits. You need ${finalCost} credits, but only have ${u ? u.credits : 0}.` });
      }
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }

    try {
      let r;
      if (useImg2Img) {
        const neg =
          typeof req.body?.negative_prompt === "string" ? req.body.negative_prompt.trim().slice(0, 2000) : "";
        const input = {
          prompt,
          image: imageRefRaw,
          denoise,
          guidance_scale: guidanceScale,
        };
        if (neg) input.negative_prompt = neg;
        r = await createTask({
          model,
          task_type: "img2img",
          input,
        });
      } else {
        const negTxt =
          typeof req.body?.negative_prompt === "string" ? req.body.negative_prompt.trim().slice(0, 2000) : "";
        const input = {
          prompt,
          width: w,
          height: h,
        };
        if (negTxt) input.negative_prompt = negTxt;
        r = await createTask({
          model,
          task_type: "txt2img",
          input,
        });
      }

      if (!r.ok || !r.json?.data?.task_id) {
        const errorMsg = r.ok ? "No task id returned from generation service." : studioUpstreamError(r.json);
        refundCredits(req.user.sub, finalCost, "image_generation", `Refund: Image generation failed: ${errorMsg}`, { prompt, model });
        return res.status(r.ok ? 502 : (r.status >= 400 && r.status < 600 ? r.status : 502)).json({
          ok: false,
          error: errorMsg,
          details: safeUpstreamDetails(r.json),
        });
      }

      const taskId = r.json.data.task_id;
      db.prepare(`
        INSERT INTO studio_tasks (id, user_id, type, credits, status, created_at, details_json)
        VALUES (?, ?, 'image', ?, 'pending', ?, ?)
      `).run(
        taskId,
        req.user.sub,
        finalCost,
        new Date().toISOString(),
        JSON.stringify({
          prompt,
          model,
          width: w,
          height: h,
          image_url: imageRefRaw,
          denoise,
          guidance_scale: guidanceScale,
          negative_prompt: req.body?.negative_prompt || "",
          kind: "image"
        })
      );
      return res.json({ ok: true, taskId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      refundCredits(req.user.sub, finalCost, "image_generation", `Refund: Image generation failed: ${msg}`, { prompt, model });
      if (msg === "STUDIO_CONFIG_MISSING") {
        return res.status(503).json({ ok: false, error: studioConfigError() });
      }
      return res.status(500).json({ ok: false, error: msg });
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
    const modeRaw = typeof req.body?.mode === "string" ? req.body.mode.trim().toLowerCase() : "std";
    let mode = modeRaw === "pro" ? "pro" : "std";
    const verRaw = typeof req.body?.version === "string" ? req.body.version.trim() : "2.6";
    const allowedVer = new Set(["1.5", "1.6", "2.1", "2.1-master", "2.5", "2.6"]);
    let version = allowedVer.has(verRaw) ? verRaw : "2.6";
    if (version === "2.1-master" && mode !== "pro") {
      mode = "pro";
    }
    const negative_prompt =
      typeof req.body?.negative_prompt === "string" ? req.body.negative_prompt.trim().slice(0, 2500) : "";

    const image_url = typeof req.body?.image_url === "string" ? req.body.image_url.trim() : "";
    if (image_url && !isAcceptableStudioImageReferenceUrl(image_url)) {
      return res.status(400).json({ ok: false, error: "Invalid reference image URL (use HTTPS, public URL)." });
    }

    const klingModel = String(process.env.STUDIO_KLING_MODEL || "kling-turbo").trim().toLowerCase();
    const useTurbo = klingModel !== "kling";

    const costSetting = db.prepare("SELECT value FROM credit_settings WHERE key = 'credits_per_video_second'").get();
    const perSecond = costSetting ? Number(costSetting.value) : 5;
    const finalCost = perSecond * dur;

    try {
      deductCredits(req.user.sub, finalCost, "video_generation", `Video generation (${dur}s): ${prompt.slice(0, 50)}`, { prompt, duration: dur });
    } catch (e) {
      if (e.message === "INSUFFICIENT_CREDITS") {
        const u = db.prepare("SELECT credits FROM users WHERE id = ?").get(req.user.sub);
        return res.status(400).json({ ok: false, error: `Insufficient credits. You need ${finalCost} credits, but only have ${u ? u.credits : 0}.` });
      }
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }

    try {
      let taskPayload;
      if (useTurbo) {
        const turboVer = version === "2.6" ? "2.6-turbo" : "2.5-turbo";
        const turboInput = {
          prompt,
          negative_prompt: negative_prompt || "",
          start_image_url: image_url || "",
          end_image_url: "",
          duration: dur,
          aspect_ratio,
          mode,
          version: turboVer,
        };
        taskPayload = {
          model: "kling-turbo",
          task_type: "video_generation",
          input: turboInput,
          config: {
            service_mode: "public",
            webhook_config: { endpoint: "", secret: "" },
          },
        };
      } else {
        const input = {
          prompt,
          cfg_scale: "0.5",
          duration: dur,
          aspect_ratio,
          mode,
          version,
        };
        if (negative_prompt) {
          input.negative_prompt = negative_prompt;
        }
        if (image_url) {
          input.image_url = image_url;
        }
        taskPayload = {
          model: "kling",
          task_type: "video_generation",
          input,
        };
      }

      const r = await createTask(taskPayload);

      if (!r.ok || !r.json?.data?.task_id) {
        const errorMsg = r.ok ? "No task id returned from generation service." : studioUpstreamError(r.json);
        refundCredits(req.user.sub, finalCost, "video_generation", `Refund: Video generation failed: ${errorMsg}`, { prompt, duration: dur });
        return res.status(r.ok ? 502 : (r.status >= 400 && r.status < 600 ? r.status : 502)).json({
          ok: false,
          error: errorMsg,
          details: safeUpstreamDetails(r.json),
        });
      }

      const taskId = r.json.data.task_id;
      db.prepare(`
        INSERT INTO studio_tasks (id, user_id, type, credits, status, created_at, details_json)
        VALUES (?, ?, 'video', ?, 'pending', ?, ?)
      `).run(
        taskId,
        req.user.sub,
        finalCost,
        new Date().toISOString(),
        JSON.stringify({
          prompt,
          duration: dur,
          aspect_ratio,
          mode,
          version,
          negative_prompt,
          image_url,
          kind: "video"
        })
      );
      return res.json({ ok: true, taskId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      refundCredits(req.user.sub, finalCost, "video_generation", `Refund: Video generation failed: ${msg}`, { prompt, duration: dur });
      if (msg === "STUDIO_CONFIG_MISSING") {
        return res.status(503).json({ ok: false, error: studioConfigError() });
      }
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

      if (dbTask.status === "completed" || dbTask.status === "failed") {
        let details = {};
        try {
          details = JSON.parse(dbTask.details_json);
        } catch (e) {}
        const urls = details.urls || [];
        return res.json({
          ok: true,
          status: dbTask.status,
          urls,
          output: details.output || {},
          error: details.error || null
        });
      }

      const r = await getTask(taskId);
      if (!r.ok) {
        return res.json({
          ok: true,
          status: "pending",
          urls: [],
          error: { message: "Failed to fetch status from upstream. Will retry." }
        });
      }
      const data = r.json?.data;
      if (!data) {
        return res.json({ ok: true, status: "pending", urls: [] });
      }
      const statusRaw = data.status ?? "";
      const status = normalizePiStatus(statusRaw);
      const urls = extractMediaUrls(data.output);

      if (status === "completed") {
        let details = {};
        try {
          details = JSON.parse(dbTask.details_json);
        } catch (e) {}
        details.urls = urls;
        details.output = data.output;
        db.prepare("UPDATE studio_tasks SET status = 'completed', details_json = ? WHERE id = ?").run(
          JSON.stringify(details),
          taskId
        );
      } else if (status === "failed" || status === "cancelled") {
        let details = {};
        try {
          details = JSON.parse(dbTask.details_json);
        } catch (e) {}
        details.error = data.error || { message: "Task failed upstream." };
        db.prepare("UPDATE studio_tasks SET status = 'failed', details_json = ? WHERE id = ?").run(
          JSON.stringify(details),
          taskId
        );
        refundCredits(
          dbTask.user_id,
          dbTask.credits,
          dbTask.type === "image" ? "image_generation" : "video_generation",
          `Refund: Task failed/cancelled`,
          { taskId }
        );
      }

      return res.json({
        ok: true,
        status: status,
        urls,
        output: data.output,
        error: data.error,
        message: r.json?.message,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server error.";
      if (msg === "STUDIO_CONFIG_MISSING") {
        return res.status(503).json({ ok: false, error: studioConfigError() });
      }
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
        return {
          id: row.id,
          kind: row.type, // 'image' or 'video'
          previewUrl: previewUrl,
          prompt: details.prompt || "",
          href: previewUrl,
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

  async function proxyDownload(req, res, fallbackName, fallbackCt) {
    try {
      const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
      if (!/^https:\/\//i.test(url)) {
        return res.status(400).json({ ok: false, error: "Invalid URL (HTTPS required)." });
      }
      const upstream = await fetch(url);
      if (!upstream.ok) {
        return res.status(502).json({ ok: false, error: "Could not fetch remote file." });
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      let name = path.basename(new URL(url).pathname) || fallbackName;
      if (!/\.[a-zA-Z0-9]{2,8}$/.test(name)) name = fallbackName;
      const ct = upstream.headers.get("content-type") || fallbackCt;
      res.setHeader("Content-Type", ct);
      res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`);
      return res.send(buf);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Download failed.";
      return res.status(500).json({ ok: false, error: msg });
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
