#!/bin/sh
set -eu

node /app/scripts/validate-env.mjs --production

if [ -f "/app/node_modules/prisma/build/index.js" ]; then
  echo "Syncing database schema with Prisma..."
  node /app/node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss || echo "Prisma db push warning: skipping auto-sync"
fi

exec "$@"
