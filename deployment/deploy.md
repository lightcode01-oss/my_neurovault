# Deployment Guide — NeuroVault Memory Network

## Overview
This guide covers deploying NeuroVault to production using Vercel, Netlify, or self-hosted solutions.

## Quickstart with Vercel (Recommended)

### 1. Setup
```bash
npm install -g vercel
vercel
# Follow the prompts to link your GitHub repo
```

### 2. Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables, add:

```
# Production (Arbitrum mainnet)
VITE_RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR_KEY
VITE_TARGET_CHAIN_ID=42161
VITE_MEMORY_REGISTRY_ADDRESS=0x...
VITE_IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
VITE_IPFS_GATEWAY=https://dweb.link/ipfs
VITE_WEB3STORAGE_KEY=eyJ...
VITE_BLOCK_EXPLORER_BASE=https://arbiscan.io
SENTRY_DSN=https://...@sentry.io/...
```

### 3. Deploy
```bash
vercel --prod
```

## Deployment to Netlify

### 1. Connect Repository
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select your repository

### 2. Build Settings
- **Build command:** `npm run build`
- **Publish directory:** `build`

### 3. Environment Variables
In Site settings → Build & deploy → Environment, add all vars from `.env.production.example`

### 4. Deploy
Netlify auto-deploys on git push to main

## Self-Hosted Deployment

### Using Docker
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

### Build & Run
```bash
docker build -t neurovault:latest .
docker run -e VITE_RPC_URL=... -p 3000:3000 neurovault:latest
```

## Environment Variables by Stage

### Development
- Use local Stylus-enabled node or Stylus deploy tooling for WASM artifacts (preferred).
- If you need EVM emulation for legacy Solidity artifacts, you may run an EVM local node (Hardhat/Anvil) on port 8545, but this is optional and legacy.
- `VITE_TARGET_CHAIN_ID=31337` is commonly used for local EVM emulation only; Stylus deployments may use different chain IDs depending on your node configuration.

### Staging (Arbitrum Sepolia)
- `.env.staging.example` template
- `VITE_TARGET_CHAIN_ID=11155111`
- Use Sepolia testnet RPC and contract
- Full integration testing before prod

### Production (Arbitrum One)
- `.env.production.example` template
- `VITE_TARGET_CHAIN_ID=42161`
- Mainnet RPC and deployed MemoryRegistry contract
- Enable Sentry monitoring (`SENTRY_DSN`)

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Contract address deployed and verified
- [ ] IPFS/web3.storage API keys valid
- [ ] Wallet connects successfully on target network
- [ ] Manual E2E tests pass (see `tests/manual-e2e-checklist.md`)
- [ ] Unit tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] Production build is < 2MB (check `build/` folder)

## Browser Support

Supported browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

MetaMask injection required. Users without a wallet will see a connection prompt.

## Block Explorers

| Network | Base URL | Example TX |
|---------|----------|-----------|
| Arbitrum One | https://arbiscan.io | `/tx/0x...` |
| Arbitrum Sepolia | https://sepolia.arbiscan.io | `/tx/0x...` |
| Ethereum Sepolia | https://sepolia.etherscan.io | `/tx/0x...` |

## Monitoring & Analytics

### Error Tracking with Sentry
1. Create a [Sentry](https://sentry.io) account
2. Create a new React project
3. Copy DSN and set `SENTRY_DSN` env var
4. Errors are automatically captured with user context and transaction info

### Performance Monitoring
Vite automatically generates bundle analysis. Check build output:
```bash
npm run build
# Check build/ directory size
du -sh build/
```

## Troubleshooting

### Issue: "User rejected transaction"
- User clicked reject in wallet
- Check MetaMask is on correct network

### Issue: "Contract not found"
- `VITE_MEMORY_REGISTRY_ADDRESS` points to invalid address
- Verify contract is deployed on target chain

### Issue: "IPFS upload timeout"
- Network latency or Infura overloaded
- Falls back to web3.storage automatically
- Verify `VITE_WEB3STORAGE_KEY` is set

### Issue: Large bundle size warnings
- Build has manual chunk splitting for vendor code
- Splitting optimizes caching but increases total size
- Expected: ~600KB+ due to ethers, radix-ui, ipfs libraries

## Post-Deployment

1. Test wallet connection on prod
2. Submit a test memory to verify end-to-end flow
3. Check block explorer for transaction
4. Monitor Sentry for errors (if enabled)
5. Set up CI/CD for auto-deploys on main branch

## Continuous Integration

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: vercel/action@v5
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## Support
For issues or questions, check:
- `docs/` folder for technical guides
- `tests/manual-e2e-checklist.md` for testing procedures
- GitHub Issues for bug reports
