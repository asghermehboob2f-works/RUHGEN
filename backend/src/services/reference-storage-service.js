/**
 * reference-storage-service.js
 * Production-Grade Ephemeral Reference Image Manager & Automatic Cleanup Engine.
 * 
 * Rules:
 * 1. Reference images are temporary generation assets only — NEVER permanently saved.
 * 2. Stored privately in memory only for as long as required for KIE.ai to ingest the generation.
 * 3. Immediately purged as soon as the generation job completes or fails.
 * 4. Automatic background sweeper runs every 60s to clean abandoned uploads and stalled jobs.
 */

const crypto = require("node:crypto");

// 15 minutes TTL for uploaded references that have not yet been submitted in a generation job
const UNCLAIMED_REF_TTL_MS = 15 * 60 * 1000;

// 30 minutes TTL for references claimed by an active generation job
const CLAIMED_REF_TTL_MS = 30 * 60 * 1000;

class ReferenceStorageService {
  /**
   * Ephemeral in-memory storage: id -> entry
   * @type {Map<string, {
   *   id: string;
   *   userId: string;
   *   buffer: Buffer;
   *   mime: string;
   *   type: "image" | "video";
   *   name: string;
   *   size: number;
   *   createdAt: number;
   *   expiresAt: number;
   *   jobId: string | null;
   *   fetchCount: number;
   * }>}
   */
  static _store = new Map();

  /**
   * Helper to extract 48-hex reference ID from a URL or raw ID
   */
  static extractReferenceId(input) {
    if (!input || typeof input !== "string") return null;
    const trimmed = input.trim();
    // Check if it's already a raw 48-char hex string
    if (/^[a-f0-9]{48}$/i.test(trimmed)) return trimmed;
    // Check if it's a URL ending with /api/studio/reference/:id
    const match = trimmed.match(/\/api\/studio\/reference\/([a-f0-9]{48})/i);
    return match ? match[1] : null;
  }

  /**
   * Store a freshly uploaded reference image in ephemeral memory
   */
  static storeReference({ userId, buffer, mime, type, name, size }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error("Invalid buffer provided to reference storage.");
    }

    const id = crypto.randomBytes(24).toString("hex");
    const now = Date.now();

    const entry = {
      id,
      userId: String(userId || "anonymous"),
      buffer,
      mime: String(mime || "image/jpeg").toLowerCase(),
      type: type === "video" ? "video" : "image",
      name: String(name || "reference").slice(0, 100),
      size: Number(size) || buffer.length,
      createdAt: now,
      expiresAt: now + UNCLAIMED_REF_TTL_MS,
      jobId: null,
      fetchCount: 0,
    };

