export interface MemoryPayload {
  agent: string;
  title: string;
  summary: string;
  category: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface SubmitMemoryResult {
  cid: string;
  contentHash: string;
  txHash?: string;
  receipt?: any;
  wasmIndex?: number;
  backendResponse?: any;
}

export interface MemoryMeta {
  submittedAt: number;
  submitter: string;
}
