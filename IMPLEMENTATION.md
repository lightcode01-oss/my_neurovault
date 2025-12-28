# MemoryRegistry V2 - Complete Implementation

A decentralized memory validation network built on Arbitrum. Submit memories to IPFS, get them validated by a distributed validator network, and earn reputation.

## 🎯 Features

- **Upgradeable Smart Contract**: UUPS pattern with OpenZeppelin
- **IPFS Integration**: Store memories on IPFS with CID tracking
- **Validation Network**: Distributed validators score memories
- **Reputation System**: Earn reputation as submitter or validator
- **Event Indexing**: Real-time blockchain event tracking
- **Backend API**: FastAPI server for off-chain operations
- **Frontend Dashboard**: React + TypeScript UI for interactions
- **Demo Seeder**: Populate with sample data for testing
- **Comprehensive Testing**: Stylus/WASM tests + backend pytest + E2E (legacy Hardhat tests kept for reference)

## 📦 Architecture

```
NeuroVault Memory Network/
├── contracts/
│   └── MemoryRegistryV2.sol        # Main contract
├── contracts/stylus/                # Stylus (Arbitrum WASM) crate(s) and helpers
├── scripts/
│   ├── deploy.ts                    # Deployment script
│   ├── seed_demo.ts                 # Demo data seeder
│   └── autoSubmitValidation.ts      # TX submitter
├── tests/
│   └── MemoryRegistryV2.test.ts    # Hardhat tests
├── backend/
│   ├── app.py                       # FastAPI server
│   ├── requirements.txt             # Python dependencies
│   ├── models/
│   │   └── memory_store.py          # SQLite storage
│   ├── validators/
│   │   └── validator.py             # Validation automation
│   └── tests/
│       └── test_api.py              # Backend tests
├── infra/
│   └── indexer.js                   # Event indexer
├── src/
│   ├── lib/
│   │   ├── onchain.ts               # Contract helpers
│   │   └── abi/
│   │       └── MemoryRegistryV2.json # Contract ABI
│   └── pages/
│       └── visualize.tsx             # Memory visualization
├── .env.example                      # Environment template
├── Makefile                          # Development tasks
├── package.json                      # Node dependencies
└── README.md                         # This file
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone repository
git clone <repo-url>
cd "NeuroVault Memory Network"

# Run setup script (Linux/Mac)
bash scripts/run_demo.sh

# Or Windows PowerShell
pwsh scripts/run_demo.ps1

# Or Windows CMD
scripts\run_demo.bat
```

### 2. Configure Environment

```bash
cp .env.example .env

# Edit .env with your values:
# - RPC_URL: Your Arbitrum RPC endpoint
# - PRIVATE_KEY: Deployer wallet key (without 0x prefix)
# - VALIDATOR_KEY: Validator wallet key
# - OPENAI_KEY: Optional OpenAI API key
```

### 3. Deploy Smart Contract

```bash
# Terminal 1: Start local Stylus or local chains
# Note: Hardhat/EVM instructions below are legacy and deprecated. This project targets Stylus (Arbitrum WASM).
# If you still need to run legacy Solidity/EVM flows, run the Hardhat commands manually in a separate environment.

# Terminal 2: Deploy contract (Stylus/WASM workflows)
# Use the Stylus tooling under `contracts/stylus/` or your preferred deploy tooling.
# For legacy EVM/Solidity deployments, run the following manually (deprecated):
# npx hardhat run scripts/deploy.ts --network localhost

# Seed demo data (deprecated Hardhat flow):
# npx hardhat run scripts/seed_demo.ts --network localhost
```

### 4. Start Backend Services

```bash
# Terminal 3: Start event indexer
node infra/indexer.js --from-block 0

# Terminal 4: Start FastAPI backend
cd backend && python -m uvicorn app:app --reload --port 8000

# Terminal 5: Run validator automation (optional)
python backend/validators/validator.py --once
```

### 5. Start Frontend

```bash
# Terminal 6: Start frontend dev server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## 🔗 Smart Contract

### MemoryRegistryV2

**Key Functions:**

```solidity
// Submit memory to registry
function submitMemory(
  string ipfsCid,
  bytes32 contentHash,
  string title,
  string category
) → uint256 memoryId

// Submit validation for memory
function submitValidation(
  uint256 memoryId,
  bool isValid,
  uint16 score,
  string explanation
) → void

// Get memory by ID
function getMemory(uint256 memoryId) → Memory struct

// Get validation history
function getValidationHistory(uint256 memoryId) → ValidationRecord[]

