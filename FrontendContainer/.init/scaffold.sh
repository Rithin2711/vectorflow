#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
mkdir -p "$WORKSPACE" && cd "$WORKSPACE"
LOGDIR="$WORKSPACE/logs"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/scaffold.log"
# If package.json exists assume scaffold already done
if [ -f package.json ]; then echo "package.json exists, skipping scaffold" >"$LOG"; [ -f .pm ] || echo "npm" > .pm; exit 0; fi
# Determine package manager (prefer yarn when yarn.lock exists and yarn present)
PM="npm"
if command -v yarn >/dev/null 2>&1 && [ -f yarn.lock ]; then PM="yarn"; fi
[ -s .pm ] || echo "$PM" > .pm
# Scaffold into tempdir to avoid destructive replace
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
TARGET="$TMPDIR/project"
mkdir -p "$TARGET"
export CI=true
if command -v npx >/dev/null 2>&1; then
  set +e
  npx create-react-app@latest "$TARGET" --template cra-template --no-telemetry >"$LOG" 2>&1
  RC=$?
  set -e
  if [ $RC -ne 0 ]; then cat "$LOG" >&2 || true; echo "create-react-app failed, see $LOG" >&2; exit 5; fi
elif command -v create-react-app >/dev/null 2>&1; then
  set +e
  create-react-app "$TARGET" >"$LOG" 2>&1
  RC=$?
  set -e
  if [ $RC -ne 0 ]; then cat "$LOG" >&2 || true; echo "create-react-app (global) failed, see $LOG" >&2; exit 6; fi
else
  echo "npx/create-react-app not available" >&2; exit 7
fi
# Merge into workspace non-destructively
rsync -a --exclude node_modules --exclude .git --exclude logs "$TARGET/" "$WORKSPACE/" >>"$LOG" 2>&1
# Ensure package.json has required scripts and devDependencies
if [ -f package.json ]; then
  node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));p.scripts=p.scripts||{};p.scripts.start=p.scripts.start||'react-scripts start';p.scripts.build=p.scripts.build||'react-scripts build';p.scripts.test=p.scripts.test||'react-scripts test --watchAll=false';p.devDependencies=p.devDependencies||{};p.devDependencies['@testing-library/react']=p.devDependencies['@testing-library/react']||'^14.0.0';p.devDependencies['serve']=p.devDependencies['serve']||'^14.0.1';fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
else
  echo "package.json missing after scaffold" >&2; exit 8
fi
# Basic test file if missing
TEST_FILE="src/App.test.js"
if [ ! -f "$TEST_FILE" ]; then mkdir -p src; cat > "$TEST_FILE" <<'EOF'
import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('app renders without crashing', () => {
  render(<App />);
  expect(document.body).toBeTruthy();
});
EOF
fi
echo "scaffold completed: PM=$(cat .pm)" >>"$LOG"
exit 0
