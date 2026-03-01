#!/bin/sh
set -e

echo "Running database migrations..."
node packages/db/migrate.cjs
echo "Starting application..."
exec node apps/web/server.js
