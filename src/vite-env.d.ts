/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL: string;
  readonly VITE_MEMORY_REGISTRY_ADDRESS: string;
  readonly VITE_IPFS_API_URL: string;
  readonly VITE_BLOCK_EXPLORER_BASE: string;
  readonly VITE_WEB3STORAGE_KEY?: string;
  readonly VITE_IPFS_GATEWAY?: string;
  readonly VITE_TARGET_CHAIN_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
