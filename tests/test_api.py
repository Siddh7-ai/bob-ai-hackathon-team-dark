"""
Unit tests for FastAPI REST Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "endpoints" in data


def test_fleet_summary():
    response = client.get("/api/fleet/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_assets" in data
    assert "fleet_readiness_pct" in data
    assert "ready_count" in data
    assert data["total_assets"] >= 10


def test_assets_list_and_filtering():
    response = client.get("/api/assets")
    assert response.status_code == 200
    data = response.json()
    assert "total_count" in data
    assert "assets" in data
    assert len(data["assets"]) > 0

    # Test status filter
    filter_resp = client.get("/api/assets?status=Ready")
    assert filter_resp.status_code == 200
    ready_assets = filter_resp.json()["assets"]
    assert all(a["status"] == "Ready" for a in ready_assets)


def test_asset_detail_drilldown():
    # Fetch first asset ID
    list_resp = client.get("/api/assets")
    first_asset = list_resp.json()["assets"][0]
    asset_id = first_asset["asset_id"]

    response = client.get(f"/api/assets/{asset_id}")
    assert response.status_code == 200
    data = response.json()
    assert "asset" in data
    assert "telemetry_history" in data
    assert len(data["telemetry_history"]) > 0
    assert "service_history" in data
    assert "envelopes" in data


def test_maintenance_plan():
    response = client.get("/api/maintenance/plan")
    assert response.status_code == 200
    plan = response.json()
    assert isinstance(plan, list)
    if len(plan) > 0:
        first_item = plan[0]
        assert "priority_rank" in first_item
        assert "priority_score" in first_item
        assert "action_recommendation" in first_item
        assert "urgency" in first_item


def test_model_evaluation():
    response = client.get("/api/evaluation")
    assert response.status_code == 200
    report = response.json()
    assert "readiness_classifier" in report
    assert "failure_prediction_rul" in report
    assert "accuracy" in report["readiness_classifier"]
    assert "mae_cycles" in report["failure_prediction_rul"]


def test_explanation_endpoint():
    response = client.get("/api/assets")
    first_asset = response.json()["assets"][0]["asset_id"]
    
    exp_resp = client.get(f"/api/explanations/{first_asset}")
    assert exp_resp.status_code == 200
    data = exp_resp.json()
    assert "executive_summary" in data
    assert "action_recommendation" in data
    assert "suspected_subsystem" in data
