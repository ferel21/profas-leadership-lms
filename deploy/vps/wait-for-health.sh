#!/usr/bin/env bash
set -Eeuo pipefail

health_url="${HEALTHCHECK_URL:-http://127.0.0.1:3000/api/health}"
timeout_seconds="${HEALTHCHECK_TIMEOUT_SECONDS:-120}"
interval_seconds="${HEALTHCHECK_INTERVAL_SECONDS:-3}"
deadline=$((SECONDS + timeout_seconds))
body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT

echo "Menunggu readiness: ${health_url}"
while (( SECONDS < deadline )); do
  status="$(curl --silent --show-error --max-time 10 --output "$body_file" --write-out '%{http_code}' "$health_url" || true)"
  if [[ "$status" == "200" ]]; then
    echo "Readiness lulus: $(tr -d '\n' < "$body_file" | cut -c1-240)"
    exit 0
  fi
  sleep "$interval_seconds"
done

echo "Readiness gagal setelah ${timeout_seconds} detik; status terakhir: ${status:-no-response}" >&2
if [[ -s "$body_file" ]]; then tr -d '\n' < "$body_file" | cut -c1-500 >&2; echo >&2; fi
exit 1
