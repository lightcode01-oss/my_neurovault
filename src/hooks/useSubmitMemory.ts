import { useState, useCallback } from 'react';
import { packAndSubmitMemory, retryLastPayload, getCachedPayload, SubmitError } from '../lib/submitMemory';
import { MemoryPayload, SubmitMemoryResult } from '../types/memory';
import { useWallet } from './useWallet';

export type SubmitStatus = 'idle' | 'uploading' | 'awaiting-signature' | 'tx-pending' | 'confirmed' | 'error';

interface UseSubmitMemoryReturn {
  submit: (memory: MemoryPayload) => Promise<void>;
  loading: boolean;
  progress: number; // 0-100
  status: SubmitStatus;
  txHash: string | null;
  wasmIndex: number | null;
  error: SubmitError | null;
  backendResponse?: any | null;
  cid: string | null;
  retryLast: () => Promise<void>;
  lastPayload: Record<string, any> | null;
}

export function useSubmitMemory(): UseSubmitMemoryReturn {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [error, setError] = useState<SubmitError | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [wasmIndex, setWasmIndex] = useState<number | null>(null);
  const [backendResponse, setBackendResponse] = useState<any | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<Record<string, any> | null>(
    getCachedPayload()
  );
  const { address } = useWallet();

  const submit = useCallback(
    async (memory: MemoryPayload) => {
      setLoading(true);
      setError(null);
      setTxHash(null);
      setCid(null);
      setProgress(0);
      setStatus('uploading');

      try {
        // allow the UI to render the 'uploading' state before heavy sync work
        await new Promise((r) => setTimeout(r, 0));
        const result = await packAndSubmitMemory(
          memory,
          address || undefined,
          (newStatus: string, newProgress: number) => {
            setProgress(newProgress);
            setStatus(newStatus as SubmitStatus);
          }
        );

        if ('error' in result) {
          setError(result.error);
          setStatus('error');
          setLastPayload(getCachedPayload());
        } else {
          setCid(result.cid);
          if ((result as any).backendResponse) setBackendResponse((result as any).backendResponse);
          if ((result as any).wasmIndex !== undefined) {
            setWasmIndex((result as any).wasmIndex ?? null);
          } else {
            setWasmIndex(null);
          }
          if (result.txHash) {
            setTxHash(result.txHash);
          }
          setStatus('confirmed');
          setProgress(100);
          // start polling validation status if backend returned id
          const backendId = (result as any).backendResponse?.id;
          if (backendId) {
            // poll every 3s with exponential backoff on failure
            (async function poll() {
              let failCount = 0;
              while (true) {
                try {
                  const resp = await fetch(`${(import.meta.env as any).VITE_BACKEND_URL.replace(/\/$/, '')}/memories/${backendId}`);
                  if (!resp.ok) throw new Error('failed to fetch memory');
                  const json = await resp.json();
                  const mem = json.memory;
                  const vals = json.validations || [];
                  if (vals.length > 0) {
                    const latest = vals[0];
                    // update UI state with validation
                    setBackendResponse(json);
                    if (latest.valid === 1 || latest.valid === true) {
                      setStatus('confirmed');
                    } else {
                      setStatus('tx-pending');
                    }
                    setProgress(100);
                  } else {
                    setStatus('tx-pending');
                    setProgress(50);
                  }
                  failCount = 0;
                  await new Promise((r) => setTimeout(r, 3000));
                } catch (e) {
                  failCount += 1;
                  const wait = Math.min(30000, 3000 * 2 ** (failCount - 1));
                  await new Promise((r) => setTimeout(r, wait));
                }
              }
            })();
          }
              setLastPayload(null);
            }
          } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const submitError: SubmitError = {
          code: 'SUBMIT_FAILED',
          message,
          originalError: err instanceof Error ? err : undefined,
        };
        setError(submitError);
        setStatus('error');
        setLastPayload(getCachedPayload());
            setLoading(false);
            throw err;
          }
          // keep loading true for a tick so transient UI states render reliably in tests
          await new Promise((r) => setTimeout(r, 0));
          setLoading(false);
    },
    [address]
  );

  const retryLast = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    setCid(null);
    setProgress(0);
    setStatus('uploading');

    try {
      // allow UI to update before retry logic runs
      await new Promise((r) => setTimeout(r, 0));
      const result = await retryLastPayload(
        address || undefined,
        (newStatus: string, newProgress: number) => {
          setProgress(newProgress);
          setStatus(newStatus as SubmitStatus);
        }
      );

      if (!result) {
        throw new Error('No cached payload to retry');
      }

      if ('error' in result) {
        setError(result.error);
        setStatus('error');
      } else {
        setCid(result.cid);
        if ((result as any).backendResponse) setBackendResponse((result as any).backendResponse);
        if ((result as any).wasmIndex !== undefined) {
          setWasmIndex((result as any).wasmIndex ?? null);
        } else {
          setWasmIndex(null);
        }
        if (result.txHash) {
          setTxHash(result.txHash);
        }
        setStatus('confirmed');
        setProgress(100);
        setLastPayload(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const submitError: SubmitError = {
        code: 'RETRY_FAILED',
        message,
        originalError: err instanceof Error ? err : undefined,
      };
      setError(submitError);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, [address]);

  return {
    submit,
    loading,
    progress,
    status,
    txHash,
    wasmIndex,
    backendResponse,
    error,
    cid,
    retryLast,
    lastPayload,
  };
}
