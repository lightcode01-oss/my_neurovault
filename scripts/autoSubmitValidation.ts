#!/usr/bin/env -S node
/**
 * scripts/autoSubmitValidation.ts
 *
 * CLI to submit a validator decision on-chain via MemoryRegistryV2
 * Uses ethers v6 style API. If VALIDATOR_KEY absent, runs in dry mode.
 *
 * Usage:
 *  npx ts-node scripts/autoSubmitValidation.ts --memoryId 123 --score 0.8 --valid true [--dry]
 *
 * TODO: Replace with contract ABI and stylus integration.
 */

async function main() {
  const argv = require('minimist')(process.argv.slice(2));
  const memoryId = argv.memoryId || argv.memoryid;
  const score = parseFloat(argv.score || '0');
  const valid = argv.valid === 'true' || argv.valid === true;
  const dry = argv.dry || false;

  if (!memoryId) {
    console.error('Missing --memoryId');
    process.exit(2);
  }

  const RPC_URL = process.env.RPC_URL || process.env.ARBITRUM_SEPOLIA_RPC || 'http://localhost:8545';
  const VALIDATOR_KEY = process.env.VALIDATOR_KEY;
  const MEMORY_REGISTRY_ADDRESS = process.env.MEMORY_REGISTRY_ADDRESS || '';

  console.log('Preview tx:');
  console.log({ memoryId, score, valid, RPC_URL, MEMORY_REGISTRY_ADDRESS, dry });

  if (!VALIDATOR_KEY) {
    console.log('No VALIDATOR_KEY set; running dry-run. To actually send a tx set VALIDATOR_KEY env var.');
  }

  // NOTE: we don't include the contract ABI here to avoid coupling. In production add ABI and gas estimation.
  // Demonstrate using ethers if available
  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    if (!VALIDATOR_KEY || dry) {
      // callStatic / estimateGas path could be used, but we show a dry-run
      console.log('Dry-run: would estimate gas and show callStatic results (omitted)');
      process.exit(0);
    }
    const wallet = new ethers.Wallet(VALIDATOR_KEY, provider);
    console.log('Connected as', wallet.address);
    if (!MEMORY_REGISTRY_ADDRESS) {
      console.error('MEMORY_REGISTRY_ADDRESS not set');
      process.exit(3);
    }
    // Minimal contract interaction placeholder — TODO: replace with actual ABI and method
    const abi = [
      'function submitValidation(uint256 memoryId, uint256 score, bool valid) public'
    ];
    const contract = new ethers.Contract(MEMORY_REGISTRY_ADDRESS, abi, wallet);
    console.log('Estimating gas...');
    const gas = await contract.estimateGas.submitValidation(memoryId, Math.floor(score*1000), valid);
    console.log('Estimated gas:', gas.toString());
    if (dry) {
      console.log('Dry mode; not sending tx');
      process.exit(0);
    }
    const tx = await contract.submitValidation(memoryId, Math.floor(score*1000), valid);
    console.log('Sent tx:', tx.hash);
    const rcpt = await tx.wait();
    console.log('Tx mined:', rcpt.transactionHash);
    process.exit(0);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Ethers not available or tx failed:', errMsg);
    process.exit(4);
  }
}

if (require.main === module) main();

// TODO: add typed ABI, gas price estimation, guardian checks, and offline signing.

