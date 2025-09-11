#!/usr/bin/env bash
set -euo pipefail
# canonical scaffold script for Create React App (idempotent, supports npm/yarn, TypeScript)
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "${WORKSPACE}" || { echo "error: workspace not found: ${WORKSPACE}" >&2; exit 2; }
# env checks
NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
if [ -z "${NODE_MAJOR}" ] || [ "${NODE_MAJOR}" -lt 18 ]; then echo "error: Node >=18 required (found $(node -v))" >&2; exit 3; fi
command -v npm >/dev/null 2>&1 || { echo "error: npm not found" >&2; exit 4; }
command -v curl >/dev/null 2>&1 || { echo "error: curl not found" >&2; exit 5; }
command -v jq >/dev/null 2>&1 || sudo apt-get update -qq && sudo apt-get install -y -qq jq >/dev/null 2>&1 || { echo "error: failed to install jq" >&2; exit 6; }
# persist minimal CI headless env and PATH via /etc/profile.d (atomic write)
PROFILE_SH=/etc/profile.d/node_headless_env.sh
TMP=$(mktemp)
cat > "$TMP" <<'PROFILE'
# created by scaffold: ensure npm global and project bins are first in PATH and set CI/BROWSER for headless builds
export PATH="$(npm bin -g 2>/dev/null || echo /usr/local/bin):$PATH"
export CI=true
export BROWSER=none
PROFILE
sudo mv "$TMP" "$PROFILE_SH" && sudo chmod 0644 "$PROFILE_SH"
# scaffolding parameters
APP_NAME="app"
PACKAGE_MANAGER="${PACKAGE_MANAGER:-npm}"
USE_TYPESCRIPT="${USE_TYPESCRIPT:-false}"
FORCE_RECREATE="${FORCE_RECREATE:-false}"
# idempotency check
if [ -f "$WORKSPACE/$APP_NAME/package.json" ] && [ "$FORCE_RECREATE" != "true" ]; then
  RS_VER="unknown"
  RS_VER=$(node -e "try{const p=require(process.argv[1]);console.log((p.dependencies&&p.dependencies['react-scripts'])||(p.devDependencies&&p.devDependencies['react-scripts'])||'missing')}catch(e){console.log('missing')}" "$WORKSPACE/$APP_NAME/package.json" 2>/dev/null || true)
  LOCK="none"
  if [ -f "$WORKSPACE/$APP_NAME/package-lock.json" ]; then LOCK="npm"; elif [ -f "$WORKSPACE/$APP_NAME/yarn.lock" ]; then LOCK="yarn"; fi
  echo "scaffold: exists (react-scripts=$RS_VER lockfile=$LOCK); skipping"
  exit 0
fi
if [ "$FORCE_RECREATE" = "true" ]; then rm -rf "$WORKSPACE/$APP_NAME"; fi
# create app
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
  command -v yarn >/dev/null 2>&1 || { echo "error: yarn requested but not found" >&2; exit 7; }
  if [ "$USE_TYPESCRIPT" = "true" ]; then yarn create react-app "$APP_NAME" --template typescript --silent; else yarn create react-app "$APP_NAME" --silent; fi
  exit 0
fi
# prefer global create-react-app if present
if command -v create-react-app >/dev/null 2>&1; then
  if [ "$USE_TYPESCRIPT" = "true" ]; then create-react-app "$APP_NAME" --template typescript --use-npm --silent; else create-react-app "$APP_NAME" --use-npm --silent; fi
else
  ARGS=("create-react-app@latest" "--yes")
  if [ "$USE_TYPESCRIPT" = "true" ]; then ARGS+=("--template" "typescript"); fi
  ARGS+=("$APP_NAME" "--use-npm")
  ATTEMPTS=0; MAX=3
  until npx "${ARGS[@]}" >/dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -ge $MAX ]; then echo "error: npx create-react-app failed after $ATTEMPTS attempts" >&2; exit 8; fi
    sleep $((ATTEMPTS*2))
  done
fi
# safe package.json edits
cd "$WORKSPACE/$APP_NAME" || { echo "error: app dir missing after scaffold" >&2; exit 9; }
if [ -f package.json ]; then cp package.json package.json.bak; else echo "error: package.json missing after scaffolding" >&2; exit 10; fi
# Use Node to mutate package.json and inject headless scripts safely
node <<'NODE'
const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));
p.scripts=p.scripts||{};
if(!p.scripts.build) p.scripts.build='react-scripts build';
if(!p.scripts.start) p.scripts.start='serve -s build -l ${VALIDATION_PORT:-3000}';
fs.writeFileSync('package.json',JSON.stringify(p,null,2));
console.log('package.json patched');
NODE
# verify essentials
node -e "const p=require('./package.json'); if(!( (p.dependencies&&p.dependencies.react)||(p.devDependencies&&p.devDependencies.react) )){console.error('react missing'); process.exit(11);} if(!( (p.dependencies&&p.dependencies['react-dom'])||(p.devDependencies&&p.devDependencies['react-dom']) )){console.error('react-dom missing'); process.exit(12);} console.log('scaffold ok')"
: "scaffold complete"
