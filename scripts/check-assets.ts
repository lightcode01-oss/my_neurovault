#!/usr/bin/env ts-node
/*
  scripts/check-assets.ts

  Scans `index.html` and the `dist` directory to ensure referenced assets exist.
  Run with: `npx ts-node scripts/check-assets.ts --dist ./dist --index ./dist/index.html`
  (In CI you can run after `npm run build` to catch incorrect base issues.)
*/

import fs from 'fs';
import path from 'path';

function usage() {
  console.log('Usage: ts-node scripts/check-assets.ts --dist <dist-dir> [--index <index-file>]');
}

const args = process.argv.slice(2);
const opts: Record<string, string> = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : '';
    opts[key] = val;
  }
}

const dist = path.resolve(process.cwd(), opts.dist || 'dist');
const indexFile = path.resolve(process.cwd(), opts.index || path.join(dist, 'index.html'));

if (!fs.existsSync(indexFile)) {
  console.error(`Index file not found: ${indexFile}`);
  process.exit(2);
}

const indexHtml = fs.readFileSync(indexFile, 'utf8');

// Very small regexes to find script and link tags
const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi;

function checkPath(p: string) {
  // Make path relative to dist when it looks like an absolute or relative URL
  // Remove query params
  const clean = p.split('?')[0];
  const resolved = clean.startsWith('/') ? path.join(dist, clean.replace(/^\//, '')) : path.join(path.dirname(indexFile), clean);
  if (!fs.existsSync(resolved)) {
    console.error(`Missing file referenced in index: ${p} -> resolved ${resolved}`);
    return false;
  }
  return true;
}

let ok = true;
let m: RegExpExecArray | null;

while ((m = scriptRegex.exec(indexHtml))) {
  const asset = m[1];
  if (!checkPath(asset)) ok = false;
}

while ((m = linkRegex.exec(indexHtml))) {
  const asset = m[1];
  if (!checkPath(asset)) ok = false;
}

if (!ok) {
  console.error('\nOne or more referenced assets are missing from the build output.');
  console.error('Common cause: incorrect `base` in vite.config.ts (use VITE_BASE or set base to the repo path).');
  console.error('Example: set `VITE_BASE=\'/neurovault/\'` and rebuild.');
  process.exit(3);
}

console.log('All referenced assets present in', dist);
process.exit(0);
