#!/usr/bin/env bash
set -euo pipefail
# Idempotent scaffold for Vite + React + TypeScript
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
mkdir -p "$WORKSPACE"
cd "$WORKSPACE"
# If no package.json and directory empty, initialize a Vite react-ts project non-interactively
if [ ! -f package.json ]; then
  if [ "$(ls -A | wc -l)" -eq 0 ]; then
    if command -v npm >/dev/null 2>&1; then
      # Try non-interactive form; fall back if --yes not supported
      npm init vite@latest . -- --template react-ts --yes >/dev/null 2>&1 || \
        npm init vite@latest . -- --template react-ts >/dev/null 2>&1
    else
      echo "error: npm not available to scaffold" >&2; exit 3
    fi
  else
    echo "package.json missing but workspace non-empty; creating minimal scaffold files" >&2
  fi
else
  echo "package.json exists; preserving project and creating missing scaffold files" >&2
fi
# Create minimal tsconfig.json if missing
if [ ! -f tsconfig.json ]; then cat > tsconfig.json <<'TS'
{
  "compilerOptions": {"target":"ES2020","lib":["DOM","ES2020"],"jsx":"react-jsx","module":"ESNext","moduleResolution":"Node","strict":true},
  "include":["src"]
}
TS
fi
mkdir -p src
if [ ! -f src/main.tsx ]; then cat > src/main.tsx <<'TS'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
createRoot(document.getElementById('root')!).render(<App />)
TS
fi
if [ ! -f src/App.tsx ]; then cat > src/App.tsx <<'TS'
import React from 'react'
export default function App(){return <div>Hello Vite+React+TS</div>}
TS
fi
if [ ! -f index.html ]; then cat > index.html <<'HTML'
<!doctype html>
<html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Vite App</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
HTML
fi
# Ensure package.json has minimal scripts; preserve existing fields
if [ -f package.json ]; then
  node -e "let fs=require('fs');let p=fs.existsSync('package.json')?require('./package.json'):{}; p.scripts=p.scripts||{}; if(!p.scripts.dev) p.scripts.dev='vite'; if(!p.scripts.build) p.scripts.build='vite build'; if(!p.scripts.serve) p.scripts.serve='serve -s dist -l $PORT'; if(!p.scripts.test) p.scripts.test='vitest --run --reporter=dot'; fs.writeFileSync('package.json',JSON.stringify(p,null,2))"
else
  cat > package.json <<'PJ'
{
  "name":"vite-react-ts-app",
  "version":"0.0.0",
  "private":true,
  "scripts":{"dev":"vite","build":"vite build","serve":"serve -s dist -l $PORT","test":"vitest --run --reporter=dot"}
}
PJ
fi
