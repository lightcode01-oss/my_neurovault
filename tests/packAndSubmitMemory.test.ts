import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canonicalize, getCachedPayload } from '../src/lib/submitMemory';
import { keccak256, toUtf8Bytes } from 'ethers';

describe('submitMemory utilities', () => {
  beforeEach(() => {
    // Clear cache before each test
    localStorage.clear();
    vi.resetModules();
  });

  describe('canonicalize', () => {
    it('produces deterministic JSON ordering', () => {
      const obj1 = { c: 3, a: 1, b: 2 };
      const obj2 = { a: 1, b: 2, c: 3 };
      expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    });

    it('handles nested objects', () => {
      const obj1 = { x: { z: 1, y: 2 }, a: 1 };
      const obj2 = { a: 1, x: { y: 2, z: 1 } };
      expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    });

    it('handles arrays correctly', () => {
      const obj1 = { items: [1, 2, 3] };
      const obj2 = { items: [1, 2, 3] };
      expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    });

    it('returns consistent hash for same content', () => {
      const obj = { title: 'Test', content: 'Memory content' };
      const canonical = canonicalize(obj);
      const hash1 = keccak256(toUtf8Bytes(canonical));
      const hash2 = keccak256(toUtf8Bytes(canonical));
      expect(hash1).toBe(hash2);
    });
  });

  describe('payload caching', () => {
    it('retrieves null when no cache exists', () => {
      expect(getCachedPayload()).toBeNull();
    });

    it('persists to localStorage', () => {
      const payload = { title: 'Test', content: 'Test content' };
      localStorage.setItem('neurovault.lastPayload', JSON.stringify(payload));
      expect(getCachedPayload()).toEqual(payload);
    });

    it('handles malformed cache gracefully', () => {
      localStorage.setItem('neurovault.lastPayload', 'invalid json');
      expect(getCachedPayload()).toBeNull();
    });
  });

  describe('content hashing', () => {
    it('produces valid keccak256 hash', () => {
      const memory = { title: 'Test', category: 'Other', content: 'Test memory' };
      const canonical = canonicalize(memory);
      const hash = keccak256(toUtf8Bytes(canonical));
      expect(hash).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('different content produces different hashes', () => {
      const obj1 = canonicalize({ content: 'A' });
      const obj2 = canonicalize({ content: 'B' });
      const hash1 = keccak256(toUtf8Bytes(obj1));
      const hash2 = keccak256(toUtf8Bytes(obj2));
      expect(hash1).not.toBe(hash2);
    });
  });
});
