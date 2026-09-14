"""
Deliverable 2: Explanation Layer (Explain Each Readiness Issue)
Translates model feature importances, safe-envelope breaches, and degradation curves
into actionable, plain-English executive briefings for maintenance commanders.
"""

from typing import Dict, List, Any
import numpy as np

# Plain language descriptors for telemetry components
SENSOR_DISPLAY_NAMES = {
    "vibration_level": "Vibration Amplitude",
    "oil_debris_count": "Metallic Oil Debris",
    "engine_temp_c": "Exhaust Gas Temperature",
    "pressure_ratio": "Compressor Pressure Ratio",
    "fuel_flow_rate": "Fuel Consumption Rate",
    "rotational_speed_rpm": "Turbine Shaft Speed"
}

SENSOR_UNITS = {
    "vibration_level": "mm/s",
    "oil_debris_count": "ppm",
    "engine_temp_c": "°C",
    "pressure_ratio": "ratio",
    "fuel_flow_rate": "kg/s",
    "rotational_speed_rpm": "RPM"
}


class ExplanationEngine:
    def __init__(self):
        pass

    def explain_asset_readiness(
        self,
        asset_meta: Dict[str, Any],
        readiness_eval: Dict[str, Any],
        prediction_eval: Dict[str, Any],
        historical_telemetry: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes model findings, sensor deviations, and RUL into human-readable briefings.
        """
        asset_id = asset_meta.get("asset_id", "Unknown Asset")
        asset_type = asset_meta.get("asset_type", "Platform")
        status = readiness_eval.get("predicted_status", "Ready")
        health_score = readiness_eval.get("health_score", 100.0)
        breached = readiness_eval.get("breached_sensors", [])
        rul_cycles = prediction_eval.get("predicted_rul_cycles", 100)
        est_days = prediction_eval.get("estimated_days_to_failure", 60)
        failing_comp = prediction_eval.get("predicted_failing_component", "None")
        comp_reason = prediction_eval.get("component_diagnosis_reason", "")
        prob_14d = prediction_eval.get("failure_probability_14d", 0.05)

        contributing_factors = []
        for b in breached:
            s_name = b["sensor"]
            disp_name = SENSOR_DISPLAY_NAMES.get(s_name, s_name)
            unit = SENSOR_UNITS.get(s_name, "")
            factor_text = f"{disp_name} registered {b['value']} {unit}, exceeding safe threshold of {b['threshold']} {unit} (+{b['breach_pct']}%)"
            contributing_factors.append({
                "sensor_key": s_name,
                "label": disp_name,
                "current_value": b["value"],
                "threshold": b["threshold"],
                "unit": unit,
                "breach_pct": b["breach_pct"],
                "summary": factor_text
            })

        # Sort factors by highest percentage breach
        contributing_factors = sorted(contributing_factors, key=lambda x: x["breach_pct"], reverse=True)

        # Generate Plain-Language Executive Summary
        if status == "Ready":
            summary = (
                f"{asset_type} {asset_id} is operating within nominal HUMS telemetry thresholds "
                f"with a composite health index of {health_score}%. No critical degradation trends detected. "
                f"Projected remaining useful life exceeds {int(rul_cycles)} cycles (~{int(est_days)} mission days)."
            )
            action_statement = "Asset cleared for standard flight/operational sortie assignments."
            risk_level = "LOW"

        elif status == "At-Risk":
            top_reasons = "; ".join([f["summary"] for f in contributing_factors[:2]]) if contributing_factors else "Minor sensor drift"
            summary = (
                f"{asset_type} {asset_id} has been flagged as AT-RISK with health index at {health_score}%. "
                f"Early stage degradation detected in {failing_comp}: {top_reasons}. "
                f"Remaining useful life is estimated at {int(rul_cycles)} cycles (~{int(est_days)} days), "
                f"with a {round(prob_14d * 100)}% probability of mission abort within the next 14 days."
            )
            action_statement = (
                f"Recommend scheduling non-destructive diagnostic inspection for {failing_comp} "
                f"before cycle {int(asset_meta.get('total_operating_cycles', 0) + rul_cycles * 0.6)}."
            )
            risk_level = "MEDIUM"

        else:  # Not-Ready
            top_reasons = "; ".join([f["summary"] for f in contributing_factors[:3]]) if contributing_factors else "Multi-sensor threshold breach"
            summary = (
                f"CRITICAL ALERT: {asset_type} {asset_id} is deemed NOT-READY for deployment. "
                f"Imminent failure signature observed on {failing_comp}. Root cause: {top_reasons}. "
                f"Remaining useful life is critically depleted to ~{int(rul_cycles)} cycles ({int(est_days)} operational days). "
                f"14-day mission failure probability is {round(prob_14d * 100)}%."
            )
            action_statement = (
                f"IMMEDIATE ACTION REQUIRED: Ground platform {asset_id}. "
                f"Dispatch depot maintenance crew for overhaul/replacement of {failing_comp}. "
                f"Mechanic note: {comp_reason}."
            )
            risk_level = "CRITICAL"

        # Rate of change over historical window (if history provided)
        trend_note = ""
        if historical_telemetry and len(historical_telemetry) >= 5:
            recent = historical_telemetry[-5:]
            first_vib = recent[0].get("vibration_level", 2.0)
            last_vib = recent[-1].get("vibration_level", 2.0)
            if first_vib > 0 and (last_vib - first_vib) / first_vib > 0.15:
                rate = round(((last_vib - first_vib) / first_vib) * 100, 1)
                trend_note = f"Vibration amplitude has accelerated +{rate}% over the last 5 operating cycles."

        return {
            "asset_id": asset_id,
            "status": status,
            "risk_level": risk_level,
            "health_score": health_score,
            "executive_summary": summary,
            "action_recommendation": action_statement,
            "trend_note": trend_note,
            "top_contributing_factors": contributing_factors[:3],
            "suspected_subsystem": failing_comp,
            "technical_rationale": comp_reason
        }
