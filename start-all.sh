#!/bin/bash
# start-all.sh
# Autostart Vite frontend, Hardhat backend, and any other servers (cross-platform)

# Start Vite frontend
echo "Starting Vite frontend..."
npm run dev &

# Start Hardhat backend
echo "Starting Hardhat backend..."
npm run dev:node &

# Add more servers as needed, e.g.:
# echo "Starting API server..."
# npm run backend:api &
# echo "Starting worker..."
# npm run backend:worker &

echo "All servers started in background."
wait
