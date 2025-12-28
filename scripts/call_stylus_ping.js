#!/usr/bin/env node

/**
 * Call Stylus WASM Test Ping
 *
 * Calls the wasm_test_ping() export on a Stylus contract.
 * Can use either a local WASM file or a deployed module ID.
 *
 * Usage:
 *  npx ts-node scripts/call_stylus_ping.ts --local ./artifact.wasm
 *  npx ts-node scripts/call_stylus_ping.ts --module-id 0x1234 --rpc https://arb1.arbitrum.io/rpc
 *
 * Environment variables (for deployed module):
 *  STYLUS_NODE_RPC - RPC endpoint
 *  STYLUS_MODULE_ID - Deployed module ID
 */

const fs = require('fs');

async function callLocalWasm(wasmPath) {
  console.log(`Testing local WASM: ${wasmPath}`);
  const buffer = fs.readFileSync(wasmPath);
  const module = new WebAssembly.Module(buffer);
  const instance = new WebAssembly.Instance(module);

  if (!instance.exports.wasm_test_ping) {
    throw new Error('wasm_test_ping export not found');
  }

  const result = instance.exports.wasm_test_ping();
  const expected = 0xF00DBABE;

  console.log(`wasm_test_ping() returned: 0x${result.toString(16).toUpperCase()}`);
  console.log(`Expected: 0xF00DBABE`);

  if (result === expected) {
    console.log('✅ Test passed!');
    return true;
  } else {
    console.error('❌ Test failed!');
    return false;
  }
}

async function callDeployedWasm(moduleId, rpcUrl) {
  console.log(`TODO: Call deployed Stylus module ${moduleId} on ${rpcUrl}`);
  console.log(`
This requires the official Arbitrum Stylus tools and deployed contract interaction.
For now, this is a stub. Steps to implement:

1. Install cargo-stylus: cargo install cargo-stylus
2. Use ethers.js or web3.js to call the module via its address
3. Query the module's test_ping() export

Example with ethers.js:
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(moduleId, ABI, provider);
  const result = await contract.testPing();
  console.log('Result:', result);

  TODO: Implement this when Stylus contract ABI is finalized.
  `);
  return false;
}

async function main() {
  const argv = require('minimist')(process.argv.slice(2), {
    string: ['local', 'module-id', 'rpc'],
  });

  try {
    if (argv.local) {
      const passed = await callLocalWasm(argv.local);
      process.exit(passed ? 0 : 1);
    } else if (argv['module-id']) {
      const rpc = argv.rpc || process.env.STYLUS_NODE_RPC || 'http://localhost:8545';
      await callDeployedWasm(argv['module-id'], rpc);
      console.log('\nModule ID call not yet implemented. Use --local for now.');
      process.exit(2);
    } else {
      console.error('Specify --local <path> or --module-id <id> --rpc <url>');
      process.exit(2);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
