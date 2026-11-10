#!/usr/bin/env sh
# becomeStEngineer – Start unter Linux/macOS (Node.js 22.13 oder neuer)
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "Node.js fehlt (>= 22.13)"; exit 1; }
PORT="${PORT:-8080}" exec node server/server.js
