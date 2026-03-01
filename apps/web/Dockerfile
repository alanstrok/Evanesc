# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./
COPY .npmrc ./

# Copy package.json files for all workspaces
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Generate database migrations
RUN pnpm --filter @evanesc/db db:generate

# Build the web app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo build --filter=@evanesc/web

# ─── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

LABEL org.opencontainers.image.source="https://github.com/alanstrok/Evanesc"

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# Ensure public dir exists even if empty in source
RUN mkdir -p ./apps/web/public
COPY --from=builder /app/apps/web/public ./apps/web/public/

# Copy migration files (used by instrumentation.ts on startup)
COPY --from=builder /app/packages/db/drizzle ./packages/db/drizzle

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
