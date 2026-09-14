"""
FastAPI Backend for HUMS Predictive Maintenance System
Provides REST endpoints for fleet readiness KPIs, asset telemetry drill-downs,
failure predictions (RUL), diagnostic explanations, and prioritised maintenance plans.
"""

import os
import sys
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure project root is accessible
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.data_generator import generate_synthetic_hums_data, BASELINE_PARAMS
from src.pipeline import HUMSPipeline
from src.ingestion import HUMSDataIngestion

app = FastAPI(
    title="HUMS Predictive Maintenance Mission API",
    description="Military/Aerospace Health & Usage Monitoring System - End-to-End Fleet Diagnostics",
    version="1.0.0"
)

# Enable CORS for local dev servers (Vite runs on 5173 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_RAW_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
DATA_MODELS_DIR = os.path.join(PROJECT_ROOT, "data", "models")
DATA_PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")


def load_json(filepath: str, default: Any = None) -> Any:
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            return json.load(f)
    return default


@app.get("/")
def root():
    return {
        "system": "HUMS Predictive Maintenance API",
        "status": "OPERATIONAL",
        "version": "1.0.0",
        "endpoints": [
            "/api/fleet/summary",
            "/api/assets",
            "/api/assets/{asset_id}",
            "/api/predictions",
            "/api/maintenance/plan",
            "/api/explanations/{asset_id}",
            "/api/evaluation",
            "/api/sensor-envelopes"
        ]
    }


@app.get("/api/sensor-envelopes")
def get_sensor_envelopes():
    """Returns nominal baseline and safe envelope limits."""
    return BASELINE_PARAMS


@app.get("/api/fleet/summary")
def get_fleet_summary():
    """Returns top-level fleet readiness KPIs."""
    kpis = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_kpis.json"))
    if not kpis:
        # If not computed yet, run inference
        pipeline = HUMSPipeline()
        results = pipeline.run_fleet_inference()
        kpis = results["kpis"]
    return kpis


@app.get("/api/assets")
def get_assets(
    status: Optional[str] = Query(None, description="Filter by status: Ready, At-Risk, Not-Ready"),
    asset_type: Optional[str] = Query(None, description="Filter by asset type"),
    unit: Optional[str] = Query(None, description="Filter by military squadron"),
    search: Optional[str] = Query(None, description="Search asset ID or keyword")
):
    """Returns list of all assets with latest telemetry and status snapshots."""
    fleet = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_status.json"), default=[])
    if not fleet:
        pipeline = HUMSPipeline()
        results = pipeline.run_fleet_inference()
        fleet = results["fleet_status"]

    filtered = fleet
    if status and status.lower() != "all":
        filtered = [a for a in filtered if a["status"].lower() == status.lower()]
    if asset_type and asset_type.lower() != "all":
        filtered = [a for a in filtered if a["asset_type"].lower() == asset_type.lower()]
    if unit and unit.lower() != "all":
        filtered = [a for a in filtered if a["unit"].lower() == unit.lower()]
    if search:
        s = search.lower()
        filtered = [
            a for a in filtered 
            if s in a["asset_id"].lower() or s in a["asset_type"].lower() or s in a["unit"].lower()
        ]

    return {
        "total_count": len(filtered),
        "assets": filtered
    }


@app.get("/api/assets/{asset_id}")
def get_asset_detail(asset_id: str):
    """
    Returns single asset drilldown:
    Full historical sensor telemetry time-series, service logs, and diagnostics.
    """
    fleet = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_status.json"), default=[])
    asset_record = next((a for a in fleet if a["asset_id"].upper() == asset_id.upper()), None)
    if not asset_record:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found in fleet records")

    # Load sensor time-series history
    ingestion = HUMSDataIngestion(data_dir=DATA_RAW_DIR)
    assets_df, sensors_df, services_df, _ = ingestion.load_data()

    history = sensors_df[sensors_df["asset_id"].str.upper() == asset_id.upper()].sort_values("cycle").to_dict(orient="records")
    services = services_df[services_df["asset_id"].str.upper() == asset_id.upper()].sort_values("service_date", ascending=False).to_dict(orient="records")

    return {
        "asset": asset_record,
        "telemetry_history": history,
        "service_history": services,
        "envelopes": BASELINE_PARAMS
    }


@app.get("/api/predictions")
def get_all_predictions():
    """Returns RUL and failure predictions for all assets."""
    fleet = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_status.json"), default=[])
    predictions = [
        {
            "asset_id": a["asset_id"],
            "asset_type": a["asset_type"],
            "status": a["status"],
            "current_cycle": a["current_cycle"],
            "predicted_rul_cycles": a["predicted_rul_cycles"],
            "estimated_days_to_failure": a["estimated_days_to_failure"],
            "failure_probability_14d": a["failure_probability_14d"],
            "failure_probability_30d": a["failure_probability_30d"],
            "predicted_failing_component": a["predicted_failing_component"],
            "component_diagnosis_reason": a["component_diagnosis_reason"]
        }
        for a in fleet
    ]
    return predictions


@app.get("/api/maintenance/plan")
def get_maintenance_plan():
    """Returns the prioritised maintenance action queue sorted by Priority Score."""
    plan = load_json(os.path.join(DATA_PROCESSED_DIR, "maintenance_plan.json"), default=[])
    if not plan:
        pipeline = HUMSPipeline()
        results = pipeline.run_fleet_inference()
        plan = results["maintenance_plan"]
    return plan


@app.get("/api/explanations/{asset_id}")
def get_asset_explanation(asset_id: str):
    """Returns plain-language diagnostic explanation and contributing sensor breaches."""
    fleet = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_status.json"), default=[])
    asset_record = next((a for a in fleet if a["asset_id"].upper() == asset_id.upper()), None)
    if not asset_record:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")

    return {
        "asset_id": asset_record["asset_id"],
        "status": asset_record["status"],
        "health_score": asset_record["health_score"],
        "composite_risk_score": asset_record["composite_risk_score"],
        "executive_summary": asset_record["executive_summary"],
        "action_recommendation": asset_record["action_recommendation"],
        "trend_note": asset_record["trend_note"],
        "top_contributing_factors": asset_record["top_contributing_factors"],
        "suspected_subsystem": asset_record["predicted_failing_component"],
        "technical_rationale": asset_record["component_diagnosis_reason"]
    }


@app.get("/api/evaluation")
def get_model_evaluation():
    """Returns hold-out model evaluation metrics (Deliverable 1 and Deliverable 3)."""
    report = load_json(os.path.join(DATA_MODELS_DIR, "evaluation_report.json"))
    if not report:
        pipeline = HUMSPipeline()
        report = pipeline.run_training_and_evaluation()
    return report


class RegenerateRequest(BaseModel):
    num_assets: Optional[int] = 40
    clean_count: Optional[int] = 7
    seed: Optional[int] = 42


@app.post("/api/regenerate-data")
def regenerate_synthetic_data(req: RegenerateRequest):
    """Re-generates synthetic CMAPSS datasets and re-runs the end-to-end pipeline."""
    try:
        generate_synthetic_hums_data(
            num_assets=req.num_assets or 40,
            clean_assets_count=req.clean_count or 7,
            seed=req.seed or 42,
            output_dir=DATA_RAW_DIR
        )
        pipeline = HUMSPipeline()
        pipeline.run_training_and_evaluation()
        results = pipeline.run_fleet_inference()
        return {
            "status": "SUCCESS",
            "message": f"Regenerated {req.num_assets} assets and updated fleet diagnostics.",
            "kpis": results["kpis"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
