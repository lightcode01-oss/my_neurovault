/**
 * Stylus Adapter Fallback (JS-only) for local development when WASM is
 * not available. This stores submitted CIDs in `localStorage` and
 * mimics the same async API as the wasm adapter.
 */

const STORAGE_KEY = 'stylus.fallback.memories';

function loadAll(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load fallback memories', e);
    return [];
  }
}

function saveAll(list: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { console.warn(e); }
}

export async function initStylusWasm(_wasmUrl: string): Promise<void> {
  // no-op for fallback
  return;
}

export async function submitMemory(cid: string): Promise<number> {
  const list = loadAll();
  list.push(cid);
  saveAll(list);
  // return index
  return list.length - 1;
}

export async function getMemoryCount(): Promise<number> {
  return loadAll().length;
}

export async function getMemoryByIndex(index: number): Promise<string | null> {
  const list = loadAll();
  if (index < 0 || index >= list.length) return null;
  return list[index];
}

export function isInitialized(): boolean { return true; }

export default {
  initStylusWasm,
  submitMemory,
  getMemoryCount,
  getMemoryByIndex,
  isInitialized,
};
