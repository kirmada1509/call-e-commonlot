#!/usr/bin/env bash
# Stops the web/server dev servers. Postgres is left running unless
# --all or --db is passed.
#
# Usage: scripts/stop.sh [--all|--db]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/dev-common.sh
source "$SCRIPT_DIR/lib/dev-common.sh"

MODE="apps"
case "${1:-}" in
  --all) MODE="all" ;;
  --db) MODE="db" ;;
  "") ;;
  *) echo "usage: $0 [--all|--db]" >&2; exit 1 ;;
esac

stop_service() {
  local name="$1"
  local pf
  pf="$(pid_file "$name")"
  local port
  port="$(service_port "$name")"

  if pid=$(running_pid "$name"); then
    echo "==> stopping ${name} (pid $pid)"
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 10); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
    kill -9 "$pid" 2>/dev/null || true
  else
    echo "==> ${name} not tracked by pidfile"
  fi
  rm -f "$pf"

  # Clean up any leftover process still bound to the port (e.g. stale pidfile).
  if leftover=$(port_pid "$port") && [[ -n "$leftover" ]]; then
    echo "    killing leftover process on port ${port} (pid $leftover)"
    kill -9 "$leftover" 2>/dev/null || true
  fi
}

if [[ "$MODE" != "db" ]]; then
  for name in "${SERVICES[@]}"; do
    stop_service "$name"
  done
fi

if [[ "$MODE" == "all" || "$MODE" == "db" ]]; then
  echo "==> stopping postgres"
  docker compose -f "$ROOT_DIR/docker-compose.yml" stop postgres
fi

if [[ "$MODE" == "all" ]] && dozzle_running; then
  echo "==> stopping dozzle"
  docker compose -f "$ROOT_DIR/docker-compose.yml" stop dozzle
fi
