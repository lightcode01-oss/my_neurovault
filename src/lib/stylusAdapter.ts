/*
  Stylus WASM adapter (frontend)

  - Loads a Stylus-compiled WebAssembly module (wasm) and exposes
    simple async functions used by the UI: `initStylusWasm`,
    `submitMemory`, `getMemoryCount`, `getMemoryByIndex`.

  - This adapter uses a small fixed scratch-buffer strategy to write
    strings into wasm memory when the wasm module does not export
    an allocator. For production, prefer a crate that exports an
    `alloc`/`dealloc` API or a canonical ABI.

  - The adapter expects the wasm exports to include:
      - `memory` (WebAssembly.Memory)
      - `submit_memory(ptr: i32, len: i32) -> i32`
      - `get_memory_count() -> u32`
      - `get_memory_by_index(index: u32, out_ptr: i32, out_max_len: i32) -> i32`

  Usage:
    await initStylusWasm(import.meta.env.VITE_STYLUS_WASM_PATH || '/stylus/memory_registry.wasm')
    const idx = await submitMemory('bafy...')
    const count = await getMemoryCount()
    const mem = await getMemoryByIndex(0)

*/

const DEFAULT_SCRATCH_PTR = 1024;
const DEFAULT_OUT_PTR = 16384;
const DEFAULT_OUT_MAX = 8192;

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let encoder = new TextEncoder();
let decoder = new TextDecoder();
let scratchOffset = DEFAULT_SCRATCH_PTR;

function ensureInit(): void {
  if (!wasmInstance || !wasmMemory) {
    throw new Error('Stylus WASM not initialized. Call initStylusWasm(wasmUrl) first.');
  }
}

export async function initStylusWasm(wasmUrl: string): Promise<void> {
  if (!wasmUrl) throw new Error('initStylusWasm: wasmUrl required');

  let resp = await fetch(wasmUrl);
  if (!resp.ok) throw new Error(`Failed to fetch wasm: ${resp.status} ${resp.statusText}`);
  const bytes = await resp.arrayBuffer();

  const imports = {} as WebAssembly.Imports;
  // Provide very small set of imports to avoid instantiation errors
  imports.env = imports.env || {};
  imports.env['memory'] = imports.env['memory'] || new WebAssembly.Memory({ initial: 256 });

  const { instance } = await WebAssembly.instantiate(bytes, imports);

  wasmInstance = instance as WebAssembly.Instance;
  // Prefer exported memory
  wasmMemory = ((wasmInstance.exports as any).memory as WebAssembly.Memory) ?? (imports.env['memory'] as WebAssembly.Memory);
  if (!wasmMemory) throw new Error('WASM module does not export memory; adapter requires `memory` export.');

  // reset scratch offset
  scratchOffset = DEFAULT_SCRATCH_PTR;
}

function allocScratch(len: number): number {
  // very simple bump allocator inside the scratch region
  const ptr = scratchOffset;
  scratchOffset += len + 1; // keep 1-byte padding
  // ensure we don't overflow current memory; WebAssembly.Memory grows in pages (64KiB)
  const needed = scratchOffset + 4096;
  const bytes = wasmMemory!.buffer.byteLength;
  if (needed > bytes) {
    const pages = Math.ceil((needed - bytes) / 65536);
    try { wasmMemory!.grow(pages); } catch (e) { throw new Error('Failed to grow wasm memory: ' + String(e)); }
  }
  return ptr;
}

function writeString(ptr: number, str: string): void {
  const u8 = new Uint8Array(wasmMemory!.buffer, ptr, str.length + 1);
  u8.set(encoder.encode(str));
  u8[str.length] = 0;
}

function readString(ptr: number, len: number): string {
  const u8 = new Uint8Array(wasmMemory!.buffer, ptr, len);
  return decoder.decode(u8);
}

export async function submitMemory(cid: string): Promise<number> {
  ensureInit();
  const enc = encoder.encode(cid);
  const ptr = allocScratch(enc.length);
  writeString(ptr, cid);
  const fn = (wasmInstance!.exports as any).submit_memory;
  if (typeof fn !== 'function') throw new Error('WASM export `submit_memory` not found');
  const result = fn(ptr, enc.length);
  return Number(result);
}

export async function getMemoryCount(): Promise<number> {
  ensureInit();
  const fn = (wasmInstance!.exports as any).get_memory_count;
  if (typeof fn !== 'function') throw new Error('WASM export `get_memory_count` not found');
  const res = fn();
  return Number(res);
}

export async function getMemoryByIndex(index: number): Promise<string | null> {
  ensureInit();
  const fn = (wasmInstance!.exports as any).get_memory_by_index;
  if (typeof fn !== 'function') throw new Error('WASM export `get_memory_by_index` not found');
  const outPtr = DEFAULT_OUT_PTR;
  const outMax = DEFAULT_OUT_MAX;
  // make sure out area exists
  const needed = outPtr + outMax + 16;
  if (needed > wasmMemory!.buffer.byteLength) {
    const pages = Math.ceil((needed - wasmMemory!.buffer.byteLength) / 65536);
    wasmMemory!.grow(pages);
  }
  const res = fn(index, outPtr, outMax);
  const length = Number(res);
  if (length <= 0) return null;
  return readString(outPtr, length);
}

export function isInitialized(): boolean {
  return !!wasmInstance && !!wasmMemory;
}

export default {
  initStylusWasm,
  submitMemory,
  getMemoryCount,
  getMemoryByIndex,
  isInitialized,
};
