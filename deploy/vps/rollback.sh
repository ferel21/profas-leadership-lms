#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${VPS_APP_DIR:-$(pwd)}"
STATE_DIR="${DEPLOY_STATE_DIR:-$APP_DIR/.deploy-state}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:3000/api/health}"
target_sha="${1:-}"

cd "$APP_DIR"
if [[ -z "$target_sha" ]]; then
  [[ -s "$STATE_DIR/previous-good-sha" ]] || { echo "Tidak ada previous-good-sha. Berikan commit target secara eksplisit." >&2; exit 1; }
  target_sha="$(cat "$STATE_DIR/previous-good-sha")"
fi
git fetch --prune origin main
git cat-file -e "$target_sha^{commit}"
git switch --detach "$target_sha"

compose=(docker compose --env-file .env -f "$COMPOSE_FILE")
"${compose[@]}" build
"${compose[@]}" run --rm --no-deps --entrypoint /bin/sh profas-lms -c 'node /app/scripts/validate-env.mjs --production'
"${compose[@]}" up -d --remove-orphans
HEALTHCHECK_URL="$HEALTHCHECK_URL" ./deploy/vps/wait-for-health.sh

mkdir -p "$STATE_DIR"
printf '%s\n' "$target_sha" > "$STATE_DIR/current-good-sha"
echo "Rollback berhasil ke $target_sha. Deploy berikutnya akan mengaktifkan branch main kembali."
