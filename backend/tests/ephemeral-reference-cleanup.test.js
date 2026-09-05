/**
 * ephemeral-reference-cleanup.test.js
 * Verification of ephemeral reference image storage, immediate auto-delete on job lifecycle events,
 * and fallback sweeper for abandoned/failed jobs.
 */

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { ReferenceStorageService, UNCLAIMED_REF_TTL_MS, CLAIMED_REF_TTL_MS } = require("../src/services/reference-storage-service");

console.log("\n=======================================================");
console.log("  TEST SUITE: EPHEMERAL REFERENCE STORAGE & CLEANUP");
console.log("=======================================================\n");

async function runTests() {
  // Setup in-memory SQLite DB for testing
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE IF NOT EXISTS generation_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      credit_cost INTEGER NOT NULL DEFAULT 0,
      reference_ids_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  console.log("1. Testing Ephemeral In-Memory Storage (Zero Disk Footprint)...");
  const testBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]); // JPEG magic header
  const stored1 = ReferenceStorageService.storeReference({
    userId: "user_alpha",
    buffer: testBuffer,
    mime: "image/jpeg",
    type: "image",
    name: "test_ref1.jpg",
    size: testBuffer.length,
  });

  assert.ok(stored1.id && stored1.id.length === 48, "ID must be a 48-hex string");
  assert.strictEqual(stored1.userId, "user_alpha");
  assert.strictEqual(stored1.jobId, null, "Unclaimed upload should have no jobId");
  assert.ok(stored1.expiresAt > Date.now(), "expiresAt should be in the future");

  const fetched1 = ReferenceStorageService.getReference(stored1.id);
  assert.ok(fetched1, "Should retrieve active reference from memory");
  assert.strictEqual(fetched1.buffer.length, testBuffer.length);
  assert.strictEqual(fetched1.fetchCount, 1, "Fetch count should increment");
  console.log("   ✓ Stored in memory with 48-char secure hex ID. Fetch count tracked.");

  console.log("\n2. Testing User-Initiated Immediate Deletion (e.g. Removing UI Thumbnail)...");
  const stored2 = ReferenceStorageService.storeReference({
    userId: "user_alpha",
    buffer: testBuffer,
    mime: "image/jpeg",
    type: "image",
    name: "test_ref2.jpg",
    size: testBuffer.length,
  });

  // User unauthorized deletion check
  const unauthorizedDelete = ReferenceStorageService.deleteReference(stored2.id, "different_user");
  assert.strictEqual(unauthorizedDelete, false, "Different user should not be able to delete reference");
  assert.ok(ReferenceStorageService.getReference(stored2.id), "Reference should still exist");

  // Authorized user deletion
  const authorizedDelete = ReferenceStorageService.deleteReference(stored2.id, "user_alpha");
  assert.strictEqual(authorizedDelete, true, "Authorized user deletion should return true");
  assert.strictEqual(ReferenceStorageService.getReference(stored2.id), null, "Deleted reference must return null immediately");
  console.log("   ✓ User immediate deletion verified with authorization check.");

  console.log("\n3. Testing Job Association & Lifecycle Claiming...");
  const stored3 = ReferenceStorageService.storeReference({
    userId: "user_beta",
    buffer: testBuffer,
    mime: "image/jpeg",
    type: "image",
    name: "test_ref3.jpg",
    size: testBuffer.length,
  });
  const stored4 = ReferenceStorageService.storeReference({
    userId: "user_beta",
    buffer: testBuffer,
    mime: "image/jpeg",
    type: "image",
    name: "test_ref4.jpg",
    size: testBuffer.length,
  });

  const url3 = `https://test.ruhgen.com/api/studio/reference/${stored3.id}`;
  const rawId4 = stored4.id;

  const claimed = ReferenceStorageService.claimReferences([url3, rawId4], {
    jobId: "job_xyz_123",
    userId: "user_beta",
  });

  assert.strictEqual(claimed.length, 2, "Should claim both references by URL and ID");
  const check3 = ReferenceStorageService.getReference(stored3.id);
  const check4 = ReferenceStorageService.getReference(stored4.id);
  assert.strictEqual(check3.jobId, "job_xyz_123");
  assert.strictEqual(check4.jobId, "job_xyz_123");
  assert.ok(check3.expiresAt >= Date.now() + CLAIMED_REF_TTL_MS - 5000, "TTL must be extended to claimed window");
  console.log("   ✓ Both references claimed and associated with job_xyz_123; TTL extended.");

  console.log("\n4. Testing Immediate Auto-Delete upon Job Completion...");
  const purgedSuccessCount = ReferenceStorageService.deleteReferencesForJob("job_xyz_123");
  assert.strictEqual(purgedSuccessCount, 2, "Must purge exactly the 2 references for job_xyz_123");
  assert.strictEqual(ReferenceStorageService.getReference(stored3.id), null, "Reference 3 must be 404/null");
  assert.strictEqual(ReferenceStorageService.getReference(stored4.id), null, "Reference 4 must be 404/null");
  console.log("   ✓ References immediately purged from memory upon job completion.");

  console.log("\n5. Testing Immediate Auto-Delete upon Job Failure...");
  const storedFail = ReferenceStorageService.storeReference({
    userId: "user_gamma",
    buffer: testBuffer,
    mime: "image/jpeg",
    type: "image",
    name: "fail_test.jpg",
    size: testBuffer.length,
  });
  ReferenceStorageService.claimReferences([storedFail.id], { jobId: "job_failed_999", userId: "user_gamma" });

  const purgedFailCount = ReferenceStorageService.deleteReferencesForJob("job_failed_999");
  assert.strictEqual(purgedFailCount, 1, "Must purge failed job reference");
  assert.strictEqual(ReferenceStorageService.getReference(storedFail.id), null, "Failed job reference must be gone");
  console.log("   ✓ References immediately purged upon job failure.");

  console.log("\n6. Testing Fallback Cleanup Sweeper for Abandoned Uploads...");
  const abandonedRef = ReferenceStorageService.storeReference({
    userId: "user_abandoned",
    buffer: testBuffer,
    mime: "image/jpeg",
    type: "image",
    name: "abandoned.jpg",
    size: testBuffer.length,
  });

  // Manually backdate expiry to simulate 15+ minutes passing
  abandonedRef.expiresAt = Date.now() - 1000;

  const sweepResult1 = ReferenceStorageService.cleanupAbandoned(db);
  assert.ok(sweepResult1.expiredCount >= 1, "Sweeper must purge expired abandoned uploads");
  assert.strictEqual(ReferenceStorageService.getReference(abandonedRef.id), null, "Abandoned upload must be purged");
  console.log("   ✓ Fallback sweeper successfully identified and purged expired abandoned upload.");

  console.log("\n7. Testing Fallback Sweeper Reconciliation against Database Terminal States...");
  const orphanedRef = ReferenceStorageService.storeReference({
    userId: "user_orphan",
    buffer: testBuffer,
    mime: "image/jpeg",
    type: "image",
    name: "orphan.jpg",
    size: testBuffer.length,
  });
  ReferenceStorageService.claimReferences([orphanedRef.id], { jobId: "job_orphan_777", userId: "user_orphan" });

  // Simulate job completing in database while reference was somehow still in memory
  db.prepare(`
    INSERT INTO generation_jobs (id, user_id, status, credit_cost, reference_ids_json, created_at, updated_at)
    VALUES ('job_orphan_777', 'user_orphan', 'COMPLETED', 30, '["${orphanedRef.id}"]', datetime('now'), datetime('now'))
  `).run();

  const sweepResult2 = ReferenceStorageService.cleanupAbandoned(db);
  assert.strictEqual(sweepResult2.terminalJobCleanCount, 1, "Sweeper must cross-reference DB and purge finished job references");
  assert.strictEqual(ReferenceStorageService.getReference(orphanedRef.id), null, "Orphaned reference must be purged");
  console.log("   ✓ Database terminal state reconciliation verified: orphaned references purged.");

  console.log("\n=======================================================");
  console.log("  ALL EPHEMERAL REFERENCE CLEANUP TESTS PASSED! (7/7)");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
