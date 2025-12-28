#!/usr/bin/env bash
set -euo pipefail

# scripts/release_check.sh
# Run a sequence of verification steps prior to releasing and promoting Stylus WASM.
# Supports --dry to run in simulation mode.

DRY=0
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --dry|--simulate) DRY=1; shift ;;
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

echo "=== NeuroVault Release Check ==="
echo "Dry run: ${DRY}" 

WASM_LOCAL=public/stylus/memory_registry.wasm

echo "1) Verify WASM artifact"
if [ -f "$WASM_LOCAL" ]; then
  node ./scripts/verify_wasm_fetch.js --local "$WASM_LOCAL" || { echo "WASM verification failed"; exit 1; }
else
  echo "WASM artifact not found at $WASM_LOCAL"; exit 1
fi

echo "2) Test deploy (dry-run) to STYLUS network using deploy-stylus.ts"
if [ "$DRY" -eq 1 ]; then
  npx ts-node contracts/stylus/deploy-stylus.ts --network ${STYLUS_NETWORK:-arbitrumSepolia} --wasm-path "$WASM_LOCAL" --dry-run || true
else
  echo "DRY mode disabled: running real deploy is not recommended from this script." 
  echo "Use contracts/stylus/deploy-stylus.ts manually with DEPLOYER_KEY set." 
fi

echo "3) Run smoke E2E tests (frontend + backend)"
if [ "$DRY" -eq 1 ]; then
  echo "Running frontend unit + vitest smoke" 
  npm run test:run || { echo "Frontend tests failed"; exit 1; }
  echo "Running backend pytest" 
  python -m pytest backend/tests/test_validation_flow.py -q || { echo "Backend tests failed"; exit 1; }
else
  echo "Skipping heavy tests in non-dry mode; run them manually if desired." 
fi

echo "4) Run indexer once (local)"
node ./infra/indexer.js --once --rpc ${RPC_URL:-http://localhost:8545} || true

echo "5) Run validator once in dry mode"
python ./backend/validators/validator.py --once --dry --backend ${VITE_BACKEND_URL:-http://localhost:8001} || true

echo "Release check complete. To promote to mainnet, run deploy-stylus.ts with --network arbitrumOne and set DEPLOYER_KEY and STYLUS_NODE_RPC in your environment."

if [ "$DRY" -eq 0 ]; then
  echo "!!! ACTION REQUIRED: You are not in dry-run mode. This script avoids mainnet promotion automatically."
fi

exit 0
