// scripts/postbuild-fix.js
// Ensures dist/index.html references built JS assets, not .ts/.tsx. Copies index.html to 404.html for SPA fallback.
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');

function abort(msg) {
  console.error('[postbuild-fix] ERROR:', msg);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) abort('dist/index.html not found. Did you run vite build?');
let html = fs.readFileSync(indexPath, 'utf8');

const tsImportRegex = /<script[^>]*src=["']([^"']+\.tsx?)["'][^>]*><\/script>/gi;
let foundTsImport = false;
html = html.replace(tsImportRegex, (match, src) => {
  foundTsImport = true;
  return `<!-- ERROR: Found reference to ${src} in dist/index.html. Did you forget to run vite build? -->`;
});

if (foundTsImport) abort('Found reference to .ts/.tsx in dist/index.html — aborting: did you forget to run vite build?');

// Copy index.html to 404.html for SPA fallback
fs.copyFileSync(indexPath, fallbackPath);
console.log('[postbuild-fix] Copied dist/index.html to dist/404.html for SPA fallback.');
