/**
 * job-manager-service.js
 * Generation Job Lifecycle Manager, Idempotency Enforcer, and Async Polling Engine.
 * 
 * - Coordinates Model Registry, Credit Wallet, and KIE.ai Provider.
 * - Enforces idempotency to prevent duplicate charges or tasks.
 * - Protects user credits with atomic reservations and automatic refunds on failure.
 */

const crypto = require("node:crypto");
const { KieProvider, sanitizeError } = require("./kie-provider");
const { ModelRegistryService } = require("./model-registry-service");
const { CreditWalletService } = require("./credit-wallet-service");
const { ReferenceStorageService } = require("./reference-storage-service");

class JobManagerService {
  /**
   * Create a new generation job with idempotency and atomic credit reservation
   */
  static async createJob(db, { userId, type, tier, modelId, rawParams, idempotencyKey, callBackUrl }) {
    // 1. Idempotency Check
    if (idempotencyKey && typeof idempotencyKey === "string") {
      const cleanKey = idempotencyKey.trim().slice(0, 128);
      const existing = db
        .prepare(
          `SELECT id, status, credit_cost, output_urls_json, created_at
           FROM generation_jobs
           WHERE user_id = ? AND idempotency_key = ?`
        )
        .get(userId, cleanKey);

      if (existing) {
        let urls = [];
        try { urls = JSON.parse(existing.output_urls_json || "[]"); } catch {}
        return {
          ok: true,
          jobId: existing.id,
          status: existing.status,
          creditCost: existing.credit_cost,
          urls,
          isDuplicate: true,
        };
      }
    }

    // 2. Resolve Model Configuration
    const model = ModelRegistryService.getModel(db, { modelId, type, tier });

    // 3. Validate and Sanitize Parameters (strips unsupported controls)
    const sanitizedParams = ModelRegistryService.validateAndSanitizeParams(model, rawParams);

    // 4. Authoritative Credit Cost Calculation
    const creditCost = ModelRegistryService.calculateCreditCost(model, sanitizedParams);

    // 5. Margin Safety Check (Protects RUHGEN from negative margins)
    const marginCheck = ModelRegistryService.validateEconomicMargin(model, creditCost, sanitizedParams, db);
    if (!marginCheck.safe) {
      throw new Error(marginCheck.reason || "Generation blocked due to economic protection rules.");
    }

    // 6. Generate Internal Job ID
    const jobId = `${model.type === "video" ? "vid" : "img"}_${crypto.randomUUID()}`;
    const cleanIdempotencyKey = idempotencyKey ? idempotencyKey.trim().slice(0, 128) : `${userId}_${jobId}`;
    const now = new Date().toISOString();

    // 7. Associate and claim any uploaded reference images/videos for this job
    const refInputs = [];
    if (Array.isArray(sanitizedParams.image_urls)) refInputs.push(...sanitizedParams.image_urls);
    if (Array.isArray(sanitizedParams.references)) refInputs.push(...sanitizedParams.references);
    if (sanitizedParams.image_url) refInputs.push(sanitizedParams.image_url);
    if (sanitizedParams.image) refInputs.push(sanitizedParams.image);
    if (sanitizedParams.video_url) refInputs.push(sanitizedParams.video_url);

    const claimedReferenceIds = ReferenceStorageService.claimReferences(refInputs, {
      jobId,
      userId,
    });

    // 8. Atomic Credit Reservation in Database
    CreditWalletService.reserveCredits(db, userId, creditCost, jobId, {
      modelId: model.id,
      modelName: model.name,
      type: model.type,
      tier: model.tier,
      reason: `${model.name} (${creditCost} credits reserved)`,
    });

    // 9. Create Job Record in RESERVED state
    db.prepare(
      `INSERT INTO generation_jobs (
        id, user_id, idempotency_key, generation_type, model_id, kie_model_id,
        status, requested_params_json, sanitized_params_json, credit_cost,
        provider_cost_usd, reference_ids_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'RESERVED', ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      jobId,
      userId,
      cleanIdempotencyKey,
      model.type,
      model.id,
      model.kie_model_id,
      JSON.stringify(rawParams),
      JSON.stringify(sanitizedParams),
      creditCost,
      marginCheck.providerCostUsd,
      JSON.stringify(claimedReferenceIds),
      now,
      now
    );

    // Also mirror to studio_tasks for backward compatibility with existing components
    try {
      db.prepare(
        `INSERT INTO studio_tasks (id, user_id, type, credits, status, created_at, details_json)
         VALUES (?, ?, ?, ?, 'pending', ?, ?)`
      ).run(
        jobId,
        userId,
        model.type,
        creditCost,
        now,
        JSON.stringify({
          ...sanitizedParams,
          model: model.id,
          tier: model.tier,
          kind: model.type,
        })
      );
    } catch {}

    // 9. Dispatch to KIE.ai Provider with exact schema mapping
    try {
      const formatted = ModelRegistryService.formatProviderInput(model, sanitizedParams);
      const taskRes = await KieProvider.createTask({
        model: formatted.providerModel,
        input: formatted.input,
        callBackUrl,
      });

      const providerTaskId = taskRes.taskId;

      db.prepare(
        `UPDATE generation_jobs
         SET provider_task_id = ?, status = 'PROCESSING', updated_at = ?
         WHERE id = ?`
      ).run(providerTaskId, new Date().toISOString(), jobId);

      return {
        ok: true,
        jobId,
        providerTaskId,
        status: "PROCESSING",
        creditCost,
      };
    } catch (err) {
      console.error(`[JobManager] Provider dispatch failed for job ${jobId}:`, err.message);

      // Release reserved credits immediately on provider rejection
      CreditWalletService.releaseReservation(
        db,
        userId,
        creditCost,
        jobId,
        "Generation service rejected task submission"
      );

      // Immediately purge references on dispatch rejection
      ReferenceStorageService.deleteReferencesForJob(jobId);

      const sanitizedDetail = sanitizeError(err.message);

      db.prepare(
        `UPDATE generation_jobs
         SET status = 'FAILED', error_message = ?, updated_at = ?
         WHERE id = ?`
      ).run(sanitizedDetail, new Date().toISOString(), jobId);

      try {
        db.prepare("UPDATE studio_tasks SET status = 'failed' WHERE id = ?").run(jobId);
      } catch {}

      const userReason = sanitizedDetail && sanitizedDetail.length < 250
        ? sanitizedDetail
        : "Generation request could not be accepted. Your reserved credits have been released.";

      throw new Error(userReason);
    }
  }

  /**
   * Poll status of an active job
   */
  static async getJobStatus(db, jobId, userId) {
    const job = db
      .prepare(
        `SELECT id, user_id, status, provider_task_id, credit_cost, output_urls_json,
                error_message, created_at, updated_at
         FROM generation_jobs
         WHERE id = ?`
      )
      .get(jobId);

    if (!job) {
      // Legacy studio_tasks fallback
      const legacy = db.prepare("SELECT * FROM studio_tasks WHERE id = ?").get(jobId);
      if (!legacy) throw new Error("Job not found.");
      let details = {};
      try { details = JSON.parse(legacy.details_json); } catch {}
      return {
        ok: true,
        status: legacy.status === "completed" ? "COMPLETED" : legacy.status === "failed" ? "FAILED" : "PROCESSING",
        urls: details.urls || [],
        progress: legacy.status === "completed" ? 100 : 50,
        error: details.error?.message || null,
      };
    }

    if (userId && job.user_id !== userId) {
      throw new Error("Unauthorized.");
    }

    let urls = [];
    try { urls = JSON.parse(job.output_urls_json || "[]"); } catch {}

    // If already finalized, return fast
    if (job.status === "COMPLETED") {
      return {
        ok: true,
        status: "COMPLETED",
        urls,
        progress: 100,
        error: null,
      };
    }

    if (job.status === "FAILED" || job.status === "CANCELLED") {
      return {
        ok: true,
        status: job.status,
        urls: [],
        progress: 0,
        error: job.error_message || "Generation failed.",
      };
    }

    // Query KIE provider if provider_task_id exists
    if (job.provider_task_id) {
      const info = await KieProvider.getRecordInfo(job.provider_task_id);

      if (info.status === "COMPLETED" && info.urls.length > 0) {
        // Atomic final consumption
        CreditWalletService.finalizeConsumption(db, job.user_id, job.credit_cost, job.id, {
          reason: "Generation succeeded",
        });

        // Purge ephemeral references immediately upon job completion
        ReferenceStorageService.deleteReferencesForJob(job.id);

        const now = new Date().toISOString();
        db.prepare(
          `UPDATE generation_jobs
           SET status = 'COMPLETED', output_urls_json = ?, completed_at = ?, updated_at = ?
           WHERE id = ?`
        ).run(JSON.stringify(info.urls), now, now, job.id);

        try {
          const legDetails = { urls: info.urls };
          db.prepare("UPDATE studio_tasks SET status = 'completed', details_json = ? WHERE id = ?").run(
            JSON.stringify(legDetails),
            job.id
          );
        } catch {}

        return {
          ok: true,
          status: "COMPLETED",
          urls: info.urls,
          progress: 100,
          error: null,
        };
      }

      if (info.status === "FAILED") {
        // Atomic release
        CreditWalletService.releaseReservation(
          db,
          job.user_id,
          job.credit_cost,
          job.id,
          info.error || "Upstream provider reported generation failure"
        );

        // Purge ephemeral references immediately upon job failure
        ReferenceStorageService.deleteReferencesForJob(job.id);

        db.prepare(
          `UPDATE generation_jobs
           SET status = 'FAILED', error_message = ?, updated_at = ?
           WHERE id = ?`
        ).run(info.error || "Generation failed.", new Date().toISOString(), job.id);

        try {
          db.prepare("UPDATE studio_tasks SET status = 'failed' WHERE id = ?").run(job.id);
        } catch {}

        return {
          ok: true,
          status: "FAILED",
          urls: [],
          progress: 0,
          error: "Generation could not be completed. Your reserved credits have been restored.",
        };
      }

      return {
        ok: true,
        status: info.status,
        urls: [],
        progress: info.progress || 45,
        error: null,
      };
    }

    return {
      ok: true,
      status: job.status,
      urls: [],
      progress: 20,
      error: null,
    };
  }

  /**
   * Background Poller Worker to resolve pending jobs
   */
  static startJobPoller(db, intervalMs = 12000) {
    const timer = setInterval(async () => {
      try {
        const pending = db
          .prepare(
            `SELECT id, user_id, provider_task_id, credit_cost, created_at
             FROM generation_jobs
             WHERE status IN ('PROCESSING', 'SUBMITTED', 'RESERVED')
             ORDER BY created_at ASC
             LIMIT 25`
          )
          .all();

        for (const job of pending) {
          const ageMs = Date.now() - new Date(job.created_at).getTime();

          // Timeout jobs older than 1.5 hours
          if (ageMs > 90 * 60 * 1000) {
            console.warn(`[JobPoller] Timing out stalled job ${job.id}`);
            CreditWalletService.releaseReservation(
              db,
              job.user_id,
              job.credit_cost,
              job.id,
              "Task timed out after 90 minutes"
            );
            ReferenceStorageService.deleteReferencesForJob(job.id);
            db.prepare(
              `UPDATE generation_jobs
               SET status = 'FAILED', error_message = 'Task timed out.', updated_at = ?
               WHERE id = ?`
            ).run(new Date().toISOString(), job.id);
            try { db.prepare("UPDATE studio_tasks SET status = 'failed' WHERE id = ?").run(job.id); } catch {}
            continue;
          }

          if (job.provider_task_id) {
            try {
              await JobManagerService.getJobStatus(db, job.id, null);
            } catch (err) {
              console.error(`[JobPoller] Polling error on job ${job.id}:`, err.message);
            }
          }
        }
      } catch (err) {
        console.error("[JobPoller] Worker exception:", err.message);
      }
    }, intervalMs);

    if (timer.unref) timer.unref();
    return timer;
  }
}

module.exports = { JobManagerService };
