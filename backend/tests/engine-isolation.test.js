/**
 * Automated Verification Suite for Rugen Standard vs Rugen Premium AI Engine Isolation & Video Provider Readiness.
 */

const fs = require("node:fs");
const path = require("node:path");
const { getImageConfig, getVideoConfig } = require("../src/config");
const { ImageGenerationService } = require("../src/services/image-generation-service");
const { VideoGenerationService } = require("../src/services/video-generation-service");

console.log("===============================================================");
console.log("   RUHGEN Full Image & Video Provider Readiness Audit Suite     ");
console.log("===============================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${description}`);
    failed++;
  }
}

const envPath = path.resolve(__dirname, "..", "..", ".env");
const originalEnvContent = fs.readFileSync(envPath, "utf8");

function writeTestEnv(keysObj) {
  const lines = [
    "PORT=4000",
    "APP_URL=http://localhost:3000",
  ];
  for (const [k, v] of Object.entries(keysObj)) {
    lines.push(`${k}=${v}`);
  }
  fs.writeFileSync(envPath, lines.join("\n"), "utf8");
}

async function runTests() {
  try {
    // -------------------------------------------------------------
    // SECTION A: IMAGE GENERATION ENGINE TESTS
    // -------------------------------------------------------------
    console.log("── Section A: Image Generation Engine Isolation");

    writeTestEnv({
      RUGEN_PREMIUM_API_KEY: "nvapi-test-premium-img-key",
      RUGEN_PREMIUM_API_URL: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b",
      RUGEN_PREMIUM_MODEL: "flux.2-klein-4b",
    });
    const premImgCfg = getImageConfig("premium");
    assert(
      premImgCfg.tier === "premium" && premImgCfg.apiKey === "nvapi-test-premium-img-key",
      "Case A1: Premium Image credentials present -> Premium resolves clean config"
    );

    writeTestEnv({});
    const premImgCfg2 = getImageConfig("premium");
    assert(!premImgCfg2.apiKey, "Case A2a: Premium Image credentials removed from .env -> apiKey is empty");

    let premImgFailed = false;
    let errImgMsg = "";
    try {
      await ImageGenerationService.generateImage({ prompt: "A sleek vehicle", tier: "premium" });
    } catch (e) {
      premImgFailed = true;
      errImgMsg = e.message;
    }
    assert(
      premImgFailed && errImgMsg.includes("Missing API Key"),
      `Case A2b: Premium Image generation fails immediately server-side: "${errImgMsg}"`
    );

    writeTestEnv({
      RUGEN_STANDARD_API_KEY: "nvapi-test-std-img-key",
      RUGEN_STANDARD_API_URL: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b",
      RUGEN_STANDARD_MODEL: "flux.2-klein-4b",
    });
    const stdImgCfg = getImageConfig("standard");
    assert(
      stdImgCfg.tier === "standard" && stdImgCfg.apiKey === "nvapi-test-std-img-key",
      "Case A3: Standard Image credentials present -> Standard resolves clean config"
    );

    writeTestEnv({});
    const stdImgCfg2 = getImageConfig("standard");
    assert(!stdImgCfg2.apiKey, "Case A4a: Standard Image credentials removed from .env -> apiKey is empty");

    let stdImgFailed = false;
    let stdImgErr = "";
    try {
      await ImageGenerationService.generateImage({ prompt: "A sleek vehicle", tier: "standard" });
    } catch (e) {
      stdImgFailed = true;
      stdImgErr = e.message;
    }
    assert(
      stdImgFailed && stdImgErr.includes("Missing API Key"),
      `Case A4b: Standard Image generation fails immediately server-side: "${stdImgErr}"`
    );

    writeTestEnv({ RUGEN_STANDARD_API_KEY: "valid_std_key" });
    const stdCheckImg = getImageConfig("standard");
    const premCheckImg = getImageConfig("premium");
    assert(
      stdCheckImg.apiKey === "valid_std_key" && premCheckImg.apiKey === "",
      "Case A5: Removing Premium Image credentials does NOT affect Standard Image"
    );

    writeTestEnv({ RUGEN_PREMIUM_API_KEY: "valid_prem_key" });
    const stdCheckImg2 = getImageConfig("standard");
    const premCheckImg2 = getImageConfig("premium");
    assert(
      stdCheckImg2.apiKey === "" && premCheckImg2.apiKey === "valid_prem_key",
      "Case A6: Removing Standard Image credentials does NOT affect Premium Image"
    );

    // -------------------------------------------------------------
    // SECTION B: VIDEO GENERATION ENGINE TESTS & PROVIDER ADAPTER
    // -------------------------------------------------------------
    console.log("\n── Section B: Video Generation Engine Isolation & Provider Agnostic Adapter");

    writeTestEnv({
      VIDEO_PREMIUM_API_KEY: "kling-test-prem-vid-key",
      VIDEO_PREMIUM_API_URL: "https://api.piapi.ai/api/v1/task",
      VIDEO_PREMIUM_MODEL: "kling-pro",
    });
    const premVidCfg = getVideoConfig("premium");
    assert(
      premVidCfg.tier === "premium" && premVidCfg.apiKey === "kling-test-prem-vid-key",
      "Case B1: Premium Video credentials present -> Premium Video resolves clean config"
    );

    writeTestEnv({});
    const premVidCfg2 = getVideoConfig("premium");
    assert(!premVidCfg2.apiKey, "Case B2a: Premium Video credentials removed from .env -> apiKey is empty");

    let premVidFailed = false;
    let errVidMsg = "";
    try {
      await VideoGenerationService.createVideoTask({ prompt: "Ocean waves in motion", tier: "premium" });
    } catch (e) {
      premVidFailed = true;
      errVidMsg = e.message;
    }
    assert(
      premVidFailed && errVidMsg.includes("Missing API Key"),
      `Case B2b: Premium Video generation fails immediately server-side: "${errVidMsg}"`
    );

    writeTestEnv({
      VIDEO_STANDARD_API_KEY: "kling-test-std-vid-key",
      VIDEO_STANDARD_API_URL: "https://api.piapi.ai/api/v1/task",
      VIDEO_STANDARD_MODEL: "kling-turbo",
    });
    const stdVidCfg = getVideoConfig("standard");
    assert(
      stdVidCfg.tier === "standard" && stdVidCfg.apiKey === "kling-test-std-vid-key",
      "Case B3: Standard Video credentials present -> Standard Video resolves clean config"
    );

    writeTestEnv({});
    const stdVidCfg2 = getVideoConfig("standard");
    assert(!stdVidCfg2.apiKey, "Case B4a: Standard Video credentials removed from .env -> apiKey is empty");

    let stdVidFailed = false;
    let stdVidErr = "";
    try {
      await VideoGenerationService.createVideoTask({ prompt: "Ocean waves in motion", tier: "standard" });
    } catch (e) {
      stdVidFailed = true;
      stdVidErr = e.message;
    }
    assert(
      stdVidFailed && stdVidErr.includes("Missing API Key"),
      `Case B4b: Standard Video generation fails immediately server-side: "${stdVidErr}"`
    );

    writeTestEnv({ VIDEO_STANDARD_API_KEY: "valid_std_vid_key", VIDEO_STANDARD_API_URL: "https://api.piapi.ai/api/v1/task" });
    const stdCheckVid = getVideoConfig("standard");
    const premCheckVid = getVideoConfig("premium");
    assert(
      stdCheckVid.apiKey === "valid_std_vid_key" && premCheckVid.apiKey === "",
      "Case B5: Removing Premium Video credentials does NOT affect Standard Video"
    );

    writeTestEnv({ VIDEO_PREMIUM_API_KEY: "valid_prem_vid_key", VIDEO_PREMIUM_API_URL: "https://api.piapi.ai/api/v1/task" });
    const stdCheckVid2 = getVideoConfig("standard");
    const premCheckVid2 = getVideoConfig("premium");
    assert(
      stdCheckVid2.apiKey === "" && premCheckVid2.apiKey === "valid_prem_vid_key",
      "Case B6: Removing Standard Video credentials does NOT affect Premium Video"
    );

    // Test Task Status Adapter format resilience
    const syncStatusRes = await VideoGenerationService.getTaskStatus("vid_sync_123", {
      urls: ["https://example.com/video.mp4"],
    });
    assert(
      syncStatusRes.status === "completed" && syncStatusRes.urls[0] === "https://example.com/video.mp4",
      "Case B7: Task Status Adapter handles synchronous task URLs seamlessly"
    );

  } finally {
    fs.writeFileSync(envPath, originalEnvContent, "utf8");
    getImageConfig("standard");
    getVideoConfig("standard");
  }

  console.log("\n===============================================================");
  console.log(`   Summary: ${passed} Passed, ${failed} Failed`);
  console.log("===============================================================");

  if (failed > 0) process.exit(1);
}

runTests();
