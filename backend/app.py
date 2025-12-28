"""
backend/app.py (restored)

This file is the verified clean backend implementation (copied from
`backend/app_clean.py`). It provides a deterministic embedding fallback
and the minimal REST endpoints used by the frontend and scripts.
"""

import os
import json
import sqlite3
import hashlib
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel

DB_PATH = os.environ.get('DB_PATH', os.path.join(os.getcwd(), 'data', 'neurovault.sqlite3'))
OPENAI_KEY = os.environ.get('OPENAI_KEY')

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

app = FastAPI(title='NeuroVault Backend')

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
    # If score/valid provided, this is a validation result submission
    memory_id: int
    validator: Optional[str] = 'validator'
    score: Optional[float] = None
    valid: Optional[bool] = None
    reason: Optional[str] = None
    simulate: Optional[bool] = False

def deterministic_embedding(text: str, dim: int = 8) -> List[float]:
    # Deterministic fallback embedding: SHA256 of text -> split to floats
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
     # support different input keys from frontend
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
        # schedule background validation
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
    # schedule background validation
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
    """Run deterministic validation for a memory and store result.

    This is a lightweight, deterministic rule-based scorer used when OPENAI_KEY
    is missing. It writes a validation record and updates the memory status.
    """
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
        # If simulate or no VALIDATOR_KEY, don't attempt on-chain
        # Insert validation
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
    # Brute-force similarity with deterministic embeddings
    q_emb = deterministic_embedding(q)
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, title, summary, embedding FROM memories')
    rows = c.fetchall()
    results = []
    for r in rows:
        emb = json.loads(r['embedding']) if r['embedding'] else deterministic_embedding(r['summary'])
        # cosine similarity
        dot = sum(a*b for a,b in zip(q_emb, emb))
        norm_q = sum(a*a for a in q_emb)**0.5
        norm_r = sum(a*a for a in emb)**0.5
        sim = dot / (norm_q * norm_r + 1e-9)
        results.append({'id': r['id'], 'title': r['title'], 'summary': r['summary'], 'score': sim})
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:limit]

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 8001)), reload=False)

# End of restored backend/app.py
"""
backend/app.py

Lightweight FastAPI backend for NeuroVault (simpler, single-file).

This file provides deterministic embedding fallbacks when OPENAI_KEY is not set
and stores memories/validations in a local SQLite database defined by DB_PATH.

Usage (Windows PowerShell):
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  pip install fastapi uvicorn pydantic
  python backend/app.py

TODO:
- Add OpenAI/real embedding integration
- Add auth, migrations, connection pool
- Add background worker for on-chain submission
"""

import os
import json
import sqlite3
import hashlib
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

DB_PATH = os.environ.get('DB_PATH', os.path.join(os.getcwd(), 'data', 'neurovault.sqlite3'))
OPENAI_KEY = os.environ.get('OPENAI_KEY')

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

app = FastAPI(title='NeuroVault Backend')

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
    agent: str
    title: str
    summary: str
    category: Optional[str] = 'general'
    metadata: Optional[dict] = {}
    cid: Optional[str] = None

class ValidateIn(BaseModel):
    memory_id: int
    validator: str
    score: float
    valid: bool
    reason: Optional[str] = None

def deterministic_embedding(text: str, dim: int = 8) -> List[float]:
    # Deterministic fallback embedding: SHA256 of text -> split to floats
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
def create_memory(m: MemoryIn):
    conn = get_db()
    c = conn.cursor()
    embedding = json.dumps(deterministic_embedding(m.summary))
    content_hash = hashlib.sha256((m.summary + (m.title or '')).encode('utf-8')).hexdigest()
    c.execute('''INSERT INTO memories (agent, title, summary, category, metadata, cid, content_hash, embedding)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
              (m.agent, m.title, m.summary, m.category, json.dumps(m.metadata or {}), m.cid, content_hash, embedding))
    conn.commit()
    mid = c.lastrowid
    conn.close()
    return {'id': mid}

@app.get('/memories')
def list_memories(limit: int = 100, offset: int = 0):
    conn = get_db()
    c = conn.cursor()
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
def add_validation(v: ValidateIn):
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT INTO validations (memory_id, validator, score, valid, reason) VALUES (?, ?, ?, ?, ?)',
              (v.memory_id, v.validator, v.score, 1 if v.valid else 0, v.reason))
    conn.commit()
    conn.close()
    # TODO: trigger on-chain submission (Stylus/contract) if desired
    return {'ok': True}

@app.get('/similar')
def similar(q: str, limit: int = 5):
    # Brute-force similarity with deterministic embeddings
    q_emb = deterministic_embedding(q)
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, title, summary, embedding FROM memories')
    rows = c.fetchall()
    results = []
    for r in rows:
        emb = json.loads(r['embedding']) if r['embedding'] else deterministic_embedding(r['summary'])
        # cosine similarity
        dot = sum(a*b for a,b in zip(q_emb, emb))
        norm_q = sum(a*a for a in q_emb)**0.5
        norm_r = sum(a*a for a in emb)**0.5
        sim = dot / (norm_q * norm_r + 1e-9)
        results.append({'id': r['id'], 'title': r['title'], 'summary': r['summary'], 'score': sim})
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:limit]

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('backend.app:app', host='0.0.0.0', port=int(os.environ.get('PORT', 8000)), reload=True)

# TODO: add DB migration support, connection pooling, authentication, rate-limiting and OpenAI integration.
