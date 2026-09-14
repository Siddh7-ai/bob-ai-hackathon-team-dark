"""
Deliverable 4: Maintenance Plan Ranker
Implements transparent multi-factor prioritization scoring:
Priority Score = (Risk Level) * (Mission Criticality of Asset) * (Inverse of Time-to-Predicted-Failure)
Outputs ordered, defensible maintenance queue with actionable recommendations.
"""

from typing import List, Dict, Any
import numpy as np


class MaintenancePlanRanker:
    def __init__(self):
        pass

    def compute_priority_score(
        self,
        composite_risk: float,
        mission_criticality: float,
        time_to_failure_days: float
    ) -> float:
        """
        Multi-factor ranking formula from Technical Approach Note:
        Priority Score = (Risk Level) * (Mission Criticality) * (Inverse Time-to-Failure)
        """
        # Guard against zero or negative days
        safe_ttf = max(0.5, time_to_failure_days)
        inverse_ttf = 1.0 / safe_ttf
        
        # Scaling factor 10.0 for human-interpretable score range (e.g. 0 to 100)
        raw_score = composite_risk * mission_criticality * inverse_ttf * 10.0
        return round(float(raw_score), 2)

    def determine_recommended_action(
        self,
        status: str,
        rul_cycles: float,
        failing_component: str
    ) -> Dict[str, Any]:
        """
        Assigns concrete maintenance action: Inspect / Repair / Replace, along with urgency.
        """
        if status == "Not-Ready" or rul_cycles <= 12:
            action = "EMERGENCY_REPLACE"
            label = "Emergency Overhaul & Component Replacement"
            urgency = "IMMEDIATE"
            timeline = "Within 24-48 Hours (Grounded)"
            est_hours = 18
            parts_required = [f"{failing_component} Replacement Kit", "High-temp Seals", "Fluid Flush Pack"]
        elif status == "At-Risk" and rul_cycles <= 35:
            action = "DEPOT_REPAIR"
            label = "Depot-Level Precision Repair & Recalibration"
            urgency = "HIGH"
            timeline = "Within 7 Days"
            est_hours = 8
            parts_required = [f"{failing_component} Gasket Set", "Borescope Inspection Kit"]
        else:
            action = "INSPECT"
            label = "Non-Destructive Diagnostic Inspection"
            urgency = "MEDIUM"
            timeline = "Within 14 Days"
            est_hours = 3
            parts_required = ["Standard Sensor Calibration Probe", "Spectrometric Oil Sample Kit"]

        return {
            "action_code": action,
            "action_label": label,
            "urgency": urgency,
            "target_timeline": timeline,
            "estimated_labor_hours": est_hours,
            "parts_required": parts_required
        }

    def generate_maintenance_plan(
        self,
        assets_analysis: List[Dict[str, Any]],
        include_ready_assets: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Takes fleet diagnostics, calculates scores, and produces an ordered maintenance plan.
        """
        ranked_items = []

        for item in assets_analysis:
            status = item.get("status", "Ready")
            if not include_ready_assets and status == "Ready":
                continue

            risk_level = item.get("composite_risk_score", 0.1)
            criticality = item.get("mission_criticality", 2.0)
            ttf_days = item.get("estimated_days_to_failure", 30.0)
            rul_cycles = item.get("predicted_rul_cycles", 40.0)
            failing_comp = item.get("predicted_failing_component", "Turbine Subsystem")

            score = self.compute_priority_score(
                composite_risk=risk_level,
                mission_criticality=criticality,
                time_to_failure_days=ttf_days
            )

            action_info = self.determine_recommended_action(status, rul_cycles, failing_comp)

            ranked_items.append({
                "asset_id": item.get("asset_id"),
                "asset_type": item.get("asset_type"),
                "unit": item.get("unit"),
                "status": status,
                "health_score": item.get("health_score"),
                "priority_score": score,
                "mission_criticality": criticality,
                "composite_risk_score": risk_level,
                "predicted_failing_component": failing_comp,
                "predicted_rul_cycles": rul_cycles,
                "estimated_days_to_failure": ttf_days,
                "failure_probability_14d": item.get("failure_probability_14d", 0.0),
                "failure_probability_30d": item.get("failure_probability_30d", 0.0),
                "action_recommendation": action_info["action_label"],
                "action_code": action_info["action_code"],
                "urgency": action_info["urgency"],
                "target_timeline": action_info["target_timeline"],
                "estimated_labor_hours": action_info["estimated_labor_hours"],
                "parts_required": action_info["parts_required"],
                "rationale": item.get("executive_summary", "")
            })

        # Sort descending by priority score
        ranked_items.sort(key=lambda x: x["priority_score"], reverse=True)

        # Assign ranks
        for idx, item in enumerate(ranked_items):
            item["priority_rank"] = idx + 1

        return ranked_items
