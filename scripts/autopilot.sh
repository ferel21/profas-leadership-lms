#!/usr/bin/env bash

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT/.autopilot"
LOG_FILE="$RUNTIME_DIR/autopilot.log"
STATE_FILE="$RUNTIME_DIR/state.json"
LOCK_FILE="$RUNTIME_DIR/autopilot.lock"
DEADLINE_FILE="$RUNTIME_DIR/deadline"
CYCLE_FILE="$RUNTIME_DIR/cycle"
START_FILE="$RUNTIME_DIR/started_at"
PROMPT_FILE="$ROOT/automation/autopilot-prompt.md"
DURATION_SECONDS="${AUTOPILOT_DURATION_SECONDS:-86400}"
INTERVAL_SECONDS="${AUTOPILOT_INTERVAL_SECONDS:-900}"
BUILD_EVERY="${AUTOPILOT_BUILD_EVERY:-4}"
IMPROVE_EVERY="${AUTOPILOT_IMPROVE_EVERY:-8}"
RUN_ONCE="${AUTOPILOT_RUN_ONCE:-0}"

mkdir -p "$RUNTIME_DIR/snapshots"
touch "$LOG_FILE"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  printf 'Autopilot lain sudah berjalan.\n' >&2
  exit 2
fi

NOW_EPOCH="$(date +%s)"
if [[ -f "$START_FILE" ]] && read -r SAVED_START <"$START_FILE" && [[ "$SAVED_START" =~ ^[0-9]+$ ]]; then
  START_EPOCH="$SAVED_START"
else
  START_EPOCH="$NOW_EPOCH"
  printf '%s\n' "$START_EPOCH" >"$START_FILE"
fi
if [[ -f "$DEADLINE_FILE" ]] && read -r SAVED_DEADLINE <"$DEADLINE_FILE" && [[ "$SAVED_DEADLINE" =~ ^[0-9]+$ ]]; then
  END_EPOCH="$SAVED_DEADLINE"
else
  END_EPOCH="$((NOW_EPOCH + DURATION_SECONDS))"
  printf '%s\n' "$END_EPOCH" >"$DEADLINE_FILE"
fi
if [[ -f "$CYCLE_FILE" ]] && read -r SAVED_CYCLE <"$CYCLE_FILE" && [[ "$SAVED_CYCLE" =~ ^[0-9]+$ ]]; then
  CYCLE="$SAVED_CYCLE"
else
  CYCLE=0
fi
LAST_MESSAGE="Autopilot dimulai"

log() {
  printf '[%s] %s\n' "$(date --iso-8601=seconds)" "$*" | tee -a "$LOG_FILE"
}

