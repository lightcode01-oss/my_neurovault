import { keccak256, toUtf8Bytes } from 'ethers';
import { uploadJSON, getPublicGatewayUrl } from './ipfs';
import { getMemoryRegistry } from '../config/contracts';
import stylusAdapter from './stylusAdapter';
import stylusAdapterFallback from './stylusAdapterFallback';
import { MemoryPayload, SubmitMemoryResult, MemoryMeta } from '../types/memory';

const CACHE_KEY = 'neurovault.lastPayload';
const TIMEOUT_MS = 30000;

export interface SubmitError {
  code: string;
  message: string;
  originalError?: Error;
}

/**
 * Canonicalize an object into a deterministic JSON string
 * with keys sorted recursively
 */
export function canonicalize(obj: any): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map((item: any) => JSON.parse(canonicalize(item))));
  }

  const keys = Object.keys(obj).sort();
  const sorted: Record<string, any> = {};

  for (const key of keys) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sorted[key] = JSON.parse(canonicalize(obj[key]));
    } else {
      sorted[key] = obj[key];
    }
  }

  return JSON.stringify(sorted);
}

/**
 * Cache payload in localStorage for retry capability
 */
function cachePayload(payload: Record<string, any>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to cache payload:', err);
  }
}

/**
 * Clear cached payload after successful submission
 */
function clearCachedPayload(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    console.warn('Failed to clear cached payload:', err);
  }
}

/**
 * Get last cached payload for retry
 */
export function getCachedPayload(): Record<string, any> | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn('Failed to read cached payload:', err);
    return null;
  }
}

export async function packAndSubmitMemory(
  memory: MemoryPayload,
  signerAddress?: string,
  onProgress?: (status: string, progress: number) => void
): Promise<SubmitMemoryResult | { error: SubmitError; cid: null }> {
  try {
    // extra values to include on return (e.g. backend response)
    const returnExtra: Record<string, any> = {};
    // Build canonical payload with metadata
    const meta: MemoryMeta = {
      submittedAt: Math.floor(Date.now() / 1000),
      submitter: signerAddress || 'web-ui',
    };

    const payload = {
      ...memory,
      _meta: meta,
    };

    // Cache payload for retry capability
    cachePayload(payload);

    // Canonicalize and compute content hash
    const canonical = canonicalize(payload);
    const contentHash = keccak256(toUtf8Bytes(canonical));

    console.log('Canonical payload:', canonical);
    console.log('Content hash:', contentHash);

    // Upload to IPFS with progress tracking
    if (onProgress) onProgress('uploading', 0);

    const cid = await uploadJSON(payload, {
      onProgress: (bytesUploaded: number, totalBytes?: number) => {
        const progress = totalBytes ? Math.round((bytesUploaded / totalBytes) * 100) : 0;
        if (onProgress) onProgress('uploading', progress);
      },
    });

    console.log('CID:', cid);

    // Attempt to persist metadata to backend if configured.
    // This is best-effort: submission should succeed even if backend is down.
    try {
      const backendBase = (import.meta.env as any).VITE_BACKEND_URL || '';
      if (backendBase) {
        const url = backendBase.replace(/\/$/, '') + '/memories';
        // Build minimal body matching backend MemorySubmission model
        const body = {
          ipfs_cid: cid,
          content_hash: contentHash,
          title: memory.title || '',
          category: memory.category || '',
          submitter: signerAddress || 'web-ui',
        };

        // Fire-and-forget but await to catch obvious errors
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          console.warn('Backend /memories POST failed:', resp.status, txt);
          // Dispatch event so UI can surface a toast
          try { window.dispatchEvent(new CustomEvent('neurovault:backend:post_failed', { detail: { status: resp.status, body: txt } })); } catch (e) {}
        } else {
          // Parse backend response and surface backend id to UI via returned value
          const json = await resp.json().catch(() => null);
          try {
            window.dispatchEvent(new CustomEvent('neurovault:memory:submitted', { detail: { cid, backend: json } }));
          } catch (e) {}
          // If backend returned an id, include it in the function return via local variable
          returnExtra.backendResponse = json;
        }
      }
    } catch (err) {
      console.warn('Failed to POST memory to backend:', err);
    }

    // Call contract submitMemory if address is configured
    const contractAddress = (import.meta.env as any).VITE_MEMORY_REGISTRY_ADDRESS;

    if (!contractAddress || contractAddress === '0x...') {
      console.warn(
        'Contract address not configured (VITE_MEMORY_REGISTRY_ADDRESS). Returning CID and hash only.'
      );
      clearCachedPayload();
      return {
        cid,
        contentHash,
        ...returnExtra,
      };
    }

    if (onProgress) onProgress('awaiting-signature', 75);

    // If a Stylus WASM path is configured, attempt to load and call it.
    const wasmPath = (import.meta.env as any).VITE_STYLUS_WASM_PATH;
    const useFallback = (import.meta.env as any).VITE_USE_WASM_FALLBACK === 'true' || (import.meta.env as any).DEV === true || (import.meta.env as any).MODE === 'development';

    if (wasmPath) {
      try {
        if (!stylusAdapter.isInitialized()) {
          await stylusAdapter.initStylusWasm(wasmPath);
        }
        const wasmIndex = await stylusAdapter.submitMemory(cid);
        clearCachedPayload();
        return { cid, contentHash, wasmIndex, ...returnExtra };
      } catch (e) {
        console.warn('Stylus WASM submit failed, falling back to CID only.', e);
        clearCachedPayload();
        return { cid, contentHash };
      }
    }

    if (useFallback) {
      try {
        const wasmIndex = await stylusAdapterFallback.submitMemory(cid);
        clearCachedPayload();
        return { cid, contentHash, wasmIndex, ...returnExtra };
      } catch (e) {
        console.warn('Stylus fallback submit failed', e);
        clearCachedPayload();
        return { cid, contentHash };
      }
    }

    // Stylus not configured — skip on-chain submission for now and return CID/hash.
    console.warn('Skipping on-chain submit: no Stylus WASM configured and fallback not enabled. Returning CID only.');
    clearCachedPayload();
    return { cid, contentHash, ...returnExtra };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('packAndSubmitMemory error:', err);

    const error: SubmitError = {
      code: 'SUBMIT_FAILED',
      message: message.includes('timeout')
        ? 'Submission timed out. Please check your connection and try again.'
        : message.includes('user rejected')
          ? 'You rejected the transaction in your wallet'
          : message.includes('IPFS')
            ? `Upload failed: ${message}`
            : `Submission failed: ${message}`,
      originalError: err instanceof Error ? err : undefined,
    };

    return { error, cid: null };
  }
}

/**
 * Retry uploading the last cached payload
 */
export async function retryLastPayload(
  signerAddress?: string,
  onProgress?: (status: string, progress: number) => void
): Promise<SubmitMemoryResult | { error: SubmitError; cid: null } | null> {
  const cached = getCachedPayload();
  if (!cached) {
    return null;
  }

  // Reconstruct MemoryPayload from cache (remove _meta which we'll regenerate)
  const { _meta, ...memory } = cached;
  return packAndSubmitMemory(memory as MemoryPayload, signerAddress, onProgress);
}
