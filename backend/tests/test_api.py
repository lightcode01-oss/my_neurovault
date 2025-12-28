"""
Unit tests for MemoryRegistry backend
Tests the FastAPI endpoints and SQLite store
"""

import pytest
import tempfile
import os
import sys
from pathlib import Path

# Add backend directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient

from app import app, MemorySubmission, EmbeddingRequest


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def temp_db():
    """Create temporary database for testing"""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.remove(path)


class TestMemorySubmission:
    """Test memory submission endpoints"""

    def test_create_memory(self, client):
        """Test creating a memory"""
        response = client.post(
            "/memories",
            json={
                "ipfs_cid": "QmTest123",
                "content_hash": "0x" + "a" * 64,
                "title": "Test Memory",
                "category": "history",
                "submitter": "0x" + "b" * 40,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Memory"
        assert data["ipfs_cid"] == "QmTest123"

    def test_list_memories(self, client):
        """Test listing memories"""
        # Create two memories
        for i in range(2):
            client.post(
                "/memories",
                json={
                    "ipfs_cid": f"QmTest{i}",
                    "content_hash": "0x" + "a" * 64,
                    "title": f"Memory {i}",
                    "category": "science",
                    "submitter": "0x" + "b" * 40,
                },
            )

        response = client.get("/memories")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_get_memory(self, client):
        """Test getting a specific memory"""
        # Create memory
        create_resp = client.post(
            "/memories",
            json={
                "ipfs_cid": "QmTest456",
                "content_hash": "0x" + "a" * 64,
                "title": "Get Test",
                "category": "art",
                "submitter": "0x" + "b" * 40,
            },
        )

        memory_id = create_resp.json()["id"]

        # Get memory
        get_resp = client.get(f"/memories/{memory_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["title"] == "Get Test"

    def test_filter_by_category(self, client):
        """Test filtering memories by category"""
        client.post(
            "/memories",
            json={
                "ipfs_cid": "QmCat1",
                "content_hash": "0x" + "a" * 64,
                "title": "Science Memory",
                "category": "science",
                "submitter": "0x" + "b" * 40,
            },
        )

        response = client.get("/memories?category=science")
        assert response.status_code == 200
        data = response.json()
        assert all(m["category"] == "science" for m in data)

    def test_filter_by_submitter(self, client):
        """Test filtering memories by submitter"""
        submitter = "0x1234567890abcdef1234567890abcdef12345678"
        client.post(
            "/memories",
            json={
                "ipfs_cid": "QmSub1",
                "content_hash": "0x" + "a" * 64,
                "title": "My Memory",
                "category": "culture",
                "submitter": submitter,
            },
        )

        response = client.get(f"/memories?submitter={submitter}")
        assert response.status_code == 200
        data = response.json()
        assert all(m["submitter"] == submitter for m in data)


class TestValidation:
    """Test validation endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self, client):
        """Create test memory before each test"""
        response = client.post(
            "/memories",
            json={
                "ipfs_cid": "QmValidate",
                "content_hash": "0x" + "a" * 64,
                "title": "To Validate",
                "category": "science",
                "submitter": "0x" + "b" * 40,
            },
        )
        self.memory_id = response.json()["id"]

    def test_validate_memory(self, client):
        """Test submitting validation"""
        response = client.post(
            "/validate",
            json={
                "memory_id": self.memory_id,
                "is_valid": True,
                "score": 850,
                "explanation": "Looks good!",
                "validator": "0x" + "c" * 40,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["score"] >= 0
        assert data["score"] <= 1000


class TestEmbeddings:
    """Test embedding endpoints"""

    def test_embed_text(self, client):
        """Test text embedding"""
        response = client.post(
            "/embed",
            json={
                "text": "This is a test memory about history",
                "model": "text-embedding-3-small",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "embedding" in data
        assert len(data["embedding"]) == 384


class TestAgentStats:
    """Test agent statistics endpoints"""

    def test_get_submitter_stats(self, client):
        """Test getting submitter stats"""
        submitter = "0x" + "d" * 40

        # Create memory
        client.post(
            "/memories",
            json={
                "ipfs_cid": "QmStats",
                "content_hash": "0x" + "a" * 64,
                "title": "Stats Test",
                "category": "technology",
                "submitter": submitter,
            },
        )

        response = client.get(f"/agent/{submitter}")
        assert response.status_code == 200
        data = response.json()
        assert data["submission_count"] >= 1
        assert data["address"] == submitter


class TestHealth:
    """Test health check"""

    def test_health_check(self, client):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
