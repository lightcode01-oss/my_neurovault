# Stylus (Arbitrum WASM) example

This folder contains a minimal example scaffold for building a Stylus-compatible WebAssembly (WASM) contract using Rust.

Overview
- The example demonstrates a tiny `add(a, b)` exported function compiled to WASM.
- This is a starting point — real Stylus contracts may require specific runtime bindings or SDK support from Arbitrum.

Files
- `Cargo.toml` — Rust crate file for the example.
- `src/lib.rs` — minimal Rust source that exports a function to WASM.
- `build-stylus.ps1` — PowerShell helper to build the WASM artifact on Windows.

Notes
- You still keep Solidity contracts in `contracts/` — this scaffold demonstrates how to add Stylus contracts alongside them.
- Deploying to a Stylus-enabled Arbitrum node requires platform-specific tooling. See Arbitrum Stylus docs for the latest deploy commands.

Next steps
- Replace or reimplement your Solidity logic in Rust (or another language that compiles to WASM).
- Add integration tests and a deployment pipeline that targets a Stylus-enabled network.
