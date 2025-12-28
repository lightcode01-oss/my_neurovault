import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules before importing
vi.mock('ipfs-http-client', () => ({
  create: vi.fn(),
}));

vi.mock('web3.storage', () => ({
  Web3Storage: class MockWeb3Storage {
    token: string;
    constructor(opts: any) {
      this.token = opts.token;
    }
    async put(files: any[], opts?: any) {
      if (opts?.onStoredChunk) {
        opts.onStoredChunk(10);
        opts.onStoredChunk(20);
      }
      return 'bafyweb3storage456';
    }
  },
}));

describe('ipfs uploader', () => {
  let mockIpfsClient: any;

  beforeEach(async () => {
    // Clear module cache to reset the ipfs singleton
    vi.resetModules();

    // Set up env vars
    process.env.VITE_IPFS_API_URL = 'https://fake-ipfs-api.test/api/v0';
    process.env.VITE_WEB3STORAGE_KEY = 'fakekey';

    // Set up IPFS mock
    const { create } = await import('ipfs-http-client');

    mockIpfsClient = {
      add: vi.fn(async (buffer: Uint8Array, opts: any) => {
        if (opts?.progress) {
          opts.progress(buffer.length);
        }
        return { cid: { toString: () => 'bafyinfura123' } };
      }),
    };

    vi.mocked(create).mockReturnValue(mockIpfsClient);
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('uploads using ipfs-http-client and returns cid', async () => {
    const { uploadJSON } = await import('../src/lib/ipfs');
    const progressCalls: Array<[number, number?]> = [];
    const cid = await uploadJSON({ hello: 'world' }, { onProgress: (b, t) => progressCalls.push([b, t]) });
    expect(cid).toBe('bafyinfura123');
    expect(progressCalls.length).toBeGreaterThan(0);
  });

  it('falls back to web3.storage when ipfs fails', async () => {
    const { uploadJSON } = await import('../src/lib/ipfs');
    
    // Make IPFS fail on both retry attempts
    mockIpfsClient.add.mockRejectedValue(new Error('Simulated Infura failure'));

    const cid = await uploadJSON({ foo: 'bar' });
    expect(cid).toBe('bafyweb3storage456');
  });
});
