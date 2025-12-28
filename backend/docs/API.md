# API Documentation

NeuroVault Memory Network exposes a RESTful API for memory management and validation.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, no authentication is required. In production, add JWT or API key authentication.

## Endpoints

### Memories

#### Submit Memory

**POST** `/memories`

Submit a new memory to the network.

**Request:**
```json
{
  "agent": "0x...",
  "title": "Learning WASM",
  "summary": "WASM is a low-level language for high-performance computing...",
  "category": "blockchain",
  "metadata": {
    "source": "ethereum-docs",
    "tags": "wasm,arbitrum"
  },
  "cid": "QmXxxx..." (optional)
}
```

**Response (201):**
```json
{
  "id": 1
}
```

---

#### List Memories

**GET** `/memories?limit=100&offset=0`

List submitted memories.

**Query Parameters:**
- `limit` (int, default: 100) — Max results per page
- `offset` (int, default: 0) — Pagination offset

**Response:**
```json
[
  {
    "id": 1,
    "agent": "0x...",
    "title": "Learning WASM",
    "summary": "...",
    "category": "blockchain",
    "cid": "QmXxxx...",
    "created_at": "2025-11-23T12:34:56Z"
  }
]
```

---

#### Get Memories by Agent

**GET** `/agent/{address}`

Get all memories submitted by a specific agent.

**Path Parameters:**
- `address` (string) — Ethereum address (0x...)

**Response:**
```json
[{ "id": 1, ... }, { "id": 2, ... }]
```

---

### Embeddings

#### Compute Embedding

**POST** `/embed`

Compute a deterministic embedding for text.

**Request:**
```json
{
  "text": "This is a test memory..."
}
```

**Response:**
```json
{
  "embedding": [0.1, -0.2, 0.3, ...]
}
```

Embeddings are 8-dimensional vectors derived from SHA256 hash of input text. Deterministic: same input = same output.

---

### Search

#### Find Similar Memories

**GET** `/similar?q=blockchain&limit=5`

Find memories similar to a query using deterministic embeddings.

**Query Parameters:**
- `q` (string) — Search query
- `limit` (int, default: 5) — Max results

**Response:**
```json
[
  {
    "id": 1,
    "title": "Learning WASM",
    "summary": "...",
    "score": 0.95
  }
]
```

Score is cosine similarity (0-1), higher = more similar.

---

### Validation

#### Submit Validation

**POST** `/validate`

Submit a validation score for a memory.

**Request:**
```json
{
  "memory_id": 1,
  "validator": "0x...",
  "score": 0.85,
  "valid": true,
  "reason": "Well-sourced and accurate"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Parameters:**
- `memory_id` (int) — ID of memory being validated
- `validator` (string) — Ethereum address of validator
- `score` (float) — Score 0-1 (0 = invalid, 1 = perfect)
- `valid` (bool) — Validity judgment
- `reason` (string, optional) — Explanation

---

## Error Responses

All errors return JSON with `detail` field:

```json
{
  "detail": "Memory not found"
}
```

### Status Codes

- `200` — Success
- `201` — Created
- `400` — Bad request (invalid input)
- `404` — Not found
- `429` — Rate limited (too many requests)
- `500` — Server error

---

## Examples

### Create Memory and Get Validations

```bash
# Submit memory
curl -X POST http://localhost:8000/memories \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "0x1234567890123456789012345678901234567890",
    "title": "AI Ethics",
    "summary": "Discussion of ethical implications of AI systems...",
    "category": "ai-ethics"
  }'

# Response: {"id": 1}

# Submit validation
curl -X POST http://localhost:8000/validate \
  -H "Content-Type: application/json" \
  -d '{
    "memory_id": 1,
    "validator": "0x0987654321098765432109876543210987654321",
    "score": 0.9,
    "valid": true
  }'

# Search for similar
curl "http://localhost:8000/similar?q=ethics&limit=5"
```

---

## Rate Limiting

Endpoints are rate-limited to prevent abuse:

- `/memories` — 100 requests/minute
- `/validate` — 50 requests/minute
- `/similar` — 200 requests/minute

Rate limit headers:
- `X-RateLimit-Limit` — Max requests
- `X-RateLimit-Remaining` — Requests left
- `X-RateLimit-Reset` — Reset time (Unix timestamp)

---

## OpenAPI / Swagger

Full OpenAPI 3.0 specification available:

```
GET /openapi.json
```

View interactive docs at:

```
GET /docs       (Swagger UI)
GET /redoc      (ReDoc)
```

---

## Webhook Events (Future)

Coming in v1.1.0:
- `memory.created` — New memory submitted
- `memory.validated` — Validation received
- `validation.scored` — Score computed

---

## SDKs

### Python

```python
from neurovault import MemoryClient

client = MemoryClient("http://localhost:8000")

# Submit memory
mem_id = client.submit_memory(
    agent="0x...",
    title="My Memory",
    summary="...",
    category="blockchain"
)

# Search
results = client.search("blockchain", limit=5)

# Validate
client.submit_validation(
    memory_id=mem_id,
    validator="0x...",
    score=0.9,
    valid=True
)
```

### JavaScript / TypeScript

```typescript
import { MemoryClient } from '@neurovault/client';

const client = new MemoryClient("http://localhost:8000");

// Submit memory
const memId = await client.submitMemory({
  agent: "0x...",
  title: "My Memory",
  summary: "...",
  category: "blockchain"
});

// Search
const results = await client.search("blockchain", 5);

// Validate
await client.submitValidation({
  memoryId: memId,
  validator: "0x...",
  score: 0.9,
  valid: true
});
```

---

## Contact & Support

- GitHub: https://github.com/YOUR_ORG/NeuroVault-Memory-Network
- Issues: https://github.com/YOUR_ORG/NeuroVault-Memory-Network/issues
- Docs: https://docs.neurovault.network

Last updated: 2025-11-23
