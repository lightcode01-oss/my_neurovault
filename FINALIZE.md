# FINALIZE.md — Release Preparation Checklist

This document guides maintainers through the final steps to release NeuroVault Memory Network to production.

## 📋 Pre-Release Checklist

### Code Quality
- [ ] All tests passing: `npm test && pytest tests/`
- [ ] TypeScript: `npx tsc --noEmit` (0 errors)
- [ ] Linting: `npm run lint` (no critical issues)
- [ ] WASM smoke test: `node scripts/verify_wasm_fetch.js --local <wasm-path>`

### Documentation
- [ ] README.md updated with latest features
- [ ] API docs generated: `/backend/docs/`
- [ ] CHANGELOG updated with version notes
- [ ] Security audit completed (security/README.md)
- [ ] Deployment guide reviewed (contracts/stylus/DEPLOY_GUIDE.md)

### Testing
- [ ] Unit tests: `npm test` (vitest)
- [ ] Backend tests: `pytest tests/e2e/`
- [ ] E2E smoke test: `node scripts/verify_wasm_fetch.js`
- [ ] Manual testing on testnet

### Dependencies
- [ ] All npm packages up-to-date: `npm outdated`
- [ ] Python packages checked: `pip list --outdated`
- [ ] No security vulnerabilities: `npm audit`

---

## 🚀 FINAL PROMPT FOR MAINTAINERS

Execute these steps **manually outside the repo** to complete the release:

### Step 1: Fetch and Verify Latest WASM Artifact

```bash
# Go to GitHub Releases: https://github.com/YOUR_ORG/NeuroVault-Memory-Network/releases
# Find the latest tag matching pattern: stylus-wasm-*
# Example tag: stylus-wasm-abc123def456

# Download the WASM artifact and SHA256:
GITHUB_TAG="stylus-wasm-abc123def456"
WASM_URL="https://github.com/YOUR_ORG/NeuroVault-Memory-Network/releases/download/${GITHUB_TAG}/stylus_wasm.wasm"
SHA_URL="https://github.com/YOUR_ORG/NeuroVault-Memory-Network/releases/download/${GITHUB_TAG}/stylus_wasm.wasm.sha256"

# Fetch and verify
npm run fetch:wasm -- --url "$WASM_URL" --sha-url "$SHA_URL"

# Output should show:
# ✅ WASM instantiated successfully
# ✅ wasm_test_ping returned: 0xF00DBABE
```

### Step 2: Sign WASM Artifact with GPG (Recommended)

```bash
# If you haven't set up GPG:
gpg --gen-key

# Sign the WASM
gpg --default-key your-email@example.com \
    --sign --armor \
    public/stylus/stylus_wasm.wasm

# Publish signature alongside WASM in release
# (This proves the artifact was built by you and hasn't been tampered with)
```

### Step 3: Deploy to Stylus-Enabled Arbitrum Node

```bash
# Prerequisites:
# 1. Install Stylus deploy tool: cargo install cargo-stylus
# 2. Ensure RPC_URL points to a Stylus-enabled node
# 3. Fund deployer wallet with test ETH (Sepolia testnet)

export RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
export DEPLOYER_KEY="0x..."  # Your private key (NEVER commit)

# Deploy to testnet first
cargo stylus deploy \
  --wasm-file public/stylus/stylus_wasm.wasm \
  --rpc-url "$RPC_URL"

# On success, you'll receive:
# Stylus Module ID: 0x1234567890abcdef...
# Activation cost: ~0.01 ETH
```

### Step 4: Store Stylus Module ID in .env and Secrets

```bash
# Update .env.local (local development)
echo "STYLUS_MODULE_ID=0x1234567890abcdef..." >> .env.local

# Update GitHub Secrets (for CI/CD)
gh secret set STYLUS_MODULE_ID --body "0x1234567890abcdef..."

# Verify secret was set
gh secret list | grep STYLUS_MODULE_ID
```

### Step 5: Run Full Integration Test

```bash
# Start backend in one terminal
npm run dev:backend

# In another terminal, run the full demo
npm run run-demo

# Expected output:
# ✅ Memory 1 submitted
# ✅ Memory 2 submitted
# ✅ Memory 3 submitted
# ✅ Validations complete
```

### Step 6: Run E2E Test Suite

```bash
# Run all tests (backend + frontend)
pytest tests/e2e/

# Expected: All tests pass
# If any fail, review test output and fix issues
```

### Step 7: Create Release Tag and Publish

```bash
# Ensure all changes are committed
git status  # Should show no uncommitted changes

# Create release tag (follow semver: vX.Y.Z)
git tag -a v1.0.0 -m "Release v1.0.0: NeuroVault Memory Network

- Complete Stylus WASM contract implementation
- Multi-chain deployment support (Arbitrum, Base, Optimism)
- Full E2E testing suite
- Security hardening and best practices
- API documentation and examples

Stylus Module ID: 0x1234567890abcdef...
WASM SHA256: 0xabcd1234...

Breaking changes: None
Upgrade path: Seamless from v0.9.x

For detailed changelog, see CHANGELOG.md"

# Sign the tag with GPG
git tag -u your-email@example.com -a v1.0.0

# Push tag to GitHub
git push origin v1.0.0

# Create GitHub Release from tag
gh release create v1.0.0 \
  --title "NeuroVault v1.0.0" \
  --notes "See git tag for release notes" \
  public/stylus/stylus_wasm.wasm \
  public/stylus/stylus_wasm.wasm.sha256 \
  public/stylus/stylus_wasm.wasm.asc
```

### Step 8: Update Documentation

