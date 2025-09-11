#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
# Source profile explicitly to pick up NODE_ENV/PORT and local bin path
[ -f /etc/profile.d/vite_env.sh ] && source /etc/profile.d/vite_env.sh || true
PORT=${PORT:-5173}
NODE_ENV=${NODE_ENV:-production}
export PORT NODE_ENV
# Prefer project-local serve binary
if [ -x ./node_modules/.bin/serve ]; then
  SERVE_BIN="./node_modules/.bin/serve"
else
  echo "error: serve binary not found; please install 'serve' as a dev dependency" >&2
  exit 6
fi
LOGFILE="$WORKSPACE/serve.log"
# Start serve in its own process group (setsid) so we can kill the group later
setsid "$SERVE_BIN" -s dist -l "$PORT" >"$LOGFILE" 2>&1 &
SERVE_PID=$!
# Record PGID for cleanup
PGID=$(ps -o pgid= -p "$SERVE_PID" | tr -d ' ' || true)
# Persist PGID and PID for stop script
echo "$SERVE_PID" > "$WORKSPACE/serve.pid"
echo "$PGID" > "$WORKSPACE/serve.pgid"
# Provide quick readiness check: wait a short moment
sleep 0.5
