#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
# Source profile so PORT/NODE_ENV are consistent
[ -f /etc/profile.d/vite_env.sh ] && source /etc/profile.d/vite_env.sh || true
PORT=${PORT:-5173}
NODE_ENV=${NODE_ENV:-production}
export PORT NODE_ENV
# Build step
if [ -x ./node_modules/.bin/vite ]; then
  ./node_modules/.bin/vite build
elif command -v npm >/dev/null 2>&1; then
  npm exec -- vite build
else
  echo "error: vite not available locally and npm not found" >&2
  exit 6
fi
# Ensure serve binary exists
if [ -x ./node_modules/.bin/serve ]; then
  SERVE_BIN="./node_modules/.bin/serve"
else
  echo "error: serve binary not found; please install 'serve' as a dev dependency" >&2
  exit 6
fi
LOGFILE="$WORKSPACE/serve.log"
# Start serve in a new process group so we can kill group later
setsid "$SERVE_BIN" -s dist -l "$PORT" >"$LOGFILE" 2>&1 &
SERVE_PID=$!
PGID=$(ps -o pgid= -p "$SERVE_PID" | tr -d ' ' || true)
# Ensure cleanup on exit
trap 'if [ -n """$PGID""" ]; then kill -TERM -"$PGID" >/dev/null 2>&1 || true; fi' EXIT INT TERM
# Health check with retries
RETRIES=12
SLEEP=1
OK=1
for i in $(seq 1 $RETRIES); do
  if curl --max-time 2 -sSf "http://localhost:$PORT/" >/dev/null 2>&1; then
    OK=0
    break
  fi
  sleep $SLEEP
done
# Clean shutdown
if [ -n "$PGID" ]; then
  kill -TERM -"$PGID" >/dev/null 2>&1 || true
fi
sleep 1
if [ $OK -eq 0 ]; then
  echo "validation: ok (http://localhost:$PORT/)"
  exit 0
else
  echo "validation: failed, see $LOGFILE" >&2
  # output last lines of logfile to aid debugging
  tail -n 200 "$LOGFILE" 2>/dev/null || true
  exit 6
fi
