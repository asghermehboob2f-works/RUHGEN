/**
 * RUHGEN Platform — Production Multi-Process Manager
 * Automatically starts both the Express Backend (Port 4000) and Next.js Frontend (Port $PORT)
 * when deployed on hosting platforms like Render, VPS, or Docker.
 */

const { spawn } = require("child_process");
const path = require("path");

console.log("[RUHGEN Production] Starting multi-process cluster: Express Backend + Next.js Frontend...");

const rootDir = path.resolve(__dirname, "..");
const backendPort = process.env.BACKEND_PORT || "4000";
const frontendPort = process.env.PORT || "3000";

// Ensure BACKEND_PORT is explicitly set for backend process so it binds to port 4000
const backendEnv = {
  ...process.env,
  PORT: backendPort,
  BACKEND_PORT: backendPort,
};

// 1. Spawn Express Backend
const backendProcess = spawn(process.execPath, [path.join(rootDir, "backend", "src", "server.js")], {
  cwd: rootDir,
  stdio: "inherit",
  env: backendEnv,
});

backendProcess.on("error", (err) => {
  console.error("[RUHGEN Production] Backend process error:", err);
});

backendProcess.on("exit", (code, signal) => {
  console.error(`[RUHGEN Production] Backend process exited (code ${code}, signal ${signal})`);
});

const fs = require("fs");
let nextBin = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(nextBin)) {
  nextBin = path.join(rootDir, "node_modules", ".bin", "next");
}
const frontendEnv = {
  ...process.env,
  BACKEND_URL: process.env.BACKEND_URL || `http://127.0.0.1:${backendPort}`,
};

const frontendProcess = spawn(process.execPath, [nextBin, "start", "-p", frontendPort], {
  cwd: rootDir,
  stdio: "inherit",
  env: frontendEnv,
});

frontendProcess.on("error", (err) => {
  console.error("[RUHGEN Production] Frontend process error:", err);
});

frontendProcess.on("exit", (code, signal) => {
  console.error(`[RUHGEN Production] Frontend process exited (code ${code}, signal ${signal})`);
  try {
    backendProcess.kill("SIGTERM");
  } catch (_) {}
  process.exit(code || 0);
});

const shutdown = (signal) => {
  console.log(`[RUHGEN Production] Received ${signal}. Shutting down services...`);
  try {
    backendProcess.kill("SIGTERM");
  } catch (_) {}
  try {
    frontendProcess.kill("SIGTERM");
  } catch (_) {}
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
