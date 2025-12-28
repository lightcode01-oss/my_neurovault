// Stylus-first project: EVM onchain helpers have been removed.
// Use the Stylus WASM adapter instead (see `contracts/stylus/` and `src/lib/stylusShim.ts`).

export function unsupportedEVMFeature(): never {
  throw new Error(
    'EVM on-chain helpers removed. This project uses Stylus (WASM). Import and use `src/lib/stylusShim.ts` for network interactions.'
  );
}
