# 🚀 RUHGEN Platform — Production Deployment Guide

> **One source of truth.** This file supersedes all chat history.
> Deploy using `npm run deploy` on the server — nothing else.

---

## 🏗️ Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 |
| Backend | Node.js + Express + `better-sqlite3` (WAL mode) + JWT Auth |
| Database | SQLite → `backend/data/ruhgen.sqlite` |
| Process manager | PM2 (`ecosystem.config.js`) |
| Reverse proxy | Nginx + Let's Encrypt SSL |
| Server | MilesWeb website container (Linux, Node v20, NVM-managed) |

---

## ⚠️ Critical Rules — Read Before Touching Anything

| Rule | Why |
|------|-----|
| **Never run `npm install` (bare) at root on the server** | Workspace hoisting triggers `better-sqlite3` C compilation via `make`, exhausting the container's fork limit and crashing the install |
| **Always use `npm run install:frontend` + `npm run install:backend`** | Frontend installs with `--workspaces=false` (no native compile); backend installs in isolation |
| **Never upload `node_modules`** | Native binaries (`.node` files) are OS-specific. Windows/macOS builds cause "invalid ELF header" on Linux |
| **Never use `next dev` or `node --watch` in production** | Dev mode disables optimizations and causes EAGAIN thread exhaustion |
| **Always build on the server** | Ensures native modules and the Next.js build match the server's OS/arch |

---

## 📋 Environment Setup (First Deploy Only)

```bash
# On the server
cp .env.example .env
nano .env   # fill in all secrets
```

Key variables:

| Variable | Production Value |
|----------|----------------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `BACKEND_PORT` | `4000` |
| `BACKEND_URL` | `http://127.0.0.1:4000` |
| `NEXT_PUBLIC_SITE_URL` | `https://ruhgen.in` |
| `ADMIN_JWT_SECRET` | 64-char random string |
| `USER_JWT_SECRET` | 64-char random string |
| `SMTP_HOST` | `mail.ruhgen.in` |
| `SMTP_PORT` | `465` |

---

## 🔁 Standard Deploy (Every Time)

SSH into the server and run **one command**:

```bash
cd ~/ruhgen1
npm run deploy
```

That's it. The script runs all 8 steps automatically:

1. Kills dev-mode processes (next dev, node --watch, concurrently)
2. `git pull origin main`
3. `npm install --workspaces=false` (frontend only, no native compile)
4. `cd backend && npm ci` (backend, compiles better-sqlite3 for Linux)
5. Pre-deploy validation (globals.css, next.config.ts, fonts, etc.)
6. `NODE_ENV=production next build`
7. `pm2 start ecosystem.config.js && pm2 save`
8. Health checks on both ports

---

## 🩺 Manual Steps (If `npm run deploy` Fails Mid-Way)

If the automated script fails at a specific step, run steps individually:

```bash
cd ~/ruhgen1

# Kill stale processes
npm run kill:dev
pm2 stop all && pm2 delete all

# Pull
git pull origin main

# Install (CRITICAL: in this exact order, NOT bare npm install)
npm run install:frontend    # → npm install --workspaces=false
npm run install:backend     # → cd backend && npm ci

# Verify better-sqlite3
node -e "require('./backend/node_modules/better-sqlite3'); console.log('OK')"

# Validate config
npm run check

# Build
NODE_ENV=production node node_modules/next/dist/bin/next build

# Start
pm2 start ecosystem.config.js
pm2 save --force
pm2 list
```

---

## 🔍 Verification Checklist

Run after every deploy to confirm everything is healthy:

```bash
# Both apps online?
pm2 list

# Backend responding?
curl http://localhost:4000/api/health

# Frontend responding?
curl -I http://localhost:3000

# Public site?
curl -I https://ruhgen.in
```

**Expected:**
- `pm2 list` → both `ruhgen-frontend` and `ruhgen-backend` show `online`
- Backend health → `{"status":"ok",...}` or `200`
- Frontend → `HTTP 200`
- ruhgen.in → `HTTP 200` via Nginx

