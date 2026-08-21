# ─────────────────────────────────────────────────────────────────────────────
# RUHGEN Platform — Production Next.js Frontend Dockerfile
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: Base Dependencies
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Stage 2: Build Frontend
FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["npx", "next", "start"]
