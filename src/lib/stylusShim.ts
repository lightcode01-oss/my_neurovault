import { ethers } from 'ethers';

// Stylus shim: lightweight helpers for the frontend in a Stylus-first project.
// This file provides pure helpers that do not depend on EVM ABIs. For full
// on-chain interactions with Stylus/WASM modules, load the compiled WASM
// artifacts and call exported functions via a runtime adapter.

export function formatMemory(memory: any): {
  id: string;
  title: string;
  category: string;
  submitter: string;
  validationScore: string;
  isValidated: boolean;
  validationCount: number;
} {
  return {
    id: memory.id?.toString?.() ?? String(memory.id ?? ''),
    title: memory.title ?? '',
    category: memory.category ?? '',
    submitter: (memory.submitter && memory.submitter.slice)
      ? memory.submitter.slice(0, 6) + '...' + memory.submitter.slice(-4)
      : String(memory.submitter ?? ''),
    validationScore: `${memory.validationScore ?? 0}/1000`,
    isValidated: Boolean(memory.isValidated),
    validationCount: Number(memory.validationCount ?? 0),
  };
}

export function hashContent(content: string): string {
  return ethers.id(content);
}

export function generateContentHash(params: { ipfsCid: string; title: string; category: string; }): string {
  const data = JSON.stringify({
    ipfsCid: params.ipfsCid,
    title: params.title,
    category: params.category,
  });
  return ethers.id(data);
}

// Placeholder async functions for Stylus interactions. Implement these
// to load the WASM module and call exported functions when deploying.

export async function submitMemoryTx(/* signer, params */): Promise<string> {
  throw new Error('submitMemoryTx: Not implemented for Stylus in-shim. Build and deploy a Stylus WASM module and implement an adapter to call it.');
}

export async function getMemoryCount(/* provider */): Promise<number> {
  return 0;
}

export async function loadMemory(/* provider, memoryId */): Promise<any | null> {
  return null;
}

export async function submitValidationTx(/* signer, params */): Promise<string> {
  throw new Error('submitValidationTx: Not implemented for Stylus in-shim.');
}

export function unsupported(): never {
  throw new Error('Stylus runtime adapter not implemented. See contracts/stylus/ for build instructions.');
}

export default {
  formatMemory,
  hashContent,
  generateContentHash,
};
