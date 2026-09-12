#!/usr/bin/env bash
# Tails dev server logs. Usage: scripts/logs.sh [web|server]
# With no argument, tails both interleaved.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/dev-common.sh
source "$SCRIPT_DIR/lib/dev-common.sh"

target="${1:-}"

ensure_runtime_dirs

if [[ -n "$target" ]]; then
  if [[ "$target" != "web" && "$target" != "server" ]]; then
    echo "usage: $0 [web|server]" >&2
    exit 1
  fi
  touch "$(log_file "$target")"
  exec tail -n 100 -f "$(log_file "$target")"
fi

touch "$(log_file web)" "$(log_file server)"
exec tail -n 50 -f "$(log_file web)" "$(log_file server)"
