#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
APPDIR="$WORKSPACE/app"
cd "$APPDIR"
PORT=${PORT:-3000}
OUT_DIR=""
if [ -d build ]; then OUT_DIR=build; elif [ -d dist ]; then OUT_DIR=dist; else echo "ERR: build output missing" >&2; exit 23; fi
# Use npx serve deterministically
START_CMD="npx serve -s \"$OUT_DIR\" -l $PORT"
LOG_START=/tmp/frontend-validate.start.$$.$(date +%s).log
setsid bash -lc "export PORT=$PORT; exec $START_CMD" >"$LOG_START" 2>&1 &
SPID=$!
# export PIDs for stop script
echo "$SPID" >/tmp/frontend-validate.start.$$.
sleep 1
if [ -z "$SPID" ] || ! kill -0 "$SPID" >/dev/null 2>&1; then echo "ERR: start failed" >&2; tail -n 200 "$LOG_START" >&2; exit 24; fi
PGID=$(ps -o pgid= -p "$SPID" | tr -d ' ')
echo "$PGID" >/tmp/frontend-validate.pgid.$$.
echo "STARTED PID=$SPID PGID=$PGID LOG=$LOG_START"
