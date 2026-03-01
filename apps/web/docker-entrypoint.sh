#!/bin/sh
set -e

echo "Running database migrations..."
node packages/db/migrate.mjs
echo "Starting application..."
exec node apps/web/server.js
