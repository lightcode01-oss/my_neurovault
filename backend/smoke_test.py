"""Run smoke checks against the FastAPI app in-process using TestClient.

This allows exercising endpoints without launching an external server.
"""
from fastapi.testclient import TestClient
import importlib.util
import sys
from pathlib import Path

# Load the app module from file to avoid requiring `backend` to be a package
spec = importlib.util.spec_from_file_location("app_clean", str(Path(__file__).parent / "app_clean.py"))
app_mod = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = app_mod
spec.loader.exec_module(app_mod)

client = TestClient(app_mod.app)

print('GET /memories ->', client.get('/memories').status_code)
print('POST /embed ->', client.post('/embed', json={'text': 'hello world'}).json())

mem = {
    'agent': '0xDEADBEEF',
    'title': 'Test memory',
    'summary': 'This is a test summary for smoke-run.',
    'category': 'test',
    'metadata': {'foo': 'bar'},
}
resp = client.post('/memories', json=mem)
print('POST /memories ->', resp.status_code, resp.json())
print('GET /memories ->', client.get('/memories').json()[:3])
print('SIMILAR ->', client.get('/similar', params={'q': 'test'}).json())
