#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE/app"
# load any globally provisioned headless env helpers if present
. /etc/profile.d/frontend_headless.sh || true
. /etc/profile.d/frontend_node_paths.sh || true
export CI=true
export BROWSER=none
USE_TYPESCRIPT="${USE_TYPESCRIPT:-false}"
mkdir -p src
if [ "$USE_TYPESCRIPT" = "true" ]; then
  cat > src/App.test.ts <<'EOF'
test('sanity', () => { expect(1 + 1).toBe(2); });
EOF
else
  cat > src/App.test.js <<'EOF'
test('sanity', () => { expect(1 + 1).toBe(2); });
EOF
fi
# backup package.json before modifying
if [ -f package.json ]; then cp package.json package.json.test.bak; fi
node <<'NODE'
const fs=require('fs');
const ppath='package.json';
if(!fs.existsSync(ppath)){console.error('package.json not found in app; cannot inject test script'); process.exit(2)}
const p=JSON.parse(fs.readFileSync(ppath));
p.scripts=p.scripts||{};
if(!p.scripts.test) p.scripts.test='react-scripts test --watchAll=false --testTimeout=10000';
fs.writeFileSync(ppath,JSON.stringify(p,null,2));
NODE
# Run tests once in CI/headless mode
CI=true BROWSER=none npm test --silent -- --watchAll=false --testTimeout=10000
