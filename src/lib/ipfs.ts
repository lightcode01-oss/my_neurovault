import { create } from 'ipfs-http-client';
import { Web3Storage } from 'web3.storage';

let ipfsClient: any = null;
let web3StorageClient: Web3Storage | null = null;

interface UploadOptions {
  onProgress?: (bytesUploaded: number, totalBytes?: number) => void;
  timeoutMs?: number; // overall timeout for primary/fallback calls
  signal?: AbortSignal | null;
}

function getIPFSClient() {
  if (ipfsClient) {
    return ipfsClient;
  }

  const apiUrl = import.meta.env.VITE_IPFS_API_URL;
  if (!apiUrl) {
    console.warn('VITE_IPFS_API_URL not set, IPFS upload may fail');
  }

  try {
    ipfsClient = create({
      url: apiUrl || 'https://ipfs.infura.io:5001/api/v0',
    });
    return ipfsClient;
  } catch (err) {
    console.error('Failed to initialize IPFS client:', err);
    throw err;
  }
}

function getWeb3StorageClient(): Web3Storage | null {
  const token = import.meta.env.VITE_WEB3STORAGE_KEY;
  if (!token) {
    console.warn('VITE_WEB3STORAGE_KEY not set, web3.storage fallback unavailable');
    return null;
  }

  if (!web3StorageClient) {
    web3StorageClient = new Web3Storage({ token });
  }
  return web3StorageClient;
}

async function uploadToIPFS(
  json: Record<string, any>,
  onProgress?: (bytesUploaded: number, totalBytes?: number) => void,
  signal?: AbortSignal | null
): Promise<string> {
  const client = getIPFSClient();
  const jsonString = JSON.stringify(json);
  const buffer = new TextEncoder().encode(jsonString);
  const totalBytes = buffer.length;

  let uploadedBytes = 0;

  try {
    const result = await client.add(buffer, {
      signal: (signal as any) || undefined,
      progress: (bytes: number) => {
        uploadedBytes = bytes;
        if (onProgress) {
          onProgress(uploadedBytes, totalBytes);
        }
      },
    });

    // Prefer cid.toString() when available
    const cid = (result && (result.cid ? result.cid.toString() : result.path)) || String(result);
    console.log(`IPFS upload successful via Infura: ${cid}`);
    return cid;
  } catch (err) {
    console.error('IPFS upload via Infura failed:', err);
    throw err;
  }
}

