#!/usr/bin/env bash
set -euo pipefail

# scripts/verify_release_artifacts.sh
# Download release artifacts from GitHub and run the local verifier.
# Usage: ./scripts/verify_release_artifacts.sh <owner> <repo> <tag>

OWNER=${1:-}
REPO=${2:-}
TAG=${3:-}

if [ -z "$OWNER" ] || [ -z "$REPO" ] || [ -z "$TAG" ]; then
  echo "Usage: $0 <owner> <repo> <tag>"; exit 2
fi

API="https://api.github.com/repos/$OWNER/$REPO/releases/tags/$TAG"
echo "Fetching release info from $API"
info=$(curl -sL "$API")
wasm_url=$(echo "$info" | jq -r '.assets[] | select(.name|test("\.wasm$")) | .browser_download_url')
sha_url=$(echo "$info" | jq -r '.assets[] | select(.name|test("\.sha256$")) | .browser_download_url')

if [ -z "$wasm_url" ]; then echo "WASM not found in release assets"; exit 1; fi
if [ -z "$sha_url" ]; then echo "SHA not found in release assets"; exit 1; fi

echo "Downloading wasm: $wasm_url"
curl -L -o /tmp/release_wasm.wasm "$wasm_url"
echo "Downloading sha: $sha_url"
curl -L -o /tmp/release_wasm.wasm.sha256 "$sha_url"

sha_expected=$(cat /tmp/release_wasm.wasm.sha256 | tr -d '\n' | awk '{print $1}')
echo "Expected SHA: $sha_expected"

node ./scripts/verify_wasm_fetch.js --local /tmp/release_wasm.wasm --sha $sha_expected || { echo "Verification failed"; exit 1; }

echo "Release artifacts verified successfully"
