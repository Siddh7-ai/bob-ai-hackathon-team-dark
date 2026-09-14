"""
Tests for Phase 1: Mock Data Generator & Ingestion Layer
"""

import os
import pytest
import pandas as pd
from src.data_generator import generate_synthetic_hums_data, BASELINE_PARAMS
from src.ingestion import HUMSDataIngestion, SENSOR_COLS


def test_synthetic_data_generation(tmp_path):
    out_dir = str(tmp_path / "data")
    assets, sensors, services, failures = generate_synthetic_hums_data(
        num_assets=15,
        clean_assets_count=3,
        seed=123,
        output_dir=out_dir
    )

    # 1. Assert file creations
    assert os.path.exists(os.path.join(out_dir, "assets.csv"))
    assert os.path.exists(os.path.join(out_dir, "sensor_readings.csv"))
    assert os.path.exists(os.path.join(out_dir, "service_records.csv"))
    assert os.path.exists(os.path.join(out_dir, "failure_labels.csv"))

    # 2. Check counts
    assert len(assets) == 15
    assert len(failures) == 15
    assert len(services) >= 15
    assert len(sensors) > 500

    # 3. Verify clean control assets exist
    clean_assets = assets[assets["is_clean_control"] == True]
    assert len(clean_assets) == 3

    # 4. Check sensor values are positive and non-null
    for col in SENSOR_COLS:
        assert col in sensors.columns
        assert sensors[col].isnull().sum() == 0
        assert (sensors[col] > 0).all()


def test_data_ingestion_and_validation(tmp_path):
    out_dir = str(tmp_path / "data")
    generate_synthetic_hums_data(num_assets=10, clean_assets_count=2, seed=99, output_dir=out_dir)

    ingestion = HUMSDataIngestion(data_dir=out_dir)
    assets, sensors, services, failures = ingestion.load_data()

    report = ingestion.validate_schema()
    assert report["status"] == "PASSED"
    assert len(report["errors"]) == 0

    # Test rolling feature extraction
    features_df = ingestion.extract_features(window_sizes=(5, 10))
    assert "vibration_level_roll_mean_5" in features_df.columns
    assert "engine_temp_c_delta_5" in features_df.columns
    assert "true_rul" in features_df.columns
    assert "ground_truth_readiness" in features_df.columns

    # Test latest snapshot
    latest = ingestion.get_latest_asset_snapshots()
    assert len(latest) == 10
    assert "mission_criticality" in latest.columns
