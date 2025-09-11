#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
APPDIR="$WORKSPACE/app"
cd "$APPDIR"
LOG=/tmp/frontend-setup.$$ ; : > "$LOG"

# detect Yarn Berry marker if written previously
YARN_BERRY=0
if [ -f /tmp/frontend_env.yarn.$$ ]; then
  # shellcheck disable=SC1090
  source /tmp/frontend_env.yarn.$$ || true
fi

# prefer yarn only if yarn v1; if yarn is Yarn Berry prefer npm
PM="npm"
if command -v yarn >/dev/null 2>&1; then
  # detect yarn version semver; yarn -v outputs e.g. 1.22.19 or 3.2.1
  YV=$(yarn -v 2>/dev/null || true)
  if [ -n "$YV" ]; then
    # Yarn v1 digits start with 1.
    case "$YV" in
      1.*) PM="yarn" ;;
      *) PM="npm" ;;
    esac
  fi
fi

# perform initial install lockfile-aware with logs
if [ "$PM" = "yarn" ]; then
  if [ -f yarn.lock ]; then
    yarn install --frozen-lockfile >>"$LOG" 2>&1 || { cat "$LOG" >&2; echo "ERR: yarn install failed" >&2; exit 14; }
  else
    yarn install >>"$LOG" 2>&1 || { cat "$LOG" >&2; echo "ERR: yarn install failed" >&2; exit 14; }
  fi
else
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund >>"$LOG" 2>&1 || { cat "$LOG" >&2; echo "ERR: npm ci failed" >&2; exit 14; }
  else
    npm i --no-audit --no-fund >>"$LOG" 2>&1 || { cat "$LOG" >&2; echo "ERR: npm install failed" >&2; exit 14; }
  fi
fi

[ -d node_modules ] || { cat "$LOG" >&2; echo "ERR: dependency install produced no node_modules" >&2; exit 14; }

# helper to check package.json for a package across dependencies/dev/optional/peer
pkg_present() {
  PKG="$1"
  node -e 'try{process.chdir("'$PWD'"); const p=require("./package.json"); const joined=Object.assign({},p.dependencies||{},p.devDependencies||{},p.optionalDependencies||{},p.peerDependencies||{}); if(joined["'$PKG'"]) process.exit(0); process.exit(1);}catch(e){process.exit(2);}' >/dev/null 2>&1 || return 1
  return 0
}

TO_ADD=()
pkg_present cross-env || TO_ADD+=("cross-env")
pkg_present jest || TO_ADD+=("jest")
pkg_present serve || TO_ADD+=("serve")

if [ ${#TO_ADD[@]} -gt 0 ]; then
  if [ "$PM" = "yarn" ]; then
    # yarn v1 add dev
    yarn add -D "${TO_ADD[@]}" >>"$LOG" 2>&1 || { cat "$LOG" >&2; echo "ERR: yarn add -D failed" >&2; exit 15; }
    # re-run frozen install if lockfile exists
    if [ -f yarn.lock ]; then yarn install --frozen-lockfile >>"$LOG" 2>&1 || { cat "$LOG" >&2; echo "ERR: yarn install after add failed" >&2; exit 16; }; else yarn install >>"$LOG" 2>&1 || { cat "$LOG" >&2; echo "ERR: yarn install after add failed" >&2; exit 16; }; fi
  else
    npm i --save-dev "${TO_ADD[@]}" --no-audit --no-fund >>"$LOG" 2>&1 || { cat "$LOG" >&2; echo "ERR: npm i --save-dev failed" >&2; exit 15; }
    if [ -f package-lock.json ]; then npm ci --no-audit --no-fund >>"$LOG" 2>&1 || { cat "$LOG" >&2; echo "ERR: npm ci after add failed" >&2; exit 16; }; fi
  fi
fi

# Verify local jest runnable: prefer npx --no-install (ensures local binary invoked)
if command -v npx >/dev/null 2>&1 && npx --no-install jest --version >/dev/null 2>&1; then
  echo "DEPS_OK"; exit 0
fi

# fallback to node_modules/.bin/jest
if [ -x node_modules/.bin/jest ]; then
  echo "DEPS_OK"; exit 0
fi

# last resort: print helpful diagnostics and fail
cat "$LOG" >&2
if command -v jest >/dev/null 2>&1; then
  echo "WARN: jest available globally but not installed locally; local tests expect local jest" >&2
fi
echo "ERR: jest not installed locally; see $LOG" >&2
exit 17
