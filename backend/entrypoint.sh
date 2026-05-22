#!/bin/sh

echo "=== ENTRYPOINT STARTED ==="
echo "NODE_ENV=${NODE_ENV:-not set}"
echo "PORT=${PORT:-not set}"
echo "DATABASE_URL=${DATABASE_URL:+set (${#DATABASE_URL} chars)}"
echo "JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET:+set (${#JWT_ACCESS_SECRET} chars)}"

echo "→ Running Prisma migrations..."
pnpm prisma migrate deploy 2>&1
MIGRATE_EXIT=$?
echo "→ Prisma migrate deploy exit code: $MIGRATE_EXIT"

echo "→ Starting application..."
exec node dist/src/main.js