// Get reputation
function getReputation(address user, string userType) → uint256
```

**Events:**

- `MemorySubmitted` - Emitted when memory is submitted
- `MemoryValidated` - Emitted when memory is validated
- `ReputationUpdated` - Emitted when reputation changes
- `ValidatorStatusChanged` - Emitted when validator role changes

### Deployment

**Local Network / Stylus (recommended):**

Use the Stylus/WASM deploy workflow under `contracts/stylus/` and the CI `build_and_release_wasm.yml` workflow. For example, build the wasm artifact and use the Stylus deploy tooling appropriate for your Stylus-enabled node.

**Legacy EVM (deprecated):**
```bash
# The following Hardhat commands are legacy/deprecated in this repository and only provided for reference.
# Prefer Stylus/WASM deployments instead.
# npx hardhat run scripts/deploy.ts --network localhost
# npx hardhat run scripts/deploy.ts --network arbitrumSepolia
# npx hardhat run scripts/deploy.ts --network arbitrumOne
```

## 🔌 Backend API

### Base URL
```
http://localhost:8000
```

### Endpoints

**Memories:**
```
POST   /memories                  # Submit memory
GET    /memories                  # List memories
GET    /memories/{id}             # Get memory details
GET    /unvalidated               # Get unvalidated memories
```

**Validation:**
```
POST   /validate                  # Submit validation
GET    /agent/{address}           # Get agent stats
```

**Embeddings:**
```
POST   /embed                     # Get embedding for text
POST   /similar                   # Find similar memories
```

**Health:**
```
GET    /health                    # Health check
```

### Example Requests

**Submit Memory:**
```bash
curl -X POST http://localhost:8000/memories \
  -H "Content-Type: application/json" \
  -d '{
    "ipfs_cid": "QmTest123",
    "content_hash": "0xabc...",
    "title": "My Memory",
    "category": "history",
    "submitter": "0x123..."
  }'
```

**List Memories:**
```bash
curl http://localhost:8000/memories?category=science&limit=10
```

**Validate Memory:**
```bash
curl -X POST http://localhost:8000/validate \
  -H "Content-Type: application/json" \
  -d '{
    "memory_id": 1,
    "is_valid": true,
    "score": 850,
    "explanation": "Good memory",
    "validator": "0x456..."
  }'
```

## 🧪 Testing

### Run All Tests

```bash
# Contract tests
npm run test

# Backend tests
pytest backend/tests/ -v

# End-to-end tests
make test-e2e
```

### Contract Tests (Stylus/WASM or legacy Hardhat)

If you are testing Stylus/WASM modules, use the Stylus testing helpers under `contracts/stylus/`.
If you need to run legacy Solidity tests with Hardhat, you can run (deprecated):

```bash
# npx hardhat test  # legacy (Solidity/Hardhat) - use only if you maintain EVM artifacts
```

Tests cover:
- Memory submission
- Validation submission
- Reputation tracking
- Validator management
- Event emission

## 📊 Event Indexing

The indexer listens to blockchain events and stores them in SQLite.

```bash
# Run once from block 0
node infra/indexer.js --from-block 0

# Run daemon (continuous polling)
node infra/indexer.js

# Run once and exit
node infra/indexer.js --once
```

**Indexed Events:**
- `MemorySubmitted` - Memory creation
- `MemoryValidated` - Validation submission
- `ReputationUpdated` - Reputation changes
- `ValidatorStatusChanged` - Validator role changes

## 🤖 Validator Automation

Automatically validate unvalidated memories.

```bash
# Run single validation cycle
python backend/validators/validator.py --once

# Run continuous daemon
python backend/validators/validator.py

# Dry-run (no TX submission)
python backend/validators/validator.py --once --dry-run

# Custom batch size
python backend/validators/validator.py --batch-size 20
```

The validator:
1. Polls backend for unvalidated memories
2. Computes embedding-based score
3. Submits validation (or calls TX submitter)
4. Tracks validator reputation

## 📝 Frontend Integration

### Hook: `useMemories`

```typescript
const { memories, loading, error } = useMemories({ category: 'science' });
```

### Hook: `useSubmitMemory`

```typescript
const { submit, loading, error } = useSubmitMemory();
await submit({
  ipfsCid: 'QmTest',
  contentHash: '0x...',
  title: 'My Memory',
  category: 'history',
});
```

### Contract Interaction

```typescript
import { submitMemoryTx, loadMemory } from '@/lib/onchain';

// Submit memory on-chain
const txHash = await submitMemoryTx(signer, {
  ipfsCid: 'QmTest',
  contentHash: '0x...',
  title: 'My Memory',
  category: 'history',
});

// Load memory from chain
const memory = await loadMemory(provider, 1n);
```

## 🎨 Visualization Page

View interactive memory network at `/visualize`

Features:
- Memory grid/list view
- Filter by category
- Click to see details
- IPFS link integration
- Stats dashboard

**TODO:** Implement react-force-graph for node visualization.

## 📋 Environment Variables

```env
# Blockchain
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=0x...
VALIDATOR_KEY=0x...
VITE_MEMORY_REGISTRY_ADDRESS=0x...

# APIs
OPENAI_KEY=sk-proj-...
VITE_IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
VITE_WEB3STORAGE_KEY=...

