"""
backend/app_clean.py

Clean FastAPI backend used as a temporary replacement for `backend/app.py`.

Usage (Windows PowerShell):
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  pip install fastapi uvicorn pydantic
  python backend/app_clean.py

This file mirrors the simplified backend implementation and avoids the
concatenated/duplicated content present in `backend/app.py` so you can
continue the smoke-run steps immediately.

TODO: Once confirmed, we can replace `backend/app.py` with this file.
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

app = FastAPI(title='NeuroVault Backend (clean)')

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
    h = hashlib.sha256(text.encode('utf-8')).digest()
    floats = []
    for i in range(dim):
        v = int.from_bytes(h[i*2:(i*2)+2], 'big')
        floats.append((v / 65535.0) * 2 - 1)
    return floats

@app.post('/embed')
def embed(req: EmbedRequest):
    if OPENAI_KEY:
        # TODO: plug in real OpenAI embedding call
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
    return {'ok': True}

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

if __name__ == '__main__':
    import uvicorn
    # Run the ASGI app object directly to avoid package import issues when
    # executing the script as `python backend/app_clean.py`.
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 8000)), reload=False)
