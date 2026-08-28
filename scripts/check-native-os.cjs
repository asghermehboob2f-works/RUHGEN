#!/usr/bin/env node
/**
 * RUHGEN Native Module OS Guard
 * Runs as `postinstall` in backend/package.json.
 * Detects if better-sqlite3 was compiled for the wrong OS (Windows/macOS)
 * and exits with an error before the mismatch silently reaches the server.
 */

"use strict";
const fs = require("fs");
const path = require("path");

// When run as backend postinstall, cwd is backend/
// When run manually from root, look in backend/node_modules
const candidates = [
  path.join(process.cwd(), "node_modules/better-sqlite3/build/Release/better_sqlite3.node"),
  path.join(__dirname, "../backend/node_modules/better-sqlite3/build/Release/better_sqlite3.node"),
];

const bindingPath = candidates.find(p => fs.existsSync(p));

if (!bindingPath) {
  // Not yet compiled — normal during a fresh install before compilation step
  process.exit(0);
}

// Read the first 4 bytes — ELF magic = 0x7f 'E' 'L' 'F'
const buf = Buffer.alloc(4);
const fd = fs.openSync(bindingPath, "r");
fs.readSync(fd, buf, 0, 4, 0);
fs.closeSync(fd);

const isElf = buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46;

if (!isElf) {
  console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  ❌  NATIVE MODULE OS MISMATCH — DEPLOYMENT BLOCKED             ║
╠══════════════════════════════════════════════════════════════════╣
║  better-sqlite3 was compiled for a non-Linux OS (Windows/macOS) ║
║  Uploading these binaries will cause "invalid ELF header" on    ║
║  the server.                                                     ║
╠══════════════════════════════════════════════════════════════════╣
║  FIX: Never upload node_modules. On the Linux server, run:      ║
║    cd backend && npm ci                                          ║
╚══════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

console.log("[RUHGEN] ✅ better-sqlite3 native binding is Linux ELF — correct for server.");
