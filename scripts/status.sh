#!/usr/bin/env bash
# Prints the running status of web, server, and postgres.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/dev-common.sh
source "$SCRIPT_DIR/lib/dev-common.sh"

printf "%-10s %-10s %-8s %-8s %s\n" "SERVICE" "STATUS" "PORT" "PID" "LOG"

for name in "${SERVICES[@]}"; do
  port="$(service_port "$name")"
  logf="$(log_file "$name")"
  if pid=$(running_pid "$name"); then
    printf "%-10s %-10s %-8s %-8s %s\n" "$name" "running" "$port" "$pid" "${logf#"$ROOT_DIR"/}"
  else
    printf "%-10s %-10s %-8s %-8s %s\n" "$name" "stopped" "$port" "-" "-"
  fi
done

if postgres_running; then
  printf "%-10s %-10s %-8s %-8s %s\n" "postgres" "running" "5432" "-" "docker compose logs postgres"
else
  printf "%-10s %-10s %-8s %-8s %s\n" "postgres" "stopped" "5432" "-" "-"
fi

if dozzle_running; then
  printf "%-10s %-10s %-8s %-8s %s\n" "dozzle" "running" "8080" "-" "http://localhost:8080"
else
  printf "%-10s %-10s %-8s %-8s %s\n" "dozzle" "stopped" "8080" "-" "-"
fi
