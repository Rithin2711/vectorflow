#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
[ -f package.json ] || { echo 'error: package.json missing, run scaffold first' >&2; exit 4; }
[ -f /etc/profile.d/vite_env.sh ] && source /etc/profile.d/vite_env.sh || true
PM=npm
if [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then PM=yarn; fi
if [ "$PM" = "npm" ] && [ -f package-lock.json ]; then
  sudo -u "${SUDO_USER:-$(whoami)}" bash -c 'npm ci --no-audit --no-fund'
elif [ "$PM" = "yarn" ] && [ -f yarn.lock ]; then
  yarn install --frozen-lockfile --silent
else
  NEED_RUNTIME=(react react-dom vite)
  NEED_DEV=(typescript @types/react @types/react-dom vitest jsdom @testing-library/react @testing-library/jest-dom serve cross-env)
  MISSING_RUNTIME=()
  MISSING_DEV=()
  for d in "${NEED_RUNTIME[@]}"; do grep -q "\"$d\"" package.json || MISSING_RUNTIME+=("$d"); done
  for d in "${NEED_DEV[@]}"; do grep -q "\"$d\"" package.json || MISSING_DEV+=("$d"); done
  if [ ${#MISSING_RUNTIME[@]} -gt 0 ]; then sudo -u "${SUDO_USER:-$(whoami)}" bash -c "npm i --no-audit --no-fund ${MISSING_RUNTIME[*]}"; fi
  if [ ${#MISSING_DEV[@]} -gt 0 ]; then sudo -u "${SUDO_USER:-$(whoami)}" bash -c "npm i -D --no-audit --no-fund ${MISSING_DEV[*]}"; fi
fi
if [ -x ./node_modules/.bin/vite ]; then ./node_modules/.bin/vite --version >/dev/null 2>&1 || true; else echo "warning: vite not found in node_modules/.bin" >&2; fi
if [ -x ./node_modules/.bin/vitest ]; then ./node_modules/.bin/vitest --version >/dev/null 2>&1 || true; else echo "warning: vitest not found in node_modules/.bin" >&2; fi
node -e "console.log('node',process.versions.node)"
npm -v || true
