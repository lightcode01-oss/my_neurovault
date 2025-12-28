#!/usr/bin/env node
"use strict";
/**
 * WASM Artifact Verification Tool
 *
 * Verifies WASM artifact integrity via SHA256 and tests instantiation.
 * Calls exported `wasm_test_ping()` function expecting magic number 0xF00DBABE.
 *
 * Usage:
 *  node scripts/verify_wasm_fetch.js --local ./path/to/artifact.wasm
 *  node scripts/verify_wasm_fetch.js --url https://example.com/artifact.wasm --sha abc123...
 *  node scripts/verify_wasm_fetch.js --url https://... --sha abc123... --out ./local.wasm
 *
 * Exit codes:
 *  0 - Verification passed
 *  1 - Verification failed (general)
 *  2 - Invalid arguments
 *  3 - SHA256 mismatch
 *  4 - WASM instantiation failed
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--url') out.url = args[++i];
    else if (a === '--local') out.local = args[++i];
    else if (a === '--sha') out.sha = args[++i];
    else if (a === '--out') out.out = args[++i];
    else if (a === '--verbose') out.verbose = true;
    else { console.error('Unknown arg:', a); process.exit(2); }
  }
  return out;
}

function log(msg) {
  console.log(`[verify-wasm] ${msg}`);
}

function logErr(msg) {
  console.error(`[verify-wasm] ❌ ${msg}`);
}

function logOk(msg) {
  console.log(`[verify-wasm] ✅ ${msg}`);
}

async function verifyLocalSha(filePath, expectedSha) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      logErr(`File not found: ${filePath}`);
      reject(new Error('File not found'));
      return;
    }

    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => {
      const digest = hash.digest('hex');
      logOk(`SHA256: ${digest.substring(0, 16)}...`);

      if (expectedSha && digest.toLowerCase() !== expectedSha.toLowerCase()) {
        logErr(`SHA256 mismatch! Expected ${expectedSha}, got ${digest}`);
        reject(new Error('SHA256 mismatch'));
        return;
      }

      resolve({ filePath, digest });
    });

    stream.on('error', reject);
  });
}

async function fetchRemote(url, outPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(outPath);

    log(`Fetching ${url}...`);

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        logOk(`Fetched to ${outPath}`);
        resolve(outPath);
      });
      file.on('error', (err) => {
        fs.unlinkSync(outPath);
        reject(err);
      });
    }).on('error', reject);
  });
}

async function instantiateWasm(wasmPath) {
  try {
    const wasmBuffer = fs.readFileSync(wasmPath);
    const wasmModule = new WebAssembly.Module(wasmBuffer);
    const wasmInstance = new WebAssembly.Instance(wasmModule);

    // Check for exported functions
    if (!wasmInstance.exports.wasm_test_ping) {
      logErr('Missing exported function: wasm_test_ping');
      throw new Error('Missing wasm_test_ping export');
    }

    // Call test function
    const result = wasmInstance.exports.wasm_test_ping();
    const expected = 0xF00DBABE;

    // WebAssembly returns numbers in JS as signed 32-bit for i32 results.
    // Convert to unsigned 32-bit for comparison so values like 0xF00DBABE
    // (which appear negative when interpreted signed) compare correctly.
    const actualU32 = (result >>> 0);

    if (actualU32 === expected) {
      logOk(`wasm_test_ping() returned 0x${actualU32.toString(16).toUpperCase()} (expected 0xF00DBABE)`);
      return true;
    } else {
      logErr(`wasm_test_ping() returned 0x${actualU32.toString(16).toUpperCase()}, expected 0xF00DBABE`);
      return false;
    }
  } catch (err) {
    logErr(`WASM instantiation failed: ${err.message}`);
    return false;
  }
}

async function main() {
  const { local, url, sha, out, verbose } = parseArgs();

  if (!local && !url) {
    logErr('Specify --local <path> or --url <url>');
    process.exit(2);
  }

  try {
    let wasmPath = local;

    // Fetch if URL provided
    if (url) {
      const outPath = out || path.join(process.cwd(), `wasm_verify_${Date.now()}.wasm`);
      wasmPath = await fetchRemote(url, outPath);
    }

    // Verify SHA if provided
    if (sha) {
      log(`Verifying SHA256...`);
      await verifyLocalSha(wasmPath, sha);
    } else {
      log('SHA256 verification skipped (no --sha provided)');
    }

    // Instantiate and test
    log('Testing WASM instantiation...');
    const testPassed = await instantiateWasm(wasmPath);

    if (!testPassed) {
      process.exit(4);
    }

    logOk('All verifications passed!');
    process.exit(0);
  } catch (err) {
    logErr(err.message);
    if (verbose) console.error(err.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifyLocalSha, fetchRemote, instantiateWasm };

