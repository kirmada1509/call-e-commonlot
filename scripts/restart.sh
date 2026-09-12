#!/usr/bin/env bash
# Restarts the web/server dev servers (and optionally postgres).
# Usage: scripts/restart.sh [--all|--db]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$SCRIPT_DIR/stop.sh" "$@"
bash "$SCRIPT_DIR/start.sh"
