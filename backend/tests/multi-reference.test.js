/**
 * multi-reference.test.js
 * Test suite for the RUHGEN Multi-Reference Image & Media System for Seedance 2.5 and Genesis 2.
 */

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { openDb } = require("../src/db");
const { ModelRegistryService } = require("../src/services/model-registry-service");

console.log("===============================================================");
console.log("   RUHGEN Video Reference System Validation Suite              ");
console.log("===============================================================");

// 1. Initialize test database
const projectRoot = path.resolve(__dirname, "..", "..");
const { db } = openDb(projectRoot);

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

try {
  // Test Section 1: Model Registry Capabilities & Limits
  console.log("\n── Section 1: Dynamic Model Capability & Limit Verification");

  runTest("Seedance 2.5 Video exposes maxReferenceImages = 10", () => {
    const publicModels = ModelRegistryService.getPublicModels(db);
    const seedanceVideo = publicModels.find((m) => m.id === "video-seedance-2-5");
    assert(seedanceVideo, "Seedance 2.5 video model should exist");
    assert.strictEqual(seedanceVideo.maxReferenceImages, 10, "Seedance 2.5 model should expose max 10 reference images");
  });

  runTest("RUHGEN Premium (Genesis 2) exposes maxReferenceImages = 1", () => {
    const publicModels = ModelRegistryService.getPublicModels(db);
    const genesisVideo = publicModels.find((m) => m.id === "video-genesis-premium");
    assert(genesisVideo, "RUHGEN Premium model should exist");
    assert.strictEqual(genesisVideo.maxReferenceImages, 1, "RUHGEN Premium model should expose 1 reference image");
  });

  runTest("Image Generation models remain untouched with 0 reference images", () => {
    const publicModels = ModelRegistryService.getPublicModels(db);
    const stdImage = publicModels.find((m) => m.id === "image-flux-standard");
    const premImage = publicModels.find((m) => m.id === "image-flux-premium");
    assert(stdImage, "Standard image model exists");
    assert(premImage, "Premium image model exists");
    assert.strictEqual(stdImage.maxReferenceImages, 0);
    assert.strictEqual(premImage.maxReferenceImages, 0);
  });

  // Test Section 2: Parameter Sanitization & Limit Enforcement
  console.log("\n── Section 2: Parameter Sanitization & Strict Count Enforcement");

  const seedanceModel = ModelRegistryService.getModel(db, { modelId: "video-seedance-2-5" });

  runTest("Accepts reference media and preserves exact user order", () => {
    const inputRefs = [
      "https://example.com/character-face.jpg",
      "https://example.com/outfit-front.png",
      "https://example.com/scene-background.webp",
      "https://example.com/lighting-reference.jpg",
    ];

    const sanitized = ModelRegistryService.validateAndSanitizeParams(seedanceModel, {
      prompt: "cinematic dolly shot of the protagonist",
      references: inputRefs,
      duration: 5,
      aspect_ratio: "16:9",
    });

    assert(Array.isArray(sanitized.image_urls), "image_urls must be an array");
    assert.strictEqual(sanitized.image_urls.length, 4, "Should have 4 images");
    assert.deepStrictEqual(sanitized.image_urls, inputRefs, "Order of reference images must be preserved");
    assert.strictEqual(sanitized.image_url, inputRefs[0], "First image preserved as primary ref");
  });

  runTest("Accepts up to 10 reference images (maximum boundary)", () => {
    const inputRefs = [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
      "https://example.com/4.jpg",
      "https://example.com/5.jpg",
      "https://example.com/6.jpg",
      "https://example.com/7.jpg",
      "https://example.com/8.jpg",
      "https://example.com/9.jpg",
      "https://example.com/10.jpg",
    ];

    const sanitized = ModelRegistryService.validateAndSanitizeParams(seedanceModel, {
      prompt: "cinematic scene",
      references: inputRefs,
      duration: 10,
    });

    assert.strictEqual(sanitized.image_urls.length, 10);
  });

  runTest("Rejects 11 reference images with descriptive error", () => {
    const inputRefs = [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
      "https://example.com/4.jpg",
      "https://example.com/5.jpg",
      "https://example.com/6.jpg",
      "https://example.com/7.jpg",
      "https://example.com/8.jpg",
      "https://example.com/9.jpg",
      "https://example.com/10.jpg",
      "https://example.com/11.jpg",
    ];

    assert.throws(
      () => {
        ModelRegistryService.validateAndSanitizeParams(seedanceModel, {
          prompt: "cinematic scene",
          references: inputRefs,
        });
      },
      /Maximum 10 reference media item/,
      "Must throw error rejecting more than 10 reference images"
    );
  });

  runTest("Filters out non-URL or invalid items and preserves valid ones", () => {
    const mixedRefs = [
      "https://example.com/valid1.png",
      "javascript:alert(1)",
      "not-a-url",
      "",
      "https://example.com/valid2.jpg",
    ];

    const sanitized = ModelRegistryService.validateAndSanitizeParams(seedanceModel, {
      prompt: "cinematic scene",
      references: mixedRefs,
    });

    assert.deepStrictEqual(sanitized.image_urls, [
      "https://example.com/valid1.png",
      "https://example.com/valid2.jpg",
    ]);
  });

  // Test Section 3: Higgsfield Provider Schema Mapping
  console.log("\n── Section 3: Higgsfield Provider Payload Construction");

  runTest("Routes to bytedance/seedance-2-5/image-to-video when references are present", () => {
    const sanitized = {
      prompt: "warrior walking in rain",
      duration: 5,
      aspect_ratio: "16:9",
      sound: true,
      image_urls: ["https://example.com/char.png", "https://example.com/armor.png"],
    };

    const formatted = ModelRegistryService.formatProviderInput(seedanceModel, sanitized);
    assert.strictEqual(
      formatted.providerModel,
      "bytedance/seedance-2-5/image-to-video",
      "Should route to Seedance 2.5 image-to-video endpoint"
    );
    assert.deepStrictEqual(formatted.input.images, sanitized.image_urls);
    assert.strictEqual(formatted.input.duration, 5);
    assert.strictEqual(formatted.input.sound, true);
  });

  runTest("Routes to bytedance/seedance-2-5/text-to-video when no references are present", () => {
    const sanitized = {
      prompt: "sunset over ocean",
      duration: 10,
      aspect_ratio: "16:9",
      sound: true,
    };

    const formatted = ModelRegistryService.formatProviderInput(seedanceModel, sanitized);
    assert.strictEqual(
      formatted.providerModel,
      "bytedance/seedance-2-5/text-to-video",
      "Should route to Seedance 2.5 text-to-video endpoint"
    );
    assert.strictEqual(formatted.input.images, undefined);
  });

  // Test Section 4: Admin Capability Updatability
  console.log("\n── Section 4: Admin Capability Updatability");

  runTest("Admin can update max_reference_images if provider changes limits", () => {
    ModelRegistryService.updateModel(db, "video-seedance-2-5", { max_reference_images: 12 });
    const updated = ModelRegistryService.getModel(db, { modelId: "video-seedance-2-5" });
    assert.strictEqual(updated.max_reference_images, 12, "Should allow updating limit to 12");

    // Reset back to verified limit of 10
    ModelRegistryService.updateModel(db, "video-seedance-2-5", { max_reference_images: 10 });
    const reverted = ModelRegistryService.getModel(db, { modelId: "video-seedance-2-5" });
    assert.strictEqual(reverted.max_reference_images, 10, "Should revert cleanly to 10");
  });
} catch (e) {
  console.error("Test execution error:", e);
}

console.log("\n===============================================================");
console.log(`   Summary: ${passed} Passed, ${failed} Failed`);
console.log("===============================================================");

if (failed > 0) process.exit(1);
