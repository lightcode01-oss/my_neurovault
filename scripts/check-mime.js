// scripts/check-mime.js
// Checks MIME types of assets in dist/ or at a remote URL. Fails if any JS/CSS/WASM asset is served as application/octet-stream or missing Content-Type.
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const https = require('https');
const http = require('http');

function isUrl(str) {
  return /^https?:\/\//.test(str);
}

function getAssetsFromHtml(html) {
  const assetRegex = /<(script|link)[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const assets = [];
  let match;
  while ((match = assetRegex.exec(html))) {
    assets.push(match[2]);
  }
  return assets.filter(a => /\.(js|css|wasm)$/i.test(a));
}

function checkLocalMime(distDir) {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('[check-mime] dist/index.html not found.');
    process.exit(1);
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const assets = getAssetsFromHtml(html);
  let ok = true;
  for (const asset of assets) {
    const assetPath = path.join(distDir, asset.replace(/^\//, ''));
    if (!fs.existsSync(assetPath)) {
      console.error(`[check-mime] Asset not found: ${assetPath}`);
      ok = false;
      continue;
    }
    const type = mime.getType(assetPath);
    if (!type || type === 'application/octet-stream') {
      console.error(`[check-mime] Asset ${asset} has MIME type ${type}. Should be text/javascript, text/css, or application/wasm.`);
      ok = false;
    }
  }
  if (!ok) process.exit(2);
  console.log('[check-mime] All local assets have correct MIME types.');
}

function checkRemoteMime(siteUrl) {
  const indexUrl = siteUrl.replace(/\/$/, '') + '/index.html';
  (siteUrl.startsWith('https') ? https : http).get(indexUrl, res => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
      const assets = getAssetsFromHtml(html);
      let pending = assets.length;
      let ok = true;
      if (pending === 0) {
        console.log('[check-mime] No assets found in remote index.html.');
        process.exit(0);
      }
      assets.forEach(asset => {
        const assetUrl = siteUrl.replace(/\/$/, '') + asset;
        (assetUrl.startsWith('https') ? https : http).request(assetUrl, { method: 'HEAD' }, res2 => {
          const ct = res2.headers['content-type'];
          if (!ct || ct === 'application/octet-stream') {
            console.error(`[check-mime] Asset ${assetUrl} served with Content-Type: ${ct}. Should be text/javascript, text/css, or application/wasm.`);
            ok = false;
          }
          if (--pending === 0) {
            if (!ok) process.exit(2);
            console.log('[check-mime] All remote assets have correct MIME types.');
          }
        }).on('error', err => {
          console.error(`[check-mime] Error checking ${assetUrl}:`, err.message);
          ok = false;
          if (--pending === 0) process.exit(2);
        }).end();
      });
    });
  }).on('error', err => {
    console.error('[check-mime] Error fetching remote index.html:', err.message);
    process.exit(1);
  });
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/check-mime.js <dist-folder | site-url>');
  process.exit(1);
}
if (isUrl(arg)) checkRemoteMime(arg);
else checkLocalMime(arg);
