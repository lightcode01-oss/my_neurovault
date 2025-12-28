#!/usr/bin/env bash
# Simple script to run local checks: start dev server and validate assets
set -euo pipefail

echo "Starting Vite dev server in background..."
npm run dev &
VITE_PID=$!

sleep 2
echo "Fetching index.html from dev server..."
curl -fsS http://localhost:5173/ -o /tmp/vite-index.html || { echo "Failed to fetch index.html from dev server"; kill $VITE_PID; exit 2; }

echo "Checking referenced assets in index.html"
node ./scripts/check-assets.ts --dist ./dist --index /tmp/vite-index.html || echo "check-assets reported issues";

echo "Stopping dev server"
kill $VITE_PID || true

echo "Done"
