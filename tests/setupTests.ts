import '@testing-library/jest-dom';

// Mock window.ethereum for wallet tests
if (typeof window !== 'undefined' && !window.ethereum) {
  window.ethereum = {
    request: async () => null,
    isMetaMask: true,
    on: () => {},
    removeListener: () => {},
  } as any;
}
