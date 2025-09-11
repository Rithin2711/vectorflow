#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/vectorflow/FrontendContainer"
PROFILE="/etc/profile.d/frontend_env.sh"
# Minimal safe paths to ensure npm/global bins and system bins are available
SAFE_PATHS=("/usr/local/bin" "/usr/bin" "\$HOME/.npm-global/bin")
# Write an idempotent profile script that appends entries only when absent and exports NODE_ENV for interactive shells
sudo bash -c "cat > ${PROFILE} <<'EOF'
# FrontendContainer environment: append safe npm/bin locations and set NODE_ENV for interactive shells
# This script avoids embedding the current shell's PATH; it appends only if missing.
case ":\$PATH:" in
  *":/usr/local/bin:") ;; 
  *) PATH=\"\$PATH:/usr/local/bin\";;
esac
case ":\$PATH:" in
  *":/usr/bin:") ;; 
  *) PATH=\"\$PATH:/usr/bin\";;
esac
# Add user-local npm global bin if not present (literal $HOME expands at login)
case ":\$PATH:" in
  *":\$HOME/.npm-global/bin:") ;; 
  *) PATH=\"\$PATH:\$HOME/.npm-global/bin\";;
esac
# Export NODE_ENV only for interactive shells to avoid affecting non-interactive tooling
if [ -n "\"\${PS1-}\"" ] || [ -n "\"\${BASH_VERSION-}\"" ]; then
  export NODE_ENV=development
fi
export PATH
EOF
"
sudo chmod 644 "${PROFILE}"
[ -r "${PROFILE}" ] || (echo "failed to write ${PROFILE}" >&2 && exit 2)
# Validate runtimes present
command -v node >/dev/null 2>&1 || (echo 'node not found' >&2 && exit 3)
command -v npm >/dev/null 2>&1 || (echo 'npm not found' >&2 && exit 4)
NODE_V=$(node --version 2>/dev/null || echo "v0")
if [[ "${NODE_V#v}" =~ ^([0-9]+) ]] && [ ${BASH_REMATCH[1]:-0} -lt 18 ]; then
  echo "warning: node ${NODE_V} detected; Node 18+ recommended for React 18" >&2
fi
if ! command -v npx >/dev/null 2>&1; then
  echo "warning: npx not found; scaffolding may fallback to manual scaffold" >&2
fi
