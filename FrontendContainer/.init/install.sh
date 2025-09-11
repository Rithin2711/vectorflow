#!/usr/bin/env bash
set -euo pipefail
# Deterministic install and ensure 'serve' available
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
LOGDIR="$WORKSPACE/logs"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/install.log"
: >"$LOG" # truncate log for fresh run
# determine package manager (recorded at .pm)
PM="$(cat "$WORKSPACE/.pm" 2>/dev/null || echo npm)"
USE_YARN=0
if [ "$PM" = "yarn" ] && command -v yarn >/dev/null 2>&1; then USE_YARN=1; fi
# Ensure package.json exists before attempting to mutate it
if [ -f package.json ]; then
  # Safely ensure serve devDependency present (avoid clobbering if package.json malformed)
  node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));
    p.devDependencies=p.devDependencies||{}; if(!p.devDependencies.serve){p.devDependencies.serve='^14.0.1'; fs.writeFileSync('package.json',JSON.stringify(p,null,2));}"
else
  echo "package.json not found in workspace; cannot ensure devDependencies" >>"$LOG"
  echo "package.json not found" >&2
  exit 21
fi
# Create lockfile if none exists
if [ ! -f package-lock.json ] && [ ! -f yarn.lock ]; then
  if [ $USE_YARN -eq 1 ]; then
    echo "Creating yarn.lock..." >>"$LOG"
    yarn install --non-interactive --silent >>"$LOG" 2>&1
  else
    echo "Creating package-lock.json..." >>"$LOG"
    npm i --package-lock-only --no-audit --no-fund >>"$LOG" 2>&1
  fi
fi
# Install with one retry (fail fast on network issues)
if [ $USE_YARN -eq 1 ]; then
  (yarn install --frozen-lockfile --non-interactive --silent >>"$LOG" 2>&1) || (sleep 2; yarn install --frozen-lockfile --non-interactive --silent >>"$LOG" 2>&1)
else
  if [ -f package-lock.json ]; then
    (npm ci --no-audit --no-fund --no-progress >>"$LOG" 2>&1) || (sleep 2; npm ci --no-audit --no-fund --no-progress >>"$LOG" 2>&1)
  else
    (npm i --no-audit --no-fund --no-progress >>"$LOG" 2>&1) || (sleep 2; npm i --no-audit --no-fund --no-progress >>"$LOG" 2>&1)
  fi
fi
# Helper: validate package exists either in node_modules or declared in package.json
validate_pkg() {
  pkg="$1"
  if [ -d "node_modules/$pkg" ] || [ -f "node_modules/$pkg/package.json" ]; then
    return 0
  fi
  node -e "const p=require('./package.json'); if(!((p.dependencies&&p.dependencies['$pkg'])||(p.devDependencies&&p.devDependencies['$pkg']))) process.exit(2);" >/dev/null 2>&1 || return 1
  return 0
}
for pkg in react react-dom react-scripts @testing-library/react; do
  if ! validate_pkg "$pkg"; then
    echo "Missing core package: $pkg" | tee >(cat >>"$LOG") >&2
    tail -n 200 "$LOG" >&2 || true
    exit 22
  fi
done
# Ensure static server available locally (node_modules/.bin/serve or http-server)
if [ -x "$WORKSPACE/node_modules/.bin/serve" ] || [ -x "$WORKSPACE/node_modules/.bin/http-server" ]; then
  true
else
  # try global
  if command -v serve >/dev/null 2>&1 || command -v http-server >/dev/null 2>&1; then
    true
  else
    # test npx reachability to fetch serve (fail fast if network blocked)
    if command -v npx >/dev/null 2>&1; then
      set +e
      npx --yes serve@latest --version >>"$LOG" 2>&1
      RC=$?
      set -e
      if [ $RC -ne 0 ]; then
        echo "serve not installed and npx cannot fetch serve (network may be blocked). Include 'serve' in package.json devDependencies or enable network." | tee >(cat >>"$LOG") >&2
        exit 23
      fi
    else
      echo "No serve/http-server locally and npx not available; cannot validate serving" | tee >(cat >>"$LOG") >&2
      exit 24
    fi
  fi
fi
# Final verification: ensure serve is actually installed into node_modules if declared as devDependency
# If package.json declares serve but node_modules/.bin/serve missing, treat as failure since network may be blocked
node -e "const p=require('./package.json'); if((p.devDependencies&&p.devDependencies.serve)||(p.dependencies&&p.dependencies.serve)){ process.exit(0);} else { process.exit(1);}"
RC_DECL=$?
if [ $RC_DECL -eq 0 ]; then
  if [ -x "$WORKSPACE/node_modules/.bin/serve" ]; then
    true
  elif [ -x "$WORKSPACE/node_modules/.bin/http-server" ]; then
    true
  else
    # serve declared but not installed
    echo "serve declared in package.json but not present in node_modules/.bin; network install likely failed" | tee >(cat >>"$LOG") >&2
    tail -n 200 "$LOG" >&2 || true
    exit 25
  fi
fi
# Success
echo "Dependencies installed and serve available" >>"$LOG"
exit 0
