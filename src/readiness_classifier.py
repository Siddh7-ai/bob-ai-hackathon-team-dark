"""
Deliverable 1: Readiness Classifier (Identify Non-Ready Assets)
Combines domain-rule envelope deviation scoring with a trained Random Forest Classifier.
Outputs: Ready / At-Risk / Not-Ready with confidence scores and health indexes.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.model_selection import train_test_split

# Safe envelopes from Baseline Specification
SAFE_ENVELOPES = {
    "vibration_level": {"nominal": 2.0, "safe_limit": 2.8, "critical_limit": 4.5, "weight": 0.25},
    "oil_debris_count": {"nominal": 10.0, "safe_limit": 18.0, "critical_limit": 42.0, "weight": 0.20},
    "engine_temp_c": {"nominal": 650.0, "safe_limit": 710.0, "critical_limit": 780.0, "weight": 0.20},
    "pressure_ratio": {"nominal": 13.5, "safe_limit": 12.0, "critical_limit": 10.6, "weight": 0.15, "inverted": True},
    "fuel_flow_rate": {"nominal": 2.0, "safe_limit": 2.35, "critical_limit": 2.80, "weight": 0.10},
    "rotational_speed_rpm": {"nominal": 12800.0, "safe_drift": 180.0, "critical_drift": 450.0, "weight": 0.10}
}


class ReadinessClassifier:
    def __init__(self, model_path: str = "./data/models/readiness_classifier.joblib"):
        self.model_path = model_path
        self.model: RandomForestClassifier = None
        self.feature_names: List[str] = []
        self.classes_ = ["Ready", "At-Risk", "Not-Ready"]

    def compute_rule_score(self, sensor_snapshot: Dict[str, float]) -> Dict[str, Any]:
        """
        Deliverable 1 Rule-based Engine:
        Computes composite deviation score (0.0 to 1.0) and safe envelope breaches.
        0.0 = completely healthy nominal, 1.0 = severely compromised.
        """
        composite_risk = 0.0
        breached_sensors = []
        deviations = {}

        for sensor, cfg in SAFE_ENVELOPES.items():
            val = sensor_snapshot.get(sensor, cfg["nominal"])
            weight = cfg["weight"]
            
            if sensor == "rotational_speed_rpm":
                # Measures deviation from nominal center
                drift = abs(val - cfg["nominal"])
                safe_drift = cfg["safe_drift"]
                crit_drift = cfg["critical_drift"]
                if drift > safe_drift:
                    sensor_risk = min(1.0, (drift - safe_drift) / (crit_drift - safe_drift + 1e-5))
                    breached_sensors.append({
                        "sensor": sensor,
                        "value": val,
                        "threshold": cfg["nominal"] + (safe_drift if val > cfg["nominal"] else -safe_drift),
                        "breach_pct": round((drift / safe_drift - 1.0) * 100, 1),
                        "unit": "RPM"
                    })
                else:
                    sensor_risk = 0.0
                deviations[sensor] = drift

            elif cfg.get("inverted", False):
                # Pressure ratio: lower is worse
                safe_min = cfg["safe_limit"]
                crit_min = cfg["critical_limit"]
                if val < safe_min:
                    sensor_risk = min(1.0, (safe_min - val) / (safe_min - crit_min + 1e-5))
                    breached_sensors.append({
                        "sensor": sensor,
                        "value": val,
                        "threshold": safe_min,
                        "breach_pct": round(((safe_min - val) / safe_min) * 100, 1),
                        "unit": "ratio"
                    })
                else:
                    sensor_risk = 0.0
                deviations[sensor] = max(0.0, safe_min - val)

            else:
                # Standard sensors: higher is worse
                safe_max = cfg["safe_limit"]
                crit_max = cfg["critical_limit"]
                if val > safe_max:
                    sensor_risk = min(1.0, (val - safe_max) / (crit_max - safe_max + 1e-5))
                    unit = "mm/s" if "vibration" in sensor else ("ppm" if "debris" in sensor else ("°C" if "temp" in sensor else "kg/s"))
                    breached_sensors.append({
                        "sensor": sensor,
                        "value": val,
                        "threshold": safe_max,
                        "breach_pct": round(((val - safe_max) / safe_max) * 100, 1),
                        "unit": unit
                    })
                else:
                    sensor_risk = 0.0
                deviations[sensor] = max(0.0, val - safe_max)

            composite_risk += weight * sensor_risk

        composite_risk = min(1.0, max(0.0, composite_risk))
        
        # Rule classification
        if composite_risk < 0.28 and len(breached_sensors) == 0:
            status = "Ready"
        elif composite_risk < 0.65 and len(breached_sensors) <= 2:
            status = "At-Risk"
        else:
            status = "Not-Ready"

        health_score = round((1.0 - composite_risk) * 100, 1)

        return {
            "status": status,
            "composite_risk_score": round(composite_risk, 3),
            "health_score": health_score,
            "breached_sensors": breached_sensors,
            "deviations": deviations
        }

    def train(self, df_features: pd.DataFrame, test_assets: List[str] = None) -> Dict[str, Any]:
        """
        Trains a Random Forest classifier using synthetic run features and failure labels.
        Evaluates on held-out test assets.
        """
        # Select features: sensor values + rolling statistics
        candidate_cols = [c for c in df_features.columns if (
            c.startswith("vibration_level") or 
            c.startswith("oil_debris_count") or 
            c.startswith("engine_temp_c") or 
            c.startswith("pressure_ratio") or 
            c.startswith("fuel_flow_rate") or 
            c.startswith("rotational_speed_rpm")
        )]
        self.feature_names = candidate_cols

        # Filter rows with labels
        valid_df = df_features.dropna(subset=["ground_truth_readiness"]).copy()

        # Train / Test split by Asset ID to prevent temporal data leakage across the same asset
        unique_assets = valid_df["asset_id"].unique()
        if test_assets is None:
            train_assets, test_assets = train_test_split(unique_assets, test_size=0.25, random_state=42)
        else:
            train_assets = [a for a in unique_assets if a not in test_assets]

        train_data = valid_df[valid_df["asset_id"].isin(train_assets)]
        test_data = valid_df[valid_df["asset_id"].isin(test_assets)]

        X_train = train_data[self.feature_names]
        y_train = train_data["ground_truth_readiness"]
        X_test = test_data[self.feature_names]
        y_test = test_data["ground_truth_readiness"]

        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=42,
            class_weight="balanced"
        )
        self.model.fit(X_train, y_train)

        # Predictions on hold-out assets
        y_pred = self.model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average="weighted")
        report = classification_report(y_test, y_pred, output_dict=True)

        # Feature importances
        importances = sorted(
            zip(self.feature_names, self.model.feature_importances_),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump({
            "model": self.model,
            "features": self.feature_names,
            "classes": list(self.model.classes_)
        }, self.model_path)

        metrics = {
            "accuracy": round(acc, 4),
            "f1_weighted": round(f1, 4),
            "test_assets": list(test_assets),
            "test_samples": len(test_data),
            "top_features": importances,
            "detailed_report": report
        }
        return metrics

    def load(self):
        """Loads saved model artifact."""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}")
        saved = joblib.load(self.model_path)
        self.model = saved["model"]
        self.feature_names = saved["features"]
        self.classes_ = saved["classes"]

    def predict(self, feature_row: pd.DataFrame) -> Dict[str, Any]:
        """Runs inference combining ML classifier with rule guardrails."""
        if self.model is None:
            self.load()

        # Extract features for ML
        X = feature_row[self.feature_names]
        pred_class = self.model.predict(X)[0]
        probs = self.model.predict_proba(X)[0]
        prob_dict = {cls: round(float(prob), 4) for cls, prob in zip(self.model.classes_, probs)}

        # Extract raw sensor readings for rule score
        sensor_dict = {k: float(feature_row[k].values[0]) for k in SAFE_ENVELOPES.keys() if k in feature_row.columns}
        rule_eval = self.compute_rule_score(sensor_dict)

        # Conservative fusion: If rule detects critical breach, upgrade status to Not-Ready
        final_status = pred_class
        if rule_eval["status"] == "Not-Ready" and pred_class == "Ready":
            final_status = "At-Risk"
        elif rule_eval["composite_risk_score"] > 0.70:
            final_status = "Not-Ready"

        return {
            "predicted_status": final_status,
            "ml_status": pred_class,
            "rule_status": rule_eval["status"],
            "probabilities": prob_dict,
            "health_score": rule_eval["health_score"],
            "composite_risk_score": rule_eval["composite_risk_score"],
            "breached_sensors": rule_eval["breached_sensors"]
        }
