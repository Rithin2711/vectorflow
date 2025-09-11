#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
[ -f package.json ] || (echo 'package.json missing' >&2 && exit 5)
# helper to check package presence in package.json or via npm ls
has_pkg() { node -e "try{const p=require('./package.json');const all=Object.assign({},p.dependencies||{},p.devDependencies||{});console.log(Boolean(all['$1'])?1:0)}catch(e){console.log(0)}" 2>/dev/null || echo 0; }
MISSING_LIST=()
if [ "$(node -e "try{const p=require('./package.json');const all=Object.assign({},p.dependencies||{},p.devDependencies||{});console.log(all['jest']?1:0)}catch(e){console.log(0)}")" -eq 0 ]; then
  MISSING_LIST+=(jest@^29)
fi
if [ "$(node -e "try{const p=require('./package.json');const all=Object.assign({},p.dependencies||{},p.devDependencies||{});console.log(all['jsdom']?1:0)}catch(e){console.log(0)}")" -eq 0 ]; then
  MISSING_LIST+=(jsdom@^21)
fi
if [ "$(node -e "try{const p=require('./package.json');const all=Object.assign({},p.dependencies||{},p.devDependencies||{});console.log(all['@testing-library/react']?1:0)}catch(e){console.log(0)}")" -eq 0 ]; then
  MISSING_LIST+=("@testing-library/react@^14")
fi
if [ -f tsconfig.json ]; then
  if [ "$(node -e "try{const p=require('./package.json');const all=Object.assign({},p.dependencies||{},p.devDependencies||{});console.log(all['typescript']?1:0)}catch(e){console.log(0)}")" -eq 0 ]; then
    MISSING_LIST+=(typescript @types/react @types/react-dom)
  fi
fi
if [ ${#MISSING_LIST[@]} -gt 0 ]; then
  npm i --save-dev --no-audit --no-fund ${MISSING_LIST[@]} --silent || (echo 'devDependencies install failed' >&2 && exit 6)
fi
# Print verification info
node --version || true
npm --version || true
if [ -x ./node_modules/.bin/jest ]; then
  ./node_modules/.bin/jest --version || true
fi
# Ensure node_modules exists
[ -d node_modules ] || (echo 'node_modules missing after deps install' >&2 && exit 7)
