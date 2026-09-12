#!/usr/bin/env bash
# Shared helpers for scripts/{start,stop,restart,status,logs}.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_DIR="$ROOT_DIR/.runtime/pids"
LOG_DIR="$ROOT_DIR/.runtime/logs"

# service name -> turbo filter, port (bash 3.2 on macOS has no associative
# arrays, so these are plain functions instead of a map)
SERVICES=(web server)

service_filter() {
  case "$1" in
    web) echo web ;;
    server) echo server ;;
    *) echo "unknown service: $1" >&2; exit 1 ;;
  esac
}

service_port() {
  case "$1" in
    web) echo 3001 ;;
    server) echo 3000 ;;
    *) echo "unknown service: $1" >&2; exit 1 ;;
  esac
}

ensure_runtime_dirs() {
  mkdir -p "$PID_DIR" "$LOG_DIR"
}

pid_file() {
  echo "$PID_DIR/$1.pid"
}

log_file() {
  echo "$LOG_DIR/$1.log"
}

# Prints the live PID for a service if its pidfile points at a running
# process, otherwise prints nothing and returns non-zero.
running_pid() {
  local pf
  pf="$(pid_file "$1")"
  if [[ -f "$pf" ]]; then
    local pid
    pid="$(cat "$pf")"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "$pid"
      return 0
    fi
  fi
  return 1
}

port_pid() {
  lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null | head -n1 || true
}

postgres_running() {
  docker compose -f "$ROOT_DIR/docker-compose.yml" ps postgres --status running --format '{{.Name}}' 2>/dev/null | grep -q .
}

dozzle_running() {
  docker compose -f "$ROOT_DIR/docker-compose.yml" ps dozzle --status running --format '{{.Name}}' 2>/dev/null | grep -q .
}
