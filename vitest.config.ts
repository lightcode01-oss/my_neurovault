import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setupTests.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'lcov'],
    },
    include: [
      'tests/**/*.test.{js,ts,tsx,mjs}',
      'tests/**/*.spec.{js,ts,tsx,mjs}',
      'src/**/*.test.{js,ts,tsx,mjs}',
      'src/**/*.spec.{js,ts,tsx,mjs}'
    ],
    exclude: [
      '**/node_modules/**',
      'tests/MemoryRegistryV2.test.ts',
      'tests/useWallet.test.ts',
      'tests/MemorySubmission.test.tsx.skip'
    ],
  },
});
