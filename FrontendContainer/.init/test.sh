#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
LOGDIR="$WORKSPACE/logs"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/test.log"
export CI=true
PM="$(cat "$WORKSPACE/.pm" 2>/dev/null || echo npm)"
# Run tests with a 90s timeout guard to prevent hangs
timeout=90
if [ "$PM" = "yarn" ] && command -v yarn >/dev/null 2>&1; then
  timeout "$timeout"s bash -c "yarn test --silent --watchAll=false" >"$LOG" 2>&1 || { echo "Tests failed or timed out, see $LOG" >&2; tail -n 200 "$LOG" >&2 || true; exit 30; }
else
  timeout "$timeout"s bash -c "npm run test -- --watchAll=false" >"$LOG" 2>&1 || { echo "Tests failed or timed out, see $LOG" >&2; tail -n 200 "$LOG" >&2 || true; exit 31; }
fi
exit 0
