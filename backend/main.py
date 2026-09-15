"""
FastAPI Backend for HUMS Predictive Maintenance System
Provides REST endpoints for fleet readiness KPIs, asset telemetry drill-downs,
failure predictions (RUL), diagnostic explanations, prioritised maintenance plans,
work order lifecycle dispatch & completion, and mission sortie simulations.
"""

import os
import sys
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, Request
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
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def normalize_id(val: Any) -> str:
    """Hyphen and case insensitive normalizer for asset IDs and work order IDs."""
    if not val:
        return ""
    return str(val).replace("-", "").strip().upper()



def recalculate_and_save_kpis(fleet: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Helper to keep system-wide fleet KPIs 100% synchronized across all events."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total_count = len(fleet)
    ready_count = sum(1 for a in fleet if a.get("status") == "Ready")
    at_risk_count = sum(1 for a in fleet if a.get("status") == "At-Risk")
    not_ready_count = sum(1 for a in fleet if a.get("status") in ["Not-Ready", "Under-Maintenance"])
    readiness_pct = round((ready_count / total_count) * 100, 1) if total_count > 0 else 0
    avg_health = round(sum(a.get("health_score", 85) for a in fleet) / total_count, 1) if total_count > 0 else 0

    kpis = {
        "total_assets": total_count,
        "ready_count": ready_count,
        "at_risk_count": at_risk_count,
        "not_ready_count": not_ready_count,
        "fleet_readiness_pct": readiness_pct,
        "avg_fleet_health_score": avg_health,
        "average_health_score": avg_health,
        "mean_fleet_health": avg_health,
        "actions_pending": sum(1 for a in fleet if a.get("status") != "Ready"),
        "critical_maintenance_actions": sum(1 for a in fleet if a.get("status") != "Ready"),
        "grounded_count": not_ready_count,
        "last_updated": now_str
    }

    kpi_path = os.path.join(DATA_PROCESSED_DIR, "fleet_kpis.json")
    with open(kpi_path, "w", encoding="utf-8") as f:
        json.dump(kpis, f, indent=2)

    return kpis


@app.get("/health")
@app.get("/api/health")
def health_check():
    """
    Lightweight, production-safe health check endpoint for Render free-tier deployment.
    Returns status: ok instantly without disk or ML pipeline overhead.
    """
    return {"status": "ok"}


@app.get("/")
def root(request: Request):
    accept_header = request.headers.get("accept", "")
    if "application/json" in accept_header and "text/html" not in accept_header:
        return {
            "system": "HUMS Predictive Maintenance API",
            "status": "OPERATIONAL",
            "version": "1.0.0",
            "health": "/health",
            "endpoints": [
                "/health",
                "/api/health",
                "/api/fleet/summary",
                "/api/assets",
                "/api/assets/{asset_id}",
                "/api/predictions",
                "/api/maintenance/plan",
                "/api/explanations/{asset_id}",
                "/api/evaluation",
                "/api/sensor-envelopes",
                "/api/work-orders",
                "/api/work-orders/dispatch",
                "/api/work-orders/complete",
                "/api/sortie/simulate"
            ]
        }
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_path):
        from fastapi.responses import FileResponse
        return FileResponse(index_path)
    return {
        "system": "HUMS Predictive Maintenance API",
        "status": "OPERATIONAL",
        "version": "1.0.0",
        "health": "/health",
        "endpoints": [
            "/health",
            "/api/health",
            "/api/fleet/summary",
            "/api/assets",
            "/api/assets/{asset_id}",
            "/api/predictions",
            "/api/maintenance/plan",
            "/api/explanations/{asset_id}",
            "/api/evaluation",
            "/api/sensor-envelopes",
            "/api/work-orders",
            "/api/work-orders/dispatch",
            "/api/work-orders/complete",
            "/api/sortie/simulate"
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
    norm_aid = normalize_id(asset_id)
    asset_record = next((a for a in fleet if normalize_id(a.get("asset_id")) == norm_aid), None)
    if not asset_record:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found in fleet records")

    ingestion = HUMSDataIngestion(data_dir=DATA_RAW_DIR)
    assets_df, sensors_df, services_df, _ = ingestion.load_data()

    history = sensors_df[sensors_df["asset_id"].astype(str).str.replace("-", "").str.upper() == norm_aid].sort_values("cycle").to_dict(orient="records")
    services = services_df[services_df["asset_id"].astype(str).str.replace("-", "").str.upper() == norm_aid].sort_values("service_date", ascending=False).to_dict(orient="records")

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

    fleet = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_status.json"), default=[])
    fleet_status_map = {normalize_id(a.get("asset_id")): a.get("status") for a in fleet}

    active_plan = []
    rank_counter = 1
    for item in plan:
        aid = normalize_id(item.get("asset_id", ""))
        current_status = fleet_status_map.get(aid, item.get("status"))
        # Exclude assets that are currently Ready
        if current_status == "Ready":
            continue
        item["status"] = current_status
        item["priority_rank"] = rank_counter
        rank_counter += 1
        active_plan.append(item)

    return active_plan


@app.get("/api/explanations/{asset_id}")
def get_asset_explanation(asset_id: str):
    """Returns plain-language diagnostic explanation and contributing sensor breaches."""
    fleet = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_status.json"), default=[])
    norm_aid = normalize_id(asset_id)
    asset_record = next((a for a in fleet if normalize_id(a.get("asset_id")) == norm_aid), None)
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
    """Returns hold-out model evaluation metrics."""
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


class WorkOrderCompleteRequest(BaseModel):
    asset_id: str
    work_order_id: Optional[str] = None
    notes: Optional[str] = None


class SortieSimulateRequest(BaseModel):
    duration_hours: int = 8
    environment: str = "STANDARD"  # STANDARD | DESERT_HEAT | HIGH_ALTITUDE_LEH
    unit_filter: Optional[str] = "ALL"


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

    clean_id = req.asset_id.replace("-", "").strip().upper()
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

    norm_req_aid = normalize_id(req.asset_id)
    orders = [o for o in orders if normalize_id(o.get("asset_id")) != norm_req_aid]
    orders.append(new_order)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(orders, f, indent=2)

    fleet_path = os.path.join(DATA_PROCESSED_DIR, "fleet_status.json")
    fleet = load_json(fleet_path, default=[])
    for a in fleet:
        if normalize_id(a.get("asset_id")) == norm_req_aid:
            a["status"] = "Under-Maintenance"
            a["flight_roster_status"] = "GROUNDED_FOR_MAINTENANCE"
            a["active_work_order"] = wo_id
            a["work_order_dispatched_at"] = now_str

    with open(fleet_path, "w", encoding="utf-8") as f:
        json.dump(fleet, f, indent=2)

    kpis = recalculate_and_save_kpis(fleet)

    return {
        "status": "SUCCESS",
        "message": f"Work Order {wo_id} successfully dispatched for asset {req.asset_id}.",
        "work_order": new_order,
        "kpis": kpis
    }


@app.post("/api/work-orders/complete")
def complete_work_order(req: WorkOrderCompleteRequest):
    """
    Completes maintenance servicing for an asset:
    1. Marks active work order status as COMPLETED.
    2. Recalibrates asset health metrics to nominal 100% / Ready status.
    3. Restores flight roster status to FLIGHT_READY.
    4. Automatically recalculates fleet KPIs across the system.
    """
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    wo_path = os.path.join(DATA_PROCESSED_DIR, "work_orders.json")
    orders = load_json(wo_path, default=[])
    updated_order = None

    norm_req_aid = normalize_id(req.asset_id)
    norm_req_woid = normalize_id(req.work_order_id) if req.work_order_id else None

    for wo in orders:
        wo_aid = normalize_id(wo.get("asset_id"))
        wo_woid = normalize_id(wo.get("work_order_id"))
        if (norm_req_aid and wo_aid == norm_req_aid) or (norm_req_woid and wo_woid == norm_req_woid):
            wo["status"] = "COMPLETED"
            wo["completed_at"] = now_str
            wo["technician_notes"] = req.notes or "Depot servicing complete. Subsystem recalibrated to nominal baseline."
            updated_order = wo

    with open(wo_path, "w", encoding="utf-8") as f:
        json.dump(orders, f, indent=2)

    fleet_path = os.path.join(DATA_PROCESSED_DIR, "fleet_status.json")
    fleet = load_json(fleet_path, default=[])
    target_asset = None

    for a in fleet:
        if normalize_id(a.get("asset_id")) == norm_req_aid:
            a["status"] = "Ready"
            a["flight_roster_status"] = "FLIGHT_READY"
            a["active_work_order"] = None
            a["predicted_rul_cycles"] = 185
            a["estimated_days_to_failure"] = 92
            a["failure_probability_14d"] = 0.01
            a["failure_probability_30d"] = 0.04
            a["health_score"] = 98.5
            a["composite_risk_score"] = 4.2
            a["executive_summary"] = "Platform fully serviced, recalibrated, and cleared for flight operations."
            a["action_recommendation"] = "Sortie Ready - Nominal baseline performance."
            a["trend_note"] = "Post-servicing telemetry indicates 100% nominal sensor envelopes."
            a["top_contributing_factors"] = []
            a["breached_sensors"] = []
            target_asset = a

    with open(fleet_path, "w", encoding="utf-8") as f:
        json.dump(fleet, f, indent=2)

    kpis = recalculate_and_save_kpis(fleet)

    return {
        "status": "SUCCESS",
        "message": f"Asset {req.asset_id} repair completed. Restored to FLIGHT_READY status.",
        "asset": target_asset,
        "work_order": updated_order,
        "kpis": kpis
    }



@app.post("/api/sortie/simulate")
def simulate_sortie_scenario(req: SortieSimulateRequest):
    """
    Simulates a tactical mission sortie under specified environmental & duration stress.
    Predicts mid-mission risk per asset and computes squadron mission clearance rate.
    """
    fleet = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_status.json"), default=[])

    env_multiplier = 1.35 if req.environment == "DESERT_HEAT" else (1.25 if req.environment == "HIGH_ALTITUDE_LEH" else 1.0)
    required_rul = int(req.duration_hours * 2.2 * env_multiplier)

    assessed = []
    suitable_count = 0

    for a in fleet:
        if req.unit_filter and req.unit_filter != "ALL" and a.get("unit", "").lower() != req.unit_filter.lower():
            continue

        rul = a.get("predicted_rul_cycles", 0)
        curr_status = a.get("status", "Ready")
        health_score = float(a.get("health_score", 85.0))
        composite_risk = float(a.get("composite_risk_score", 0.0))
        fail_prob_14d = float(a.get("failure_probability_14d", 0.05))
        failing_comp = a.get("predicted_failing_component", "High-Stress Subsystem")
        diag_reason = a.get("component_diagnosis_reason", "")
        breached_sensors = a.get("breached_sensors", [])
        top_factors = a.get("top_contributing_factors", [])

        # Realistic Combat Survivability calculation based on actual system health
        if curr_status in ["Under-Maintenance", "Not-Ready"]:
            if curr_status == "Under-Maintenance":
                survivability = 0  # Platform is grounded in depot bay
            else:
                survivability = max(5, min(30, round(health_score * (1.0 - fail_prob_14d) * 0.3)))
            is_suitable = False
        elif curr_status == "At-Risk":
            base_ratio = min(1.0, rul / max(1, required_rul))
            env_penalty = (env_multiplier - 1.0) * 0.5
            calc_surv = round(health_score * base_ratio * (1.0 - max(composite_risk, 0.15)) * (1.0 - env_penalty))
            survivability = max(10, min(80, calc_surv))
            is_suitable = False
        else:  # Ready
            breached_sensors = []
            top_factors = []
            base_ratio = rul / max(1, required_rul)
            if base_ratio >= 1.0:
                survivability = 100
                is_suitable = True
            else:
                survivability = max(15, min(95, round(base_ratio * 100)))
                is_suitable = False

        # Build Real System Diagnostic Message
        breach_summary = ", ".join([b.get("sensor", "").replace("_", " ").title() for b in breached_sensors[:2]]) if breached_sensors else ""
        
        if curr_status == "Under-Maintenance":
            warning_msg = f"Depot Grounded: Active servicing for {failing_comp}. Platform unavailable until repair clearance."
        elif curr_status == "Not-Ready":
            warning_msg = f"Critical Telemetry Fault: {failing_comp} failure risk ({health_score}% health). Breached: {breach_summary or 'Critical sensor limit'}."
        elif curr_status == "At-Risk":
            warning_msg = f"At-Risk Subsystem Degradation: {failing_comp} ({diag_reason or 'abnormal sensor drift'}). Breached: {breach_summary or 'Threshold warning'}."
        elif rul < required_rul:
            warning_msg = f"Insufficient Mission RUL: {rul} cycles available vs {required_rul} cycles required under {req.environment} ({int(env_multiplier*100)}% stress)."
        else:
            warning_msg = f"Nominal Flight Envelope: {rul} cycles available (exceeds {required_rul} req). Health {health_score}%. All sensor channels clear."

        if is_suitable:
            suitable_count += 1

        assessed.append({
            "asset_id": a["asset_id"],
            "model_name": a.get("model_name", "Platform"),
            "category": a.get("category", "Defense"),
            "unit": a.get("unit", "Squadron"),
            "current_status": curr_status,
            "health_score": health_score,
            "composite_risk_score": composite_risk,
            "predicted_failing_component": failing_comp,
            "component_diagnosis_reason": diag_reason,
            "breached_sensors": breached_sensors,
            "top_contributing_factors": top_factors,
            "predicted_rul_cycles": rul,
            "required_rul_cycles": required_rul,
            "survivability_pct": survivability,
            "is_suitable": is_suitable,
            "mission_clearance_status": "CLEARED" if is_suitable else "RISK_HIGH",
            "warning": warning_msg
        })

    total_assessed = len(assessed)
    clearance_rate = round((suitable_count / total_assessed) * 100, 1) if total_assessed > 0 else 0

    return {
        "scenario": {
            "duration_hours": req.duration_hours,
            "environment": req.environment,
            "required_rul_cycles": required_rul,
            "env_multiplier": env_multiplier
        },
        "summary": {
            "total_assessed": total_assessed,
            "suitable_count": suitable_count,
            "high_risk_count": total_assessed - suitable_count,
            "mission_clearance_rate_pct": clearance_rate
        },
        "assessed_assets": assessed
    }


@app.get("/api/activity-log")
def get_activity_log():
    """
    Returns unified maintenance audit trail combining real-time dispatched work orders
    and historical depot service records across all assets.
    """
    fleet = load_json(os.path.join(DATA_PROCESSED_DIR, "fleet_status.json"), default=[])
    asset_map = {normalize_id(a.get("asset_id")): a for a in fleet if a.get("asset_id")}

    wo_file = os.path.join(DATA_PROCESSED_DIR, "work_orders.json")
    work_orders = load_json(wo_file, default=[])

    activity_log = []

    for wo in work_orders:
        aid_norm = normalize_id(wo.get("asset_id"))
        asset_info = asset_map.get(aid_norm, {})
        wo_status = wo.get("status", "DISPATCHED")
        is_completed = wo_status == "COMPLETED"
        wo_id = wo.get("work_order_id")

        if is_completed:
            # Completion Audit Event Entry
            activity_log.append({
                "id": f"{wo_id}-COMPLETED" if wo_id else f"{aid_norm}-COMPLETED-{wo.get('completed_at', '')}",
                "work_order_id": wo_id,
                "timestamp": wo.get("completed_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                "asset_id": wo.get("asset_id"),
                "model_name": wo.get("model_name") or asset_info.get("model_name", "Military Platform"),
                "category": asset_info.get("category", "Defense Platform"),
                "unit": wo.get("unit") or asset_info.get("unit", "Base Squadron"),
                "event_type": "DEPOT_SERVICE_RECORD",
                "action_title": f"Depot Repair Servicing Complete",
                "component": wo.get("failing_component", "Subsystem"),
                "parts_reserved": wo.get("parts_reserved", []),
                "assigned_crew": wo.get("assigned_crew", "Base Depot Crew"),
                "estimated_hours": wo.get("estimated_labor_hours", 8),
                "urgency": wo.get("urgency", "HIGH"),
                "status": "COMPLETED",
                "notes": wo.get("technician_notes") or "Depot maintenance complete. Subsystem recalibrated to nominal baseline."
            })
            # Original Dispatch Event Entry
            activity_log.append({
                "id": f"{wo_id}-DISPATCHED" if wo_id else f"{aid_norm}-DISPATCHED-{wo.get('dispatched_at', '')}",
                "work_order_id": wo_id,
                "timestamp": wo.get("dispatched_at", wo.get("completed_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))),
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
                "status": "COMPLETED",
                "notes": f"Work Order {wo_id} issued. Servicing completed & platform restored."
            })
        else:
            activity_log.append({
                "id": f"{wo_id}-DISPATCHED" if wo_id else f"{aid_norm}-DISPATCHED",
                "work_order_id": wo_id,
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
                "notes": f"Work Order {wo_id} issued. Inventory reserved & flight roster locked."
            })

    try:
        ingestion = HUMSDataIngestion(data_dir=DATA_RAW_DIR)
        _, _, services_df, _ = ingestion.load_data()
        for _, srow in services_df.iterrows():
            aid_norm = normalize_id(str(srow["asset_id"]))
            asset_info = asset_map.get(aid_norm, {})
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

    activity_log.sort(key=lambda x: x["timestamp"], reverse=True)
    return activity_log


# Serve static frontend production build if dist directory exists (Unified Cloud Deployment)
FRONTEND_DIST_DIR = os.path.join(PROJECT_ROOT, "frontend", "dist")
if os.path.exists(FRONTEND_DIST_DIR):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path in ["health", "api/health"]:
            raise HTTPException(status_code=404, detail="Route not found")
        file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "index.html"))

