// Placeholder JS example that demonstrates how you might prepare memory
// for calling the exported WASM functions. This is not a deploy script
// to Arbitrum; it only shows pointer/length preparation for local wasm.

const fs = require('fs');

async function run() {
  const wasm = fs.readFileSync(__dirname + '/target/wasm32-unknown-unknown/release/memory_registry_stylus.wasm');
  const module = await WebAssembly.instantiate(wasm, {});
  const instance = module.instance;

  // NOTE: This example assumes the module exports a memory and the functions
  // defined in the scaffold. In practice you will need a proper allocator
  // or export/imports to manage memory safely.

  const { memory, submit_memory, get_memory_count } = instance.exports;
  if (!memory) {
    console.error('WASM module does not export memory');
    return;
  }

  const enc = new TextEncoder();
  const cid = 'bafy...examplecid';
  const cidBytes = enc.encode(cid);

  // Very naive allocation: write at offset 1024. Do NOT use in production.
  const ptr = 1024;
  const memU8 = new Uint8Array(memory.buffer);
  memU8.set(cidBytes, ptr);

  // Call submit_memory(ptr, len)
  const index = submit_memory(ptr, cidBytes.length);
  console.log('submit_memory returned index:', index);
  console.log('get_memory_count:', get_memory_count());
}

run().catch((err) => console.error(err));
