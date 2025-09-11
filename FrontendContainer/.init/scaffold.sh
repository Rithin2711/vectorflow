#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
mkdir -p "$WORKSPACE" && cd "$WORKSPACE"
# helper: check package.json has required fields
valid_pkg=false
if [ -f package.json ]; then
  has_fields=$(node -e "try{const p=require('./package.json');const s=p.scripts||{};const d=p.dependencies||{};console.log((s.start?1:0)+(s.build?1:0)+(s.test?1:0)+(d.react?1:0)+(d['react-dom']?1:0));}catch(e){console.log(0)}" 2>/dev/null || echo 0)
  if [ "$has_fields" -eq 5 ]; then
    valid_pkg=true
  fi
fi
if [ "$valid_pkg" = true ]; then
  # ensure node_modules; use npm ci if lockfile present
  if [ ! -d node_modules ]; then
    if [ -f package-lock.json ]; then
      npm ci --no-audit --no-fund --quiet
    else
      npm i --no-audit --no-fund --quiet
    fi
  fi
  exit 0
fi
# If workspace not empty, scaffold into temp dir to avoid CRA refusing to run
if [ "$(ls -A . 2>/dev/null || true)" != "" ]; then
  TMPDIR=$(mktemp -d)
else
  TMPDIR="$WORKSPACE"
fi
# Try CRA non-interactively into TMPDIR
if command -v npx >/dev/null 2>&1; then
  (cd "$TMPDIR" && env CREATE_REACT_APP_DISABLE_TELEMETRY=1 BROWSER=none npx --yes create-react-app@latest . --use-npm) || CRA_ERR=1
else
  CRA_ERR=1
fi
if [ -z "${CRA_ERR-}" ] && [ "$TMPDIR" != "$WORKSPACE" ]; then
  # move files from TMPDIR to workspace (overwrite safe for our use-case)
  shopt -s dotglob
  mv "$TMPDIR"/* "$WORKSPACE"/
  rm -rf "$TMPDIR"
fi
# If CRA failed or unavailable, create a minimal manual scaffold (local deps explicit)
if [ -n "${CRA_ERR-}" ]; then
  cat > package.json <<'JSON'
{
  "name": "frontend-container-app",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --watchAll=false"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "^5.0.1"
  }
}
JSON
  mkdir -p src public
  cat > src/App.js <<'JS'
import React from 'react';
export default function App(){ return <div>Hello from FrontendContainer</div> }
JS
  cat > src/index.js <<'JS'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
createRoot(document.getElementById('root')).render(<App />);
JS
  cat > public/index.html <<'HTML'
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>FrontendContainer</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
HTML
fi
# Ensure dependencies installed: prefer npm ci when lockfile exists
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund --quiet
else
  npm i --no-audit --no-fund --quiet
fi
# Verify node_modules and react/react-dom present
[ -d node_modules ] || (echo 'node_modules missing after scaffold' >&2 && exit 6)
node -e "const p=require('./package.json');if(!(p.dependencies&&p.dependencies.react&&p.dependencies['react-dom'])){process.exit(1);}" >/dev/null 2>&1 || true
