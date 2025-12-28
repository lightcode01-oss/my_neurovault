import { describe, it, expect, vi } from 'vitest';

// Simple unit test for addSafeOnMessageListener logic using a mock runtime
import addSafeOnMessageListener from '../src/lib/messaging-safe';

describe('messaging-safe', () => {
  it('registers and handles promise-returning handler and calls sendResponse', async () => {
    // Create a small fake runtime on window
    (global as any).browser = { runtime: { onMessage: { addListener: vi.fn(), removeListener: vi.fn() } } };

    // Handler that returns a promise
    let calledSendResponse = false;
    const handler = async (message: any, sender: any, sendResponse: any) => {
      const r = await Promise.resolve('ok-' + message);
      sendResponse(r);
      return r;
    };

    const remove = addSafeOnMessageListener(handler, { timeoutMs: 100 });
    expect(typeof remove).toBe('function');

    // Simulate runtime invoking the wrapped listener
    const runtime = (global as any).browser.runtime;
    const wrapped = (runtime.onMessage.addListener as any).mock.calls[0][0];

    const sendResponse = (resp: any) => {
      calledSendResponse = true;
      // assert response shape
      expect(resp).toBeDefined();
    };

    const ret = wrapped('hello', {}, sendResponse);
    // wrapped should return true to indicate async sendResponse (chrome semantics)
    expect(ret).toBe(true);

    // Wait a tick for the promise to resolve
    await new Promise((r) => setTimeout(r, 10));
    expect(calledSendResponse).toBe(true);

    // cleanup
    remove();
  });
});
