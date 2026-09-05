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
    // SECTION B: VIDEO GENERATION ENGINE TESTS (KIE.ai)
    // -------------------------------------------------------------
    console.log("\n── Section B: Video Generation Engine (KIE.ai Integration)");

    writeTestEnv({
      KIE_API_KEY: "test_mock_kie_key_12345",
      KIE_BASE_URL: "https://api.kie.ai",
    });
    const vidCfg = getVideoConfig("standard");
    assert(
      vidCfg.provider === "kie.ai" && vidCfg.isConfigured === true,
      "Case B1: KIE_API_KEY present -> Video engine resolves configured status"
    );

    writeTestEnv({ KIE_API_KEY: "" });
    const vidCfgNoKey = getVideoConfig("standard");
    assert(
      vidCfgNoKey.isConfigured === false,
      "Case B2: KIE_API_KEY removed -> isConfigured is false"
    );

    let vidFailed = false;
    let vidErrMsg = "";
    try {
      await VideoGenerationService.createVideoTask({ prompt: "Ocean waves in motion", tier: "standard" });
    } catch (e) {
      vidFailed = true;
      vidErrMsg = e.message;
    }
    assert(
      vidFailed && vidErrMsg.includes("Missing KIE_API_KEY"),
      `Case B3: Video generation fails server-side when KIE_API_KEY is missing: "${vidErrMsg}"`
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
