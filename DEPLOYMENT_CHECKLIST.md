# Deployment Checklist - v1.0.0

## Quick Start
```bash
# Build everything
npm run build
npm run build:wasm:copy

# Verify builds
npm run verify:wasm:local
npm run test:run

# Run locally
npm run dev               # Frontend on http://localhost:5173
python backend/app_run.py # Backend on http://localhost:8001
python backend/validators/validator.py --once --dry  # Test validator
```

## Pre-Flight Checklist

- [ ] **Code Review**
  - [ ] All PRs merged
  - [ ] No console errors in dev
  - [ ] All tests passing (npm run test:run)
  - [ ] TypeScript check passing (npm run type-check)

- [ ] **Environment**
  - [ ] .env.local configured
  - [ ] Database initialized (DB_PATH exists)
  - [ ] VITE_BACKEND_URL set to correct endpoint
  - [ ] Python 3.8+ with FastAPI and uvicorn

- [ ] **Build Artifacts**
  - [ ] Frontend build complete (build/ directory)
  - [ ] WASM compiled (public/stylus/memory_registry.wasm)
  - [ ] All assets under 2MB total
  - [ ] No broken asset references

- [ ] **Testing**
  - [ ] Frontend: npm run test:run (34/34 passing)
  - [ ] Backend: pytest backend/tests/test_validation_flow.py (1/1 passing)
  - [ ] E2E: Manual smoke test (submit → validate → check status)

- [ ] **Deployment Strategy**
  - [ ] Decide hosting platform (Vercel, Netlify, self-hosted, etc.)
  - [ ] Decide backend hosting (AWS, Heroku, self-hosted, etc.)
  - [ ] Plan for database backups
  - [ ] Plan for validator daemon deployment
  - [ ] Decide on contract network (testnet first, then mainnet)

## Deployment Steps

### Phase 1: Staging Deployment (Optional)
1. Deploy frontend to staging environment
2. Deploy backend to staging server
3. Run full E2E tests against staging
4. Get stakeholder sign-off

### Phase 2: Production Frontend Deployment
```bash
# Build
npm run build

# Deploy to your platform
# Example: Vercel
npm install -g vercel
vercel --prod

# Example: AWS S3 + CloudFront
aws s3 sync build/ s3://your-bucket/ --delete
```

### Phase 3: Production Backend Deployment
```bash
# On your server:
cd /opt/neurovault
git pull origin main

# Install/update dependencies
pip install -r requirements.txt

# Set environment variables
export DB_PATH=/var/lib/neurovault/data/neurovault.sqlite3
export VITE_BACKEND_URL=https://api.neurovault.com
export PORT=8001

# Start service (use supervisor, systemd, or Docker)
python backend/app_run.py
# OR with uvicorn:
uvicorn backend.app_run:app --host 0.0.0.0 --port 8001 --workers 4

# Enable auto-restart on reboot (systemd example)
sudo systemctl enable neurovault-backend
```

### Phase 4: Validator Daemon Deployment
```bash
# On a separate server or background process:
python backend/validators/validator.py --backend https://api.neurovault.com:8001

# Or with supervisor/systemd for auto-restart on failure
# Configuration example for systemd:
[Unit]
Description=NeuroVault Validator Daemon
After=network.target

[Service]
Type=simple
User=neurovault
WorkingDirectory=/opt/neurovault
ExecStart=/usr/bin/python3 backend/validators/validator.py --backend https://api.neurovault.com:8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Phase 5: WASM Contract Deployment
```bash
# Testnet (Arbitrum Sepolia)
npx ts-node contracts/stylus/deploy-stylus.ts \
  --network arbitrumSepolia \
  --wasm-path ./public/stylus/memory_registry.wasm

# Save the deployed contract address for use in frontend

# Mainnet (when ready)
npx ts-node contracts/stylus/deploy-stylus.ts \
  --network arbitrumMainnet \
  --wasm-path ./public/stylus/memory_registry.wasm
```

## Post-Deployment Verification

### Health Checks
```bash
# Frontend
curl https://your-frontend-url
# Should return HTML with no errors

# Backend
curl https://your-backend-url/memories
# Should return JSON array

# Validator (check logs)
# Should see "Processed X candidates" every 30 seconds
```

### Functional Testing
1. **Submit Memory**
   - Fill form on frontend
   - Click submit
   - Verify CID appears
   
2. **Validation Flow**
   - Check backend receives memory (GET /memories)
   - Validator should process it
   - Frontend should show validation status
   - Status should update (PENDING → PASSED/FAILED)

3. **Database**
   - Check memory records exist
   - Check validation records exist
   - Verify status column is updated

### Performance Testing
- Frontend Lighthouse score: target 90+
- Backend response time: target <500ms
- Database query time: target <100ms

## Rollback Plan

### If Frontend Breaks
```bash
# Revert to previous build
git revert <commit-hash>
npm run build
# Redeploy
```

### If Backend Breaks
```bash
# Stop service
systemctl stop neurovault-backend

# Restore database backup
cp /backups/neurovault.sqlite3.bak $DB_PATH

# Restart service
systemctl start neurovault-backend
```

### If WASM Deployment Fails
- Use previous contract address in frontend config
- No action needed (contract already deployed)

## Monitoring Setup

### Logging
- Backend: Enable uvicorn logging at INFO level
- Validator: Log to file for audit trail
- Frontend: Use browser error tracking (Sentry, LogRocket)

### Metrics
- API response times (avg, p95, p99)
- Memory submission rate
- Validation success rate
- Database size growth
- Validator daemon uptime

### Alerts
- Backend service down
- Database size > threshold
- Validator daemon not responding
- High error rate (>5%)

## Sign-Off

- [ ] **Development Lead**: _______________ Date: _______
- [ ] **QA Lead**: _______________ Date: _______
- [ ] **Operations**: _______________ Date: _______

## Notes
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---
Generated: 2025-11-23
Version: v1.0.0
