module.exports = {
  apps: [
    {
      name: "ruhgen-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
    {
      name: "ruhgen-backend",
      script: "backend/src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.BACKEND_PORT || 4000,
      },
      autorestart: true,
      watch: false,
    },
  ],
};
