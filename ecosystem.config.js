/**
 * PM2 Ecosystem Config — RUHGEN Production
 * Uses __dirname so cwd is always the project root regardless of install path.
 * Both apps: watch: false (never file-watch in production).
 */
module.exports = {
  apps: [
    {
      name: "ruhgen-frontend",
      // next binary via full local path — works even when `next` isn't globally in PATH
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname, // resolves dynamically to wherever this file lives
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      autorestart: true,
      watch: false, // NEVER set to true in production
      max_memory_restart: "1G",
    },
    {
      name: "ruhgen-backend",
      script: "backend/src/server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      autorestart: true,
      watch: false, // NEVER set to true in production
    },
  ],
};
