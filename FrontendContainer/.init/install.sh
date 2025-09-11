#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
INIT_DIR="$WORKSPACE/.init"
SCRIPT="$INIT_DIR/install_deps.sh"
# ensure .init exists
mkdir -p "$INIT_DIR"
# write atomic installer (idempotent)
cat > "$SCRIPT" <<'INSTALLER'
#!/usr/bin/env bash
set -euo pipefail
# Minimal installer: perform deterministic install in WORKSPACE/app
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
APP_DIR="$WORKSPACE/app"
if [ ! -d "$APP_DIR" ]; then echo "error: app directory missing: $APP_DIR" >&2; exit 10; fi
cd "$APP_DIR"
# prefer npm ci when lockfile present
if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
  npm ci --no-audit --prefer-offline --no-fund --quiet
else
  npm i --no-audit --prefer-offline --no-fund --quiet
fi
# validate node_modules and binaries
if [ ! -d node_modules ]; then echo "error: node_modules missing" >&2; exit 12; fi
command -v node >/dev/null || (echo "node missing" >&2; exit 13)
command -v npm >/dev/null || (echo "npm missing" >&2; exit 14)
# check for common local binaries (not fatal if absent)
[ -x node_modules/.bin/react-scripts ] || true
[ -x node_modules/.bin/serve ] || true
: "installer complete"
INSTALLER
chmod +x "$SCRIPT"
# Provide the wrapper script that executes the installer in headless CI env
WRAPPER="$INIT_DIR/run_install_wrapper.sh"
cat > "$WRAPPER" <<'WR'
#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
SCRIPT="$WORKSPACE/.init/install_deps.sh"
if [ ! -x "$SCRIPT" ]; then echo "error: dependency installer missing; expected $SCRIPT" >&2; exit 11; fi
USE_TYPESCRIPT="${USE_TYPESCRIPT:-false}" CI=true BROWSER=none "$SCRIPT"
: "dependencies installed"
WR
chmod +x "$WRAPPER"
# Summary output
echo "written: $SCRIPT"
echo "wrapper: $WRAPPER"