    ReferenceStorageService._store.set(id, entry);
    return entry;
  }

  /**
   * Retrieve a reference file for KIE.ai or preview
   */
  static getReference(id) {
    if (!id || typeof id !== "string") return null;
    const cleanId = id.trim();
    const entry = ReferenceStorageService._store.get(cleanId);

    if (!entry) return null;

    // Check expiry
    if (Date.now() >= entry.expiresAt) {
      ReferenceStorageService._store.delete(cleanId);
      return null;
    }

    entry.fetchCount += 1;
    return entry;
  }

  /**
   * Explicitly delete a single reference image (e.g. user removed thumbnail or unauthorized)
   */
  static deleteReference(id, userId = null) {
    const cleanId = ReferenceStorageService.extractReferenceId(id);
    if (!cleanId) return false;

    const entry = ReferenceStorageService._store.get(cleanId);
    if (!entry) return false;

    if (userId && entry.userId !== userId && entry.userId !== "anonymous") {
      return false; // Not authorized to delete another user's reference
    }

    ReferenceStorageService._store.delete(cleanId);
    return true;
  }

  /**
   * Associate reference images with an active generation job
   */
  static claimReferences(inputs, { jobId, userId }) {
    if (!Array.isArray(inputs) || !jobId) return [];

    const claimedIds = [];
    const now = Date.now();

    for (const item of inputs) {
      const id = ReferenceStorageService.extractReferenceId(item);
      if (!id) continue;

      const entry = ReferenceStorageService._store.get(id);
      if (entry) {
        entry.jobId = String(jobId);
        entry.expiresAt = now + CLAIMED_REF_TTL_MS; // Extend TTL while generation is active
        if (userId) entry.userId = String(userId);
        claimedIds.push(id);
      }
    }

    return claimedIds;
  }

  /**
   * Immediately purge all temporary reference images associated with a generation job
   * (Called as soon as a job reaches COMPLETED or FAILED)
   */
  static deleteReferencesForJob(jobId) {
    if (!jobId) return 0;
    const targetJobId = String(jobId);
    let purgedCount = 0;

    for (const [id, entry] of ReferenceStorageService._store.entries()) {
      if (entry.jobId === targetJobId) {
        ReferenceStorageService._store.delete(id);
        purgedCount++;
      }
    }

    if (purgedCount > 0) {
      console.log(`[ReferenceStorage] Immediately purged ${purgedCount} ephemeral reference(s) for job ${jobId}`);
    }

    return purgedCount;
  }

  /**
   * Delete references by list of URLs or IDs
   */
  static deleteReferencesByUrls(urls) {
    if (!Array.isArray(urls)) return 0;
    let purgedCount = 0;

    for (const url of urls) {
      const id = ReferenceStorageService.extractReferenceId(url);
      if (id && ReferenceStorageService._store.has(id)) {
        ReferenceStorageService._store.delete(id);
        purgedCount++;
      }
    }

    return purgedCount;
  }

  /**
   * Fallback cleanup mechanism:
   * 1. Purges expired references (past their TTL).
   * 2. Checks database for terminal jobs (COMPLETED, FAILED, CANCELLED) and immediately clears remaining references.
   * 3. Purges abandoned unclaimed uploads older than 15 minutes.
   */
  static cleanupAbandoned(db) {
    const now = Date.now();
    let expiredCount = 0;
    let terminalJobCleanCount = 0;

    // 1. Time-based expiry sweep
    for (const [id, entry] of ReferenceStorageService._store.entries()) {
      if (now >= entry.expiresAt) {
        ReferenceStorageService._store.delete(id);
        expiredCount++;
      }
    }

    // 2. Terminal job reconciliation sweep against database
    if (db && ReferenceStorageService._store.size > 0) {
      try {
        const activeJobIds = new Set();
        for (const entry of ReferenceStorageService._store.values()) {
          if (entry.jobId) activeJobIds.add(entry.jobId);
        }

        if (activeJobIds.size > 0) {
          const placeholders = Array.from(activeJobIds).map(() => "?").join(",");
          const finishedJobs = db
            .prepare(
              `SELECT id, status FROM generation_jobs
               WHERE id IN (${placeholders}) AND status IN ('COMPLETED', 'FAILED', 'CANCELLED')`
            )
            .all(...Array.from(activeJobIds));

          for (const finished of finishedJobs) {
            terminalJobCleanCount += ReferenceStorageService.deleteReferencesForJob(finished.id);
          }
        }
      } catch (err) {
        console.error("[ReferenceStorage] Terminal job reconciliation error:", err.message);
      }
    }

    const totalPurged = expiredCount + terminalJobCleanCount;
    if (totalPurged > 0) {
      console.log(
        `[ReferenceStorage] Sweeper run complete: purged ${expiredCount} expired and ${terminalJobCleanCount} finished job references. Active in memory: ${ReferenceStorageService._store.size}`
      );
    }

    return { expiredCount, terminalJobCleanCount, remaining: ReferenceStorageService._store.size };
  }

  /**
   * Start recurring background sweeper
   */
  static startSweeper(db, intervalMs = 60000) {
    const timer = setInterval(() => {
      try {
        ReferenceStorageService.cleanupAbandoned(db);
      } catch (err) {
        console.error("[ReferenceStorage] Sweeper exception:", err.message);
      }
    }, intervalMs);

    if (timer.unref) timer.unref();
    return timer;
  }

  /**
   * For testing & status reporting
   */
  static getStats() {
    return {
      activeCount: ReferenceStorageService._store.size,
      items: Array.from(ReferenceStorageService._store.values()).map((e) => ({
        id: e.id,
        userId: e.userId,
        jobId: e.jobId,
        size: e.size,
        mime: e.mime,
        fetchCount: e.fetchCount,
        ttlRemainingMs: Math.max(0, e.expiresAt - Date.now()),
      })),
    };
  }
}

module.exports = {
  ReferenceStorageService,
  UNCLAIMED_REF_TTL_MS,
  CLAIMED_REF_TTL_MS,
};
