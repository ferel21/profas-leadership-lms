#!/bin/sh
set -eu

node /app/scripts/validate-env.mjs --production

if command -v prisma >/dev/null 2>&1; then
  echo "Syncing database schema with Prisma..."
  prisma db push --skip-generate --accept-data-loss || echo "Prisma db push warning: skipping auto-sync"
fi

exec "$@"
