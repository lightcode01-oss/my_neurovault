#!/usr/bin/env node
"use strict";
/**
 * Usage:
 *  node scripts/fetch_wasm.js --url <url> --out <path> [--sha <sha>]
 *  node scripts/fetch_wasm.js --local <path> --out <path>
 *
 * Fetches a wasm file, validates SHA256 (if provided), and writes to `--out`.
 * Exits with non-zero code on failure and prints helpful error messages.
 *
 * Deterministic behavior: if neither URL nor local provided, exits with error.
 *
 * TODO: add retries, timeout, and HTTP auth for private artifacts.
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--url') out.url = args[++i];
    else if (a === '--local') out.local = args[++i];
    else if (a === '--out') out.out = args[++i];
    else if (a === '--sha') out.sha = args[++i];
    else { console.error('Unknown arg', a); process.exit(2); }
  }
  return out;
}

async function fetchUrl(url) {
  if (typeof fetch !== 'undefined') {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return Buffer.from(await res.arrayBuffer());
  }
  // Node <18 fallback
  return new Promise((resolve, reject) => {
    const http = url.startsWith('https') ? require('https') : require('http');
    http.get(url, (res) => {
      if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function main() {
  const { url, local, out, sha } = parseArgs();
  if (!out) { console.error('Missing --out'); process.exit(2); }

  try {
    let data;
    if (url) {
      console.log(`Fetching wasm from URL: ${url}`);
      data = await fetchUrl(url);
    } else if (local) {
      console.log(`Reading local wasm file: ${local}`);
      data = fs.readFileSync(local);
    } else {
      console.error('Provide --url or --local');
      process.exit(2);
    }

    if (sha) {
      const actual = sha256(data);
      if (actual !== sha) {
        console.error(`SHA mismatch: expected ${sha} actual ${actual}`);
        process.exit(3);
      }
      console.log('SHA256 verified');
    }

    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, data);
    console.log(`WASM written to ${out}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to fetch wasm:', err.message || err);
    process.exit(4);
  }
}

if (require.main === module) main();

// TODO: Add TLS pinning and authenticated fetch for private artifacts.#!/usr/bin/env node
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

function usage() {
  console.error('Usage: node fetch_wasm.js --url <wasm-url> --out <path> [--sha <sha256>] [--local <path>]');
  process.exit(2);
}

const argv = require('minimist')(process.argv.slice(2));

if (!argv.url && !argv.local) usage();
if (!argv.out) usage();

async function download(url, dest) {
  const proto = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = proto.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} when downloading ${url}`));
      }
      const fileStream = fs.createWriteStream(dest);
      streamPipeline(res, fileStream).then(resolve).catch(reject);
    });
    req.on('error', reject);
  });
}

async function copyLocal(src, dest) {
  await fs.promises.copyFile(src, dest);
}

function sha256OfFile(path) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(path);
  hash.update(data);
  return hash.digest('hex');
}

(async () => {
  try {
    const out = argv.out;
    if (argv.local) {
      console.log(`Copying local wasm ${argv.local} -> ${out}`);
      await copyLocal(argv.local, out);
    } else {
      console.log(`Downloading wasm from ${argv.url} -> ${out}`);
      await download(argv.url, out);
    }

    if (argv.sha) {
      const actual = sha256OfFile(out);
      if (actual !== argv.sha.toLowerCase()) {
        console.error(`SHA256 mismatch: expected ${argv.sha}, got ${actual}`);
        process.exit(3);
      }
      console.log('SHA256 verified');
    }

    console.log('WASM fetch complete');
    process.exit(0);
  } catch (err) {
    console.error('Error fetching wasm:', err.message || err);
    process.exit(1);
  }
})();
