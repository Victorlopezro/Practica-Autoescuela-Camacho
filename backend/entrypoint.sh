#!/bin/sh

echo "=== ENTRYPOINT STARTED ==="
echo "NODE_ENV=${NODE_ENV:-not set}"
echo "PORT=${PORT:-not set}"
echo "DATABASE_URL=${DATABASE_URL:+set (${#DATABASE_URL} chars)}"
echo "JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET:+set (${#JWT_ACCESS_SECRET} chars)}"

echo 'Starting application...'
exec node dist/src/main.js
