"""
Tests for Phase 2: Deliverables 1, 2, 3, and 4 ML Models and Rules
"""

import os
import pytest
import pandas as pd
import numpy as np

from src.data_generator import generate_synthetic_hums_data
from src.ingestion import HUMSDataIngestion
from src.readiness_classifier import ReadinessClassifier
from src.failure_prediction import FailurePredictor
from src.explanation_engine import ExplanationEngine
from src.maintenance_ranker import MaintenancePlanRanker


@pytest.fixture(scope="module")
def prepared_data(tmp_path_factory):
    data_dir = str(tmp_path_factory.mktemp("hums_data"))
    models_dir = str(tmp_path_factory.mktemp("hums_models"))

    # Generate test dataset
    generate_synthetic_hums_data(num_assets=20, clean_assets_count=4, seed=42, output_dir=data_dir)
    
    ingestion = HUMSDataIngestion(data_dir=data_dir)
    features_df = ingestion.extract_features()
    latest_df = ingestion.get_latest_asset_snapshots()

    return {
        "data_dir": data_dir,
        "models_dir": models_dir,
        "features_df": features_df,
        "latest_df": latest_df
    }


def test_readiness_classifier_train_predict(prepared_data):
    features_df = prepared_data["features_df"]
    models_dir = prepared_data["models_dir"]
    model_path = os.path.join(models_dir, "test_classifier.joblib")

    classifier = ReadinessClassifier(model_path=model_path)
    metrics = classifier.train(features_df)

    # General performance checks (sanity check, not artificial perfection)
    assert metrics["accuracy"] >= 0.70
    assert metrics["f1_weighted"] >= 0.70
    assert os.path.exists(model_path)

    # Predict single asset
    single_row = prepared_data["latest_df"].iloc[0:1]
    res = classifier.predict(single_row)

    assert "predicted_status" in res
    assert res["predicted_status"] in ["Ready", "At-Risk", "Not-Ready"]
    assert "health_score" in res
    assert 0.0 <= res["health_score"] <= 100.0
    assert "composite_risk_score" in res


def test_failure_predictor_train_predict(prepared_data):
    features_df = prepared_data["features_df"]
    models_dir = prepared_data["models_dir"]
    model_path = os.path.join(models_dir, "test_regressor.joblib")

    predictor = FailurePredictor(model_path=model_path)
    metrics = predictor.train(features_df)

    # Sanity checks on regression metrics
    assert metrics["mae_cycles"] < 35.0
    assert os.path.exists(model_path)

    # Test inference
    single_row = prepared_data["latest_df"].iloc[0:1]
    pred = predictor.predict_rul(single_row)

    assert "predicted_rul_cycles" in pred
    assert pred["predicted_rul_cycles"] > 0
    assert "failure_probability_14d" in pred
    assert 0.0 <= pred["failure_probability_14d"] <= 1.0
    assert 0.0 <= pred["failure_probability_30d"] <= 1.0
    assert "predicted_failing_component" in pred
    assert len(pred["predicted_failing_component"]) > 0


def test_explanation_engine():
    explainer = ExplanationEngine()
    asset_meta = {"asset_id": "AC-1005", "asset_type": "Fighter Jet Engine", "total_operating_cycles": 180}
    readiness_eval = {
        "predicted_status": "Not-Ready",
        "health_score": 38.0,
        "breached_sensors": [
            {"sensor": "vibration_level", "value": 4.6, "threshold": 2.8, "breach_pct": 64.3, "unit": "mm/s"},
            {"sensor": "oil_debris_count", "value": 48.0, "threshold": 18.0, "breach_pct": 166.7, "unit": "ppm"}
        ]
    }
    prediction_eval = {
        "predicted_rul_cycles": 8.0,
        "estimated_days_to_failure": 5.0,
        "failure_probability_14d": 0.88,
        "predicted_failing_component": "Main Bearing / Gearbox",
        "component_diagnosis_reason": "High vibration and particle buildup"
    }

    result = explainer.explain_asset_readiness(asset_meta, readiness_eval, prediction_eval)
    assert result["status"] == "Not-Ready"
    assert result["risk_level"] == "CRITICAL"
    assert "CRITICAL ALERT" in result["executive_summary"]
    assert "Main Bearing / Gearbox" in result["executive_summary"]
    assert len(result["top_contributing_factors"]) == 2


def test_maintenance_ranker():
    ranker = MaintenancePlanRanker()
    mock_assets = [
        {
            "asset_id": "AC-01",
            "asset_type": "Fighter Jet Engine",
            "unit": "101st Wing",
            "status": "Not-Ready",
            "health_score": 30.0,
            "composite_risk_score": 0.85,
            "mission_criticality": 3.0,
            "estimated_days_to_failure": 4.0,
            "predicted_rul_cycles": 6.0,
            "predicted_failing_component": "Turbine Blade"
        },
        {
            "asset_id": "AC-02",
            "asset_type": "Transport Helicopter",
            "unit": "82nd Aviation",
            "status": "At-Risk",
            "health_score": 68.0,
            "composite_risk_score": 0.40,
            "mission_criticality": 2.2,
            "estimated_days_to_failure": 18.0,
            "predicted_rul_cycles": 28.0,
            "predicted_failing_component": "Hydraulic Pump"
        },
        {
            "asset_id": "AC-03",
            "asset_type": "Armoured Vehicle",
            "unit": "3rd Brigade",
            "status": "Ready",
            "health_score": 95.0,
            "composite_risk_score": 0.05,
            "mission_criticality": 1.6,
            "estimated_days_to_failure": 90.0,
            "predicted_rul_cycles": 140.0,
            "predicted_failing_component": "None"
        }
    ]

    plan = ranker.generate_maintenance_plan(mock_assets, include_ready_assets=False)
    assert len(plan) == 2  # Ready asset filtered out
    assert plan[0]["asset_id"] == "AC-01"  # AC-01 has higher risk and urgent TTF
    assert plan[0]["priority_rank"] == 1
    assert plan[0]["priority_score"] > plan[1]["priority_score"]
    assert plan[0]["action_code"] == "EMERGENCY_REPLACE"
    assert plan[1]["action_code"] == "DEPOT_REPAIR"
