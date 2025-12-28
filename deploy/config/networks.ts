/**
 * deploy/config/networks.ts
 *
 * Multi-chain network configurations for NeuroVault.
 * Supports Arbitrum, Base, Optimism, and zkSync ecosystems.
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  blockTime: number; // seconds
  nativeCurrency: string;
  isTestnet: boolean;
  stylusSupport: boolean; // Has Arbitrum Stylus?
  faucet?: string;
}

export const networks: Record<string, NetworkConfig> = {
  // Arbitrum
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia Testnet',
    chainId: 421614,
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    blockTime: 0.25, // ~250ms
    nativeCurrency: 'ETH',
    isTestnet: true,
    stylusSupport: true,
    faucet: 'https://faucet.arbitrum.io',
  },

  arbitrumOne: {
    name: 'Arbitrum One (Mainnet)',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_ONE_RPC || 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    blockTime: 0.25,
    nativeCurrency: 'ETH',
    isTestnet: false,
    stylusSupport: true,
  },

  // Base
  baseGoerli: {
    name: 'Base Goerli Testnet',
    chainId: 84531,
    rpcUrl: process.env.BASE_GOERLI_RPC || 'https://goerli.base.org',
    blockExplorer: 'https://goerli.basescan.org',
    blockTime: 2,
    nativeCurrency: 'ETH',
    isTestnet: true,
    stylusSupport: false,
  },

  base: {
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC || 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    blockTime: 2,
    nativeCurrency: 'ETH',
    isTestnet: false,
    stylusSupport: false,
  },

  // Optimism
  optimismGoerli: {
    name: 'Optimism Goerli Testnet',
    chainId: 420,
    rpcUrl: process.env.OPTIMISM_GOERLI_RPC || 'https://goerli.optimism.io',
    blockExplorer: 'https://goerli-optimism.etherscan.io',
    blockTime: 2,
    nativeCurrency: 'ETH',
    isTestnet: true,
    stylusSupport: false,
  },

  optimism: {
    name: 'Optimism Mainnet',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    blockTime: 2,
    nativeCurrency: 'ETH',
    isTestnet: false,
    stylusSupport: false,
  },

  // zkSync
  zkSyncGoerli: {
    name: 'zkSync Era Testnet',
    chainId: 280,
    rpcUrl: process.env.ZKSYNC_GOERLI_RPC || 'https://testnet.era.zksync.dev',
    blockExplorer: 'https://goerli.explorer.zksync.io',
    blockTime: 2,
    nativeCurrency: 'ETH',
    isTestnet: true,
    stylusSupport: false,
  },

  zkSync: {
    name: 'zkSync Era Mainnet',
    chainId: 324,
    rpcUrl: process.env.ZKSYNC_RPC || 'https://mainnet.era.zksync.io',
    blockExplorer: 'https://explorer.zksync.io',
    blockTime: 2,
    nativeCurrency: 'ETH',
    isTestnet: false,
    stylusSupport: false,
  },

  // Local
  localhost: {
    name: 'Local Dev Chain',
    chainId: 31337,
    rpcUrl: 'http://localhost:8545',
    blockExplorer: 'http://localhost:8000',
    blockTime: 1,
    nativeCurrency: 'ETH',
    isTestnet: true,
    stylusSupport: false,
  },
};

export function getNetwork(name: string): NetworkConfig {
  const network = networks[name];
  if (!network) {
    throw new Error(
      `Unknown network: ${name}\nAvailable: ${Object.keys(networks).join(', ')}`
    );
  }
  return network;
}

export function getStylusNetworks(): NetworkConfig[] {
  return Object.values(networks).filter((n) => n.stylusSupport);
}

export function getTestnetworks(): NetworkConfig[] {
  return Object.values(networks).filter((n) => n.isTestnet);
}
