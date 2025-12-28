Building Stylus WASM (memory_registry)

This document explains how to build the Rust smart contract to a WASM artifact suitable for Stylus deployment.

Prerequisites

- Rust toolchain (rustup / cargo)
- `wasm32-unknown-unknown` target
- Windows PowerShell (or similar shell)

Quick commands

1. Install Rust (if needed):

```powershell
# Install rustup (Windows installer)
Invoke-WebRequest -Uri https://win.rustup.rs -OutFile $env:TEMP\rustup-init.exe
Start-Process $env:TEMP\rustup-init.exe -ArgumentList '-y' -Wait
# Restart shell after installation
```

2. Add WASM target:

```powershell
rustup target add wasm32-unknown-unknown
```

3. Build the contract:

```powershell
cd contracts/stylus/memory_registry
cargo build --target wasm32-unknown-unknown --release
```

Expected artifact

- `contracts/stylus/memory_registry/target/wasm32-unknown-unknown/release/memory_registry.wasm`

If you prefer an automated helper, run the helper from the project root (PowerShell):

```powershell
pwsh ./scripts/build_wasm.ps1
```

This script will try to install rustup (if missing) and build the WASM.

Notes

- The helper script attempts a silent install of rustup on Windows. If you prefer, install Rust manually via https://rustup.rs and ensure `%USERPROFILE%\.cargo\bin` is in your PATH.
- After building, re-run the deploy script in dry-run mode to validate the artifact path:

```powershell
npx ts-node contracts/stylus/deploy-stylus.ts --network arbitrumSepolia --wasm-path ./contracts/stylus/memory_registry/target/wasm32-unknown-unknown/release/memory_registry.wasm --dry-run
```
