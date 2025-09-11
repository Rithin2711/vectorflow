#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
# Source profile so PORT/NODE_ENV are consistent
[ -f /etc/profile.d/vite_env.sh ] && source /etc/profile.d/vite_env.sh || true
# Default NODE_ENV to production for build
NODE_ENV=${NODE_ENV:-production}
export NODE_ENV
# Use local vite if available, else npm exec -- vite build, else fail
if [ -x ./node_modules/.bin/vite ]; then
  ./node_modules/.bin/vite build
elif command -v npm >/dev/null 2>&1; then
  npm exec -- vite build
else
  echo "error: vite not available locally and npm not found" >&2
  exit 6
fi
