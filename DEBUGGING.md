# Debugging 404 assets and extension message-channel issues

This document explains how to reproduce and diagnose the two runtime errors shown in the screenshot:

- "Failed to load resource: the server responded with a status of 404 () main.tsx:1"
- "Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"

Quick checklist
- Ensure `vite.config.ts` `base` is set correctly for where the app will be hosted. For GitHub Pages under the `neurovault` repo, set `VITE_BASE='/neurovault/'` before building.
- Run `npm run build` and then `npx ts-node scripts/check-assets.ts --dist ./dist --index ./dist/index.html` to validate the build output contains all referenced assets.

Reproducing the 404 asset error
1. Build the site: `npm run build` (or set `VITE_BASE` and run `npm run build`).
2. Serve the `dist` folder (e.g., `npx serve dist`) at the expected base path.
3. Open the console — missing assets will show 404s. Run `npx ts-node scripts/check-assets.ts --dist ./dist` to see missing refs.

Reproducing the message-channel error (extension environment)
1. Use the `src/lib/messaging-safe.ts` helper when registering listeners in background/service-worker/content scripts.
2. Create a small harness (background script) that registers a listener returning `true` but never calling `sendResponse`. The helper prevents that and logs timeouts.

Testing messaging helper locally (Node + mock):
1. Run `node -e "require('./src/lib/messaging-safe.ts')"` (the module has no side-effects but you can import wrapper into tests).
2. Use the test `tests/messaging.test.ts` (run with vitest) to validate behavior.

Useful commands
```bash
# Build and check assets
npm run build
npx ts-node scripts/check-assets.ts --dist ./dist --index ./dist/index.html

# Run tests
npm run test
```

If you want me to add a CI job that runs `scripts/check-assets.ts` after build, I can add a small workflow step.
