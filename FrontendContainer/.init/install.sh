#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
# Ensure package.json exists
[ -f package.json ] || { echo 'error: package.json missing, run scaffold first' >&2; exit 4; }
# Source profile to pick up PATH additions for local node bins if present
[ -f /etc/profile.d/vite_env.sh ] && source /etc/profile.d/vite_env.sh || true
# Run as invoking non-root user when possible: detect SUDO_USER or fall back to current user
INVOKING_USER=${SUDO_USER:-$(id -un)}
# Prefer npm unless yarn.lock exists and yarn binary present
PM=npm
if [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then PM=yarn; fi
# Use npm ci if lockfile exists and npm is chosen
if [ "$PM" = "npm" ] && [ -f package-lock.json ]; then
  # Run npm ci as the invoking user to avoid root-owned node_modules
  if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
    sudo -H -u "$INVOKING_USER" bash -c "npm ci --no-audit --no-fund --silent"
  else
    npm ci --no-audit --no-fund --silent
  fi
elif [ "$PM" = "yarn" ] && [ -f yarn.lock ]; then
  if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
    sudo -H -u "$INVOKING_USER" bash -c "yarn install --frozen-lockfile --silent"
  else
    yarn install --frozen-lockfile --silent
  fi
else
  # Ensure minimal runtime and dev deps exist in package.json; install missing deps only
  NEED_RUNTIME=(react react-dom vite)
  NEED_DEV=(typescript @types/react @types/react-dom vitest jsdom @testing-library/react @testing-library/jest-dom serve cross-env)
  MISSING_RUNTIME=()
  MISSING_DEV=()
  for d in "${NEED_RUNTIME[@]}"; do grep -q "\"$d\"" package.json || MISSING_RUNTIME+=("$d"); done
  for d in "${NEED_DEV[@]}"; do grep -q "\"$d\"" package.json || MISSING_DEV+=("$d"); done
  if [ ${#MISSING_RUNTIME[@]} -gt 0 ]; then
    if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
      sudo -H -u "$INVOKING_USER" bash -c "npm i --no-audit --no-fund --silent ${MISSING_RUNTIME[*]}"
    else
      npm i --no-audit --no-fund --silent "${MISSING_RUNTIME[@]}"
    fi
  fi
  if [ ${#MISSING_DEV[@]} -gt 0 ]; then
    if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
      sudo -H -u "$INVOKING_USER" bash -c "npm i -D --no-audit --no-fund --silent ${MISSING_DEV[*]}"
    else
      npm i -D --no-audit --no-fund --silent "${MISSING_DEV[@]}"
    fi
  fi
fi
# Verify local bins exist (prefer ./node_modules/.bin)
if [ -x ./node_modules/.bin/vite ]; then
  ./node_modules/.bin/vite --version >/dev/null 2>&1 || true
else
  echo "warning: vite not found in node_modules/.bin" >&2
fi
if [ -x ./node_modules/.bin/vitest ]; then
  ./node_modules/.bin/vitest --version >/dev/null 2>&1 || true
else
  echo "warning: vitest not found in node_modules/.bin" >&2
fi
# Log versions (numeric validation not enforced here; environment expected to have node>=18 and npm>=8)
NODE_VER=$(node -v 2>/dev/null || echo "unknown")
NPM_VER=$(npm -v 2>/dev/null || echo "unknown")
echo "node ${NODE_VER}"
echo "npm ${NPM_VER}"
# Ensure workspace ./node_modules/.bin is available in profile for future shells
if [ -d "$WORKSPACE/node_modules/.bin" ]; then
  PROFILE_FILE=/etc/profile.d/vite_env.sh
  BIN_EXPORT="export PATH=\"$WORKSPACE/node_modules/.bin:\$PATH\""
  if [ -w /etc/profile.d ] && ( ! [ -f "$PROFILE_FILE" ] || ! grep -Fq "$WORKSPACE/node_modules/.bin" "$PROFILE_FILE" ); then
    sudo bash -c "cat > $PROFILE_FILE <<'EOF'
# Vite workspace env: add project-local node bins
export NODE_ENV=development
export PORT=5173
$BIN_EXPORT
EOF
"
  fi
fi