---

## 🧪 Config Invariants (Enforced by `npm run check`)

These are automatically verified before every build. If any fail, the build is blocked:

| Check | Expected |
|-------|---------|
| `src/app/globals.css` line 1 | `@import "tailwindcss";` |
| `next.config.ts` | No `workerThreads`, no `cpus: 1` |
| `next.config.ts` | `allowedDevOrigins: ["ruhgen.in", "*.ruhgen.in"]` present |
| `backend/package.json` start | No `--watch` |
| `ecosystem.config.js` | `watch: false` on both apps |
| `public/fonts/` | All 12 custom fonts present |
| `.gitignore` | `/node_modules` and `/backend/node_modules` excluded |

Run manually anytime: `npm run check`

---

## 📁 PM2 Configuration (`ecosystem.config.js`)

```js
// Both apps use __dirname as cwd — works regardless of install path
// script: "node_modules/next/dist/bin/next"  ← works without global `next`
// watch: false                                ← NEVER file-watch in production
```

To view PM2 logs:
```bash
pm2 logs ruhgen-frontend --lines 50
pm2 logs ruhgen-backend  --lines 50
```

---

## 🔄 PM2 Persistence (Website Container)

`pm2 startup systemd` is blocked in MilesWeb containers. Use a cron job instead:

```bash
# Add once — survives container restarts
PM2_BIN=$(which pm2)
APPPATH=$(realpath ~/ruhgen1)
(crontab -l 2>/dev/null; echo "@reboot cd $APPPATH && $PM2_BIN resurrect") | crontab -
crontab -l   # verify
```

---

## 🌐 Nginx Configuration

The `nginx.conf` at the project root is the production Nginx config.

```bash
# First-time setup
sudo cp nginx.conf /etc/nginx/sites-available/ruhgen
sudo ln -s /etc/nginx/sites-available/ruhgen /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d ruhgen.in -d www.ruhgen.in
```

---

## 🐳 Docker (Alternative)

```bash
docker-compose up -d --build
docker-compose ps
docker-compose logs -f
```

---

## 🗂️ Script Reference

| Script | What it does |
|--------|-------------|
| `npm run deploy` | **Full automated production deploy** (use this) |
| `npm run check` | Run pre-deploy config validation |
| `npm run kill:dev` | Kill all dev-mode processes |
| `npm run install:frontend` | `npm install --workspaces=false` (safe for server) |
| `npm run install:backend` | `cd backend && npm ci` |
| `npm run install:prod` | Both of the above in sequence |
| `npm run build` | Next.js production build (runs check first) |
| `npm run sync:media` | Sync `media/` → `public/media/` |

---

## 🔐 Secrets Management

- Never commit `.env` — it's in `.gitignore`
- On the server, `.env` lives at `~/ruhgen1/.env`
- Use `.env.example` as the template — it contains all variable names with safe placeholder values
- Rotate `ADMIN_JWT_SECRET` and `USER_JWT_SECRET` immediately if ever exposed

---

## 📊 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `invalid ELF header` | `better-sqlite3` compiled on wrong OS | `rm -rf backend/node_modules && npm run install:backend` on server |
| `next: not found` | `npm install` (bare) failed due to fork limit | `npm run install:frontend` instead |
| `fork: Resource temporarily unavailable` | Too many processes forked by `make`/`node-gyp` | Wait 2 min, then use `npm run install:frontend` + `npm run install:backend` separately |
| `pm2: command not found` | npm global bin not in PATH | `npm install -g pm2` then retry |
| `pm2 startup` blocked | Website container, no systemd access | Use `@reboot` cron job (see PM2 Persistence above) |
| Build fails with CSS error | `@import "tailwindcss"` not first line | Run `npm run check` to identify |
| Font 404s | Font file missing from `public/fonts/` | Run `npm run check` — lists missing fonts |
