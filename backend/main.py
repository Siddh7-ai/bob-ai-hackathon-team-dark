"""
FastAPI Backend for HUMS Predictive Maintenance System
Provides REST endpoints for fleet readiness KPIs, asset telemetry drill-downs,
failure predictions (RUL), diagnostic explanations, and prioritised maintenance plans.
"""

import os
import sys
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
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
    category: Optional[str] = Query(None, description="Filter by category: Aircraft, Helicopters, Vehicles"),
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
    if category and category.lower() != "all":
        filtered = [a for a in filtered if a.get("category", "").lower() == category.lower()]
    if asset_type and asset_type.lower() != "all":
        filtered = [a for a in filtered if a["asset_type"].lower() == asset_type.lower()]
    if unit and unit.lower() != "all":
        filtered = [a for a in filtered if a["unit"].lower() == unit.lower()]
    if search:
        s = search.lower()
        filtered = [
            a for a in filtered 
            if s in a["asset_id"].lower() 
            or s in a["asset_type"].lower() 
            or s in a.get("category", "").lower()
            or s in a.get("model_name", "").lower() 
            or s in a["unit"].lower()
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


class WorkOrderDispatchRequest(BaseModel):
    asset_id: str
    action_code: Optional[str] = "EMERGENCY_REPLACE"
    action_label: Optional[str] = None
    failing_component: Optional[str] = None
    parts_required: Optional[List[str]] = []
    estimated_labor_hours: Optional[int] = 8
    urgency: Optional[str] = "HIGH"
    unit: Optional[str] = None
    model_name: Optional[str] = None


@app.get("/api/work-orders")
def get_work_orders():
    """Returns list of all dispatched work orders."""
    file_path = os.path.join(DATA_PROCESSED_DIR, "work_orders.json")
    orders = load_json(file_path, default=[])
    return orders


@app.post("/api/work-orders/dispatch")
def dispatch_work_order(req: WorkOrderDispatchRequest):
    """
    Dispatches an official military maintenance work order.
    Reserves spare parts from inventory, assigns maintenance crew, locks flight status to grounded,
    and returns full work order confirmation receipt.
    """
    file_path = os.path.join(DATA_PROCESSED_DIR, "work_orders.json")
    orders = load_json(file_path, default=[])

    clean_id = req.asset_id.replace("-", "").upper()
    wo_id = f"WO-2026-{clean_id}"

    now_dt = datetime.now()
    now_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")
    time_str = now_dt.strftime("%I:%M:%S %p")

    crew_name = "Alpha Maintenance Squad - Bay 3" if req.urgency == "IMMEDIATE" else "Bravo Depot Repair Team - Hangar 2"

    new_order = {
        "work_order_id": wo_id,
        "asset_id": req.asset_id,
        "model_name": req.model_name or "Military Platform",
        "unit": req.unit or "Base Squadron",
        "action_code": req.action_code,
        "action_label": req.action_label or "Depot Maintenance",
        "failing_component": req.failing_component or "Subsystem",
        "parts_reserved": req.parts_required or [],
        "parts_reserved_count": len(req.parts_required or []),
        "estimated_labor_hours": req.estimated_labor_hours or 8,
        "urgency": req.urgency,
        "assigned_crew": crew_name,
        "inventory_status": "RESERVED_FROM_BASE_LOGISTICS",
        "flight_roster_status": "GROUNDED_FOR_MAINTENANCE",
        "dispatched_at": now_str,
        "dispatched_time": time_str,
        "status": "DISPATCHED"
    }

    # Upsert order in work_orders.json
    orders = [o for o in orders if o.get("asset_id", "").upper() != req.asset_id.upper()]
    orders.append(new_order)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(orders, f, indent=2)

    # Persist asset status grounding in fleet_status.json
    fleet_path = os.path.join(DATA_PROCESSED_DIR, "fleet_status.json")
    fleet = load_json(fleet_path, default=[])
    for a in fleet:
        if a.get("asset_id", "").upper() == req.asset_id.upper():
            a["status"] = "Under-Maintenance"
            a["flight_roster_status"] = "GROUNDED_FOR_MAINTENANCE"
            a["active_work_order"] = wo_id
            a["work_order_dispatched_at"] = now_str

    with open(fleet_path, "w", encoding="utf-8") as f:
        json.dump(fleet, f, indent=2)

    return {
        "status": "SUCCESS",
        "message": f"Work Order {wo_id} successfully dispatched for asset {req.asset_id}.",
        "work_order": new_order
    }


@app.get("/api/activity-log")
def get_activity_log():
    """
    Returns unified maintenance audit trail combining real-time dispatched work orders
    and historical depot service records across all assets.
    """
    fleet = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_status.json"), default=[])
    asset_map = {a["asset_id"].upper(): a for a in fleet}

    wo_file = os.path.join(DATA_PROCESSED_DIR, "work_orders.json")
    work_orders = load_json(wo_file, default=[])

    activity_log = []

    # 1. Real-time Dispatched Work Orders
    for wo in work_orders:
        aid = wo.get("asset_id", "").upper()
        asset_info = asset_map.get(aid, {})
        activity_log.append({
            "id": wo.get("work_order_id"),
            "timestamp": wo.get("dispatched_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            "asset_id": wo.get("asset_id"),
            "model_name": wo.get("model_name") or asset_info.get("model_name", "Military Platform"),
            "category": asset_info.get("category", "Defense Platform"),
            "unit": wo.get("unit") or asset_info.get("unit", "Base Squadron"),
            "event_type": "WORK_ORDER_DISPATCH",
            "action_title": wo.get("action_label", "Work Order Dispatched"),
            "component": wo.get("failing_component", "Subsystem"),
            "parts_reserved": wo.get("parts_reserved", []),
            "assigned_crew": wo.get("assigned_crew", "Base Depot Crew"),
            "estimated_hours": wo.get("estimated_labor_hours", 8),
            "urgency": wo.get("urgency", "HIGH"),
            "status": "DISPATCHED_TO_DEPOT",
            "notes": f"Work Order {wo.get('work_order_id')} issued. Inventory reserved & flight roster locked."
        })

    # 2. Historical Service Logs
    try:
        ingestion = HUMSDataIngestion(data_dir=DATA_RAW_DIR)
        _, _, services_df, _ = ingestion.load_data()
        for _, srow in services_df.iterrows():
            aid = str(srow["asset_id"]).upper()
            asset_info = asset_map.get(aid, {})
            activity_log.append({
                "id": str(srow["record_id"]),
                "timestamp": str(srow["service_date"]) + " 09:00:00",
                "asset_id": str(srow["asset_id"]),
                "model_name": asset_info.get("model_name", "Military Platform"),
                "category": asset_info.get("category", "Defense Platform"),
                "unit": asset_info.get("unit", "Base Squadron"),
                "event_type": "DEPOT_SERVICE_RECORD",
                "action_title": f"{srow['service_type']} Depot Servicing",
                "component": str(srow["component_serviced"]),
                "parts_reserved": ["Standard Calibration Kit"],
                "assigned_crew": "Base Maintenance Squadron",
                "estimated_hours": 6,
                "urgency": "ROUTINE",
                "status": "COMPLETED",
                "notes": str(srow["technician_notes"])
            })
    except Exception as e:
        print("Historical service load note:", e)

    # Sort descending by timestamp
    activity_log.sort(key=lambda x: x["timestamp"], reverse=True)
    return activity_log


