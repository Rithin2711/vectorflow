#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
for f in src public package.json yarn.lock package-lock.json; do
  if [ -e "$f" ]; then echo "workspace not empty or contains project files: $f" >&2; exit 2; fi
done
# Prefer global create-react-app, but fall back to pinned npx if global is unusable
if command -v create-react-app >/dev/null 2>&1; then
  if create-react-app --version >/dev/null 2>&1; then
    CREATE_CMD=(create-react-app "$WORKSPACE" --use-npm --no-install)
  else
    CREATE_CMD=(npx create-react-app@5.0.1 "$WORKSPACE" --use-npm --no-install)
  fi
else
  CREATE_CMD=(npx create-react-app@5.0.1 "$WORKSPACE" --use-npm --no-install)
fi
export CI=true
# Run create command; prefer not to run as root/global to avoid permission issues
if "${CREATE_CMD[@]}"; then
  :
else
  echo "create-react-app failed; falling back to pinned npx" >&2
  npx create-react-app@5.0.1 "$WORKSPACE" --use-npm --no-install || { echo 'create-react-app failed' >&2; exit 3; }
fi
# Ensure workspace has package.json (CRA created it)
if [ ! -f "$WORKSPACE/package.json" ]; then echo "package.json not found after scaffold" >&2; exit 6; fi
# Install deps: prefer npm ci when lockfile exists, else npm i. Add a brief retry for transient network issues.
cd "$WORKSPACE"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund --silent || (sleep 2 && npm ci --no-audit --no-fund --silent) || { echo 'npm ci failed' >&2; exit 4; }
else
  npm i --no-audit --no-fund --silent || (sleep 2 && npm i --no-audit --no-fund --silent) || { echo 'npm install failed' >&2; exit 5; }
fi
# Add headless .env non-destructively
if [ -f .env ]; then ENV_TARGET='.env.local'; else ENV_TARGET='.env'; fi
cat >> "$ENV_TARGET" <<'EOF'
# Headless dev env (added by scaffold)
BROWSER=none
HOST=127.0.0.1
PORT=3000
FAST_REFRESH=true
EOF
# Verify essentials exist in package.json
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json')); if(!(p.dependencies&&p.dependencies.react&&p.dependencies['react-dom'])){console.error('missing-deps'); process.exit(6);} console.log('scaffold-ok');"
