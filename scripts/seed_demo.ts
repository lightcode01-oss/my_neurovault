#!/usr/bin/env -S node
/**
 * scripts/seed_demo.ts
 *
 * Seed the local backend with demo memories for development.
 * Usage:
 *   npx ts-node scripts/seed_demo.ts --backend http://localhost:8000
 *
 * If backend is not running, prints sample curl commands.
 */

import fetch from 'node-fetch';

async function main() {
  const argv = require('minimist')(process.argv.slice(2));
  const backend = argv.backend || process.env.BACKEND_URL || 'http://localhost:8000';
  const samples = [
    { title: 'Memory One', summary: 'This is the first demo memory about physics.', category: 'science' },
    { title: 'Memory Two', summary: 'Second demo memory about AI and ethics.', category: 'technology' },
    { title: 'Memory Three', summary: 'Third demo memory about history and culture.', category: 'history' },
  ];
  for (const s of samples) {
    const body = { agent: 'demo-seeder', title: s.title, summary: s.summary, category: s.category, metadata: {seed: true} };
    try {
      const res = await fetch(`${backend}/memories`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        console.log('Backend not available; sample curl:');
        console.log('curl -X POST', `${backend}/memories -d '${JSON.stringify(body)}' -H "Content-Type: application/json"`);
      } else {
        const j = await res.json();
        console.log('Seeded memory id=', j.id);
      }
    } catch (err) {
      console.log('Failed to POST; backend may be down. Sample curl below:');
      console.log('curl -X POST', `${backend}/memories -d '${JSON.stringify(body)}' -H "Content-Type: application/json"`);
    }
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });

// TODO: optionally deploy a local MemoryRegistry contract and submit on-chain samples using ethers.// seed_demo.ts disabled — Stylus/WASM migration
console.error('seed_demo.ts is disabled: project migrated to Stylus/WASM.');
console.error('Seed data can be added via backend API or Stylus seeding scripts under contracts/stylus.');
process.exit(1);
