import fs from 'fs';
import path from 'path';
import hre from 'hardhat';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';

async function main(hreParam: HardhatRuntimeEnvironment) {
  const { ethers, upgrades, network } = hreParam;
  console.log('\n🔧 Deploying MemoryRegistryV2 (upgradeable proxy)');

  try {
    const Factory = await ethers.getContractFactory('MemoryRegistryV2');
    console.log('  Compiled contract factory OK');

    const initName = process.env.MEMORY_REGISTRY_NAME || 'MemoryRegistryV2';
    console.log(`  Deploying proxy (initializer: initialize('${initName}')) ...`);
    const proxy = await upgrades.deployProxy(Factory, [initName], { initializer: 'initialize' });
    if (proxy.waitForDeployment) {
      await proxy.waitForDeployment();
    } else if (proxy.deployed) {
      await proxy.deployed();
    }
    console.log('\nProxy object returned by deployProxy:');
    console.log(proxy);
    const proxyAddress = (proxy as any).address || (proxy as any).target || null;
    console.log(`\n[✓] Proxy deployed (detected): ${proxyAddress}`);

    const implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`[✓] Implementation: ${implementation}`);

    // Attempt owner check (OwnableUpgradeable)
    let ownerAddress = 'unknown';
    try {
      if ((proxy as any).owner) {
        ownerAddress = await (proxy as any).owner();
        console.log(`[✓] Owner: ${ownerAddress}`);
      }
    } catch (err) {
      console.warn('  Could not read owner() from proxy (contract may not expose owner)');
    }

    // Persist deployment info
    const deploymentsDir = path.join(process.cwd(), 'deployments');
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

    const out = {
      network: network.name,
      proxy: proxyAddress,
      implementation,
      owner: ownerAddress,
      timestamp: new Date().toISOString(),
    } as const;

    const outPath = path.join(deploymentsDir, 'memoryRegistry.json');
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), { encoding: 'utf8' });
    console.log(`[✓] Saved to ${outPath}`);

    console.log('\nDeployment complete.');
  } catch (err) {
    console.error('❌ Deployment failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}

// Execute when run via `npx hardhat run`
main(hre).catch((err) => {
  console.error(err);
  process.exit(1);
});

export default main;
