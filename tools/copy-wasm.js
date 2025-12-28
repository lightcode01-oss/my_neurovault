const fs = require('fs');
const path = require('path');

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const releaseDir = path.join(repoRoot, 'contracts', 'stylus', 'memory_registry', 'target', 'wasm32-unknown-unknown', 'release');
  if (!fs.existsSync(releaseDir)) {
    console.error('Release directory not found:', releaseDir);
    process.exit(2);
  }

  const files = fs.readdirSync(releaseDir).filter(f => f.endsWith('.wasm'));
  if (files.length === 0) {
    console.error('No .wasm file found in', releaseDir);
    process.exit(3);
  }

  const wasmFile = files[0];
  const src = path.join(releaseDir, wasmFile);
  const outDir = path.join(repoRoot, 'public', 'stylus');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const dest = path.join(outDir, 'memory_registry.wasm');

  fs.copyFileSync(src, dest);
  console.log('Copied', src, '->', dest);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
