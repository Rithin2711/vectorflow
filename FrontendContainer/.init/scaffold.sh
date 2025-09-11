#!/usr/bin/env bash
set -euo pipefail
# Scaffolding script: create-vite via npx, fallback to global create-react-app
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
mkdir -p "$WORKSPACE" && cd "$WORKSPACE"
APPDIR="$WORKSPACE/app"
# verify node >=18 and package managers available
if ! command -v node >/dev/null 2>&1; then echo "ERR: node not found" >&2; exit 20; fi
NODE_VER=$(node -v | sed 's/v//')
NODE_MAJOR=${NODE_VER%%.*}
if [ "${NODE_MAJOR:-0}" -lt 18 ]; then echo "ERR: node >=18 required (found $NODE_VER)" >&2; exit 21; fi
# ensure npm present
if ! command -v npm >/dev/null 2>&1; then echo "ERR: npm not found" >&2; exit 22; fi
# write profile.d entry atomically to compute npm global bin at login (no PATH expansion)
PROFILE=/etc/profile.d/frontend_env.sh
TMP_PROFILE="/tmp/frontend_env.sh.$$"
echo "# runtime additions for frontend tooling" > "$TMP_PROFILE"
echo "# compute npm global bin at login without expanding current PATH" >> "$TMP_PROFILE"
echo 'if command -v npm >/dev/null 2>&1; then NG=$(npm bin -g 2>/dev/null || true); if [ -n "$NG" ]; then export PATH="$NG:$PATH"; fi; fi' >> "$TMP_PROFILE"
if sudo install -m 644 "$TMP_PROFILE" "$PROFILE"; then rm -f "$TMP_PROFILE"; else rm -f "$TMP_PROFILE"; echo "ERR: failed to write $PROFILE" >&2; exit 23; fi
# Idempotent check: if APPDIR/package.json exists and is a react app -> skip; if exists but not react -> fail
if [ -f "$APPDIR/package.json" ]; then
  if node -e 'try{process.chdir(process.argv[1]); const p=require("./package.json"); const hasReact=!!((p.dependencies&&p.dependencies.react)||(p.devDependencies&&p.devDependencies.react)); if(hasReact) process.exit(0); else process.exit(2);}catch(e){process.exit(1);}' "$APPDIR" >/dev/null 2>&1; then
    echo "SCAFFOLD_SKIP"; exit 0
  else
    echo "ERR: $APPDIR exists but is not a React app; remove or move it before scaffolding" >&2; exit 8
  fi
fi
# Attempt create with npx create-vite non-interactively
TMPNAME="tmp_vite_project_$$"
VITE_FAIL=0
if command -v npx >/dev/null 2>&1; then
  ( cd "$WORKSPACE" && npx --yes create-vite@latest "$TMPNAME" --template react ) || VITE_FAIL=1
else
  VITE_FAIL=1
fi
if [ "$VITE_FAIL" -eq 0 ] && [ -d "$WORKSPACE/$TMPNAME" ]; then
  mv "$WORKSPACE/$TMPNAME" "$APPDIR" || { echo "ERR: move scaffold failed" >&2; exit 9; }
else
  # offline fallback to global create-react-app if available
  if command -v create-react-app >/dev/null 2>&1; then
    CRA_TMP="tmp_cra_$$"
    ( cd "$WORKSPACE" && create-react-app "$CRA_TMP" ) || { echo "ERR: global create-react-app failed" >&2; exit 10; }
    mv "$WORKSPACE/$CRA_TMP" "$APPDIR" || { echo "ERR: move CRA failed" >&2; exit 11; }
  else
    echo "ERR: create-vite scaffold failed and no global create-react-app available" >&2; exit 12
  fi
fi
# final verification using node with APPDIR as cwd (validate scripts and react dependency)
node -e 'try{process.chdir(process.argv[1]); const p=require("./package.json"); if(!(p.scripts && (p.scripts.dev||p.scripts.start||p.scripts.build))){console.error("missing scripts"); process.exit(2);} if(!((p.dependencies&&p.dependencies.react)||(p.devDependencies&&p.devDependencies.react))){console.error("missing react"); process.exit(3);} process.exit(0);}catch(e){console.error(e.message); process.exit(4);}' "$APPDIR" >/dev/null 2>&1 || { echo "ERR: scaffold verification failed" >&2; exit 13; }
# success
echo "SCAFFOLD_OK"
