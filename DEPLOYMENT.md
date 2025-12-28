# NeuroVault v1.0.0 Deployment Guide

## Build Status ✅

### Frontend Build
- **Status**: ✅ Complete
- **Location**: `build/`
- **Artifacts**:
  - `build/index.html` (0.61 kB, gzip: 0.33 kB)
  - `build/assets/index-DDEq2I86.js` (491.39 kB, gzip: 154.93 kB)
  - `build/assets/vendor-ipfs-DVW1VsNc.js` (538.65 kB, gzip: 138.65 kB)
  - `build/assets/vendor-ethers-BwlW12PN.js` (7.36 kB, gzip: 3.24 kB)
  - `build/assets/index-uFyRsnH9.css` (66.61 kB, gzip: 10.19 kB)
- **Build Time**: 6.21s
- **Module Count**: 3034 modules transformed

### WASM Contract Build
- **Status**: ✅ Complete
- **Location**: `contracts/stylus/memory_registry/target/wasm32-unknown-unknown/release/memory_registry_stylus.wasm`
- **Size**: 35,574 bytes
- **Build Time**: 4.69s
- **Target**: wasm32-unknown-unknown (Stylus)
- **Copy Destination**: `public/stylus/memory_registry.wasm`

### Backend
- **Status**: ✅ Ready
- **Framework**: FastAPI + SQLite
- **Server File**: `backend/app_run.py` (clean, single-file implementation)
- **Port**: 8001
- **Features**:
  - Deterministic embedding fallback (no OpenAI key required)
  - Memory submission and validation endpoints
  - Rule-based validation scoring
  - Background task scheduling support

### Validator Daemon
- **Status**: ✅ Ready
- **Language**: Python
- **File**: `backend/validators/validator.py`
- **Features**:
  - Polls backend for pending validations
  - Deterministic scoring (dry-run capable)
  - Supports `--once` and `--interval` modes
  - Works without VALIDATOR_KEY in dry-run

## Test Results ✅

### Frontend Tests (Vitest)
```
Test Files:  6 passed (6)
Tests:       34 passed (34)
Duration:    7.09s
```

### Backend Tests (pytest)
```
Test: test_validation_flow.py
Status: 1 passed
Duration: 0.45s
```

## Deployment Checklist

### Pre-Deployment
- [ ] Review and update environment variables (`.env.local`)
  - `DB_PATH`: SQLite database path
  - `OPENAI_KEY`: (optional) OpenAI API key for embeddings
  - `VALIDATOR_KEY`: (optional) Validator authorization key
  - `VALIDATE_SYNC`: Enable synchronous validation on memory creation
  - `VITE_BACKEND_URL`: Backend API endpoint URL

- [ ] Verify all tests pass:
  ```bash
  npm run test:run
  npm run type-check
  ```

- [ ] Build artifacts exist:
  ```bash
  ls -la build/
  ls -la public/stylus/memory_registry.wasm
  ```

### Deployment Steps

#### 1. Frontend Deployment
```bash
# Build is complete in `build/`
# Deploy to your static hosting (Vercel, Netlify, AWS S3, etc.)
# Make sure VITE_BACKEND_URL environment variable is set for API endpoint

# Example (Vercel):
vercel --prod --build-env VITE_BACKEND_URL=https://api.neurovault.com
```

#### 2. Backend Deployment
```bash
# Install dependencies
pip install fastapi uvicorn pydantic

# Set environment variables
export DB_PATH=/var/lib/neurovault/neurovault.sqlite3
export VITE_BACKEND_URL=http://localhost:8001  # or your backend URL
export PORT=8001

# Run server
python backend/app_run.py
# or with uvicorn
uvicorn backend.app_run:app --host 0.0.0.0 --port 8001 --workers 4
```

#### 3. Validator Daemon (Optional)
```bash
# Run as continuous daemon (checks every 30s)
python backend/validators/validator.py --backend http://your-backend-url:8001

# Run once for testing
python backend/validators/validator.py --once --dry --backend http://your-backend-url:8001
```

#### 4. WASM Contract Deployment (Stylus)
```bash
# Deploy to Arbitrum Sepolia testnet (dry-run first)
npx ts-node contracts/stylus/deploy-stylus.ts \
  --network arbitrumSepolia \
  --wasm-path ./public/stylus/memory_registry.wasm \
  --dry-run

# Deploy to mainnet (when ready)
npx ts-node contracts/stylus/deploy-stylus.ts \
  --network arbitrumMainnet \
  --wasm-path ./public/stylus/memory_registry.wasm
```

### Post-Deployment Verification

#### 1. Frontend
```bash
# Test the deployed frontend
curl https://your-app-url

# Verify asset loading
# Check browser console for no errors
```

#### 2. Backend
```bash
# Health check
curl http://localhost:8001/memories

# Create test memory
curl -X POST http://localhost:8001/memories \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","summary":"Testing deployment"}'

# List memories
curl http://localhost:8001/memories
```

#### 3. End-to-End Flow
1. Submit a memory from the frontend
2. Check backend receives it: `GET /memories`
3. Trigger validation: `POST /validate`
4. Verify status updates: `GET /memories/{id}`
5. Check validations: `GET /validations?memoryId={id}`

### Environment Variables

#### Frontend (.env.local)
```
VITE_BACKEND_URL=http://localhost:8001
```

#### Backend (OS Environment)
```
DB_PATH=./data/neurovault.sqlite3
OPENAI_KEY=sk-...          # Optional
VALIDATOR_KEY=val_...      # Optional
VALIDATE_SYNC=false        # true to validate on create
PORT=8001
```

## Rollback Plan

If deployment fails:

1. **Frontend**: Revert to previous build, redeploy
2. **Backend**: Stop service, restore previous `DB_PATH` backup, restart
3. **WASM**: If contract deployment fails, use previous contract address

## Monitoring

### Key Metrics to Monitor
- Frontend bundle size (should be <2MB total)
- Backend API response times (target <500ms)
- Database query performance
- Validator daemon uptime and success rate
- Memory submission and validation rates

### Logging
- Backend logs: check stdout/stderr from uvicorn
- Validator logs: check stdout from validator.py
- Frontend errors: browser console (user-facing)

## Support & Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check DB_PATH exists
mkdir -p $(dirname $DB_PATH)

# Check port is free
netstat -an | grep 8001
```

**Validator not processing**
```bash
# Test connectivity to backend
curl http://backend:8001/memories

# Run in verbose mode
python backend/validators/validator.py --once --dry --backend http://localhost:8001
```

**Frontend can't reach backend**
```bash
# Check VITE_BACKEND_URL is set correctly
# Check CORS settings in backend if needed
# Check network connectivity
```

## Version Info
- **NeuroVault Version**: v1.0.0
- **Build Date**: 2025-11-23
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: FastAPI + SQLite
- **WASM Target**: Stylus (Arbitrum)
- **Node Version**: 18+
- **Python Version**: 3.8+
