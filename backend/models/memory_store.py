"""
SQLite-based memory store for MemoryRegistry backend
Handles persistence of memories, validations, and agent statistics
"""

import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Any

class MemoryStore:
    """SQLite-based storage for memory metadata and validations"""

    def __init__(self, db_path: str):
        self.db_path = db_path

    def init_db(self):
        """Initialize database schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create memories table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ipfs_cid TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT,
                submitter TEXT NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                validation_score INTEGER DEFAULT 0,
                validation_count INTEGER DEFAULT 0,
                is_validated BOOLEAN DEFAULT FALSE
            )
        """)

        # Create validations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS validations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                memory_id INTEGER NOT NULL,
                validator TEXT NOT NULL,
                is_valid BOOLEAN,
                score INTEGER,
                explanation TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (memory_id) REFERENCES memories(id)
            )
        """)

        # Create embeddings cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS embeddings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                memory_id INTEGER NOT NULL,
                embedding BLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (memory_id) REFERENCES memories(id)
            )
        """)

        # Create indices for faster queries
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_memories_submitter ON memories(submitter)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_validations_memory ON validations(memory_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_validations_validator ON validations(validator)")

        conn.commit()
        conn.close()

    def add_memory(
        self,
        ipfs_cid: str,
        content_hash: str,
        title: str,
        category: str,
        submitter: str,
    ) -> int:
        """Add a new memory and return its ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO memories (ipfs_cid, content_hash, title, category, submitter)
            VALUES (?, ?, ?, ?, ?)
        """, (ipfs_cid, content_hash, title, category, submitter))

        memory_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return memory_id

    def get_memory(self, memory_id: int) -> Optional[Dict[str, Any]]:
        """Get memory by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM memories WHERE id = ?", (memory_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return dict(row)

    def list_memories(
        self,
        category: Optional[str] = None,
        submitter: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """List memories with optional filtering"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = "SELECT * FROM memories WHERE 1=1"
        params = []

        if category:
            query += " AND category = ?"
            params.append(category)

        if submitter:
            query += " AND submitter = ?"
            params.append(submitter)

        query += " ORDER BY submitted_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def add_validation(
        self,
        memory_id: int,
        validator: str,
        is_valid: bool,
        score: int,
        explanation: str,
    ):
        """Add validation record and update memory score"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Insert validation record
        cursor.execute("""
            INSERT INTO validations (memory_id, validator, is_valid, score, explanation)
            VALUES (?, ?, ?, ?, ?)
        """, (memory_id, validator, is_valid, score, explanation))

        # Update memory validation count and average score
        cursor.execute("""
            SELECT validation_count, validation_score FROM memories WHERE id = ?
        """, (memory_id,))
        row = cursor.fetchone()

        if row:
            old_count = row[0]
            old_score = row[1]

            new_count = old_count + 1
            new_score = int((old_score * old_count + score) / new_count)

            cursor.execute("""
                UPDATE memories
                SET validation_count = ?, validation_score = ?, is_validated = ?
                WHERE id = ?
            """, (new_count, new_score, new_count >= 3, memory_id))

        conn.commit()
        conn.close()

    def get_validations(self, memory_id: int) -> List[Dict[str, Any]]:
        """Get validation history for a memory"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM validations WHERE memory_id = ? ORDER BY submitted_at DESC
        """, (memory_id,))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def get_agent_stats(self, address: str) -> Dict[str, Any]:
        """Get stats for a submitter or validator"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Get submission stats
        cursor.execute("""
            SELECT COUNT(*) as count FROM memories WHERE submitter = ?
        """, (address,))
        submission_count = cursor.fetchone()[0]

        # Get validation stats
        cursor.execute("""
            SELECT COUNT(*) as count, AVG(score) as avg_score FROM validations WHERE validator = ?
        """, (address,))
        row = cursor.fetchone()
        validation_count = row[0] if row else 0
        avg_validation_score = int(row[1]) if row and row[1] else 0

        conn.close()

        return {
            "submission_count": submission_count,
            "validation_count": validation_count,
            "avg_validation_score": avg_validation_score,
        }

    def get_unvalidated_memories(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get memories that haven't been validated yet"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM memories
            WHERE is_validated = FALSE
            ORDER BY submitted_at ASC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def cache_embedding(self, memory_id: int, embedding: List[float]):
        """Cache embedding vector for a memory"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Convert list to JSON for storage
        embedding_json = json.dumps(embedding)

        cursor.execute("""
            INSERT INTO embeddings (memory_id, embedding)
            VALUES (?, ?)
        """, (memory_id, embedding_json))

        conn.commit()
        conn.close()

    def get_embedding(self, memory_id: int) -> Optional[List[float]]:
        """Retrieve cached embedding for a memory"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT embedding FROM embeddings WHERE memory_id = ?
            ORDER BY created_at DESC LIMIT 1
        """, (memory_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return json.loads(row[0])