# Backend
DB_PATH=./data/neurovault.db
BACKEND_PORT=8000
BACKEND_URL=http://localhost:8000

# Frontend
VITE_PORT=3000
VITE_TARGET_CHAIN_ID=11155111
VITE_BLOCK_EXPLORER_BASE=https://sepolia.arbiscan.io

# Indexing
INDEX_FROM_BLOCK=0
INDEX_POLL_INTERVAL=30000

# Logging
LOG_LEVEL=INFO
```

## 🔧 Available Commands

### Using Make (Linux/Mac)

```bash
make help                 # Show all commands
make install             # Install dependencies
make env                 # Create .env from template
make dev-hardhat         # Start Hardhat node
make dev-frontend        # Start frontend dev server
make deploy              # Deploy contract
make test-contracts      # Run contract tests
make backend             # Start FastAPI backend
make indexer             # Start event indexer
make validator           # Run validator once
make clean               # Remove artifacts
make full-demo           # Start everything
```

### Using npm

```bash
npm install              # Install dependencies
npm run dev              # Start frontend
npm run build            # Build frontend
npm run test:run         # Run frontend tests
npm run type-check       # TypeScript check
```

### Using npx

```bash
npx hardhat compile      # (legacy) Compile contracts - deprecated in this repo
# npx hardhat compile      # (legacy) Compile contracts - deprecated in this repo
# npx hardhat test         # (legacy) Run contract tests - deprecated in this repo
# npx hardhat node         # (legacy) Start local node - deprecated in this repo
# npx hardhat run scripts/deploy.ts --network localhost  # (legacy) Deploy - deprecated in this repo
```

## 🐳 Docker

### Build Images

```bash
docker build -t neurovault-backend:latest -f Dockerfile.backend .
docker build -t neurovault-frontend:latest -f Dockerfile.frontend .
```

### Run with Docker Compose

```bash
docker compose up -d
```

Services:
- Backend API (port 8000)
- Frontend (port 3000)
- PostgreSQL database (port 5432)

## 🔐 Security Considerations

### Contract

- ✅ Uses OpenZeppelin Upgradeable pattern
- ✅ Access control with roles
- ✅ Input validation on all functions
- 🔜 TODO: Implement pause mechanism
- 🔜 TODO: Add rate limiting on validations
- 🔜 TODO: Implement withdrawal timelock

### Backend

- ✅ Input validation on all endpoints
- ✅ CORS properly configured
- 🔜 TODO: Add rate limiting middleware
- 🔜 TODO: Add authentication/API keys
- 🔜 TODO: Implement validator reputation thresholds

### Frontend

- ✅ Private keys never exposed
- ✅ Uses ethers.js for safe RPC calls
- 🔜 TODO: Implement transaction signing with hardware wallets
- 🔜 TODO: Add signature verification

### Keys

- ⚠️ Never commit `.env` with real keys
- ⚠️ Use environment-specific configs
- ⚠️ Rotate keys regularly
- ⚠️ Use hardware wallets for production

## 📚 Additional Resources

### Arbitrum Docs
- [Arbitrum Bridge](https://bridge.arbitrum.io/)
- [Arbitrum Docs](https://docs.arbitrum.io/)
- [Sepolia Testnet](https://sepolia.arbiscan.io/)

### OpenZeppelin
- [Upgradeable Contracts](https://docs.openzeppelin.com/contracts/4.x/upgradeable)
- [Access Control](https://docs.openzeppelin.com/contracts/4.x/access-control)

### IPFS
- [IPFS Docs](https://docs.ipfs.io/)
- [Web3.Storage](https://web3.storage/)

### Frontend Frameworks
- [Vite](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [Radix UI](https://www.radix-ui.com/)

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run tests: `make test-all`
4. Submit pull request

## 📄 License

MIT

## 🆘 Support

For issues or questions:
1. Check existing GitHub issues
2. Review documentation in `deployment/deploy.md`
3. Check test files for usage examples
4. See inline code comments and NatSpec docs

## 🎯 Roadmap

- [ ] Multi-wallet support (WalletConnect, Coinbase)
- [ ] Advanced AI validation with Chainlink oracles
- [ ] Reputation threshold enforcement
- [ ] Batch validation operations
- [ ] Advanced memory similarity search
- [ ] Validator incentive mechanism
- [ ] Governance token implementation
- [ ] DAO governance structure
- [ ] Zero-knowledge proofs for privacy
- [ ] Cross-chain memory bridge

## 📝 Changelog

### v0.1.0 - Initial Release
- ✅ Smart contract core functionality
- ✅ Backend API and SQLite storage
- ✅ Event indexing system
- ✅ Validator automation
- ✅ Frontend React integration
- ✅ Comprehensive testing
- ✅ Deployment automation

---

**Built with ❤️ for the decentralized memory network**
