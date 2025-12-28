const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

const DEMO_MEMORIES = [
  { title: 'Ancient Library of Alexandria', category: 'history', cid: 'QmAlexandria001', validationScore: 950 },
  { title: 'Renaissance Art Movement', category: 'art', cid: 'QmRenaissance002', validationScore: 920 },
  { title: 'Quantum Computing Basics', category: 'science', cid: 'QmQuantum003', validationScore: 880 },
  { title: 'Traditional Japanese Tea Ceremony', category: 'culture', cid: 'QmJapaneseCeremony004', validationScore: 850 },
  { title: 'History of the Internet', category: 'technology', cid: 'QmInternet005', validationScore: 910 },
  { title: 'Byzantine Architecture', category: 'history', cid: 'QmByzantine006', validationScore: 890 },
  { title: 'Modern Abstract Expressionism', category: 'art', cid: 'QmAbstract007', validationScore: 800 },
  { title: 'CRISPR Gene Editing', category: 'science', cid: 'QmCRISPR008', validationScore: 920 },
  { title: 'Indigenous Knowledge Systems', category: 'culture', cid: 'QmIndigenous009', validationScore: 870 },
  { title: 'AI and Machine Learning Evolution', category: 'technology', cid: 'QmAI010', validationScore: 900 }
];

async function main() {
  const envPath = path.join(process.cwd(), '.env');
  const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const match = env.match(/VITE_MEMORY_REGISTRY_ADDRESS=(.*)/);
  if (!match) {
    console.error('VITE_MEMORY_REGISTRY_ADDRESS not set in .env. Deploy first.');
    process.exit(1);
  }
  const contractAddress = match[1].trim();

  const artifactPath = path.join(process.cwd(), 'artifacts', 'contracts', 'MemoryRegistryV2.sol', 'MemoryRegistryV2.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('Artifact not found. Legacy EVM artifacts are not built by default in this repository.');
    console.error('If you need to seed a Solidity-based local network, build contracts with `npx hardhat compile` and set VITE_MEMORY_REGISTRY_ADDRESS accordingly, or adapt this script for Stylus/WASM deployments.');
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');

  // Hardhat default private keys
  const pk0 = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const pk1 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
  const pk2 = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
  const pk3 = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';

  const deployer = new ethers.Wallet(pk0, provider);
  const validator1 = new ethers.Wallet(pk1, provider);
  const validator2 = new ethers.Wallet(pk2, provider);
  const validator3 = new ethers.Wallet(pk3, provider);

  console.log('Deployer:', deployer.address);

  const registry = new ethers.Contract(contractAddress, abi, provider);

  // Set validators as owner (use explicit nonces to avoid nonce race conditions)
  console.log('Setting validators...');
  let deployerNonce = await provider.getTransactionCount(deployer.address);
  const tx1 = await registry.connect(deployer).setValidator(validator1.address, true, { nonce: deployerNonce });
  await tx1.wait?.();
  deployerNonce++;
  const tx2 = await registry.connect(deployer).setValidator(validator2.address, true, { nonce: deployerNonce });
  await tx2.wait?.();
  deployerNonce++;
  const tx3 = await registry.connect(deployer).setValidator(validator3.address, true, { nonce: deployerNonce });
  await tx3.wait?.();
  deployerNonce++;
  console.log('Validators set');

  // Submit memories
  console.log('Submitting demo memories...');
  const memoryIds = [];
  for (const memory of DEMO_MEMORIES) {
    const contentHash = ethers.id(memory.title + memory.category);
    const tx = await registry.connect(deployer).submitMemory(memory.cid, contentHash, memory.title, memory.category, { nonce: deployerNonce });
    await tx.wait?.();
    deployerNonce++;
    const count = await registry.getMemoryCount();
    const id = Number(count.toString ? count.toString() : count);
    memoryIds.push(id);
    console.log(`Submitted: ${memory.title} -> id ${id}`);
  }

  // Submit validations
  console.log('Submitting validations...');
  const validators = [validator1, validator2, validator3];
  let validationCount = 0;
  for (let i = 0; i < memoryIds.length; i++) {
    const memory = DEMO_MEMORIES[i];
    const memoryId = memoryIds[i];
    const numValidators = Math.floor(Math.random() * 2) + 2;
    const shuffled = validators.sort(() => Math.random() - 0.5).slice(0, numValidators);
    for (const v of shuffled) {
      // Ensure each validator uses its correct nonce
      if (!v.nonce) v.nonce = await provider.getTransactionCount(v.address);
      const baseScore = memory.validationScore;
      const variance = Math.floor((Math.random() - 0.5) * 100);
      const score = Math.max(0, Math.min(1000, baseScore + variance));
      const tx = await registry.connect(v).submitValidation(memoryId, score >= 500, score, `Validation for ${memory.title}. Score: ${score}`, { nonce: v.nonce });
      await tx.wait?.();
      v.nonce++;
      validationCount++;
      console.log(`Validated memory ${memoryId} by ${v.address.slice(0,8)} score ${score}`);
    }
  }
  console.log(`Submitted ${validationCount} validations.`);

  console.log('Demo seeding complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
