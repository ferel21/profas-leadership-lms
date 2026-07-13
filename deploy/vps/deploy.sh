#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${VPS_APP_DIR:-$(pwd)}"
BRANCH="${VPS_BRANCH:-main}"
STATE_DIR="${DEPLOY_STATE_DIR:-$APP_DIR/.deploy-state}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:3000/api/health}"

cd "$APP_DIR"
[[ -f .env ]] || { echo "File $APP_DIR/.env tidak ditemukan." >&2; exit 1; }
git diff --quiet && git diff --cached --quiet || { echo "Working tree VPS memiliki perubahan tracked; deploy dihentikan." >&2; exit 1; }

git switch "$BRANCH"
git fetch --prune origin "$BRANCH"
previous_sha="$(git rev-parse HEAD)"
git merge --ff-only "origin/$BRANCH"
current_sha="$(git rev-parse HEAD)"

if [[ -n "${DEPLOY_RELEASE_SHA:-}" && "$current_sha" != "$DEPLOY_RELEASE_SHA" ]]; then
  echo "Commit VPS ($current_sha) tidak sama dengan release yang diminta ($DEPLOY_RELEASE_SHA)." >&2
  exit 1
fi

mkdir -p "$STATE_DIR"
printf '%s\n' "$previous_sha" > "$STATE_DIR/previous-good-sha"

compose=(docker compose --env-file .env -f "$COMPOSE_FILE")
echo "Build image untuk commit $current_sha..."
"${compose[@]}" build

echo "Validasi environment di image..."
"${compose[@]}" run --rm --no-deps --entrypoint /bin/sh profas-lms -c 'node /app/scripts/validate-env.mjs --production'

echo "Menjalankan release $current_sha..."
"${compose[@]}" up -d --remove-orphans
if HEALTHCHECK_URL="$HEALTHCHECK_URL" ./deploy/vps/wait-for-health.sh; then
  printf '%s\n' "$current_sha" > "$STATE_DIR/current-good-sha"
  echo "Deploy berhasil: $current_sha"
  exit 0
fi

echo "Release baru gagal readiness. Log terakhir:" >&2
"${compose[@]}" logs --tail=120 profas-lms >&2 || true
echo "Mencoba rollback otomatis ke $previous_sha..." >&2
git switch --detach "$previous_sha"
"${compose[@]}" build
"${compose[@]}" run --rm --no-deps --entrypoint /bin/sh profas-lms -c 'node /app/scripts/validate-env.mjs --production'
"${compose[@]}" up -d --remove-orphans
if HEALTHCHECK_URL="$HEALTHCHECK_URL" ./deploy/vps/wait-for-health.sh; then
  printf '%s\n' "$previous_sha" > "$STATE_DIR/current-good-sha"
  echo "Rollback otomatis berhasil: $previous_sha" >&2
else
  echo "Rollback otomatis gagal; VPS membutuhkan investigasi manual." >&2
  exit 1
fi
exit 1
