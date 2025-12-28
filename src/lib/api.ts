// frontend/src/lib/api.ts
// Typed helpers for backend API
const BACKEND = (import.meta.env as any).VITE_BACKEND_URL || 'http://localhost:8000';

type CreateMemoryPayload = {
  title?: string;
  summary?: string;
  category?: string;
  metadata?: any;
  ipfs_cid?: string;
  content_hash?: string;
  submitter?: string;
};

export async function createMemory(payload: CreateMemoryPayload){
  const res = await fetch(`${BACKEND.replace(/\/$/, '')}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createMemory failed: ${res.status}`);
  return res.json();
}

export async function getMemory(id: number){
  const res = await fetch(`${BACKEND.replace(/\/$/, '')}/memories/${id}`);
  if (!res.ok) throw new Error('getMemory failed');
  return res.json();
}

export async function triggerValidation(memoryId: number, simulate = false){
  const res = await fetch(`${BACKEND.replace(/\/$/, '')}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memory_id: memoryId, simulate }),
  });
  return res.json();
}

export async function listValidations(memoryId: number){
  const res = await fetch(`${BACKEND.replace(/\/$/, '')}/validations?memoryId=${memoryId}`);
  if (!res.ok) throw new Error('listValidations failed');
  return res.json();
}

export default { createMemory, getMemory, triggerValidation, listValidations };
