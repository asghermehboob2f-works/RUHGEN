# 🚀 RUHGEN Platform — Production Deployment & Administration Guide

This guide provides step-by-step instructions for deploying, managing, and maintaining the RUHGEN platform across Linux VPS hosting (MilesWeb, DigitalOcean, Hetzner, AWS), Docker containers, PM2 process management, and Nginx reverse proxies.

---

## 🏗️ Architectural Overview

- **Frontend Framework**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS.
- **Backend API Engine**: Node.js + Express + `better-sqlite3` (WAL mode) + JWT Auth.
- **Database Storage**: SQLite database stored in `backend/data/ruhgen.sqlite` with WAL mode enabled.
- **Media Asset Storage**: Persistent assets in `media/` synced to `public/media/`.
- **API Proxy Strategy**: Next.js transparently proxies relative `/api/*` requests to the Express backend (`http://127.0.0.1:4000`) in local development or via Nginx in production.

---

## 📋 Environment Configuration

### 1. Monorepo Root `.env` Setup
Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `PORT` | Next.js frontend port | `3000` |
| `BACKEND_PORT` | Express backend port | `4000` |
| `BACKEND_URL` | Backend origin URL | `http://127.0.0.1:4000` |
| `NEXT_PUBLIC_SITE_URL` | Canonical public domain | `https://ruhgen.in` |
| `ADMIN_JWT_SECRET` | Secret key for Admin JWT tokens | *Generate 64-char random string* |
| `USER_JWT_SECRET` | Secret key for User JWT tokens | *Generate 64-char random string* |
| `SMTP_HOST` | Mail server hostname | `mail.ruhgen.in` |
| `SMTP_PORT` | SSL/TLS mail server port | `465` |
| `SMTP_PASS` | Mail server password | *Your SMTP Password* |
| `RAZORPAY_KEY_ID` | Razorpay Live Key ID | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Live Key Secret | *Your Razorpay Secret* |

---

## 💻 Deployment Method 1: PM2 + Nginx on VPS (MilesWeb / Ubuntu / Debian)

### 1. System Requirements
- Node.js >= 20.x or 22.x
- PM2 (`npm install -g pm2`)
- Nginx & Certbot

### 2. Installation & Build
```bash
# 1. Clone repository
git clone https://github.com/asghermehboob2f-works/RUHGEN.git /var/www/ruhgen
cd /var/www/ruhgen

# 2. Install dependencies
npm ci
cd backend && npm ci && cd ..

# 3. Create production .env file
cp .env.example .env
# Edit .env with your secrets: nano .env

# 4. Build Next.js production bundle
npm run build
```

### 3. Start PM2 Processes
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Configure Nginx & SSL
Copy `nginx.conf` to `/etc/nginx/sites-available/ruhgen` and link it:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/ruhgen
sudo ln -s /etc/nginx/sites-available/ruhgen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtain Let's Encrypt SSL certificate:
```bash
sudo certbot --nginx -d ruhgen.in -d www.ruhgen.in
```

---

## 🐳 Deployment Method 2: Docker & Docker Compose

Deploy the containerized stack with volume persistence:

```bash
# 1. Build and start containers in detached mode
docker-compose up -d --build

# 2. Check container status & health checks
docker-compose ps

# 3. View live application logs
docker-compose logs -f
```

---

## ☁️ Deployment Method 3: Render (PaaS)

When deploying on Render, npm workspaces automatically install both frontend and backend dependencies during the root `npm install` build step.

### 1. Standalone Backend Service Configuration
- **Environment**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `node backend/src/server.js`

### 2. Multi-Process Single Web Service (Frontend + Backend)
- **Environment**: Node.js
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:cluster`

---

## 🔄 Database Backups & Maintenance

### 1. SQLite WAL Database Backup
Since SQLite uses WAL mode (`ruhgen.sqlite`, `ruhgen.sqlite-wal`), create backups using `.backup`:

```bash
# Daily automated backup cron job
sqlite3 /var/www/ruhgen/backend/data/ruhgen.sqlite ".backup '/var/www/backups/ruhgen-$(date +%F).sqlite'"
```

### 2. Media Asset Sync
If uploading new showcase assets via CMS, sync media to public directory:

```bash
node scripts/sync-media.cjs
```

---

## 🩺 System Verification Checklist

- [x] `npx tsc --noEmit` returns zero type errors.
- [x] `npm run build` compiles successfully (45/45 routes).
- [x] Rate limiting active on auth routes (`X-RateLimit-*` headers returned).
- [x] Health check endpoint responding at `GET /api/health`.
- [x] PM2 monitoring active (`pm2 status`).
