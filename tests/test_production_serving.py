import os
import sys
from fastapi.testclient import TestClient

# Ensure root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app

def test_production_deployment_serving():
    client = TestClient(app)

    # 1. API Health Check
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    data_health = res_health.json()
    assert data_health["status"] in ["healthy", "ok"]
    assert data_health["model_status"]["model_loaded"] is True

    # 2. API Model Status
    res_model = client.get("/api/model/status")
    assert res_model.status_code == 200
    data_model = res_model.json()
    assert data_model["model_loaded"] is True
    assert len(data_model["emotion_classes"]) == 7

    # 3. Frontend SPA index.html serving
    res_index = client.get("/")
    assert res_index.status_code == 200
    assert "html" in res_index.headers.get("content-type", "").lower()
    assert 'id="root"' in res_index.text

    # 4. Frontend SPA client-side route fallback
    res_route = client.get("/live")
    assert res_route.status_code == 200
    assert 'id="root"' in res_route.text

    print("[SUCCESS] Production deployment routes & SPA verified!")

if __name__ == "__main__":
    test_production_deployment_serving()
