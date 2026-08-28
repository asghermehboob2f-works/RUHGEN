#!/usr/bin/env node
/**
 * RUHGEN Production Deploy Script
 * Run on the Linux server: npm run deploy
 *
 * Performs the full safe sequence:
 *   1. Kill dev processes
 *   2. Git pull
 *   3. Install frontend deps (--workspaces=false, avoids native-module fork exhaustion)
 *   4. Install backend deps (isolated, compiles better-sqlite3 for Linux)
 *   5. Pre-deploy validation
 *   6. Production build
 *   7. Start/restart via PM2
 *   8. Health verification
 */

"use strict";
const { spawnSync, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ── Guard: server-only ───────────────────────────────────────────────────────
if (process.platform === "win32") {
  console.error("\n❌ Run this script on the Linux server, not Windows.");
  console.error("   On Windows: git commit & push, then SSH to server and run: npm run deploy\n");
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "..");

// ── Find PM2 binary ──────────────────────────────────────────────────────────
function findBin(name) {
  try {
    return execSync(`which ${name}`, { encoding: "utf8", stdio: ["pipe","pipe","pipe"] }).trim();
  } catch {}
  try {
    const npmGlobal = execSync("npm root -g", { encoding: "utf8", stdio: ["pipe","pipe","pipe"] }).trim();
    const p = path.join(path.dirname(npmGlobal), "bin", name);
    if (fs.existsSync(p)) return p;
  } catch {}
  return name; // fallback — let shell resolve it
}

const PM2 = findBin("pm2");

// ── Run helper ───────────────────────────────────────────────────────────────
function run(cmd, { allowFail = false } = {}) {
  console.log(`\n  $ ${cmd}`);
  const r = spawnSync("bash", ["-c", cmd], { stdio: "inherit", cwd: ROOT });
  if (!allowFail && r.status !== 0) {
    console.error(`\n❌ Failed (exit ${r.status}): ${cmd}`);
    process.exit(r.status || 1);
  }
  return r.status;
}

function step(n, title) {
  console.log(`\n${"═".repeat(62)}`);
  console.log(`  STEP ${n} — ${title}`);
  console.log("═".repeat(62));
}

// ── Deploy ───────────────────────────────────────────────────────────────────
console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║       RUHGEN — Production Deploy                           ║");
console.log("╚══════════════════════════════════════════════════════════════╝");

step(1, "Kill dev-mode processes");
run("node scripts/kill-dev-processes.cjs");
run(`${PM2} stop all 2>/dev/null || true`, { allowFail: true });
run(`${PM2} delete all 2>/dev/null || true`, { allowFail: true });

step(2, "Git pull — latest source");
run("git pull origin main");

step(3, "Install frontend deps (--workspaces=false)");
console.log("  ℹ️  Skipping workspace (backend) to prevent better-sqlite3 fork exhaustion");
run("npm install --workspaces=false");

step(4, "Install backend deps (isolated native compilation)");
run("cd backend && npm install --no-workspaces");
run(`cd backend && node -e "require('better-sqlite3'); console.log('  ✅ better-sqlite3 OK');"`);

step(5, "Pre-deploy validation");
run("node scripts/predeploy-check.cjs");

step(6, "Production build");
run("node scripts/sync-media.cjs");
run("NODE_ENV=production node node_modules/next/dist/bin/next build");

step(7, "Start via PM2");
run(`${PM2} start ecosystem.config.js`);
run(`${PM2} save --force`);

step(8, "Health check");
run("sleep 4");
run(`${PM2} list`);
run("curl -sf http://localhost:4000/api/health && echo '  ✅ Backend: OK' || echo '  ⚠️  Backend health check pending (check pm2 logs)'", { allowFail: true });
run("curl -sf -o /dev/null -w '  ✅ Frontend: HTTP %{http_code}\\n' http://localhost:3000 || echo '  ⚠️  Frontend not ready yet (may still be starting)'", { allowFail: true });

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  ✅  RUHGEN deployment complete!                           ║");
console.log("║  Run: pm2 list   to confirm both apps are online.          ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
