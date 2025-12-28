# MemoryRegistry Operations Guide

Complete guide for running and managing the MemoryRegistry system.

## 📋 System Architecture

```
┌─────────────────────────────────────────────────┐
│         Frontend (React + TypeScript)           │
│         Port 3000 / localhost:3000              │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/WebSocket
┌──────────────────▼──────────────────────────────┐
│         Backend API (FastAPI)                   │
│         Port 8000 / localhost:8000              │
│  ┌────────────────────────────────────────┐   │
│  │  - Memory submissions                  │   │
│  │  - Embeddings & similarity             │   │
│  │  - Validation records                  │   │
│  │  - Agent statistics                    │   │
│  └────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────┘
                   │
          ┌────────┼────────┐
          │        │        │
┌─────────▼──┐ ┌──▼─────────┐ ┌──────────────────┐
│  SQLite DB │ │ Validator  │ │ Event Indexer    │
│  /data/    │ │ Service    │ │ (Node.js)        │
│  neurovault│ │ (Python)   │ │                  │
└────────────┘ └────────────┘ └─────────┬────────┘
                                        │
                                        │
                         ┌──────────────▼────────────┐
                         │  Smart Contract Events    │
                         │  (Arbitrum Sepolia)      │
                         │                          │
                         │  MemorySubmitted         │
                         │  MemoryValidated         │
                         │  ReputationUpdated       │
                         └──────────────────────────┘
```

## 🚀 Starting the System

### Option 1: Full Automated (Recommended)

```bash
# Linux/Mac
bash scripts/run_demo.sh

# Windows PowerShell
pwsh scripts/run_demo.ps1

# Windows CMD
scripts\run_demo.bat

# Or use Make
make full-demo
```

This will:
1. Check dependencies
2. Create .env file
3. Install all packages
4. Create data directories
5. Guide you through next steps

### Option 2: Manual Setup (Step by Step)

**Terminal 1 - Blockchain Node:**
```bash
# Legacy Hardhat node (deprecated). Prefer Stylus/WASM workflows under `contracts/stylus/`.
# If you still need an EVM local node for legacy Solidity artifacts, run:
# npx hardhat node
```

Expected output:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
Available accounts:
...
```

**Terminal 2 - Deploy Contract:**
```bash
# Stylus/WASM deployments: use the Stylus tooling under `contracts/stylus/` or CI built wasm artifacts.
# Legacy (deprecated) Hardhat deploy (for reference):
# npx hardhat run scripts/deploy.ts --network localhost
```

Expected output:
```
🚀 Deploying MemoryRegistryV2...

📦 Deploying MemoryRegistryV2...
✅ MemoryRegistryV2 deployed at: 0x5FbDB2315678afccb33d7d44caf9b05b57563d8d

👮 Setting deployer as initial validator...
✅ Validator role granted

💾 Saving deployment info...
✅ Updated .env with contract address
✅ Saved ABI to src/lib/abi/MemoryRegistryV2.json
```

**Terminal 3 - Seed Demo Data (Optional):**
```bash
# Seed demo data via backend or Stylus tooling. Legacy Hardhat seeding (deprecated):
# npx hardhat run scripts/seed_demo.ts --network localhost
```

Expected output:
```
🌱 Seeding Demo Memories...
...
📥 Submitting demo memories...
  ✅ Ancient Library of Alexandria (ID: 1)
  ✅ Renaissance Art Movement (ID: 2)
...
✅ Demo seeding complete!
```

**Terminal 4 - Event Indexer:**
```bash
node infra/indexer.js --from-block 0
```

Expected output:
```
📡 MemoryRegistry Event Indexer

🔗 RPC: http://127.0.0.1:8545
📦 Contract: 0x5FbDB2315678afccb33d7d44caf9b05b57563d8d
💾 Database: ./data/neurovault.db

🔍 Indexing range 0 to 42 (42 blocks)...
📦 Indexing block 0...
  Found 0 events
