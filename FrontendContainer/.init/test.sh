#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
cd "$WORKSPACE"
# Ensure App exists
[ -f src/App.js ] || (mkdir -p src && cat > src/App.js <<'JS'
import React from 'react';
export default function App(){ return <div>Test App</div> }
JS
)
mkdir -p src/__tests__
cat > src/__tests__/App.test.js <<'JS'
import React from 'react';
import { render } from '@testing-library/react';
import App from '../App';

test('renders without crashing', () => {
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
JS
# Detect react-scripts via package.json fields
HAS_REACT_SCRIPTS=$(node -e "try{const p=require('./package.json');const all=Object.assign({},p.dependencies||{},p.devDependencies||{});console.log(all['react-scripts']?1:0);}catch(e){console.log(0)}" 2>/dev/null || echo 0)
if [ "$HAS_REACT_SCRIPTS" -eq 1 ]; then
  # Ensure non-interactive CI flags
  npm test -- --watchAll=false --silent || (echo 'npm test failed' >&2 && exit 8)
else
  # Ensure local jest and jsdom present
  if [ -f jest.config.js ]; then
    :
  else
    cat > jest.config.js <<'JCFG'
module.exports = { testEnvironment: 'jsdom' };
JCFG
  fi
  if [ -x ./node_modules/.bin/jest ]; then
    NODE_ENV=development ./node_modules/.bin/jest --runInBand --colors=false || (echo 'jest tests failed' >&2 && exit 9)
  else
    echo 'no local jest binary present; refusing to run global jest' >&2
    exit 10
  fi
fi
