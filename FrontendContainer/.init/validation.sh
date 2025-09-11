#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
PIDFILE="${WORKSPACE}/.frontend_server.pid"
PGIDFILE="${WORKSPACE}/.frontend_server.pgid"
cleanup() {
  if [ -f "$PGIDFILE" ]; then
    PGID=$(cat "$PGIDFILE") || PGID=""
    if [ -n "$PGID" ]; then
      kill -- -${PGID} >/dev/null 2>&1 || true
    fi
  fi
  rm -f "$PIDFILE" "$PGIDFILE" || true
}
trap cleanup EXIT INT TERM
HAS_REACT_SCRIPTS=$(node -e "try{const p=require('./package.json');const all=Object.assign({},p.dependencies||{},p.devDependencies||{});console.log(all['react-scripts']?1:0);}catch(e){console.log(0)}" 2>/dev/null || echo 0)
if [ "$HAS_REACT_SCRIPTS" -eq 1 ]; then
  PORT=3000 BROWSER=none setsid sh -c 'PORT=3000 BROWSER=none npm run start' >/dev/null 2>&1 &
  PID=$!; echo "$PID" >"$PIDFILE"; PGID=$(ps -o pgid= -p "$PID" | tr -d ' ')
  echo "${PGID}" >"$PGIDFILE"
  i=0; MAX_WAIT=40; sleep 1
  until curl -sSf --max-time 3 http://127.0.0.1:3000/ >/dev/null 2>&1 || [ $i -ge $MAX_WAIT ]; do i=$((i+1)); sleep 1; done
  if [ $i -ge $MAX_WAIT ]; then
    echo 'dev server did not start in time; showing last 200 lines of possible logs' >&2
    ps -ef | grep -E 'react-scripts|node' | sed -n '1,200p' >&2 || true
    exit 13
  fi
  cleanup
else
  echo 'dev-server validation skipped (no react-scripts present)'
fi
[ -d build ] || (echo 'build directory missing; run build step first' >&2 && exit 14)
if command -v serve >/dev/null 2>&1; then
  setsid sh -c 'serve -s build -l 3000' >/dev/null 2>&1 &
  PID=$!; echo "$PID" >"$PIDFILE"; PGID=$(ps -o pgid= -p "$PID" | tr -d ' ')
  echo "${PGID}" >"$PGIDFILE"
else
  if npm view serve >/dev/null 2>&1; then
    npm i --no-save serve --silent >/dev/null 2>&1
    setsid sh -c './node_modules/.bin/serve -s build -l 3000' >/dev/null 2>&1 &
    PID=$!; echo "$PID" >"$PIDFILE"; PGID=$(ps -o pgid= -p "$PID" | tr -d ' ')
    echo "${PGID}" >"$PGIDFILE"
  else
    setsid sh -c 'python3 -m http.server 3000 -d build' >/dev/null 2>&1 &
    PID=$!; echo "$PID" >"$PIDFILE"; PGID=$(ps -o pgid= -p "$PID" | tr -d ' ')
    echo "${PGID}" >"$PGIDFILE"
    echo 'note: python3 http.server does not provide SPA fallback; use "serve" for SPA routing' >&2
  fi
fi
i=0; MAX_WAIT=20
until curl -sSf --max-time 3 http://127.0.0.1:3000/ >/dev/null 2>&1 || [ $i -ge $MAX_WAIT ]; do i=$((i+1)); sleep 1; done
if [ $i -ge $MAX_WAIT ]; then
  echo 'validation probe failed after retries' >&2
  ps -ef | grep -E 'serve|http.server|node' | sed -n '1,200p' >&2 || true
  exit 15
fi
 du -sh build 2>/dev/null || true
 head -n 20 build/index.html 2>/dev/null || true
# cleanup handled by trap
