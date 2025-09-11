#!/usr/bin/env bash
set -euo pipefail
# Runs build, deterministic start, polls endpoint, captures first 1KB and HTTP status, then stops server
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
APPDIR="$WORKSPACE/app"
cd "$APPDIR"
PORT=${PORT:-3000}
RESP_FILE=/tmp/frontend-validate.$$.response
META_FILE="${RESP_FILE}.meta"
LOG=/tmp/frontend-validate.$$.log; : >"$LOG"
LOG_START=/tmp/frontend-validate.start.$$.log
# Build
if node -e 'try{process.chdir("'""$PWD"'"'"); const p=require("./package.json"); process.exit(p.scripts&&p.scripts.build?0:1);}catch(e){process.exit(1);}' >/dev/null 2>&1; then
  if command -v yarn >/dev/null 2>&1; then yarn build 2>"$LOG" || { echo "ERR: build failed" >&2; tail -n 200 "$LOG" >&2; exit 22; }; else npm run build 2>"$LOG" || { echo "ERR: build failed" >&2; tail -n 200 "$LOG" >&2; exit 22; }; fi
fi
# locate output
OUT_DIR=""
if [ -d build ]; then OUT_DIR=build; elif [ -d dist ]; then OUT_DIR=dist; fi
if [ -z "$OUT_DIR" ]; then echo "ERR: build output missing" >&2; exit 23; fi
# start server deterministically
START_CMD="npx serve -s \"$OUT_DIR\" -l $PORT"
setsid bash -lc "export PORT=$PORT; exec $START_CMD" >"$LOG_START" 2>&1 &
SPID=$!
sleep 1
if [ -z "$SPID" ] || ! kill -0 "$SPID" >/dev/null 2>&1; then echo "ERR: start failed" >&2; tail -n 200 "$LOG_START" >&2; exit 24; fi
PGID=$(ps -o pgid= -p "$SPID" | tr -d ' ')
TRIES=12
OK=0
for i in $(seq 1 $TRIES); do
  sleep 1
  HTTP_STATUS=$(curl -sS -o /tmp/frontend-validate.body.$$ -w "%{http_code}" --max-time 3 http://127.0.0.1:$PORT/ 2>/dev/null || echo 000)
  if [ "$HTTP_STATUS" != "000" ] && [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
    head -c 1024 /tmp/frontend-validate.body.$$ > "$RESP_FILE"
    echo "HTTP_STATUS=$HTTP_STATUS" > "$META_FILE"
    OK=1; break
  fi
  if [ "$i" -eq "$TRIES" ]; then echo "ERR: healthcheck failed (status=$HTTP_STATUS)" >&2; tail -n 200 "$LOG_START" >&2; kill -TERM -"${PGID}" >/dev/null 2>&1 || true; exit 25; fi
done
# stop server cleanly
kill -TERM -"${PGID}" >/dev/null 2>&1 || true
sleep 1
if kill -0 "$SPID" >/dev/null 2>&1; then kill -KILL -"${PGID}" >/dev/null 2>&1 || true; fi
if [ "$OK" -ne 1 ]; then echo "ERR: validation failed" >&2; exit 26; fi
echo "VALIDATION_OK"
# evidence files
echo "evidence_files:$RESP_FILE,$META_FILE,$LOG_START"
