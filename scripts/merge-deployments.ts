import fs from 'fs';
import path from 'path';

/*
  scripts/merge-deployments.ts

  Usage:
    npx ts-node scripts/merge-deployments.ts --network arbitrumSepolia
    (Reads deployments/memoryRegistry.json and ensures the file contains a
     `networks` map keyed by network name. If the file is a single object
     with `network` field, it will be converted to the new shape. If CLI
     args are provided (proxy, implementation, owner, timestamp), they will
     override values for the specified network.)
*/

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const [k, v] = arg.slice(2).split('=');
    out[k] = v ?? 'true';
  }
  return out;
}

function loadJSON(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${err}`);
  }
}

function saveJSON(filePath: string, obj: unknown) {
  const raw = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(filePath, raw, 'utf8');
}

function main() {
  const cwd = process.cwd();
  const deploymentsDir = path.join(cwd, 'deployments');
  const filePath = path.join(deploymentsDir, 'memoryRegistry.json');
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const args = parseArgs();
  const cliNetwork = args.network || process.env.NETWORK;

  let data = loadJSON(filePath);
  if (!data) {
    console.log('No deployments file found. Creating empty template.');
    data = {};
  }

  // If file contains flat object with `network` key, convert it.
  if ((data as any).network && !(data as any).networks) {
    const flat = data as any;
    const net = flat.network;
    const entry = {
      proxy: flat.proxy || null,
      implementation: flat.implementation || null,
      owner: flat.owner || null,
      timestamp: flat.timestamp || new Date().toISOString(),
    };
    data = { networks: { [net]: entry } };
    console.log(`Converted flat deployment for network '${net}' into networks map.`);
  }

  // Ensure structure
  if (!(data as any).networks) (data as any).networks = {};

  const targetNetwork = cliNetwork || (data as any).network || 'hardhat';

  // Prepare merged entry
  const existing = (data as any).networks[targetNetwork] || {};
  const merged = {
    proxy: args.proxy ?? existing.proxy ?? (data as any).proxy ?? null,
    implementation: args.implementation ?? existing.implementation ?? (data as any).implementation ?? null,
    owner: args.owner ?? existing.owner ?? (data as any).owner ?? null,
    timestamp: args.timestamp ?? existing.timestamp ?? new Date().toISOString(),
  };

  (data as any).networks[targetNetwork] = merged;

  // Keep backwards-compatible root-level most-recent summary
  (data as any).latest = merged;

  saveJSON(filePath, data);
  console.log(`Updated deployments file: ${filePath}`);
  console.log(`Network '${targetNetwork}' => proxy=${merged.proxy} implementation=${merged.implementation}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

export {};