async function uploadToWeb3Storage(
  json: Record<string, any>,
  onProgress?: (bytesUploaded: number, totalBytes?: number) => void,
  signal?: AbortSignal | null
): Promise<string> {
  const client = getWeb3StorageClient();
  if (!client) {
    throw new Error('web3.storage client not configured');
  }

  const jsonString = JSON.stringify(json);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const file = new File([blob], 'memory.json', { type: 'application/json' });
  const totalBytes = file.size;

  try {
    let uploaded = 0;

    // web3.storage supports onStoredChunk for progress tracking
    const cid = await client.put([file], {
      signal: (signal as any) || undefined,
      onStoredChunk: (size: number) => {
        uploaded += size;
        if (onProgress) onProgress(Math.min(uploaded, totalBytes), totalBytes);
      },
    });

    console.log(`IPFS upload successful via web3.storage: ${cid}`);
    return cid;
  } catch (err) {
    console.error('IPFS upload via web3.storage failed:', err);
    throw err;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, signal?: AbortSignal | null): Promise<T> {
  if (signal?.aborted) return Promise.reject(new Error('Aborted'));

  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Attempt ${attempt + 1}/${maxAttempts} failed:`, lastError.message);

      if (attempt < maxAttempts - 1) {
        const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('All upload attempts failed');
}

/**
 * Upload JSON to IPFS with automatic fallback and retry logic
 * Primary: ipfs-http-client (Infura)
 * Fallback: web3.storage (if Infura times out or fails)
 */
export async function uploadJSON(
  json: Record<string, any>,
  options: UploadOptions = {}
): Promise<string> {
  const { onProgress, timeoutMs = 6000, signal = null } = options;

  try {
    // Try Infura with configurable timeout
    console.log('Attempting upload to Infura IPFS...');
    const cid = await retryWithBackoff(
      () => withTimeout(uploadToIPFS(json, onProgress, signal), timeoutMs, signal),
      2 // 2 attempts for Infura before falling back
    );
    return cid;
  } catch (infuraErr) {
    console.warn('Infura upload failed, falling back to web3.storage...', infuraErr);

    try {
      // Fallback to web3.storage
      const client = getWeb3StorageClient();
      if (!client) {
        throw new Error(
          'web3.storage not configured (set VITE_WEB3STORAGE_KEY env var) and Infura failed'
        );
      }

      const cid = await retryWithBackoff(
        () => withTimeout(uploadToWeb3Storage(json, onProgress, signal), Math.max(timeoutMs, 10000), signal),
        3
      );
      return cid;
    } catch (web3Err) {
      console.error('Both Infura and web3.storage uploads failed:', web3Err);
      throw new Error(
        `IPFS upload failed: ${web3Err instanceof Error ? web3Err.message : String(web3Err)}`
      );
    }
  }
}

/**
 * Get public IPFS gateway URL for a CID
 */
export function getPublicGatewayUrl(cid: string): string {
  const customGateway = import.meta.env.VITE_IPFS_GATEWAY;
  const gatewayUrl = customGateway || 'https://dweb.link/ipfs';
  return `${gatewayUrl}/${cid}`;
}

/**
 * Try a list of public gateways and return the first that responds successfully.
 * This is intended to be used on-demand (e.g. user click) to pick a working
 * gateway rather than relying on one gateway that may be down.
 */
export async function findWorkingGateway(cid: string, timeoutPerGateway = 2000): Promise<string> {
  const envGateway = import.meta.env.VITE_IPFS_GATEWAY;
  const gateways = [] as string[];
  if (envGateway) gateways.push(envGateway.replace(/\/$/, '') + '/ipfs');
  // preferred public gateways
  gateways.push('https://dweb.link/ipfs');
  gateways.push('https://ipfs.io/ipfs');
  gateways.push('https://cloudflare-ipfs.com/ipfs');
  gateways.push('https://gateway.pinata.cloud/ipfs');

  const targetPaths = gateways.map((g) => `${g}/${cid}`);

  const tryUrl = async (url: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutPerGateway);
      // Try HEAD first to avoid downloading whole content
      let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(id);
      if (res && res.ok) return true;

      // Some gateways don't support HEAD properly — try a ranged GET for one byte
      const controller2 = new AbortController();
      const id2 = setTimeout(() => controller2.abort(), timeoutPerGateway);
      res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: controller2.signal });
      clearTimeout(id2);
      return !!(res && (res.status === 206 || res.status === 200));
    } catch (e) {
      return false;
    }
  };

  for (const url of targetPaths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const ok = await tryUrl(url);
      if (ok) return url;
    } catch (e) {
      // ignore and try next
    }
  }

  // fallback to default public gateway URL
  return getPublicGatewayUrl(cid);
}

/**
 * Return the prioritized list of gateway URLs for a CID (not probed).
 */
export function getGatewayList(cid: string): string[] {
  const envGateway = import.meta.env.VITE_IPFS_GATEWAY;
  const gateways: string[] = [];
  if (envGateway) gateways.push(envGateway.replace(/\/$/, '') + '/ipfs/' + cid);
  gateways.push('https://dweb.link/ipfs/' + cid);
  gateways.push('https://ipfs.io/ipfs/' + cid);
  gateways.push('https://cloudflare-ipfs.com/ipfs/' + cid);
  gateways.push('https://gateway.pinata.cloud/ipfs/' + cid);
  return gateways;
}

/**
 * Lightweight CID sanity check to detect obviously-truncated or malformed CIDs.
 * This is intentionally permissive — it mainly guards against the common
 * case where UI displays a truncated CID like "QmX4f...7k2p" and the
 * href points to that truncated value producing gateway errors.
 */
export function looksLikeValidCid(cid: string | null | undefined): boolean {
  if (!cid || typeof cid !== 'string') return false;
  // obvious truncated form containing ellipsis
  if (cid.includes('...')) return false;
  // common CIDv0 (base58) starts with Qm and is 46 chars
  if (cid.startsWith('Qm') && cid.length === 46) return true;
  // common CIDv1 in base32 starts with bafy and is longer
  if (cid.startsWith('bafy') && cid.length >= 46) return true;
  // fallback: ensure reasonably long and contains no spaces
  if (cid.length >= 10 && !/\s/.test(cid)) return true;
  return false;
}