```bash
# Update version in key files
sed -i 's/0.9.0/1.0.0/g' package.json
sed -i 's/0.9.0/1.0.0/g' contracts/stylus/Cargo.toml

# Commit version bump
git add package.json contracts/stylus/Cargo.toml
git commit -m "chore: bump version to 1.0.0"
git push origin main
```

### Step 9: Announce Release

```bash
# Post release notes to community channels
echo "🎉 NeuroVault Memory Network v1.0.0 Released!

Key features:
- Arbitrum Stylus WASM contracts
- Multi-chain deployment
- Full E2E testing

Download WASM: https://github.com/YOUR_ORG/NeuroVault-Memory-Network/releases/download/v1.0.0/stylus_wasm.wasm
Testnet: https://sepolia.arbiscan.io/address/0x...
Docs: https://github.com/YOUR_ORG/NeuroVault-Memory-Network#readme" | \
  # Post to Discord, Twitter, etc.
```

---

## 📊 Post-Release Validation

After release, verify everything is working:

```bash
# 1. Verify GitHub Release assets
open "https://github.com/YOUR_ORG/NeuroVault-Memory-Network/releases/tag/v1.0.0"

# 2. Check WASM is accessible
curl -I "https://github.com/YOUR_ORG/NeuroVault-Memory-Network/releases/download/v1.0.0/stylus_wasm.wasm"
# Should return HTTP 200

# 3. Verify Stylus Module on testnet
# Check Arbiscan for module ID: https://sepolia.arbiscan.io/address/0x...

# 4. Test fresh installation
mkdir /tmp/neurovault-test
cd /tmp/neurovault-test
git clone -b v1.0.0 https://github.com/YOUR_ORG/NeuroVault-Memory-Network.git
cd NeuroVault-Memory-Network
npm install
npm run build
npm test

# All should succeed!
```

---

## 🔄 Rollback Procedure (If Needed)

```bash
# If critical issues are found after release:

# 1. Delete faulty release tag
git tag -d v1.0.0
git push origin --delete v1.0.0

# 2. Delete GitHub release
gh release delete v1.0.0

# 3. Revert commits if they were merged
git revert <commit-hash>
git push origin main

# 4. Tag a patch release
git tag -a v1.0.1 -m "Hotfix: <description>"
git push origin v1.0.1
```

---

## 📝 Release Notes Template

```markdown
# NeuroVault Memory Network v1.0.0

## 🎉 Highlights

- **Stylus/WASM:** Full Arbitrum Stylus support for 90% lower gas costs
- **Multi-chain:** Deploy to Arbitrum, Base, Optimism, and zkSync
- **Security:** Hardened validation, rate limiting, and key rotation
- **Testing:** Complete E2E test suite and smoke tests

## ✨ Features

### New
- Stylus WASM contract implementation
- Multi-chain deployment orchestrator
- Rate-limited API endpoints
- Deterministic embedding fallbacks
- Security audit checklist

### Improved
- Indexer incremental sync
- Validator scoring algorithm
- Database query optimization
- Error messages and logging

### Fixed
- WASM instantiation on Node.js 18+
- TypeScript type errors
- Python syntax issues
- Workflow YAML validation

## 🚀 Deployment

### Testnet
```bash
# Deploy to Arbitrum Sepolia
cargo stylus deploy --wasm-file stylus_wasm.wasm \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### Mainnet
```bash
# Deploy to Arbitrum One (requires ~0.01 ETH for activation)
cargo stylus deploy --wasm-file stylus_wasm.wasm \
  --rpc-url https://arb1.arbitrum.io/rpc
```

## 📦 Assets

- `stylus_wasm.wasm` — WASM artifact (signed)
- `stylus_wasm.wasm.sha256` — Integrity check
- `stylus_wasm.wasm.asc` — GPG signature

## 🔗 Links

- [CHANGELOG](../../CHANGELOG.md)
- [Deployment Guide](../../contracts/stylus/DEPLOY_GUIDE.md)
- [Security Guide](../../docs/security/README.md)
- [API Documentation](../../backend/docs/)

## ⚠️ Breaking Changes

None. Upgrade seamlessly from v0.9.x.

## 👥 Contributors

Thanks to all contributors who made this release possible!
```

---

## ✅ Final Sign-Off

- [ ] All checklist items completed
- [ ] Release published on GitHub
- [ ] Community notified
- [ ] Documentation updated
- [ ] Version bump committed
- [ ] Deployment verified on testnet/mainnet

**Release by:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Version:** v1.0.0

---

Last updated: 2025-11-23

## Deployment Steps (Automated)

Run the automated release checklist and smoke tests before promoting to mainnet:

```bash
# Run verification and smoke tests in dry-run mode
./scripts/release_check.sh --dry

# If everything looks good, perform an operator deploy to testnet (dry-run already exercised):
npx ts-node contracts/stylus/deploy-stylus.ts --network arbitrumSepolia --wasm-path public/stylus/memory_registry.wasm --dry-run

# After manual verification and audit, deploy to mainnet with explicit confirmation (DO NOT automate in CI):
# !!! ACTION REQUIRED: Set DEPLOYER_KEY and STYLUS_NODE_RPC in environment for mainnet deployment
npx ts-node contracts/stylus/deploy-stylus.ts --network arbitrumOne --wasm-path public/stylus/memory_registry.wasm

# Verify release artifacts locally (download from GitHub release and run verifier):
./scripts/verify_release_artifacts.sh <owner> <repo> <tag>

```

// TODO: GPG sign artifacts using `gpg --sign` and store signature alongside release assets. !!! ACTION REQUIRED

