#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
APPDIR="$WORKSPACE/app"
cd "$APPDIR"
# build if build script exists
if node -e 'try{process.chdir("'""$PWD"'"'"); const p=require("./package.json"); process.exit(p.scripts&&p.scripts.build?0:1);}catch(e){process.exit(1);}' >/dev/null 2>&1; then
  if command -v yarn >/dev/null 2>&1; then
    yarn build
  else
    npm run build
  fi
else
  echo "NO_BUILD_SCRIPT"
fi
