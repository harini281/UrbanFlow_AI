from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    r = client.get('/api/health')
    assert r.status_code == 200
    assert r.json()['status'] == 'healthy'

def test_summary():
    r = client.get('/api/dashboard/summary')
    assert r.status_code == 200
    assert 'top_pickup_zone' in r.json()

def test_hotspots():
    r = client.get('/api/zones/hotspots?limit=5')
    assert r.status_code == 200
    assert len(r.json()) == 5

def test_od():
    r = client.get('/api/flows/od?limit=5')
    assert r.status_code == 200
    assert len(r.json()) == 5

def test_forecast():
    r = client.get('/api/demand/forecast?hours=24')
    assert r.status_code == 200
    assert len(r.json()) > 0
