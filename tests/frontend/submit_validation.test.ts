import { describe, it, expect, vi } from 'vitest';
import { createMemory, getMemory, triggerValidation } from '../../src/lib/api';

// lightweight fetch mock
global.fetch = vi.fn();

describe('frontend API', () => {
  it('createMemory -> returns id', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ id: 123 }) });
    const res = await createMemory({ title: 'T', summary: 'S', ipfs_cid: 'bafy' });
    expect(res.id).toBe(123);
  });

  it('triggerValidation enqueues', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ enqueued: true }) });
    const res = await triggerValidation(123);
    expect(res.enqueued).toBe(true);
  });

  it('getMemory returns memory object', async () => {
    const body = { memory: { id: 123, title: 'T' }, validations: [] };
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => body });
    const res = await getMemory(123);
    expect(res.memory.id).toBe(123);
  });
});