...
✅ Range indexing complete
⏳ Waiting 30000ms for next poll...
```

**Terminal 5 - Backend API:**
```bash
cd backend && python -m uvicorn app:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Terminal 6 - Validator Service (Optional):**
```bash
python backend/validators/validator.py --once
```

Expected output:
```
INFO Validator Automation
🏜️  Running in dry-run mode (no TX submission)
👤 Validator: 0x...
🔄 Running validation cycle...
📥 Fetched 0 unvalidated memories
⏸️  No unvalidated memories to process
```

**Terminal 7 - Frontend:**
```bash
npm run dev
```

Expected output:
```
  VITE v6.3.5  ready in 400 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Now visit `http://localhost:3000` in your browser.

## 📊 Testing the System

### Test Smart Contract

```bash
# For Stylus/WASM tests use the `contracts/stylus/` helpers. Legacy Hardhat test (deprecated):
# npx hardhat test
```

Expected output:
```
  MemoryRegistryV2
    Memory Submission
      ✓ should submit a memory and return memory ID
      ✓ should increment memory ID for each submission
      ...
    Memory Validation
      ✓ should submit validation
      ✓ should reject non-validator submissions
      ...

  17 passing (500ms)
```

### Test Backend API

```bash
cd backend && pytest tests/ -v
```

Expected output:
```
tests/test_api.py::TestMemorySubmission::test_create_memory PASSED
tests/test_api.py::TestMemorySubmission::test_list_memories PASSED
...

======================== 20 passed in 2.34s ========================
```

### Test Frontend

```bash
npm run test:run
```

Expected output:
```
 ✓ tests/ipfsUploader.test.ts (2 tests)
 ✓ tests/packAndSubmitMemory.test.ts (9 tests)
 ✓ tests/useWallet.test.ts (6 tests)

 Test Files  3 passed (3)
      Tests  17 passed (17)
```

### Manual Testing Checklist

1. **Submit Memory via Frontend**
   - Go to `/` on frontend
   - Click "Submit Memory"
   - Fill in: title, category, connect wallet
   - See TX confirmation
   - Check database for new record

2. **Check Backend API**
   ```bash
   curl http://localhost:8000/memories
   ```
   Should return list of memories

3. **Validate Memory**
   ```bash
   curl -X POST http://localhost:8000/validate \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

4. **Check Events**
   - Look in indexer logs for event processing
   - Check `data/neurovault.db` with SQLite browser

5. **View Visualization**
   - Go to `/visualize` on frontend
   - See memory grid/network
   - Filter by category
   - Click memory for details

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8545      # Port 8545 (Hardhat)
lsof -i :8000      # Port 8000 (Backend)
lsof -i :3000      # Port 3000 (Frontend)

# Kill process
kill -9 <PID>

# Or use different port
# Hardhat deprecated: start a Stylus/Arbitrum-WASM local node or skip network emulation.
# For local dev, start the backend and frontend and use the CI-built wasm artifact in `public/wasm/`.
```

### Contract Not Deployed

```
❌ Error: VITE_MEMORY_REGISTRY_ADDRESS not configured

# Run deployment
npx hardhat run scripts/deploy.ts --network localhost
```

### Backend Can't Connect to Database

```
❌ Failed to create database

# Check directory exists
mkdir -p data

# Check permissions
chmod 755 data

# Delete and recreate
rm -f data/neurovault.db
python backend/app.py
```

### TypeScript Errors

```bash
# Regenerate types
npm run type-check

# Full rebuild
rm -rf dist build artifacts
npm run build
```

### Python Module Not Found

```bash
# Reinstall dependencies
pip install -r backend/requirements.txt

# Check Python version
python --version    # Should be 3.10+

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r backend/requirements.txt
```

## 📈 Monitoring

### Check System Health

