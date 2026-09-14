"""
Data Ingestion and Feature Engineering Layer
Validates incoming sensor data, checks operational limits, and extracts rolling temporal features.
"""

import os
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any

# Sensor safe boundaries for domain checks
SENSOR_BOUNDS = {
    "vibration_level": (0.0, 15.0),
    "oil_debris_count": (0.0, 200.0),
    "engine_temp_c": (400.0, 1100.0),
    "pressure_ratio": (2.0, 25.0),
    "fuel_flow_rate": (0.2, 8.0),
    "rotational_speed_rpm": (8000.0, 16000.0)
}

SENSOR_COLS = list(SENSOR_BOUNDS.keys())


class HUMSDataIngestion:
    def __init__(self, data_dir: str = "./data/raw"):
        self.data_dir = data_dir
        self.assets_df: pd.DataFrame = None
        self.sensors_df: pd.DataFrame = None
        self.services_df: pd.DataFrame = None
        self.failures_df: pd.DataFrame = None

    def load_data(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Loads and validates all raw datasets."""
        assets_path = os.path.join(self.data_dir, "assets.csv")
        sensors_path = os.path.join(self.data_dir, "sensor_readings.csv")
        services_path = os.path.join(self.data_dir, "service_records.csv")
        failures_path = os.path.join(self.data_dir, "failure_labels.csv")

        if not all(os.path.exists(p) for p in [assets_path, sensors_path, services_path, failures_path]):
            raise FileNotFoundError(f"One or more required CSV files missing in {self.data_dir}")

        self.assets_df = pd.read_csv(assets_path)
        self.sensors_df = pd.read_csv(sensors_path)
        self.services_df = pd.read_csv(services_path)
        self.failures_df = pd.read_csv(failures_path)

        self.validate_schema()
        return self.assets_df, self.sensors_df, self.services_df, self.failures_df

    def validate_schema(self) -> Dict[str, Any]:
        """Performs data validation and boundary integrity checks."""
        validation_report = {"errors": [], "warnings": [], "status": "PASSED"}

        # 1. Null check
        for name, df in [("assets", self.assets_df), ("sensors", self.sensors_df), 
                         ("services", self.services_df), ("failures", self.failures_df)]:
            null_counts = df.isnull().sum()
            if null_counts.any():
                validation_report["warnings"].append(f"Nulls found in {name}: {null_counts.to_dict()}")

        # 2. Sensor boundary checks
        for col, (min_val, max_val) in SENSOR_BOUNDS.items():
            if col in self.sensors_df.columns:
                out_of_bounds = self.sensors_df[(self.sensors_df[col] < min_val) | (self.sensors_df[col] > max_val)]
                if len(out_of_bounds) > 0:
                    validation_report["warnings"].append(
                        f"Sensor {col} has {len(out_of_bounds)} readings exceeding physics limits [{min_val}, {max_val}]"
                    )

        # 3. Asset linkage check
        sensor_assets = set(self.sensors_df["asset_id"].unique())
        master_assets = set(self.assets_df["asset_id"].unique())
        orphan_sensors = sensor_assets - master_assets
        if orphan_sensors:
            validation_report["errors"].append(f"Sensor readings contain unknown assets: {orphan_sensors}")
            validation_report["status"] = "FAILED"

        return validation_report

    def extract_features(self, window_sizes=(5, 10, 20)) -> pd.DataFrame:
        """
        Extracts temporal rolling features per asset:
        - Rolling means (5, 10, 20 cycles)
        - Rolling standard deviations (short-term volatility)
        - Rolling slope / drift (rate of change)
        Returns a rich tabular dataset aggregated at cycle level or latest snapshot.
        """
        if self.sensors_df is None:
            self.load_data()

        df = self.sensors_df.sort_values(by=["asset_id", "cycle"]).copy()

        # Compute rolling stats grouped by asset_id
        feature_cols = []
        for sensor in SENSOR_COLS:
            for w in window_sizes:
                # Rolling mean
                col_mean = f"{sensor}_roll_mean_{w}"
                df[col_mean] = df.groupby("asset_id")[sensor].transform(
                    lambda x: x.rolling(window=w, min_periods=1).mean()
                )
                feature_cols.append(col_mean)

                # Rolling std
                col_std = f"{sensor}_roll_std_{w}"
                df[col_std] = df.groupby("asset_id")[sensor].transform(
                    lambda x: x.rolling(window=w, min_periods=1).std().fillna(0.0)
                )
                feature_cols.append(col_std)

                # Rolling rate of change (delta between current and w cycles ago)
                col_delta = f"{sensor}_delta_{w}"
                df[col_delta] = df.groupby("asset_id")[sensor].transform(
                    lambda x: (x - x.shift(w)).fillna(0.0)
                )
                feature_cols.append(col_delta)

        # Merge with ground truth failure labels for modeling
        if self.failures_df is not None:
            # failure_cycle per asset
            df = df.merge(
                self.failures_df[["asset_id", "failure_cycle", "failed_component", "failure_signature"]],
                on="asset_id",
                how="left"
            )
            # True RUL at every cycle
            df["true_rul"] = df["failure_cycle"] - df["cycle"]
            df["true_rul"] = df["true_rul"].clip(lower=0)

            # Ground truth readiness category for training/evaluation:
            # Ready: RUL > 50 cycles
            # At-Risk: 15 <= RUL <= 50 cycles
            # Not-Ready: RUL < 15 cycles
            conditions = [
                (df["true_rul"] > 50),
                (df["true_rul"] >= 15) & (df["true_rul"] <= 50),
                (df["true_rul"] < 15)
            ]
            choices = ["Ready", "At-Risk", "Not-Ready"]
            df["ground_truth_readiness"] = np.select(conditions, choices, default="Ready")

        return df

    def get_latest_asset_snapshots(self) -> pd.DataFrame:
        """Returns the single latest operating cycle features for each asset."""
        full_df = self.extract_features()
        latest_idx = full_df.groupby("asset_id")["cycle"].idxmax()
        latest_df = full_df.loc[latest_idx].copy()
        
        # Merge asset metadata (criticality, type, unit, image_url, model_name)
        if self.assets_df is not None:
            cols = ["asset_id", "asset_type", "unit", "mission_criticality", "commission_date", "last_service_date"]
            if "image_url" in self.assets_df.columns:
                cols.append("image_url")
            if "model_name" in self.assets_df.columns:
                cols.append("model_name")
            latest_df = latest_df.merge(
                self.assets_df[cols],
                on="asset_id",
                how="left"
            )
        return latest_df
