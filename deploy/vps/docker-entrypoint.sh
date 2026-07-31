#!/bin/sh
set -eu

node /app/scripts/validate-env.mjs --production
exec "$@"
