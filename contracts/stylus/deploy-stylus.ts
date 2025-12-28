#!/usr/bin/env node
/**
 * contracts/stylus/deploy-stylus.ts
 *
 * Deploy Stylus WASM contract to an Arbitrum network.
 * 
 * Usage:
 *  npx ts-node contracts/stylus/deploy-stylus.ts --network arbitrumSepolia --wasm-path ./target/wasm32-unknown-unknown/release/memory_registry.wasm
 *
 * Environment variables:
 *  - RPC_URL: JSON-RPC endpoint (defaults to ARBITRUM_SEPOLIA_RPC or http://localhost:8545)
 *  - DEPLOYER_KEY: Private key of deployer wallet (required for live deployment)
 *  - STYLUS_MODULE_ID: Will be output and should be stored in .env.local
 *
 * TODO: This is a placeholder. Real deployment requires:
 *  1. Use official Arbitrum Stylus deploy tool (cargo-stylus or wasm-deploy)
 *  2. Verify contract bytecode with Stylus validator
 *  3. Pay activation fee on Arbitrum mainnet
 *  4. Store returned module ID in .env and GitHub secrets
 */

import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';
import minimist from 'minimist';
import { fileURLToPath } from 'url';

interface DeployOptions {
  network: string;
  wasmPath: string;
  dryRun?: boolean;
}

const NETWORKS = {
  arbitrumSepolia: {
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    chainId: 421614,
    name: 'Arbitrum Sepolia',
  },
  arbitrumOne: {
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    name: 'Arbitrum One (Mainnet)',
  },
  base: {
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453,
    name: 'Base',
  },
  optimism: {
    rpcUrl: 'https://mainnet.optimism.io',
    chainId: 10,
    name: 'Optimism',
  },
};

async function deploy(options: DeployOptions): Promise<void> {
  console.log(`\n📦 Stylus WASM Contract Deployment`);
  console.log(`  Network: ${options.network}`);
  console.log(`  WASM: ${options.wasmPath}`);
  console.log(`  Dry-run: ${options.dryRun ? 'YES' : 'NO'}`);
  console.log();

  // Validate WASM file exists
  if (!fs.existsSync(options.wasmPath)) {
    console.error(`❌ WASM file not found: ${options.wasmPath}`);
    console.error(`   Build with: cd contracts/stylus/memory_registry && cargo build --target wasm32-unknown-unknown --release`);
    process.exit(1);
  }

  const wasmBuffer = fs.readFileSync(options.wasmPath);
  console.log(`✅ WASM artifact loaded (${wasmBuffer.length} bytes)`);

  // Get network config
  const network = NETWORKS[options.network as keyof typeof NETWORKS];
  if (!network) {
    console.error(`❌ Unknown network: ${options.network}`);
    console.error(`   Available: ${Object.keys(NETWORKS).join(', ')}`);
    process.exit(1);
  }

  console.log(`   Network: ${network.name}`);
  console.log(`   Chain ID: ${network.chainId}`);
  console.log(`   RPC: ${network.rpcUrl}`);

  // Get deployer
  const deployerKey = process.env.DEPLOYER_KEY;
  if (!deployerKey && !options.dryRun) {
    console.error(`❌ DEPLOYER_KEY env var not set. Use --dry-run for preview.`);
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(network.rpcUrl);

  // Validate network
  let chainId: number;
  try {
    const { chainId: cid } = await provider.getNetwork();
    // ethers v6 may return a bigint for chainId; normalize to number for comparison
    chainId = Number(cid);
    if (chainId !== network.chainId) {
      console.warn(`⚠️  RPC chain ID mismatch: expected ${network.chainId}, got ${chainId}`);
    }
  } catch (err) {
    console.error(`❌ Failed to connect to RPC:`, err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // If dry-run, stop here
  if (options.dryRun) {
    console.log(`\n✅ Dry-run complete. Contract is ready for deployment.`);
    console.log(`\nNext steps:`);
    console.log(`  1. Install Stylus deploy tool: cargo install cargo-stylus`);
    console.log(`  2. Deploy to Stylus node: cargo stylus deploy --wasm-file ${options.wasmPath} --rpc-url ${network.rpcUrl}`);
    console.log(`  3. Store returned module ID in .env.local: STYLUS_MODULE_ID=0x...`);
    return;
  }

  // Real deployment (stub)
  const wallet = new ethers.Wallet(deployerKey!, provider);
  console.log(`\n👤 Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balance);
  console.log(`   Balance: ${balanceEth} ETH`);

  if (balance === 0n) {
    console.error(`❌ Deployer wallet has no balance. Fund with test ETH first.`);
    process.exit(1);
  }

  // TODO: Real deployment would use official Stylus deploy tooling here
  // For now, log the deployment steps
  console.log(`\n⚠️  Deployment is a stub. Use official Stylus deploy tool:`);
  console.log(`   cargo stylus deploy --wasm-file ${options.wasmPath} --rpc-url ${network.rpcUrl}`);
  
  // Generate a dummy module ID for demo
  const dummyModuleId = '0x' + Buffer.from('DummyModuleID').toString('hex').padEnd(40, '0');
  console.log(`\n📝 Example output (from real deploy):`);
  console.log(`   Stylus Module ID: ${dummyModuleId}`);
  console.log(`\n💾 Save to .env.local:`);
  console.log(`   STYLUS_MODULE_ID=${dummyModuleId}`);
  console.log(`\n📊 Add to GitHub secrets (for CI):`);
  console.log(`   gh secret set STYLUS_MODULE_ID -b "${dummyModuleId}"`);
}

// CLI
async function main(): Promise<void> {
  const argv = minimist(process.argv.slice(2));
  
  const network = argv.network || process.env.NETWORK || 'arbitrumSepolia';
  const wasmPath = argv['wasm-path'] || 
    path.join(__dirname, 'memory_registry', 'target', 'wasm32-unknown-unknown', 'release', 'memory_registry.wasm');
  const dryRun = argv['dry-run'] || argv.dry || false;

  try {
    await deploy({ network, wasmPath, dryRun });
  } catch (err) {
    console.error('❌ Deployment failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

// Determine if the script was executed directly (works in ESM)
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  // run main only when executed directly
  // eslint-disable-next-line no-console
  main();
}

// Export runtime API
export { deploy };
export type { DeployOptions };
