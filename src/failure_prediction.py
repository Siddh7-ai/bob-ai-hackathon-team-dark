"""
Deliverable 3: Failure Prediction (RUL Regression & Failure Probability)
Trains a Gradient Boosting Regressor on CMAPSS run-to-failure sequences to predict RUL.
Converts RUL to failure probabilities within operational mission windows (14/30 days).
Pinpoints likely failing component based on degradation signatures.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

# Typical operational tempo (cycles flown or logged per calendar day)
DAILY_TEMPO = 1.6  # cycles / day


class FailurePredictor:
    def __init__(self, model_path: str = "./data/models/rul_regressor.joblib"):
        self.model_path = model_path
        self.model: GradientBoostingRegressor = None
        self.feature_names: List[str] = []

    def train(self, df_features: pd.DataFrame, test_assets: List[str] = None) -> Dict[str, Any]:
        """
        Trains Gradient Boosting Regressor to predict Remaining Useful Life (RUL).
        Evaluates on held-out test assets.
        """
        candidate_cols = [c for c in df_features.columns if (
            c.startswith("vibration_level") or 
            c.startswith("oil_debris_count") or 
            c.startswith("engine_temp_c") or 
            c.startswith("pressure_ratio") or 
            c.startswith("fuel_flow_rate") or 
            c.startswith("rotational_speed_rpm")
        )]
        self.feature_names = candidate_cols

        valid_df = df_features.dropna(subset=["true_rul"]).copy()

        # Split train/test by asset to avoid leakage
        unique_assets = valid_df["asset_id"].unique()
        if test_assets is None:
            train_assets, test_assets = train_test_split(unique_assets, test_size=0.25, random_state=42)
        else:
            train_assets = [a for a in unique_assets if a not in test_assets]

        train_data = valid_df[valid_df["asset_id"].isin(train_assets)]
        test_data = valid_df[valid_df["asset_id"].isin(test_assets)]

        X_train = train_data[self.feature_names]
        y_train = train_data["true_rul"]
        X_test = test_data[self.feature_names]
        y_test = test_data["true_rul"]

        # Cap max RUL at 125 (standard NASA CMAPSS piecewise linear formulation)
        # to prevent model from being penalized on early non-degraded cycles
        y_train_clipped = y_train.clip(upper=125)
        y_test_clipped = y_test.clip(upper=125)

        self.model = GradientBoostingRegressor(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=5,
            random_state=42
        )
        self.model.fit(X_train, y_train_clipped)

        # Evaluate on test set
        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test_clipped, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test_clipped, y_pred))
        r2 = r2_score(y_test_clipped, y_pred)

        # Feature importances
        importances = sorted(
            zip(self.feature_names, self.model.feature_importances_),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump({
            "model": self.model,
            "features": self.feature_names
        }, self.model_path)

        metrics = {
            "mae_cycles": round(float(mae), 2),
            "rmse_cycles": round(float(rmse), 2),
            "r2_score": round(float(r2), 3),
            "test_assets": list(test_assets),
            "test_samples": len(test_data),
            "top_features": importances
        }
        return metrics

    def load(self):
        """Loads saved regression model."""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}")
        saved = joblib.load(self.model_path)
        self.model = saved["model"]
        self.feature_names = saved["features"]

    def diagnose_component(self, sensor_snapshot: Dict[str, float]) -> Tuple[str, str, float]:
        """
        Maps the dominant sensor degradation patterns to physical subsystem:
        1. Bearing / Gearbox: vibration + oil debris
        2. Turbine Blade: engine temp + pressure ratio
        3. Hydraulic Pump: fuel flow + rotational speed
        """
        vib = sensor_snapshot.get("vibration_level", 2.0)
        debris = sensor_snapshot.get("oil_debris_count", 10.0)
        temp = sensor_snapshot.get("engine_temp_c", 650.0)
        press = sensor_snapshot.get("pressure_ratio", 13.5)
        fuel = sensor_snapshot.get("fuel_flow_rate", 2.0)
        rpm = sensor_snapshot.get("rotational_speed_rpm", 12800.0)

        # Calculate subsystem stress indicators
        bearing_score = max(0, (vib - 2.5) / 2.0) * 0.5 + max(0, (debris - 15.0) / 25.0) * 0.5
        turbine_score = max(0, (temp - 680.0) / 80.0) * 0.6 + max(0, (12.2 - press) / 2.0) * 0.4
        pump_score = max(0, (fuel - 2.25) / 0.5) * 0.5 + max(0, abs(rpm - 12800.0) - 150) / 300.0 * 0.5

        scores = {
            "Main Bearing / Gearbox": round(bearing_score, 3),
            "Turbine Blade Assembly": round(turbine_score, 3),
            "Hydraulic Pump / Fuel Delivery": round(pump_score, 3)
        }

        top_comp = max(scores, key=scores.get)
        confidence = scores[top_comp]

        if top_comp == "Main Bearing / Gearbox":
            reason = "Elevated mechanical harmonic vibration coupled with ferrous oil debris accumulation"
        elif top_comp == "Turbine Blade Assembly":
            reason = "High thermal exhaust spike paired with compressor stage pressure decay"
        else:
            reason = "Elevated fuel flow consumption and unstable shaft RPM governing"

        return top_comp, reason, confidence

    def predict_rul(self, feature_row: pd.DataFrame, daily_tempo: float = DAILY_TEMPO) -> Dict[str, Any]:
        """
        Predicts RUL and computes failure probability for 14-day and 30-day mission windows.
        """
        if self.model is None:
            self.load()

        X = feature_row[self.feature_names]
        raw_pred_rul = float(self.model.predict(X)[0])
        pred_rul = max(1.0, round(raw_pred_rul, 1))

        # Convert cycles to estimated calendar days: days = cycles / daily_tempo
        estimated_days_to_failure = round(pred_rul / daily_tempo, 1)

        # Operational Mission Window Probabilities:
        # P(failure <= T) modelled using exponential failure distribution CDF:
        # F(T) = 1 - exp(- (T / estimated_days_to_failure)^2) (Weibull/Exponential shape)
        def calc_prob(window_days: int) -> float:
            if estimated_days_to_failure <= 0.1:
                return 0.99
            ratio = window_days / estimated_days_to_failure
            # Using Weibull-style steepness (shape beta = 2.2) reflecting wear-out phase
            prob = 1.0 - np.exp(- np.power(ratio, 2.2) * 0.7)
            return round(float(min(0.99, max(0.01, prob))), 3)

        prob_14d = calc_prob(14)
        prob_30d = calc_prob(30)

        # Extract latest sensor snapshot for component diagnosis
        sensor_dict = {
            col: float(feature_row[col].values[0]) 
            for col in ["vibration_level", "oil_debris_count", "engine_temp_c", "pressure_ratio", "fuel_flow_rate", "rotational_speed_rpm"]
            if col in feature_row.columns
        }
        failing_comp, comp_reason, comp_conf = self.diagnose_component(sensor_dict)

        return {
            "predicted_rul_cycles": pred_rul,
            "estimated_days_to_failure": estimated_days_to_failure,
            "failure_probability_14d": prob_14d,
            "failure_probability_30d": prob_30d,
            "predicted_failing_component": failing_comp,
            "component_diagnosis_reason": comp_reason,
            "diagnosis_confidence": comp_conf
        }
