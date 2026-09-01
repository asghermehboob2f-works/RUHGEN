#!/usr/bin/env node
/**
 * RUHGEN Pre-Deploy Validation Script
 * Automatically runs before `npm run build` and `npm run deploy`.
 * Exits 1 with a clear error message if any check fails.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     → ${err.message}`);
    failed++;
  }
}

console.log("\n[RUHGEN] ── Pre-Deploy Validation ─────────────────────────────\n");

// 1. globals.css starts with @import "tailwindcss"
check('globals.css: first line is @import "tailwindcss"', () => {
  const p = path.join(ROOT, "src/app/globals.css");
  if (!fs.existsSync(p)) throw new Error("src/app/globals.css not found");
  const first = fs.readFileSync(p, "utf8").split(/\r?\n/)[0].trim();
  if (first !== '@import "tailwindcss";')
    throw new Error(`Got: "${first}"`);
});

// 2. next.config.ts — no forbidden experimental flags
check("next.config.ts: no experimental.workerThreads", () => {
  const p = path.join(ROOT, "next.config.ts");
  if (!fs.existsSync(p)) throw new Error("next.config.ts not found");
  if (/workerThreads/.test(fs.readFileSync(p, "utf8")))
    throw new Error("workerThreads found — remove it");
});

check("next.config.ts: no experimental.cpus: 1", () => {
  const p = path.join(ROOT, "next.config.ts");
  if (/cpus\s*:\s*1/.test(fs.readFileSync(p, "utf8")))
    throw new Error("cpus: 1 found — remove it");
});

check("next.config.ts: allowedDevOrigins configured", () => {
  const p = path.join(ROOT, "next.config.ts");
  if (!fs.readFileSync(p, "utf8").includes("allowedDevOrigins"))
    throw new Error("allowedDevOrigins missing from next.config.ts");
});

// 3. Backend start script has no --watch
check("backend/package.json: start script has no --watch", () => {
  const p = path.join(ROOT, "backend/package.json");
  if (!fs.existsSync(p)) throw new Error("backend/package.json not found");
  const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
  const start = pkg.scripts?.start || "";
  if (start.includes("--watch"))
    throw new Error(`start script contains --watch: "${start}" — remove it`);
});

// 4. ecosystem.config.js has watch: false
check("ecosystem.config.js: watch: false for all apps", () => {
  const p = path.join(ROOT, "ecosystem.config.js");
  if (!fs.existsSync(p)) throw new Error("ecosystem.config.js not found");
  if (/watch\s*:\s*true/.test(fs.readFileSync(p, "utf8")))
    throw new Error("watch: true found — set to false");
});

// 5. .gitignore excludes node_modules
check(".gitignore: excludes /node_modules and /backend/node_modules", () => {
  const p = path.join(ROOT, ".gitignore");
  if (!fs.existsSync(p)) throw new Error(".gitignore not found");
  const c = fs.readFileSync(p, "utf8");
  if (!c.includes("/node_modules")) throw new Error("/node_modules not excluded");
  if (!c.includes("/backend/node_modules")) throw new Error("/backend/node_modules not excluded");
});

// 6. All custom font files present
check("public/fonts: all 12 custom font files present", () => {
  const fontsDir = path.join(ROOT, "public/fonts");
  const required = [
    "Rink-Regular.otf", "Rink-Medium.otf",
    "Ticdar-Regular.otf", "Ticdar-SemiBold.otf",
    "CalSans-Regular.ttf", "BungeeHairline-Regular.ttf",
    "Shooting Star.ttf", "Signatie.otf", "Ningetan.ttf",
    "Quadrat Grotesk W01 Regular.ttf",
    "Nareko.ttf", "Toqsi-Regular.otf",
  ];
  const missing = required.filter(f => !fs.existsSync(path.join(fontsDir, f)));
  if (missing.length) throw new Error(`Missing: ${missing.join(", ")}`);
});

// 7. No dev processes running (Linux only)
check("No dev-mode processes currently running", () => {
  if (process.platform === "win32") return; // skip on Windows (deployment is Linux-side)
  try {
    const out = execSync(
      'pgrep -fa "next dev|node --watch|concurrently" 2>/dev/null || true',
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
    if (out) throw new Error(`Dev process detected:\n     ${out}\n     Run: npm run kill:dev`);
  } catch (e) {
    if (e.message.includes("Dev process detected")) throw e;
    // pgrep unavailable — skip gracefully
  }
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n[RUHGEN] Checks: ${passed} passed, ${failed} failed.\n`);

if (failed > 0) {
  console.error("[RUHGEN] ❌ Pre-deploy validation FAILED — fix the issues above before building.\n");
  process.exit(1);
}

console.log("[RUHGEN] ✅ All pre-deploy checks passed.\n");
