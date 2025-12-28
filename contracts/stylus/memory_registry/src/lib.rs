//! Minimal Stylus (WASM) scaffold for a MemoryRegistry-like contract.
//!
//! NOTE: This is a placeholder/proof-of-concept showing how you might
//! structure exported functions for a WASM contract. Stylus on Arbitrum
//! requires runtime host bindings for storage, logging, and calling other
//! contracts. Those bindings are not implemented here — this crate
//! demonstrates the Rust -> WASM build and a simple exported API.

use core::slice;
use once_cell::sync::Lazy;
use std::sync::Mutex;

// WARNING:
// This crate implements an in-memory store inside the WASM instance for
// local testing and demonstration only. Real Stylus contracts MUST use
// the Stylus/Arbitrum host storage APIs to persist state across calls and
// re-instantiations. The store below will be lost when the module is
// reloaded and may not reflect actual Stylus runtime behavior.

static MEMORIES: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));

#[no_mangle]
pub extern "C" fn memory_registry_version() -> u32 {
    1
}

/// Submit a memory CID to the registry.
///
/// Parameters:
/// - `cid_ptr` / `cid_len`: pointer + length of the CID bytes in linear memory.
///
/// Returns: index (>=0) on success, negative error code on failure.
#[no_mangle]
pub extern "C" fn submit_memory(cid_ptr: *const u8, cid_len: usize) -> i32 {
    if cid_ptr.is_null() || cid_len == 0 {
        return -1; // invalid args
    }

    let cid_bytes = unsafe { slice::from_raw_parts(cid_ptr, cid_len) };
    let cid_str = match std::str::from_utf8(cid_bytes) {
        Ok(s) => s.to_string(),
        Err(_) => return -2, // invalid utf8
    };

    let mut store = MEMORIES.lock().unwrap();
    store.push(cid_str);
    // Return index of newly inserted memory
    (store.len() as i32) - 1
}

/// Returns the number of memories stored in this instance (placeholder).
#[no_mangle]
pub extern "C" fn get_memory_count() -> u32 {
    let store = MEMORIES.lock().unwrap();
    store.len() as u32
}

/// Read a stored CID into a provided buffer.
///
/// Parameters:
/// - `index`: zero-based index of the stored CID
/// - `out_ptr` / `out_max_len`: pointer + max length of the buffer in linear memory
///
/// Returns: number of bytes written, or negative error code.
#[no_mangle]
pub extern "C" fn get_memory_by_index(index: u32, out_ptr: *mut u8, out_max_len: usize) -> i32 {
    if out_ptr.is_null() || out_max_len == 0 {
        return -1;
    }

    let store = MEMORIES.lock().unwrap();
    let idx = index as usize;
    if idx >= store.len() {
        return -2; // not found
    }

    let cid = &store[idx];
    let bytes = cid.as_bytes();
    if bytes.len() > out_max_len {
        return -3; // buffer too small
    }

    unsafe {
        let dst = std::slice::from_raw_parts_mut(out_ptr, bytes.len());
        dst.copy_from_slice(bytes);
    }

    bytes.len() as i32
}

// Note: Event emission, persistent storage, and other runtime features
// require Stylus host bindings. This scaffold helps you iterate on the
// API surface and local testing, but is not a production implementation.

/// Small test ping exported for CI / smoke-tests to validate the
/// WebAssembly artifact can be instantiated and called from JS/Node.
/// Returns a fixed magic value on success.
#[no_mangle]
pub extern "C" fn wasm_test_ping() -> u32 {
    0xF00DBABE_u32
}
