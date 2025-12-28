import fs from 'fs';
import path from 'path';
import hre from 'hardhat';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function verifyImpl(hreParam: HardhatRuntimeEnvironment) {
  const { run, network } = hreParam;
  try {
    const file = path.join(process.cwd(), 'deployments', 'memoryRegistry.json');
    if (!fs.existsSync(file)) {
      console.error('❌ deployments/memoryRegistry.json not found. Run deploy first.');
      process.exit(1);
    }

    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    const impl = data.implementation;
    if (!impl) {
      console.error('❌ Implementation address not present in deployments file');
      process.exit(1);
    }

    console.log(`📡 Verifying implementation ${impl} on network ${network.name}`);

    // Retry loop: the explorer may not have indexed bytecode immediately
    const maxRetries = 8;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await run('verify:verify', { address: impl, constructorArguments: [] });
        console.log('✅ Verification succeeded');
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Attempt ${i + 1}/${maxRetries} failed: ${msg}`);
        if (i < maxRetries - 1) {
          console.log('Waiting 10s before retrying...');
          await sleep(10000);
        } else {
          console.error('❌ Verification failed after retries');
          process.exit(1);
        }
      }
    }
  } catch (err) {
    console.error('❌ Verify script error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyImpl(hre).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default verifyImpl;
