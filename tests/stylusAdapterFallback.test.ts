import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import adapter from '../src/lib/stylusAdapterFallback';

describe('stylusAdapterFallback', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('stores and returns indices for submitted CIDs', async () => {
    const idx0 = await adapter.submitMemory('CID_ABC');
    expect(idx0).toBe(0);
    const idx1 = await adapter.submitMemory('CID_DEF');
    expect(idx1).toBe(1);

    const count = await adapter.getMemoryCount();
    expect(count).toBe(2);

    const first = await adapter.getMemoryByIndex(0);
    expect(first).toBe('CID_ABC');

    const second = await adapter.getMemoryByIndex(1);
    expect(second).toBe('CID_DEF');

    const outOfRange = await adapter.getMemoryByIndex(5);
    expect(outOfRange).toBeNull();
  });
});
