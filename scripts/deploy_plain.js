const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

async function main() {
  const artifactPath = path.join(process.cwd(), 'artifacts', 'contracts', 'MemoryRegistryV2.sol', 'MemoryRegistryV2.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('Artifact not found. Legacy EVM artifacts are not built in this repo by default.');
    console.error('If you need to deploy a Solidity artifact, run your local EVM build (e.g., `npx hardhat compile`) or use the Stylus/WASM workflow under `contracts/stylus/`.');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;

  const rpc = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const provider = new ethers.JsonRpcProvider(rpc);

  const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('Deploying with account:', wallet.address);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  if (contract.waitForDeployment) {
    await contract.waitForDeployment();
  } else if (contract.deployed) {
    await contract.deployed();
  }

  // Call initialize (OpenZeppelin Initializable)
  try {
    const tx = await contract.initialize();
    if (tx.wait) await tx.wait();
  } catch (e) {
    console.warn('initialize call failed or unnecessary:', e.message || e);
  }

  const contractAddress = contract.address || contract.target;
  console.log('Deployed at:', contractAddress);

  // Update .env
  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (envContent.includes('VITE_MEMORY_REGISTRY_ADDRESS=')) {
    envContent = envContent.replace(/VITE_MEMORY_REGISTRY_ADDRESS=.*/,'VITE_MEMORY_REGISTRY_ADDRESS=' + contractAddress);
  } else {
    envContent += '\nVITE_MEMORY_REGISTRY_ADDRESS=' + contractAddress + '\n';
  }
  fs.writeFileSync(envPath, envContent);
  console.log('Updated .env with VITE_MEMORY_REGISTRY_ADDRESS');

  // Save ABI to frontend
  const abiPath = path.join(process.cwd(), 'src', 'lib', 'abi', 'MemoryRegistryV2.json');
  const abiDir = path.dirname(abiPath);
  if (!fs.existsSync(abiDir)) fs.mkdirSync(abiDir, { recursive: true });
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log(`Saved ABI to ${abiPath}`);

  // Save deployment config
  const config = {
    network: rpc,
    contractAddress,
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(process.cwd(), 'deployment-config.json'), JSON.stringify(config, null, 2));
  console.log('Saved deployment-config.json');

  console.log('Deployment complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
