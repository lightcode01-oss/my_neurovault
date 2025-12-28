#!/usr/bin/env node
// Thin wrapper to run the TypeScript asset checker without requiring the user to run ts-node explicitly.
try {
  // Attempt to require ts-node/register
  require('ts-node/register');
} catch (e) {
  console.error('ts-node not found. Install with `npm i -D ts-node` or run `npx ts-node scripts/check-assets.ts`');
  process.exit(1);
}

require('./check-assets.ts');
