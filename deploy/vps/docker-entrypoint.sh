#!/bin/sh
set -eu

node /app/scripts/validate-env.mjs --production

if [ -f "/app/node_modules/prisma/build/index.js" ] || command -v npx >/dev/null 2>&1; then
  echo "Syncing database schema with Prisma..."
  npx prisma db push --skip-generate || echo "Prisma db push warning: skipping auto-sync"
fi

exec "$@"
