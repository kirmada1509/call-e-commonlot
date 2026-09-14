#!/usr/bin/env bash
# Starts Postgres (docker) and the web/server dev servers, detached.
# Safe to re-run: already-running services are left alone.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/dev-common.sh
source "$SCRIPT_DIR/lib/dev-common.sh"

ensure_runtime_dirs

echo "==> Postgres"
if postgres_running; then
  echo "    already running"
else
  docker compose -f "$ROOT_DIR/docker-compose.yml" up -d postgres
  echo -n "    waiting for healthcheck"
  for _ in $(seq 1 30); do
    if docker compose -f "$ROOT_DIR/docker-compose.yml" ps postgres --format '{{.Health}}' 2>/dev/null | grep -q healthy; then
      echo " done"
      break
    fi
    echo -n "."
    sleep 1
  done
fi

echo "==> dozzle"
if dozzle_running; then
  echo "    already running"
else
  docker compose -f "$ROOT_DIR/docker-compose.yml" up -d dozzle
fi

for name in "${SERVICES[@]}"; do
  echo "==> ${name}"
  if pid=$(running_pid "$name"); then
    echo "    already running (pid $pid)"
    continue
  fi

  port="$(service_port "$name")"
  if existing=$(port_pid "$port") && [[ -n "$existing" ]]; then
    echo "    skipped: port ${port} is already in use by an untracked process (pid ${existing})"
    echo "    run 'bun run down' first, or stop pid ${existing} manually, then retry"
    continue
  fi

  filter="$(service_filter "$name")"
  logf="$(log_file "$name")"
  pf="$(pid_file "$name")"

  (cd "$ROOT_DIR" && nohup bun run turbo run dev -F "$filter" -- >"$logf" 2>&1 &
   echo $! >"$pf")

  echo "    started (pid $(cat "$pf")), logs: ${logf#"$ROOT_DIR"/}"
done

echo
echo "==> Summary"
bash "$SCRIPT_DIR/status.sh"
