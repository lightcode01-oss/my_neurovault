# Deploying Stylus WASM artifacts (placeholder)

This file documents a placeholder workflow for deploying Stylus (WASM) artifacts to a Stylus-enabled Arbitrum node. Tooling and RPC endpoints for Stylus evolve — consult Arbitrum's official docs for exact commands.

Suggested flow:

1. Build your Rust crate to produce a `.wasm` artifact.

```powershell
cd contracts/stylus/memory_registry
.\build-memory-registry.ps1
# artifact: target/wasm32-unknown-unknown/release/memory_registry_stylus.wasm
```

2. (Optional) Optimize the WASM with `wasm-opt` (Binaryen) for smaller and faster code.

3. Use Arbitrum/Stylus deployment tooling or RPC to upload the WASM. Example (pseudocode):

```text
# Upload wasm bytes to network and obtain a code id / address
# Then instantiate or register the module in the Stylus runtime.
# Exact commands depend on the Arbitrum Stylus CLI / SDK.
```

4. Call exported functions from the contract via the Stylus runtime or via a compatibility shim that exposes EVM-like calls.

Notes
- This project includes only a scaffold. Deploy automation and integration tests require a Stylus-enabled endpoint.
- If you tell me which network (Arbitrum testnet/devnet) you plan to use, I can look up or draft more specific deploy commands.
