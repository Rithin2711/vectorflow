#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
ARTIFACTS="$WORKSPACE/.setup_artifacts"
cd "$WORKSPACE"
[ -f package.json ] || { echo 'package.json not found in workspace' >&2; exit 2; }
mkdir -p "$ARTIFACTS"
cp package.json "$ARTIFACTS/package.json.bak"

# Install testing libs locally with a single retry; keep package.json backup to restore on failure
npm i --save-dev @testing-library/react@latest @testing-library/jest-dom@latest --silent || (
  sleep 2 && npm i --save-dev @testing-library/react@latest @testing-library/jest-dom@latest --silent
) || {
  echo 'npm install failed' >&2
  echo 'leaving backup at .setup_artifacts/package.json.bak for recovery' >&2
  exit 3
}

# Conditionally set test script to use react-scripts test so npm test will pick up project-local jest
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json')); p.scripts=p.scripts||{}; const cur=p.scripts.test||''; const placeholder=/^\s*(echo\s+\"?placeholder\"?|true|exit\s+0)\s*$/i; if(!cur|| placeholder.test(cur) || cur.match(/react-scripts test/)===null){ p.scripts.test='react-scripts test --watchAll=false'; fs.writeFileSync('package.json', JSON.stringify(p,null,2)); }"

# Verify devDependencies were recorded in package.json
node -e "const p=require('./package.json'); if(!(p.devDependencies && (p.devDependencies['@testing-library/react'] || p.devDependencies['@testing-library/react']===''))){ console.error('testing-libs-missing'); process.exit(4);} console.log('devdeps-ok');"

# On success, remove backup
rm -f "$ARTIFACTS/package.json.bak" || true

exit 0
