/**
 * multi-reference.test.js
 * Test suite for the RUHGEN Multi-Reference Image System for Premium Video.
 */

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { openDb } = require("../src/db");
const { ModelRegistryService } = require("../src/services/model-registry-service");

console.log("===============================================================");
console.log("   RUHGEN Multi-Reference Image System Validation Suite        ");
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

  runTest("Premium Omni Video exposes maxReferenceImages = 7", () => {
    const publicModels = ModelRegistryService.getPublicModels(db);
    const premiumVideo = publicModels.find((m) => m.id === "video-kling-premium");
    assert(premiumVideo, "Premium video model should exist");
    assert.strictEqual(premiumVideo.maxReferenceImages, 7, "Premium Omni model should expose max 7 reference images");
  });

  runTest("Standard Video exposes maxReferenceImages = 0", () => {
    const publicModels = ModelRegistryService.getPublicModels(db);
    const standardVideo = publicModels.find((m) => m.id === "video-kling-standard");
    assert(standardVideo, "Standard video model should exist");
    assert.strictEqual(standardVideo.maxReferenceImages, 0, "Standard video model should expose 0 reference images");
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

  const premiumModel = ModelRegistryService.getModel(db, { modelId: "video-kling-premium" });

  runTest("Accepts 1 to 7 reference images and preserves exact user order", () => {
    const inputRefs = [
      "https://example.com/character-face.jpg",
      "https://example.com/outfit-front.png",
      "https://example.com/scene-background.webp",
      "https://example.com/lighting-reference.jpg",
    ];

    const sanitized = ModelRegistryService.validateAndSanitizeParams(premiumModel, {
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

  runTest("Accepts exactly 7 reference images (maximum boundary)", () => {
    const inputRefs = [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
      "https://example.com/4.jpg",
      "https://example.com/5.jpg",
      "https://example.com/6.jpg",
      "https://example.com/7.jpg",
    ];

    const sanitized = ModelRegistryService.validateAndSanitizeParams(premiumModel, {
      prompt: "cinematic scene",
      references: inputRefs,
      duration: 10,
    });

    assert.strictEqual(sanitized.image_urls.length, 7);
  });

  runTest("Rejects 8 reference images with descriptive error", () => {
    const inputRefs = [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
      "https://example.com/4.jpg",
      "https://example.com/5.jpg",
      "https://example.com/6.jpg",
      "https://example.com/7.jpg",
      "https://example.com/8.jpg",
    ];

    assert.throws(
      () => {
        ModelRegistryService.validateAndSanitizeParams(premiumModel, {
          prompt: "cinematic scene",
          references: inputRefs,
        });
      },
      /Maximum 7 reference images supported/,
      "Must throw error rejecting more than 7 reference images"
    );
  });

  runTest("Filters out non-URL or invalid items and preserves valid ones", () => {
    const mixedRefs = [
      "https://example.com/valid1.png",
      "not-a-valid-url",
      "javascript:alert(1)",
      "https://example.com/valid2.jpg",
    ];

    const sanitized = ModelRegistryService.validateAndSanitizeParams(premiumModel, {
      prompt: "cinematic scene",
      references: mixedRefs,
    });

    assert.deepStrictEqual(sanitized.image_urls, [
      "https://example.com/valid1.png",
      "https://example.com/valid2.jpg",
    ]);
  });

  // Test Section 3: Provider Schema Mapping
  console.log("\n── Section 3: KIE.ai Provider Payload Construction");

  runTest("Routes to kling-3.0-omni/reference-to-video when images are present", () => {
    const sanitized = {
      prompt: "warrior walking in rain",
      duration: 5,
      aspect_ratio: "16:9",
      sound: true,
      image_urls: ["https://example.com/char.png", "https://example.com/armor.png"],
    };

    const formatted = ModelRegistryService.formatProviderInput(premiumModel, sanitized);
    assert.strictEqual(
      formatted.providerModel,
      "kling-3.0-omni/reference-to-video",
      "Should route to reference-to-video model"
    );
    assert.deepStrictEqual(formatted.input.image_urls, sanitized.image_urls);
    assert.strictEqual(formatted.input.duration, "5");
    assert.strictEqual(formatted.input.sound, true);
  });

  runTest("Routes to kling-3.0-omni/text-to-video when no reference images are present", () => {
    const sanitized = {
      prompt: "sunset over ocean",
      duration: 5,
      aspect_ratio: "16:9",
      sound: true,
    };

    const formatted = ModelRegistryService.formatProviderInput(premiumModel, sanitized);
    assert.strictEqual(
      formatted.providerModel,
      "kling-3.0-omni/text-to-video",
      "Should route to text-to-video model"
    );
    assert.strictEqual(formatted.input.image_urls, undefined);
  });

  // Test Section 4: Admin Capability Updatability
  console.log("\n── Section 4: Admin Capability Updatability");

  runTest("Admin can update max_reference_images if provider changes limits", () => {
    ModelRegistryService.updateModel(db, "video-kling-premium", { max_reference_images: 10 });
    const updated = ModelRegistryService.getModel(db, { modelId: "video-kling-premium" });
    assert.strictEqual(updated.max_reference_images, 10, "Should allow updating limit to 10");

    // Reset back to verified limit of 7
    ModelRegistryService.updateModel(db, "video-kling-premium", { max_reference_images: 7 });
    const reverted = ModelRegistryService.getModel(db, { modelId: "video-kling-premium" });
    assert.strictEqual(reverted.max_reference_images, 7, "Should revert cleanly to 7");
  });
} catch (e) {
  console.error("Test execution error:", e);
}

console.log("\n===============================================================");
console.log(`   Summary: ${passed} Passed, ${failed} Failed`);
console.log("===============================================================");

if (failed > 0) process.exit(1);
