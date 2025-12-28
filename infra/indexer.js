#!/usr/bin/env node
"use strict";
/**
 * infra/indexer.clean.js
 *
 * Clean, single-file event indexer (fallback canonical copy).
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const argv = require('minimist')(process.argv.slice(2));

let ethers;
try { ethers = require('ethers'); } catch (e) { ethers = null; }

const RPC_URL = argv.rpc || process.env.RPC_URL || 'http://localhost:8545';
const CONTRACT_ADDRESS = argv.contract || process.env.VITE_MEMORY_REGISTRY_ADDRESS || process.env.MEMORY_REGISTRY_ADDRESS || '';
const DB_PATH = argv.db || process.env.DB_PATH || './data/neurovault.db';
const FROM_BLOCK_ARG = argv['from-block'] || argv.from || null;
const TO_BLOCK_ARG = argv['to-block'] || argv.to || null;
const ONCE = Boolean(argv.once || argv['once'] === true);
const POLL_INTERVAL = parseInt(argv['poll-interval'] || process.env.INDEX_POLL_INTERVAL || '30000', 10);

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) return reject(err);
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT, block_number INTEGER, transaction_hash TEXT, log_index INTEGER, args JSON, indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(transaction_hash, log_index))`);
        db.run(`CREATE TABLE IF NOT EXISTS index_state (id INTEGER PRIMARY KEY CHECK (id = 1), last_block_indexed INTEGER DEFAULT 0, last_indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        db.run(`INSERT OR IGNORE INTO index_state (id, last_block_indexed) VALUES (1, 0)`);
        resolve(db);
      });
    });
  });
}

function getLastIndexedBlock(db) {
  return new Promise((resolve, reject) => db.get('SELECT last_block_indexed FROM index_state WHERE id = 1', (err, row) => err ? reject(err) : resolve(row ? row.last_block_indexed : 0)));
}

function updateIndexState(db, blockNumber) {
  return new Promise((resolve, reject) => db.run('UPDATE index_state SET last_block_indexed = ?, last_indexed_at = CURRENT_TIMESTAMP WHERE id = 1', [blockNumber], (err) => err ? reject(err) : resolve()));
}

function saveEvent(db, eventType, blockNumber, txHash, logIndex, args) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO events (event_type, block_number, transaction_hash, log_index, args) VALUES (?, ?, ?, ?, ?)', [eventType, blockNumber, txHash, logIndex, JSON.stringify(args)], (err) => {
      if (err && !err.message.includes('UNIQUE constraint failed')) return reject(err);
      resolve();
    });
  });
}

class EventIndexer {
  constructor(rpcUrl, contractAddress, db) {
    if (!ethers) throw new Error('ethers required');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contractAddress = contractAddress || null;
    this.db = db;
    this.abi = [
      'event MemorySubmitted(uint256 indexed memoryId, address indexed submitter, string ipfsCid, bytes32 contentHash, string title, string category)',
      'event MemoryValidated(uint256 indexed memoryId, address indexed validator, bool isValid, uint16 score, string explanation)'
    ];
    this.iface = new ethers.Interface(this.abi);
  }

  async indexBlock(blockNumber) {
    const filter = this.contractAddress ? { address: this.contractAddress, fromBlock: blockNumber, toBlock: blockNumber } : { fromBlock: blockNumber, toBlock: blockNumber };
    const logs = await this.provider.getLogs(filter);
    if (!logs || logs.length === 0) { await updateIndexState(this.db, blockNumber); return; }
    for (const log of logs) {
      try {
        const parsed = this.iface.parseLog(log);
        if (!parsed) continue;
        const args = {};
        parsed.eventFragment.inputs.forEach((inp, idx) => { const key = inp.name || String(idx); const val = parsed.args[idx]; args[key] = (typeof val === 'bigint') ? val.toString() : val; });
        await saveEvent(this.db, parsed.name, log.blockNumber, log.transactionHash, log.index, args);
      } catch (e) {
        await saveEvent(this.db, 'raw_log', log.blockNumber, log.transactionHash, log.index, { topics: log.topics, data: log.data });
      }
    }
    await updateIndexState(this.db, blockNumber);
  }

  async runOnce(fromBlock, toBlock = null) {
    const latest = await this.provider.getBlockNumber();
    const end = toBlock !== null ? Math.min(toBlock, latest) : latest;
    for (let b = fromBlock; b <= end; b++) await this.indexBlock(b);
  }

  async runDaemon(pollInterval) {
    while (true) {
      const last = await getLastIndexedBlock(this.db);
      const latest = await this.provider.getBlockNumber();
      if (last < latest) await this.runOnce(last + 1, latest);
      await new Promise((r) => setTimeout(r, pollInterval));
    }
  }
}

async function main() {
  if (!ethers) { console.error('Install ethers: npm install ethers'); process.exit(1); }
  const db = await initDatabase();
  const indexer = new EventIndexer(RPC_URL, CONTRACT_ADDRESS, db);
  let from = FROM_BLOCK_ARG !== null ? parseInt(FROM_BLOCK_ARG, 10) : null;
  if (from === null) { from = await getLastIndexedBlock(db); from = Math.max(0, from + 1); }
  const to = TO_BLOCK_ARG !== null ? parseInt(TO_BLOCK_ARG, 10) : null;
  if (ONCE || to !== null) { await indexer.runOnce(from, to); console.log('Done'); process.exit(0); }
  await indexer.runDaemon(POLL_INTERVAL);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(2); });
