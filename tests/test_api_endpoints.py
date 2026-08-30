import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_status" in data
    assert "database_connected" in data

def test_model_status_endpoint(client):
    response = client.get("/api/model/status")
    assert response.status_code == 200
    data = response.json()
    assert "model_loaded" in data
    assert "emotion_classes" in data
    assert len(data["emotion_classes"]) == 7

def test_session_lifecycle_api(client):
    # 1. Start session
    start_resp = client.post("/api/session/start", json={"notes": "API test session"})
    assert start_resp.status_code == 200
    sess_data = start_resp.json()
    assert "session_uuid" in sess_data
    session_uuid = sess_data["session_uuid"]

    # 2. Stop session
    stop_resp = client.post("/api/session/stop", json={"session_uuid": session_uuid})
    assert stop_resp.status_code == 200
    stopped_data = stop_resp.json()
    assert stopped_data["session_uuid"] == session_uuid
    assert stopped_data["ended_at"] is not None

def test_history_and_analytics_endpoints(client):
    hist_resp = client.get("/api/history")
    assert hist_resp.status_code == 200
    assert "records" in hist_resp.json()

    analytics_resp = client.get("/api/analytics")
    assert analytics_resp.status_code == 200
    assert "total_observations" in analytics_resp.json()
    assert "distribution" in analytics_resp.json()

    trends_resp = client.get("/api/analytics/trends")
    assert trends_resp.status_code == 200
    assert "points" in trends_resp.json()

    insights_resp = client.get("/api/insights")
    assert insights_resp.status_code == 200
    assert "insights" in insights_resp.json()
