"""
Clean single-file FastAPI backend for local runs: `backend/app_run.py`.
This mirrors the intended behavior of `backend/app.py` but avoids the accidental
concatenation/indentation issues found in the repo copy. Use this file to run
local tests and the validator daemon during development.

Usage (PowerShell):
  .\.venv\Scripts\python.exe backend/app_run.py

"""
import os
import json
import sqlite3
import hashlib
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import subprocess
import urllib.request
import shutil
import sys

DB_PATH = os.environ.get('DB_PATH', os.path.join(os.getcwd(), 'data', 'neurovault.sqlite3'))
OPENAI_KEY = os.environ.get('OPENAI_KEY')

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

app = FastAPI(title='NeuroVault Backend (run)')


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent TEXT,
      title TEXT,
      summary TEXT,
      category TEXT,
      metadata TEXT,
      cid TEXT,
      content_hash TEXT,
      embedding TEXT,
      status TEXT DEFAULT 'PENDING_VALIDATION',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    c.execute('''
    CREATE TABLE IF NOT EXISTS validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id INTEGER,
      validator TEXT,
      score REAL,
      valid INTEGER,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    conn.commit()
    conn.close()


init_db()


class EmbedRequest(BaseModel):
    text: str


class MemoryIn(BaseModel):
    # support both frontend and legacy keys
    agent: Optional[str] = None
    submitter: Optional[str] = None
    title: Optional[str] = ''
    summary: Optional[str] = ''
    category: Optional[str] = 'general'
    metadata: Optional[dict] = {}
    cid: Optional[str] = None
    ipfs_cid: Optional[str] = None
    content_hash: Optional[str] = None


class ValidateIn(BaseModel):
    memory_id: int
    validator: Optional[str] = 'validator'
    score: Optional[float] = None
    valid: Optional[bool] = None
    reason: Optional[str] = None
    simulate: Optional[bool] = False


def deterministic_embedding(text: str, dim: int = 8) -> List[float]:
    h = hashlib.sha256(text.encode('utf-8')).digest()
    floats = []
    for i in range(dim):
        v = int.from_bytes(h[i*2:(i*2)+2], 'big')
        floats.append((v / 65535.0) * 2 - 1)
    return floats


@app.post('/embed')
def embed(req: EmbedRequest):
    if OPENAI_KEY:
        # TODO: plug in real OpenAI embedding call using OPENAI_KEY
        pass
    emb = deterministic_embedding(req.text)
    return {'embedding': emb}


@app.post('/memories')
def create_memory(m: MemoryIn, background_tasks: BackgroundTasks = None):
    conn = get_db()
    c = conn.cursor()
    cid_val = m.ipfs_cid or m.cid
    summary_text = m.summary or ''
    title_text = m.title or ''
    embedding = json.dumps(deterministic_embedding(summary_text))
    content_hash = m.content_hash or hashlib.sha256((summary_text + title_text).encode('utf-8')).hexdigest()
    agent = m.agent or m.submitter or 'web-ui'
    c.execute('''INSERT INTO memories (agent, title, summary, category, metadata, cid, content_hash, embedding, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (agent, title_text, summary_text, m.category, json.dumps(m.metadata or {}), cid_val, content_hash, embedding, 'PENDING_VALIDATION'))
    conn.commit()
    mid = c.lastrowid
    conn.close()
    # Optionally run validation synchronously if configured
    if os.environ.get('VALIDATE_SYNC', 'false').lower() in ('1', 'true', 'yes'):
        if background_tasks is not None:
            background_tasks.add_task(run_validation, mid, False, 'internal-sync')
    return {'id': mid}


@app.get('/memories/{memory_id}')
def get_memory(memory_id: int):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM memories WHERE id = ?', (memory_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail='memory not found')
    mem = dict(row)
    c.execute('SELECT * FROM validations WHERE memory_id = ? ORDER BY id DESC LIMIT 10', (memory_id,))
    vals = [dict(v) for v in c.fetchall()]
    conn.close()
    return {'memory': mem, 'validations': vals}


@app.get('/memories')
def list_memories(limit: int = 100, offset: int = 0, status: Optional[str] = None):
    conn = get_db()
    c = conn.cursor()
    if status:
        c.execute('SELECT * FROM memories WHERE status = ? ORDER BY id DESC LIMIT ? OFFSET ?', (status, limit, offset))
    else:
        c.execute('SELECT * FROM memories ORDER BY id DESC LIMIT ? OFFSET ?', (limit, offset))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


@app.get('/agent/{address}')
def memories_by_agent(address: str):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM memories WHERE agent = ? ORDER BY id DESC', (address,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


@app.post('/validate')
def add_validation(v: ValidateIn, background_tasks: BackgroundTasks = None):
    # If score/valid provided -> treat as direct submission from validator
    if v.score is not None and v.valid is not None:
        conn = get_db()
        c = conn.cursor()
        c.execute('INSERT INTO validations (memory_id, validator, score, valid, reason) VALUES (?, ?, ?, ?, ?)',
                  (v.memory_id, v.validator or 'validator', v.score, 1 if v.valid else 0, v.reason))
        # update memory status
        status = 'PASSED' if v.valid else 'FAILED'
        c.execute('UPDATE memories SET status = ? WHERE id = ?', (status, v.memory_id))
        conn.commit()
        conn.close()
        return {'ok': True}
    # Otherwise treat as a trigger to run validation
    if background_tasks is not None:
        background_tasks.add_task(run_validation, v.memory_id, v.simulate if v.simulate else False, v.validator or 'trigger')
        return {'enqueued': True}
    else:
        return {'error': 'no background task runner available'}


@app.get('/validations')
def list_validations(memoryId: Optional[int] = None, limit: int = 100):
    conn = get_db()
    c = conn.cursor()
    if memoryId:
        c.execute('SELECT * FROM validations WHERE memory_id = ? ORDER BY id DESC LIMIT ?', (memoryId, limit))
    else:
        c.execute('SELECT * FROM validations ORDER BY id DESC LIMIT ?', (limit,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def run_validation(memory_id: int, simulate: bool = False, validator: str = 'auto'):
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM memories WHERE id = ?', (memory_id,))
        row = c.fetchone()
        if not row:
            return
        mem = dict(row)
        summary = mem.get('summary') or ''
        title = mem.get('title') or ''
        # simple rule-based scoring
        length_score = min(40, len(summary) / 5)
        keyword_bonus = 0
        for kw in ['important', 'remember', 'study', 'note', 'research']:
            if kw in summary.lower() or kw in title.lower():
                keyword_bonus += 8
        # penalize duplicates
        c.execute('SELECT COUNT(*) as cnt FROM memories WHERE content_hash = ?', (mem.get('content_hash'),))
        cnt = c.fetchone()['cnt']
        duplicate_penalty = 20 if cnt > 1 else 0
        raw = length_score + keyword_bonus - duplicate_penalty
        score = max(0, min(100, raw))
        valid = score >= 50
        reason = f"length={len(summary)}, keywords={keyword_bonus}, duplicates={cnt}, score={score}"
        c.execute('INSERT INTO validations (memory_id, validator, score, valid, reason) VALUES (?, ?, ?, ?, ?)',
                  (memory_id, validator, float(score), 1 if valid else 0, reason))
        status = 'PASSED' if valid else 'FAILED'
        c.execute('UPDATE memories SET status = ? WHERE id = ?', (status, memory_id))
        conn.commit()
    except Exception:
        pass
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.get('/similar')
def similar(q: str, limit: int = 5):
    q_emb = deterministic_embedding(q)
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, title, summary, embedding FROM memories')
    rows = c.fetchall()
    results = []
    for r in rows:
        emb = json.loads(r['embedding']) if r['embedding'] else deterministic_embedding(r['summary'])
        dot = sum(a*b for a,b in zip(q_emb, emb))
        norm_q = sum(a*a for a in q_emb)**0.5
        norm_r = sum(a*a for a in emb)**0.5
        sim = dot / (norm_q * norm_r + 1e-9)
        results.append({'id': r['id'], 'title': r['title'], 'summary': r['summary'], 'score': sim})
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:limit]


@app.get('/health/full')
def health_full():
    """Run a full health-check: DB, WASM availability, and IPFS gateway.

    This endpoint is intended for deployment health checks and monitoring.
    It will attempt lightweight probes only and return a JSON structure
    describing the status of each sub-check.
    """
    status = {'ok': True, 'checks': {}}

    # DB check: simple query
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) as cnt FROM memories')
        cnt = cur.fetchone()['cnt']
        conn.close()
        status['checks']['database'] = {'ok': True, 'count': cnt}
    except Exception as e:
        status['checks']['database'] = {'ok': False, 'error': str(e)}
        status['ok'] = False

    # WASM check: try local public artifact first, then attempt to call node script
    wasm_ok = False
    wasm_msg = ''
    local_wasm = os.path.join(os.getcwd(), 'public', 'stylus', 'memory_registry.wasm')
    module_id = os.environ.get('STYLUS_MODULE_ID') or os.environ.get('VITE_STYLUS_MODULE_ID')
    try:
        if os.path.exists(local_wasm):
            # call Node helper to run the local ping (non-blocking wrapper)
            proc = subprocess.run([sys.executable, '-m', 'json.tool'], input=b'', stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            # Attempt direct instantiate using node script (if available)
            node_script = os.path.join(os.getcwd(), 'scripts', 'call_stylus_ping.js')
            if os.path.exists(node_script) and shutil.which('node'):
                r = subprocess.run(['node', node_script, '--local', local_wasm], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15)
                wasm_ok = (r.returncode == 0)
                wasm_msg = r.stdout.decode('utf-8') + '\n' + r.stderr.decode('utf-8')
            else:
                # Fallback: ensure file is readable
                size = os.path.getsize(local_wasm)
                wasm_ok = size > 0
                wasm_msg = f'Local wasm present, size={size}'
        elif module_id and os.environ.get('STYLUS_NODE_RPC') and shutil.which('node'):
            node_script = os.path.join(os.getcwd(), 'scripts', 'call_stylus_ping.js')
            r = subprocess.run(['node', node_script, '--module-id', module_id, '--rpc', os.environ.get('STYLUS_NODE_RPC')], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20)
            wasm_ok = (r.returncode == 0)
            wasm_msg = r.stdout.decode('utf-8') + '\n' + r.stderr.decode('utf-8')
        else:
            wasm_ok = False
            wasm_msg = 'No local wasm and no module id / rpc configured'
    except Exception as e:
        wasm_ok = False
        wasm_msg = str(e)

    status['checks']['wasm'] = {'ok': bool(wasm_ok), 'detail': wasm_msg}
    if not wasm_ok:
        status['ok'] = False

    # IPFS gateway check
    try:
        ipfs_gateway = os.environ.get('IPFS_GATEWAY_URL', os.environ.get('VITE_IPFS_GATEWAY', 'https://gateway.ipfs.io'))
        req = urllib.request.Request(ipfs_gateway, method='HEAD')
        with urllib.request.urlopen(req, timeout=5) as resp:
            status['checks']['ipfs'] = {'ok': resp.status < 400, 'status_code': resp.status}
            if resp.status >= 400:
                status['ok'] = False
    except Exception as e:
        status['checks']['ipfs'] = {'ok': False, 'error': str(e)}
        status['ok'] = False

    return status


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 8001)), reload=False)
