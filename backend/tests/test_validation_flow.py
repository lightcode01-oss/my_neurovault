import os
import tempfile
import sqlite3
import json
# Set DB_PATH before importing app so module-level DB_PATH is initialized correctly
os.environ['DB_PATH'] = os.path.join(os.getcwd(), 'backend', 'tests', 'test_neurovault.sqlite3')
from fastapi.testclient import TestClient
import backend.app_run as appmod

client = TestClient(appmod.app)

def setup_module(module):
    # ensure DB is clean
    db_path = os.environ['DB_PATH']
    try:
        os.remove(db_path)
    except Exception:
        pass
    appmod.init_db()

def teardown_module(module):
    db_path = os.environ['DB_PATH']
    try:
        os.remove(db_path)
    except Exception:
        pass

def test_create_memory_and_validate_trigger():
    # create memory via POST /memories using frontend keys
    payload = {
        'title': 'Test memory',
        'summary': 'This is an important research note to remember',
        'category': 'science',
        'ipfs_cid': 'bafytestcid123',
        'submitter': 'tester'
    }
    r = client.post('/memories', json=payload)
    assert r.status_code == 200
    mid = r.json().get('id')
    assert mid is not None

    # Trigger validation (enqueue background task)
    r2 = client.post('/validate', json={'memory_id': mid})
    assert r2.status_code == 200
    assert r2.json().get('enqueued') is True

    # Run validation synchronously by calling run_validation directly (simulating background worker)
    appmod.run_validation(mid, simulate=True, validator='test-run')

    # Check validations table
    r3 = client.get('/validations', params={'memoryId': mid})
    assert r3.status_code == 200
    vals = r3.json()
    assert isinstance(vals, list)
    assert len(vals) >= 1
    v = vals[0]
    assert 'score' in v
    assert 'valid' in v

    # Check memory status updated
    r4 = client.get(f'/memories/{mid}')
    assert r4.status_code == 200
    data = r4.json()
    assert 'memory' in data
    assert 'validations' in data
    assert isinstance(data['validations'], list)

