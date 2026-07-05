#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT="profas-autopilot.service"
ACTION="${1:-status}"

install_unit() {
  local unit_dir="$HOME/.config/systemd/user"
  mkdir -p "$unit_dir"
  {
    printf '[Unit]\n'
    printf 'Description=PROFAS autonomous maintenance\n'
    printf 'After=network-online.target\n'
    printf 'Wants=network-online.target\n\n'
    printf '[Service]\n'
    printf 'Type=simple\n'
    printf 'WorkingDirectory=%s\n' "$ROOT"
    printf 'ExecStart=/usr/bin/bash "%s/scripts/autopilot.sh"\n' "$ROOT"
    printf 'Restart=on-failure\n'
    printf 'RestartSec=60\n'
    printf 'Nice=10\n\n'
    printf '[Install]\n'
    printf 'WantedBy=default.target\n'
  } >"$unit_dir/$UNIT"
  systemctl --user daemon-reload
}

case "$ACTION" in
  start)
    HOURS="${2:-24}"
    if ! [[ "$HOURS" =~ ^[0-9]+$ ]] || [[ "$HOURS" -lt 1 ]]; then
      printf 'Durasi harus berupa jam bulat positif.\n' >&2
      exit 2
    fi
    systemctl --user disable --now "$UNIT" >/dev/null 2>&1 || true
    mkdir -p "$ROOT/.autopilot"
    START_EPOCH="$(date +%s)"
    printf '%s\n' "$START_EPOCH" >"$ROOT/.autopilot/started_at"
    printf '%s\n' "$(( START_EPOCH + HOURS * 3600 ))" >"$ROOT/.autopilot/deadline"
    printf '0\n' >"$ROOT/.autopilot/cycle"
    install_unit
    systemctl --user enable --now "$UNIT"
    printf 'Autopilot dimulai selama %s jam.\n' "$HOURS"
    ;;
  stop)
    systemctl --user disable --now "$UNIT"
    rm -f "$ROOT/.autopilot/deadline" "$ROOT/.autopilot/started_at" "$ROOT/.autopilot/cycle"
    printf 'Autopilot dihentikan.\n'
    ;;
  once)
    AUTOPILOT_RUN_ONCE=1 AUTOPILOT_DURATION_SECONDS=3600 /usr/bin/bash "$ROOT/scripts/autopilot.sh"
    ;;
  status)
    systemctl --user status "$UNIT" --no-pager || true
    if [[ -f "$ROOT/.autopilot/state.json" ]]; then
      printf '\nStatus terakhir:\n'
      cat "$ROOT/.autopilot/state.json"
    fi
    if [[ -f "$ROOT/.autopilot/autopilot.log" ]]; then
      printf '\nLog terbaru:\n'
      tail -n 20 "$ROOT/.autopilot/autopilot.log"
    fi
    ;;
  *)
    printf 'Penggunaan: %s {start [jam]|stop|once|status}\n' "$0" >&2
    exit 2
    ;;
esac
