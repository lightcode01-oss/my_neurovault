import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

/**
 * Hook to resolve ENS names for Ethereum addresses
 * Falls back gracefully if no ENS name exists
 */
export function useENS(address: string | null | undefined) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setEnsName(null);
      return;
    }

    setLoading(true);
    resolveENS(address)
      .then(setEnsName)
      .catch((err) => {
        console.warn('Failed to resolve ENS:', err);
        setEnsName(null);
      })
      .finally(() => setLoading(false));
  }, [address]);

  return { ensName, loading };
}

/**
 * Resolve ENS name for an address using the connected provider
 */
async function resolveENS(address: string): Promise<string | null> {
  try {
    if (!window.ethereum) return null;

    const provider = new BrowserProvider(window.ethereum);
    const name = await provider.lookupAddress(address);
    return name;
  } catch (err) {
    // No ENS name found or network doesn't support ENS
    return null;
  }
}

/**
 * Format address with ENS name if available
 * Fallback: shortened address (0x1234...5678)
 */
export function formatAddressWithENS(address: string, ensName: string | null | undefined): string {
  if (ensName) return ensName;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