```bash
# Frontend
curl http://localhost:3000/

# Backend
curl http://localhost:8000/health

# Contract (via ethers)
npx hardhat console --network localhost
> const registry = await ethers.getContractAt("MemoryRegistryV2", "0x...");
> await registry.getMemoryCount();
```

### View Logs

```bash
# Backend logs
tail -f ~/.local/share/uvicorn.log

# Indexer logs
# Check console where indexer is running

# Contract events
# Check indexer logs and database
```

### Database Stats

```bash
# SQLite
sqlite3 data/neurovault.db

sqlite> SELECT COUNT(*) FROM memories;
sqlite> SELECT COUNT(*) FROM validations;
sqlite> SELECT * FROM index_state;
sqlite> .exit
```

## 🔐 Security Checks

### Before Production

- [ ] Verify .env is in .gitignore
- [ ] Check no private keys in code
- [ ] Enable contract pause mechanism
- [ ] Add rate limiting to API
- [ ] Use https in production
- [ ] Set up monitoring/alerting
- [ ] Audit smart contract
- [ ] Load test API
- [ ] Set up backups

### Generate Production .env

```bash
# Don't use test keys!
cp .env.example .env.production

# Fill in real values:
# - Use hardware wallet keys or key manager
# - Use production RPC endpoint
# - Set higher log level (WARNING)
```

## 📦 Deployment

### Deploy to Arbitrum Sepolia

```bash
# Update .env
VITE_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=0x...
VALIDATOR_KEY=0x...

# Get testnet ETH from faucet
# https://faucet.arbitrum.io/

# Deploy using Stylus/WASM workflows or your deploy tooling. Legacy Hardhat deploy (deprecated):
# npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

### Deploy to Production (Arbitrum One)

```bash
# Update .env for mainnet
VITE_RPC_URL=https://arb1.arbitrum.io/rpc

# Deploy with caution! Use Stylus/WASM production deploy tooling where applicable.
# Legacy Hardhat deploy (deprecated):
# npx hardhat run scripts/deploy.ts --network arbitrumOne
```

### Docker Deployment

```bash
# Build images
docker build -t neurovault-backend:latest -f Dockerfile.backend .

# Run with compose
docker compose up -d

# Check logs
docker compose logs -f backend

# Stop services
docker compose down
```

## 🎯 Common Operations

### Submit Memory via Script

```bash
# Create helper script
cat > submit_memory.sh << 'EOF'
#!/bin/bash
TITLE="My Memory"
CATEGORY="history"
CID="QmTest123"

npx hardhat run --network localhost << HARDHAT_EOF
const registry = await ethers.getContractAt(
  "MemoryRegistryV2",
  "0x..."
);
const tx = await registry.submitMemory(
  "$CID",
  ethers.id("$TITLE"),
  "$TITLE",
  "$CATEGORY"
);
console.log(tx.hash);
HARDHAT_EOF
EOF
chmod +x submit_memory.sh
./submit_memory.sh
```

### Validate Memory via Script

```bash
npx ts-node scripts/autoSubmitValidation.ts \
  --memoryId 1 \
  --score 850 \
  --valid true
```

### Check Validator Status

```bash
npx hardhat console --network localhost

> const registry = await ethers.getContractAt("MemoryRegistryV2", "0x...");
> const validator = "0x...";
> await registry.isValidator(validator);
```

## 📞 Support

- Check `IMPLEMENTATION.md` for feature docs
- Review contract NatSpec comments
- Look at test files for usage examples
- Check backend API docstring at `/docs` (FastAPI)

## 🎓 Learning Resources

- Smart Contract Tests: `tests/MemoryRegistryV2.test.ts`
- Backend Tests: `backend/tests/test_api.py`
- Frontend Usage: `src/lib/onchain.ts`
- Validator Logic: `backend/validators/validator.py`
- Indexer: `infra/indexer.js`

---

**Last Updated:** November 2024
**Version:** 0.1.0
