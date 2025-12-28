import { BrowserProvider, JsonRpcProvider, Signer } from 'ethers';

let cachedProvider: BrowserProvider | JsonRpcProvider | null = null;
let cachedSigner: Signer | null = null;

export function getProvider(): BrowserProvider | JsonRpcProvider {
  // Prefer injected provider (MetaMask)
  if (window.ethereum) {
    return new BrowserProvider(window.ethereum);
  }

  // Fall back to RPC URL
  const rpcUrl = (import.meta.env as any).VITE_RPC_URL;
  if (!rpcUrl) {
    throw new Error('VITE_RPC_URL not set and no injected provider found');
  }

  if (!cachedProvider) {
    cachedProvider = new JsonRpcProvider(rpcUrl);
  }
  return cachedProvider;
}

export async function getSigner(): Promise<Signer> {
  if (!window.ethereum) {
    throw new Error('No injected provider (MetaMask) found');
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  cachedSigner = signer;
  return signer;
}

export async function getMemoryRegistry(): Promise<never> {
  throw new Error(
    'EVM MemoryRegistry has been removed. This project now uses Stylus/WASM contracts.\n' +
      'Use the Stylus adapter under `contracts/stylus/` and the frontend Stylus shim (`src/lib/stylusShim.ts`) to interact with WASM modules.'
  );
}

// Helper to clear cached provider/signer on account/chain change
export function clearCache(): void {
  cachedProvider = null;
  cachedSigner = null;
}

// Type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
