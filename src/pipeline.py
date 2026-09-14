"""
Unified HUMS Pipeline Orchestrator
Connects all 4 deliverables:
1. Ingestion & Feature Engineering
2. Train & Evaluate Readiness Classifier (Deliverable 1)
3. Train & Evaluate Failure Prediction RUL Model (Deliverable 3)
4. Generate Plain-Language Diagnostic Briefings (Deliverable 2)
5. Generate Multi-Factor Prioritised Maintenance Plan (Deliverable 4)
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from typing import Dict, Any

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.ingestion import HUMSDataIngestion
from src.readiness_classifier import ReadinessClassifier
from src.failure_prediction import FailurePredictor
from src.explanation_engine import ExplanationEngine
from src.maintenance_ranker import MaintenancePlanRanker


class HUMSPipeline:
    def __init__(
        self,
        data_dir: str = None,
        models_dir: str = None,
        output_dir: str = None
    ):
        self.data_dir = data_dir or os.path.join(PROJECT_ROOT, "data", "raw")
        self.models_dir = models_dir or os.path.join(PROJECT_ROOT, "data", "models")
        self.output_dir = output_dir or os.path.join(PROJECT_ROOT, "data", "processed")
        
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)

        self.ingestion = HUMSDataIngestion(data_dir=self.data_dir)
        self.classifier = ReadinessClassifier(model_path=os.path.join(self.models_dir, "readiness_classifier.joblib"))
        self.predictor = FailurePredictor(model_path=os.path.join(self.models_dir, "rul_regressor.joblib"))
        self.explainer = ExplanationEngine()
        self.ranker = MaintenancePlanRanker()

    def run_training_and_evaluation(self, test_ratio: float = 0.25) -> Dict[str, Any]:
        """
        Extracts temporal features, splits assets into train/test holdouts,
        trains both models, and saves evaluation metrics.
        """
        print("[PIPELINE] Ingesting and extracting temporal features...")
        features_df = self.ingestion.extract_features()

        unique_assets = list(features_df["asset_id"].unique())
        np.random.seed(42)
        shuffled = np.random.permutation(unique_assets)
        test_count = max(2, int(len(unique_assets) * test_ratio))
        test_assets = list(shuffled[:test_count])
        train_assets = list(shuffled[test_count:])

        print(f"[PIPELINE] Total Assets: {len(unique_assets)} | Train: {len(train_assets)} | Hold-out Test: {len(test_assets)}")

        # Train Deliverable 1
        print("[PIPELINE] Training Deliverable 1: Readiness Classifier...")
        clf_metrics = self.classifier.train(features_df, test_assets=test_assets)

        # Train Deliverable 3
        print("[PIPELINE] Training Deliverable 3: RUL Failure Predictor...")
        pred_metrics = self.predictor.train(features_df, test_assets=test_assets)

        eval_report = {
            "evaluation_timestamp": pd.Timestamp.now().isoformat(),
            "train_assets_count": len(train_assets),
            "test_assets_count": len(test_assets),
            "test_asset_ids": test_assets,
            "readiness_classifier": {
                "accuracy": clf_metrics["accuracy"],
                "f1_weighted": clf_metrics["f1_weighted"],
                "top_features": clf_metrics["top_features"]
            },
            "failure_prediction_rul": {
                "mae_cycles": pred_metrics["mae_cycles"],
                "rmse_cycles": pred_metrics["rmse_cycles"],
                "r2_score": pred_metrics["r2_score"],
                "top_features": pred_metrics["top_features"]
            }
        }

        report_path = os.path.join(self.models_dir, "evaluation_report.json")
        with open(report_path, "w") as f:
            json.dump(eval_report, f, indent=2)

        print(f"[PIPELINE] Evaluation Report saved to {report_path}")
        print(f"  - Readiness Classifier: Accuracy = {clf_metrics['accuracy'] * 100:.1f}%, F1 = {clf_metrics['f1_weighted']:.3f}")
        print(f"  - RUL Regressor: MAE = {pred_metrics['mae_cycles']} cycles, RMSE = {pred_metrics['rmse_cycles']} cycles, R2 = {pred_metrics['r2_score']:.3f}")

        return eval_report

    def run_fleet_inference(self) -> Dict[str, Any]:
        """
        Runs full inference on the latest telemetry for all assets.
        Synthesizes explanations and generates the prioritised maintenance plan.
        """
        print("[PIPELINE] Generating fleet diagnostics and explanations...")
        latest_df = self.ingestion.get_latest_asset_snapshots()
        assets_meta_df, raw_sensors, services_df, _ = self.ingestion.load_data()

        fleet_results = []
        for _, row in latest_df.iterrows():
            asset_id = row["asset_id"]
            row_df = pd.DataFrame([row])

            # 1. Readiness Classifier
            readiness_res = self.classifier.predict(row_df)

            # 2. Failure Predictor
            prediction_res = self.predictor.predict_rul(row_df)

            # 3. Asset Telemetry History for this asset
            asset_history = raw_sensors[raw_sensors["asset_id"] == asset_id].to_dict(orient="records")

            # 4. Explanation Layer
            meta_dict = row.to_dict()
            explanation_res = self.explainer.explain_asset_readiness(
                asset_meta=meta_dict,
                readiness_eval=readiness_res,
                prediction_eval=prediction_res,
                historical_telemetry=asset_history
            )

            # Consolidated record
            asset_summary = {
                "asset_id": asset_id,
                "category": str(row.get("category", "Aircraft")),
                "asset_type": row.get("asset_type", "Platform"),
                "model_name": str(row.get("model_name", "Standard Mk-1")),
                "image_url": str(row.get("image_url", "/images/assets/fighter_jet.jpg")),
                "unit": row.get("unit", "Default Squadron"),
                "mission_criticality": float(row.get("mission_criticality", 2.0)),
                "total_operating_cycles": int(row.get("total_operating_cycles", row["cycle"])),
                "current_cycle": int(row["cycle"]),
                "last_service_date": str(row.get("last_service_date", "2024-01-01")),
                "status": readiness_res["predicted_status"],
                "health_score": readiness_res["health_score"],
                "composite_risk_score": readiness_res["composite_risk_score"],
                "status_probabilities": readiness_res["probabilities"],
                "breached_sensors": readiness_res["breached_sensors"],
                "predicted_rul_cycles": prediction_res["predicted_rul_cycles"],
                "estimated_days_to_failure": prediction_res["estimated_days_to_failure"],
                "failure_probability_14d": prediction_res["failure_probability_14d"],
                "failure_probability_30d": prediction_res["failure_probability_30d"],
                "predicted_failing_component": prediction_res["predicted_failing_component"],
                "component_diagnosis_reason": prediction_res["component_diagnosis_reason"],
                "executive_summary": explanation_res["executive_summary"],
                "action_recommendation": explanation_res["action_recommendation"],
                "trend_note": explanation_res["trend_note"],
                "top_contributing_factors": explanation_res["top_contributing_factors"],
                "latest_sensors": {
                    "vibration_level": float(row["vibration_level"]),
                    "oil_debris_count": float(row["oil_debris_count"]),
                    "engine_temp_c": float(row["engine_temp_c"]),
                    "pressure_ratio": float(row["pressure_ratio"]),
                    "fuel_flow_rate": float(row["fuel_flow_rate"]),
                    "rotational_speed_rpm": float(row["rotational_speed_rpm"])
                }
            }
            fleet_results.append(asset_summary)

        # 5. Maintenance Ranker
        maintenance_plan = self.ranker.generate_maintenance_plan(fleet_results, include_ready_assets=False)

        # Fleet KPI Summary
        ready_count = sum(1 for a in fleet_results if a["status"] == "Ready")
        at_risk_count = sum(1 for a in fleet_results if a["status"] == "At-Risk")
        not_ready_count = sum(1 for a in fleet_results if a["status"] == "Not-Ready")
        avg_health = round(float(np.mean([a["health_score"] for a in fleet_results])), 1)

        kpi_summary = {
            "total_assets": len(fleet_results),
            "ready_count": ready_count,
            "at_risk_count": at_risk_count,
            "not_ready_count": not_ready_count,
            "fleet_readiness_pct": round((ready_count / len(fleet_results)) * 100, 1),
            "average_health_score": avg_health,
            "critical_maintenance_actions": len(maintenance_plan)
        }

        # Save outputs
        with open(os.path.join(self.output_dir, "fleet_status.json"), "w") as f:
            json.dump(fleet_results, f, indent=2)

        with open(os.path.join(self.output_dir, "maintenance_plan.json"), "w") as f:
            json.dump(maintenance_plan, f, indent=2)

        with open(os.path.join(self.output_dir, "fleet_kpis.json"), "w") as f:
            json.dump(kpi_summary, f, indent=2)

        print(f"[PIPELINE] Processed {len(fleet_results)} assets.")
        print(f"[PIPELINE] Fleet Readiness: {kpi_summary['fleet_readiness_pct']}% ({ready_count} Ready, {at_risk_count} At-Risk, {not_ready_count} Not-Ready)")
        print(f"[PIPELINE] Prioritised Maintenance Queue: {len(maintenance_plan)} pending actions.")

        return {
            "kpis": kpi_summary,
            "fleet_status": fleet_results,
            "maintenance_plan": maintenance_plan
        }


if __name__ == "__main__":
    pipeline = HUMSPipeline()
    pipeline.run_training_and_evaluation()
    pipeline.run_fleet_inference()