write_state() {
  local status="$1"
  local message="$2"
  AUTOPILOT_STATUS="$status" AUTOPILOT_MESSAGE="$message" AUTOPILOT_CYCLE="$CYCLE" AUTOPILOT_START="$START_EPOCH" AUTOPILOT_END="$END_EPOCH" AUTOPILOT_PID="$$" AUTOPILOT_STATE="$STATE_FILE" node <<'NODE'
const fs = require("node:fs");
const state = {
  status: process.env.AUTOPILOT_STATUS,
  message: process.env.AUTOPILOT_MESSAGE,
  cycle: Number(process.env.AUTOPILOT_CYCLE),
  startedAt: new Date(Number(process.env.AUTOPILOT_START) * 1000).toISOString(),
  endsAt: new Date(Number(process.env.AUTOPILOT_END) * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  pid: Number(process.env.AUTOPILOT_PID),
};
const target = process.env.AUTOPILOT_STATE;
fs.writeFileSync(`${target}.tmp`, `${JSON.stringify(state, null, 2)}\n`);
fs.renameSync(`${target}.tmp`, target);
NODE
}

run_check() {
  local label="$1"
  shift
  log "Menjalankan $label"
  if "$@" >>"$LOG_FILE" 2>&1; then
    log "$label lulus"
    return 0
  fi
  log "$label gagal"
  return 1
}

codex_ready() {
  command -v codex >/dev/null 2>&1 && codex login status 2>&1 | grep -Eqi 'logged in|login successful'
}

snapshot_workspace() {
  local snapshot="$RUNTIME_DIR/snapshots/$(date +%Y%m%d-%H%M%S)-cycle-$CYCLE"
  mkdir -p "$snapshot"
  rsync -a \
    --exclude='.autopilot/' \
    --exclude='.next/' \
    --exclude='node_modules/' \
    --exclude='.env' \
    --exclude='prisma/dev.db*' \
    "$ROOT/" "$snapshot/"
  printf '%s' "$snapshot"
}

run_codex() {
  local mode="$1"
  local reason="$2"
  if ! codex_ready; then
    log "Codex CLI belum login; audit AI dilewati. Jalankan: codex login"
    return 3
  fi
  local snapshot
  snapshot="$(snapshot_workspace)"
  log "Snapshot dibuat di $snapshot"
  log "Menjalankan Codex dalam mode $mode"
  {
    cat "$PROMPT_FILE"
    printf '\nMode siklus: %s\nAlasan: %s\n' "$mode" "$reason"
  } | timeout 2700 codex exec --ephemeral --full-auto --skip-git-repo-check -C "$ROOT" - >>"$LOG_FILE" 2>&1
  local exit_code=$?
  if [[ $exit_code -eq 0 ]]; then
    log "Codex menyelesaikan mode $mode"
  else
    log "Codex berhenti dengan kode $exit_code; snapshot dipertahankan untuk pemulihan manual"
  fi
  return "$exit_code"
}

mechanical_repair() {
  log "Mencoba perbaikan mekanis yang aman"
  npx eslint . --fix >>"$LOG_FILE" 2>&1 || true
  npx prisma generate >>"$LOG_FILE" 2>&1 || true
}

health_cycle() {
  CYCLE=$((CYCLE + 1))
  printf '%s\n' "$CYCLE" >"$CYCLE_FILE"
  write_state "checking" "Siklus $CYCLE sedang berjalan"
  log "===== Siklus $CYCLE ====="

  if [[ ! -d "$ROOT/node_modules" ]]; then
    log "node_modules tidak ada; menjalankan npm ci"
    npm ci >>"$LOG_FILE" 2>&1 || true
  fi

  local failed=0
  run_check "typecheck" npm run typecheck || failed=1
  run_check "lint" npm run lint || failed=1
  if [[ $CYCLE -eq 1 || $((CYCLE % BUILD_EVERY)) -eq 0 ]]; then
    run_check "production build" npm run build || failed=1
    run_check "runtime smoke test" npm run smoke || failed=1
  fi

  if [[ $failed -ne 0 ]]; then
    mechanical_repair
    if ! run_check "verifikasi setelah perbaikan mekanis" npm run typecheck || ! run_check "lint setelah perbaikan mekanis" npm run lint || ! run_check "build setelah perbaikan mekanis" npm run build || ! run_check "smoke test setelah perbaikan mekanis" npm run smoke; then
      run_codex "repair" "Health-check gagal dan perbaikan mekanis belum memulihkan proyek" || true
      if run_check "verifikasi akhir" npm run typecheck && run_check "lint akhir" npm run lint && run_check "build akhir" npm run build && run_check "smoke test akhir" npm run smoke; then
        LAST_MESSAGE="Siklus $CYCLE pulih setelah perbaikan AI"
        write_state "healthy" "$LAST_MESSAGE"
        return 0
      fi
      LAST_MESSAGE="Siklus $CYCLE masih gagal; lihat log dan snapshot"
      write_state "degraded" "$LAST_MESSAGE"
      return 1
    fi
    LAST_MESSAGE="Siklus $CYCLE pulih melalui perbaikan mekanis"
    write_state "healthy" "$LAST_MESSAGE"
    return 0
  fi

  if [[ $((CYCLE % IMPROVE_EVERY)) -eq 0 ]]; then
    run_codex "improve" "Pemeriksaan bersih; cari tepat satu bug, fitur belum lengkap, atau optimasi berisiko rendah" || true
    if ! run_check "typecheck pasca-audit" npm run typecheck || ! run_check "lint pasca-audit" npm run lint || ! run_check "build pasca-audit" npm run build || ! run_check "smoke test pasca-audit" npm run smoke; then
      LAST_MESSAGE="Audit proaktif menghasilkan kegagalan; snapshot tersedia"
      write_state "degraded" "$LAST_MESSAGE"
      return 1
    fi
  fi

  LAST_MESSAGE="Siklus $CYCLE sehat"
  write_state "healthy" "$LAST_MESSAGE"
  return 0
}

stop_autopilot() {
  trap - TERM INT
  write_state "stopped" "Autopilot dihentikan"
  log "Autopilot dihentikan"
  exit 0
}

trap stop_autopilot TERM INT
write_state "starting" "$LAST_MESSAGE"

while [[ "$(date +%s)" -lt "$END_EPOCH" ]]; do
  health_cycle || true
  if [[ "$RUN_ONCE" == "1" ]]; then
    break
  fi
  now="$(date +%s)"
  remaining="$((END_EPOCH - now))"
  if [[ $remaining -le 0 ]]; then
    break
  fi
  sleep_for="$INTERVAL_SECONDS"
  if [[ $remaining -lt $sleep_for ]]; then
    sleep_for="$remaining"
  fi
  log "Menunggu ${sleep_for} detik menuju siklus berikutnya"
  sleep "$sleep_for" &
  wait $!
done

write_state "completed" "Periode automasi selesai setelah $CYCLE siklus"
log "Periode automasi selesai setelah $CYCLE siklus"
systemctl --user disable profas-autopilot.service >/dev/null 2>&1 || true
