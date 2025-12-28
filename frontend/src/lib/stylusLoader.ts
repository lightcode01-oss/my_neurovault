/**
 * frontend/src/lib/stylusLoader.ts
 *
 * Usage examples:
 *
 * import { loadStylusWasm } from './lib/stylusLoader';
 * await loadStylusWasm({ url: '/stylus_wasm.wasm', localFallbackPath: '/fallback/stylus_wasm.wasm' });
 *
 * This module attempts to load a Stylus wasm binary from a URL, verifies
 * the exported `wasm_test_ping()` sentinel, and exposes minimal wrapper
 * functions that call into the wasm exports. If wasm fails to load or
 * verify, the code falls back to a JS adapter implementation (stylusAdapterFallback).
 *
 * TODO: Prefer a canonical ABI via wit-bindgen/wasm-bindgen and provide
 * typed TypeScript bindings. Add integrity checks and signed releases.
 */

type StylusExports = {
  wasm_test_ping?: () => number;
  submit_memory?: (ptr: number, len: number) => number;
  get_memory_count?: () => number;
  get_memory_by_index?: (idx: number, ptr: number) => number;
  memory?: WebAssembly.Memory;
  // Any other export accessor
  [k: string]: any;
};

export async function loadStylusWasm(opts: { url?: string; localFallbackPath?: string } = {}) {
  const { url, localFallbackPath } = opts;
  let bytes: Uint8Array | null = null;

  async function fetchBytesFromUrl(u: string) {
    const res = await fetch(u);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${u}`);
    return new Uint8Array(await res.arrayBuffer());
  }

  // Try URL first
  if (url) {
    try {
      bytes = await fetchBytesFromUrl(url);
    } catch (err) {
      console.warn('Failed to fetch wasm from URL, will try local fallback:', err);
    }
  }

  // Try local fallback
  if (!bytes && localFallbackPath) {
    try {
      bytes = await fetchBytesFromUrl(localFallbackPath);
    } catch (err) {
      console.warn('Failed to fetch wasm from localFallbackPath:', err);
    }
  }

  // If still no bytes, fail and fallback to JS implementation
  if (!bytes) {
    console.warn('No wasm bytes available; using JS fallback adapter');
    const fallback = await import('../../src/lib/stylusAdapterFallback').catch(() => null);
    if (!fallback) throw new Error('stylusAdapterFallback not found');
    return { exports: fallback.default || fallback, instance: null };
  }

  // Instantiate the wasm
  let instance: WebAssembly.Instance | null = null;
  let exports: StylusExports | null = null;
  try {
    const mod = await WebAssembly.compile(bytes);
    instance = await WebAssembly.instantiate(mod, {});
    exports = instance.exports as StylusExports;
  } catch (err) {
    console.warn('WASM instantiate failed; falling back to JS adapter', err);
    const fallback = await import('../../src/lib/stylusAdapterFallback').catch(() => null);
    if (!fallback) throw err;
    return { exports: fallback.default || fallback, instance: null };
  }

  // Verify sentinel
  if (typeof exports.wasm_test_ping === 'function') {
    try {
      const val = exports.wasm_test_ping();
      if (val !== 0xF00DBABE) {
        throw new Error(`invalid wasm_test_ping result: ${val}`);
      }
    } catch (err) {
      console.warn('wasm_test_ping check failed; falling back to JS adapter', err);
      const fallback = await import('../../src/lib/stylusAdapterFallback').catch(() => null);
      if (!fallback) throw err;
      return { exports: fallback.default || fallback, instance: null };
    }
  } else {
    console.warn('wasm_test_ping export not present; falling back to JS adapter');
    const fallback = await import('../../src/lib/stylusAdapterFallback').catch(() => null);
    if (!fallback) throw new Error('stylusAdapterFallback not found');
    return { exports: fallback.default || fallback, instance: null };
  }

  // Wrap exports with safe API
  const api = {
    async initStylusWasm() {
      // noop for now; retained for API compatibility
      return true;
    },
    async submitMemory(payloadJson: string) {
      try {
        if (!exports) throw new Error('WASM exports missing');
        // TODO: Implement ABI to pass strings/structs into wasm memory.
        if (typeof exports.submit_memory === 'function') {
          // This naive path assumes wasm exposes a helper that accepts pointer/len.
          throw new Error('submitMemory ABI not implemented in loader — TODO');
        }
        throw new Error('submit_memory export not found');
      } catch (err) {
        // try fallback adapter
        const fb = await import('../../src/lib/stylusAdapterFallback');
        return fb.submitMemory ? fb.submitMemory(payloadJson) : Promise.reject(err);
      }
    },
    async getMemoryCount() {
      try {
        if (!exports) return 0;
        if (typeof exports.get_memory_count === 'function') return exports.get_memory_count();
        return 0;
      } catch (err) {
        const fb = await import('../../src/lib/stylusAdapterFallback');
        return fb.getMemoryCount ? fb.getMemoryCount() : 0;
      }
    },
    async getMemoryByIndex(idx: number) {
      try {
        if (!exports) throw new Error('WASM exports missing');
        if (typeof exports.get_memory_by_index === 'function') {
          // TODO: implement pointer/len host-to-wasm marshalling
          throw new Error('getMemoryByIndex ABI not implemented in loader — TODO');
        }
        throw new Error('get_memory_by_index export not found');
      } catch (err) {
        const fb = await import('../../src/lib/stylusAdapterFallback');
        return fb.getMemoryByIndex ? fb.getMemoryByIndex(idx) : null;
      }
    },
    __rawExports: exports,
    __instance: instance,
  };

  return { exports: api, instance };
}

export default loadStylusWasm;

// TODO: Implement proper memory marshalling, canonical ABI (WIT/WASM-Bindgen), and streaming uploads.export async function loadStylusWasm(options: { url?: string; localFallbackPath?: string } = {}) {
  // Prefer provided URL, then environment variable, then local public fallback
  const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_STYLUS_WASM_URL) ? (import.meta as any).env.VITE_STYLUS_WASM_URL : undefined;
  const { url = envUrl, localFallbackPath = '/wasm/stylus_wasm.wasm' } = options || {};

  async function instantiateFromResponse(resp: Response) {
    if (WebAssembly.instantiateStreaming) {
      try {
        const result = await WebAssembly.instantiateStreaming(resp);
        return result.instance.exports;
      } catch (e) {
        // fall through to arrayBuffer path
      }
    }
    const buf = await resp.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(buf);
    return instance.exports;
  }

  // Try URL first
  if (url) {
    try {
      console.log(`Attempting to fetch Stylus WASM from ${url}`);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const exports = await instantiateFromResponse(resp);
      if (exports.wasm_test_ping) {
        try {
          const v = (exports.wasm_test_ping as any)();
          console.log('wasm_test_ping returned', v);
        } catch (e) {
          console.warn('wasm_test_ping invocation failed', e);
        }
      }
      return exports;
    } catch (err) {
      console.warn('Fetching wasm from URL failed:', err.message || err);
    }
  }

  // Try local fallback
  try {
    console.log(`Attempting to load Stylus WASM from local path ${localFallbackPath}`);
    const resp = await fetch(localFallbackPath);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const exports = await instantiateFromResponse(resp);
    if (exports.wasm_test_ping) {
      try {
        const v = (exports.wasm_test_ping as any)();
        console.log('wasm_test_ping returned', v);
      } catch (e) {
        console.warn('wasm_test_ping invocation failed', e);
      }
    }
    return exports;
  } catch (err) {
    console.error('Failed to load Stylus WASM from fallback path:', err.message || err);
    throw err;
  }
}
