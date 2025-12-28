# Stylus WASM Contract Deployment Guide

## Overview

This guide explains how to deploy the NeuroVault Memory Registry Stylus WASM contract to an Arbitrum network.

## Prerequisites

1. **Rust & Stylus toolchain:**
   ```bash
   rustup target add wasm32-unknown-unknown
   cargo install cargo-stylus
   ```

2. **Arbitrum Stylus-enabled node:**
   - Arbitrum Sepolia (testnet): https://sepolia-rollup.arbitrum.io/rpc
   - Arbitrum One (mainnet): https://arb1.arbitrum.io/rpc

3. **Deployer wallet with ETH:**
   - Testnet: Get free ETH from faucet
   - Mainnet: Need enough for deployment + activation fee

## Steps

### 1. Build WASM Artifact

```bash
cd contracts/stylus/memory_registry
cargo build --target wasm32-unknown-unknown --release

# Output: target/wasm32-unknown-unknown/release/memory_registry.wasm
```

### 2. Verify WASM Artifact (Local Test)

```bash
cd ../../../  # Return to repo root
node scripts/verify_wasm_fetch.js --local ./contracts/stylus/memory_registry/target/wasm32-unknown-unknown/release/memory_registry.wasm
```

Expected output:
```
✅ WASM instantiated successfully
✅ wasm_test_ping returned: 0xF00DBABE
```

### 3. Deploy Using Official Stylus Tool

#### Dry-run (preview):
```bash
export RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
npx ts-node contracts/stylus/deploy-stylus.ts --network arbitrumSepolia --dry-run
```

#### Live deployment (testnet):
```bash
export DEPLOYER_KEY=0x...  # Your private key (NEVER commit)
export RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

cargo stylus deploy \
  --wasm-file ./contracts/stylus/memory_registry/target/wasm32-unknown-unknown/release/memory_registry.wasm \
  --rpc-url $RPC_URL
```

#### Live deployment (mainnet):
```bash
export DEPLOYER_KEY=0x...
export RPC_URL=https://arb1.arbitrum.io/rpc

cargo stylus deploy \
  --wasm-file ./contracts/stylus/memory_registry/target/wasm32-unknown-unknown/release/memory_registry.wasm \
  --rpc-url $RPC_URL
```

### 4. Store Module ID

After successful deployment, you'll receive a `Stylus Module ID` (example: `0xabcd1234...`).

Save it:

```bash
# .env.local
echo "STYLUS_MODULE_ID=0xabcd1234..." >> .env.local

# GitHub secrets
gh secret set STYLUS_MODULE_ID --body "0xabcd1234..."
```

### 5. Update Contract Address in Frontend

```bash
# .env.local
VITE_MEMORY_REGISTRY_ADDRESS=0x<module-address-if-deployable>
```

## Cost Estimates

| Network | Type | Cost (approx) |
|---------|------|---------------|
| Arbitrum Sepolia | Deploy | ~$0 (testnet) |
| Arbitrum One | Deploy | 0.01-0.1 ETH |
| Arbitrum One | Activation fee | 0.01 ETH |

## Troubleshooting

### "WASM activation failed"
- Ensure contract doesn't exceed size limits (~4 MB)
- Verify bytecode is valid WebAssembly

### "RPC connection timeout"
- Check RPC endpoint is responding
- Verify network connectivity

### "Insufficient balance"
- Fund deployer wallet
- For testnet, use faucet: https://faucet.arbitrum.io

### "Contract already deployed"
- Check deployment status on block explorer
- Get existing module address and reuse it

## Advanced: Custom Storage

The current implementation uses in-memory storage for testing. For production, integrate Stylus host storage APIs:

```rust
// TODO: Replace with actual Stylus host calls
// use stylus_sdk::hostio::{input, output};
// use stylus_sdk::storage::StorageMap;

// let mut memory_store: StorageMap<u256, Vec<u8>> = StorageMap::new();
```

See: https://docs.arbitrum.io/stylus/

## References

- [Arbitrum Stylus Documentation](https://docs.arbitrum.io/stylus/)
- [cargo-stylus](https://github.com/arbitrum-foundation/cargo-stylus)
- [WASM Deployment Checklist](../../../FINALIZE.md)
