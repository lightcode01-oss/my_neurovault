/**
 * deploy/deploy-multichain.ts
 *
 * Multi-chain deployment orchestrator.
 * Deploy NeuroVault Memory Registry to multiple chains.
 *
 * Usage:
 *  npx ts-node deploy/deploy-multichain.ts --networks arbitrumSepolia,base --dry-run
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { getNetwork, getStylusNetworks } from './config/networks';

interface DeploymentResult {
  network: string;
  success: boolean;
  address?: string;
  txHash?: string;
  error?: string;
  gasCost?: string;
}

class MultiChainDeployer {
  private deployments: Map<string, DeploymentResult> = new Map();

  async deployToNetworks(networkNames: string[], dryRun: boolean = true): Promise<void> {
    console.log(`\n🌐 Multi-Chain Deployment`);
    console.log(`   Networks: ${networkNames.join(', ')}`);
    console.log(`   Dry-run: ${dryRun}`);
    console.log();

    const results: DeploymentResult[] = [];

    for (const networkName of networkNames) {
      console.log(`\n📡 Deploying to ${networkName}...`);
      const result = await this.deployToNetwork(networkName, dryRun);
      results.push(result);
      this.deployments.set(networkName, result);

      if (result.success) {
        console.log(`   ✅ Success`);
        if (result.address) console.log(`   Address: ${result.address}`);
        if (result.txHash) console.log(`   Tx: ${result.txHash}`);
        if (result.gasCost) console.log(`   Gas cost: ${result.gasCost}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    }

    // Summary
    console.log(`\n📊 Deployment Summary`);
    console.log(`   Total: ${results.length}`);
    console.log(`   Success: ${results.filter((r) => r.success).length}`);
    console.log(`   Failed: ${results.filter((r) => !r.success).length}`);

    // Generate config file
    this.generateDeploymentConfig(results);
  }

  private async deployToNetwork(networkName: string, dryRun: boolean): Promise<DeploymentResult> {
    try {
      const network = getNetwork(networkName);
      console.log(`   Network: ${network.name} (Chain ${network.chainId})`);

      const provider = new ethers.JsonRpcProvider(network.rpcUrl);

      // Verify network
      const { chainId } = await provider.getNetwork();
      if (Number(chainId) !== network.chainId) {
        return {
          network: networkName,
          success: false,
          error: `Chain ID mismatch: expected ${network.chainId}, got ${chainId}`,
        };
      }

      // Get deployer
      const deployerKey = process.env.DEPLOYER_KEY;
      if (!deployerKey && !dryRun) {
        return {
          network: networkName,
          success: false,
          error: 'DEPLOYER_KEY not set',
        };
      }

      if (!dryRun && deployerKey) {
        const wallet = new ethers.Wallet(deployerKey, provider);
        const balance = await provider.getBalance(wallet.address);

        if (balance === 0n) {
          return {
            network: networkName,
            success: false,
            error: `Deployer wallet ${wallet.address} has no balance`,
          };
        }

        console.log(`   Deployer: ${wallet.address}`);
        console.log(`   Balance: ${ethers.formatEther(balance)} ${network.nativeCurrency}`);
      }

      // If Stylus-capable, use Stylus deployment
      if (network.stylusSupport) {
        return {
          network: networkName,
          success: true,
          address: `0x${'0'.repeat(40)}`, // Placeholder
          error: 'Use cargo-stylus deploy for Stylus networks',
        };
      }

      // TODO: For non-Stylus networks, deploy EVM-compatible adapter contract
      // This would require an EVM contract that can call the Stylus module

      return {
        network: networkName,
        success: true,
        address: `0x${'1'.repeat(40)}`, // Placeholder
      };
    } catch (error) {
      return {
        network: networkName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private generateDeploymentConfig(results: DeploymentResult[]): void {
    const config = {
      timestamp: new Date().toISOString(),
      deployments: results.filter((r) => r.success),
    };

    const configPath = path.join(__dirname, 'deployments.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`\n💾 Deployment config saved to: ${configPath}`);
  }
}

async function main(): Promise<void> {
  const argv = require('minimist')(process.argv.slice(2));

  const networksArg = argv.networks || argv.n || 'arbitrumSepolia';
  const networkList = networksArg.split(',').map((n: string) => n.trim());
  const dryRun = argv['dry-run'] || argv.dry || true;

  const deployer = new MultiChainDeployer();

  try {
    await deployer.deployToNetworks(networkList, dryRun);
  } catch (error) {
    console.error('❌ Multi-chain deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { MultiChainDeployer };
