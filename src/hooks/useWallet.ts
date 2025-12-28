import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

interface UseWalletReturn {
  address: string | null;
  chainId: number | null;
  connected: boolean;
  connect: () => Promise<void>;
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (targetChainId: number) => Promise<void>;
  error: string | null;
}

const CONNECTED_FLAG = 'neurovault.connected';

export function useWallet(): UseWalletReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Listen for account and chain changes
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setError(null);
      } else {
        setAddress(null);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if previously connected
      if (localStorage.getItem(CONNECTED_FLAG)) {
        // Try to get accounts without forcing popup
        window.ethereum
          .request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length > 0) {
              setAddress(accounts[0]);
            } else {
              // Clear flag if no accounts available
              localStorage.removeItem(CONNECTED_FLAG);
            }
          })
          .catch(() => {
            console.warn('Failed to fetch accounts on mount');
          });
      }

      // Get current chain
      window.ethereum
        .request({ method: 'eth_chainId' })
        .then((id: string) => {
          setChainId(parseInt(id, 16));
        })
        .catch(() => {
          console.warn('Failed to fetch chain ID');
        });

      return () => {
        // Check if window.ethereum still exists before cleanup
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask or compatible wallet not found');
      return;
    }

    try {
      setError(null);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        localStorage.setItem(CONNECTED_FLAG, '1');

        // Also get chain ID
        const chainIdHex = await window.ethereum.request({
          method: 'eth_chainId',
        });
        setChainId(parseInt(chainIdHex as string, 16));
      }
    } catch (err: any) {
      const message =
        err?.code === 4001
          ? 'Connection rejected by user'
          : err?.message || 'Failed to connect wallet';
      setError(message);
      console.error('Wallet connection error:', err);
    }
  }, []);

  const reconnect = useCallback(async () => {
    await connect();
  }, [connect]);

  const disconnect = useCallback(async () => {
    try {
      setError(null);
      setAddress(null);
      setChainId(null);
      localStorage.removeItem(CONNECTED_FLAG);
      
      // Attempt to disconnect provider if it supports it
      if (window.ethereum?.disconnect) {
        await window.ethereum.disconnect();
      }
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setError('Failed to disconnect');
    }
  }, []);

  const switchChain = useCallback(
    async (targetChainId: number) => {
      if (!window.ethereum) {
        setError('MetaMask or compatible wallet not found');
        return;
      }

      try {
        setError(null);
        const chainIdHex = `0x${targetChainId.toString(16)}`;
        
        // First try to switch to the chain
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
        
        // Update local state
        setChainId(targetChainId);
      } catch (err: any) {
        if (err?.code === 4902) {
          setError('Chain not available. Please add it manually in your wallet.');
        } else if (err?.code !== 4001) {
          // 4001 is user rejection, which is expected
          setError('Failed to switch chain');
        }
        console.error('Chain switch error:', err);
      }
    },
    []
  );

  return {
    address,
    chainId,
    connected: address !== null,
    connect,
    reconnect,
    disconnect,
    switchChain,
    error,
  };
}

// Type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
