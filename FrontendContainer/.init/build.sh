#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
[ -f package.json ] || (echo 'package.json missing' >&2 && exit 5)
NODE_ENV=production npm run build --silent || (echo 'production build failed' >&2 && exit 11)
[ -f build/index.html ] || (echo 'build output missing' >&2 && exit 12)
# provide brief evidence
du -sh build 2>/dev/null || true
head -n 5 build/index.html 2>/dev/null || true
