import { getProvider } from '../config/contracts';

interface TestProviderResult {
  ok: boolean;
  blockNumber?: number;
  error?: string;
}

/**
 * Test provider connectivity by fetching block number with timeout
 */
export async function testProvider(): Promise<TestProviderResult> {
  try {
    const provider = getProvider();
    
    const blockNumberPromise = provider.getBlockNumber();
    const timeoutPromise = new Promise<never>(
      (_, reject) =>
        setTimeout(() => reject(new Error('Provider test timeout after 6s')), 6000)
    );

    const blockNumber = await Promise.race([blockNumberPromise, timeoutPromise]);
    
    console.log('Provider test successful. Block number:', blockNumber);
    return { ok: true, blockNumber };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Provider test failed:', message);
    return { ok: false, error: message };
  }
}
