import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../src/hooks/useWallet';

describe('useWallet hook', () => {
  let mockEthereum: any;

  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();

    // Mock window.ethereum with Promise-returning methods
    mockEthereum = {
      request: vi.fn((req: any) => {
        if (req.method === 'eth_requestAccounts') {
          return Promise.resolve(['0x1234567890123456789012345678901234567890']);
        }
        if (req.method === 'eth_accounts') {
          return Promise.resolve(['0x1234567890123456789012345678901234567890']);
        }
        if (req.method === 'eth_chainId') {
          return Promise.resolve('0xa7eb9f'); // 421614
        }
        if (req.method === 'wallet_switchEthereumChain') {
          return Promise.resolve(null);
        }
        return Promise.reject(new Error('Unsupported method'));
      }),
      on: vi.fn(),
      removeListener: vi.fn(),
      isMetaMask: true,
    };

    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true,
    });

    // Set env vars
    process.env.VITE_RPC_URL = 'http://localhost:8545';
    process.env.VITE_TARGET_CHAIN_ID = '421614';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (window.ethereum) {
      delete (window as any).ethereum;
    }
  });

  it('initializes with no wallet connected', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.address).toBeNull();
    expect(result.current.chainId).toBeNull();
  });

  it('connects wallet on request_accounts', async () => {
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.address).toBe('0x1234567890123456789012345678901234567890');
    expect(localStorage.getItem('neurovault.connected')).toBe('1');
  });

  it('requests eth_accounts on mount when connected flag is set', async () => {
    localStorage.setItem('neurovault.connected', '1');

    renderHook(() => useWallet());

    // Wait for effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_accounts' });
  });

  it('fetches chain ID on mount', async () => {
    renderHook(() => useWallet());

    // Wait for effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_chainId' });
  });

  it('updates address on connect', async () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.address).toBeNull();

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.address).not.toBeNull();
  });

  it('calls switchEthereumChain when switching network', async () => {
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });

    await act(async () => {
      await result.current.switchChain(421614);
    });

    expect(mockEthereum.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'wallet_switchEthereumChain',
      })
    );
  });
});
