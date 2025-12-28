// Minimal WASM export example for Stylus
// Exports a simple `add` function as a demonstration artifact.

#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Note: Real Stylus contracts will often require specific ABI conventions
// or bindings from the Stylus/Arbitrum SDK. Treat this as a placeholder
// to validate the Rust -> WASM build pipeline.
