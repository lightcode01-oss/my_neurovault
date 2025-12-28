Memory Registry (Stylus) - Scaffold
=================================

This folder contains a minimal Rust/WASM scaffold that mimics a small
MemoryRegistry API surface for Stylus (Arbitrum's WASM runtime).

Key exported functions
- `memory_registry_version() -> u32` — returns a version number.
- `submit_memory(cid_ptr, cid_len) -> i32` — stores a CID string and returns the index (>=0), or negative error code.
- `get_memory_count() -> u32` — returns how many CIDs are stored in this WASM instance.
- `get_memory_by_index(index, out_ptr, out_max_len) -> i32` — copies the CID into the provided buffer and returns bytes written or negative error code.

Important notes
- This implementation keeps state in a process-local in-memory vector inside the WASM instance. Stylus on Arbitrum requires contracts to use host-provided storage APIs for persistent state — the in-memory store here is only for local development and experimentation.
- For a production Stylus contract you will need to replace these in-memory operations with runtime host storage calls (see Arbitrum Stylus docs).

Build
-----
From the `contracts/stylus/memory_registry` directory run (Windows PowerShell):

```powershell
.\build-memory-registry.ps1
# outputs: target/wasm32-unknown-unknown/release/memory_registry_stylus.wasm
```

Interop from JS
----------------
To call these functions from JS you will:

1. Load the WASM module and get its linear memory buffer.
2. Allocate a buffer inside WASM memory (for example using a simple allocator or a fixed region) and write the CID bytes into memory.
3. Call `submit_memory(ptr, len)` and read the returned index.
4. To read back a CID, call `get_memory_by_index(index, out_ptr, out_max_len)` and read bytes from the output buffer.

See `deploy-stylus-placeholder.md` in the parent folder for notes about deploying WASM to a Stylus-enabled Arbitrum node.
