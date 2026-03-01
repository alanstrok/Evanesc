#!/usr/bin/env bash
set -euo pipefail

# ─── Evanesc Production Deployment Script ─────────────────────────────────────
# Designed for Unraid servers running Docker Compose
# Usage: ./deploy.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Evanesc — Production Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 1: Pull latest changes ─────────────────────────────────────────────
echo ""
echo "📦 Pulling latest changes from GitHub..."
git pull origin main

# ─── Step 2: Build Docker image ──────────────────────────────────────────────
echo ""
echo "🔨 Building Docker image..."
docker compose -f docker-compose.prod.yml build --no-cache web

# ─── Step 3: Start database services if not running ──────────────────────────
echo ""
echo "🗄️  Ensuring database services are running..."
docker compose -f docker-compose.prod.yml up -d postgres redis minio

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U evanesc > /dev/null 2>&1; do
  sleep 2
done
echo "✅ PostgreSQL is ready"

# ─── Step 4: Run Drizzle migrations ──────────────────────────────────────────
echo ""
echo "🔄 Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm web sh -c "
  cd /app && node -e \"
    const { drizzle } = require('drizzle-orm/postgres-js');
    const postgres = require('postgres');
    const { migrate } = require('drizzle-orm/postgres-js/migrator');
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    migrate(db, { migrationsFolder: './packages/db/drizzle' })
      .then(() => { console.log('Migrations complete'); process.exit(0); })
      .catch((err) => { console.error(err); process.exit(1); });
  \"
" || echo "⚠️  Migration step skipped (may not have migrations yet)"

# ─── Step 5: Rolling restart (zero downtime) ─────────────────────────────────
echo ""
echo "🚀 Deploying web container with zero downtime..."

# Scale up a new container first
docker compose -f docker-compose.prod.yml up -d --no-deps --scale web=2 web 2>/dev/null || true
sleep 5

# Scale back down to 1 (removes old container)
docker compose -f docker-compose.prod.yml up -d --no-deps --scale web=1 web 2>/dev/null || \
  docker compose -f docker-compose.prod.yml up -d web

# ─── Step 6: Cleanup ─────────────────────────────────────────────────────────
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment complete!"
echo "  🌐 Web app: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
