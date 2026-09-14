"""
Synthetic HUMS (Health & Usage Monitoring System) Data Generator
Modelled on NASA CMAPSS run-to-failure degradation patterns.
Implements the schema specified in 02_Mock_Data_Schema_Design.pdf.
"""

import os
import random
import json
import argparse
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Constants & Envelopes based on D1 Data Design
ASSET_TYPES = [
    "Fighter Jet Engine",
    "Armoured Vehicle",
    "Transport Helicopter"
]

UNITS = [
    "101st Tactical Fighter Squadron",
    "4th Strike Fighter Wing",
    "3rd Armoured Brigade",
    "7th Mechanized Recon Cavalry",
    "82nd Airborne Combat Aviation",
    "10th Mountain Aviation Support"
]

COMPONENTS = [
    "Main Bearing",
    "Turbine Blade",
    "Hydraulic Pump",
    "Gearbox Drive"
]

# Normal Operating Baseline Envelopes (Mean and Std under healthy state)
BASELINE_PARAMS = {
    "vibration_level": {"mean": 2.0, "std": 0.25, "safe_max": 2.8, "critical_max": 4.5},      # mm/s
    "oil_debris_count": {"mean": 10.0, "std": 2.0, "safe_max": 18.0, "critical_max": 45.0},   # ppm
    "engine_temp_c": {"mean": 650.0, "std": 12.0, "safe_max": 710.0, "critical_max": 780.0},  # deg C
    "pressure_ratio": {"mean": 13.5, "std": 0.35, "safe_min": 12.0, "critical_min": 10.5},   # ratio
    "fuel_flow_rate": {"mean": 2.0, "std": 0.08, "safe_max": 2.35, "critical_max": 2.85},     # kg/s
    "rotational_speed_rpm": {"mean": 12800.0, "std": 45.0, "safe_range": (12650.0, 12950.0), "critical_range": (12300.0, 13300.0)} # rpm
}

CRITICALITY_MAP = {
    "Fighter Jet Engine": 3.0,     # Maximum mission criticality
    "Transport Helicopter": 2.2,   # High mission criticality
    "Armoured Vehicle": 1.6        # Standard tactical criticality
}


def generate_synthetic_hums_data(
    num_assets: int = 40,
    clean_assets_count: int = 7,
    seed: int = 42,
    output_dir: str = "./data/raw"
):
    """
    Generates synthetic HUMS datasets:
    1. assets: Master equipment table
    2. sensor_readings: Run-to-failure multi-sensor logs
    3. service_records: Historical maintenance records
    4. failure_labels: Ground-truth RUL & failure modes
    """
    np.random.seed(seed)
    random.seed(seed)
    os.makedirs(output_dir, exist_ok=True)

    assets = []
    sensor_readings = []
    service_records = []
    failure_labels = []

    base_date = datetime(2025, 1, 1)

    for i in range(1, num_assets + 1):
        asset_id = f"AC-{1000 + i}"
        asset_type = random.choice(ASSET_TYPES)
        unit = random.choice(UNITS)
        commission_days_ago = random.randint(400, 1200)
        commission_date = (base_date - timedelta(days=commission_days_ago)).strftime("%Y-%m-%d")
        
        is_clean = (i <= clean_assets_count)
        
        if is_clean:
            # Healthy asset: Runs up to current cycles without critical failure imminent
            max_simulated_cycles = random.randint(180, 260)
            failure_cycle = max_simulated_cycles + random.randint(120, 200) # RUL is large (>100)
            failed_comp = random.choice(COMPONENTS)
            failure_signature = "clean"
        else:
            # Asset running to failure (or near failure)
            failure_cycle = random.randint(150, 300)
            # Sample whether the asset is observed early, mid, or near end of life
            lifecycle_fraction = random.uniform(0.55, 0.98)
            max_simulated_cycles = max(50, int(failure_cycle * lifecycle_fraction))
            
            # Select 1 of 3 realistic failure signatures
            sig_choice = i % 3
            if sig_choice == 0:
                failure_signature = "bearing_gearbox"
                failed_comp = random.choice(["Main Bearing", "Gearbox Drive"])
            elif sig_choice == 1:
                failure_signature = "turbine_thermal"
                failed_comp = "Turbine Blade"
            else:
                failure_signature = "hydraulic_fuel"
                failed_comp = "Hydraulic Pump"

        last_service_cycle = max(10, max_simulated_cycles - random.randint(20, 70))
        last_service_date = (base_date - timedelta(days=int((max_simulated_cycles - last_service_cycle) * 1.5))).strftime("%Y-%m-%d")

        assets.append({
            "asset_id": asset_id,
            "asset_type": asset_type,
            "unit": unit,
            "mission_criticality": CRITICALITY_MAP[asset_type],
            "commission_date": commission_date,
            "total_operating_cycles": max_simulated_cycles,
            "last_service_date": last_service_date,
            "simulated_signature": failure_signature,
            "is_clean_control": is_clean
        })

        # Failure label entry (ground truth per asset)
        final_cycle_rul = max(0, failure_cycle - max_simulated_cycles)
        failure_labels.append({
            "asset_id": asset_id,
            "failure_cycle": failure_cycle,
            "failed_component": failed_comp,
            "observed_cycles": max_simulated_cycles,
            "remaining_useful_life": final_cycle_rul,
            "failure_signature": failure_signature
        })

        # Generate Service Records for this asset
        # 1-3 previous service events
        num_services = random.randint(1, 3)
        for s_idx in range(num_services):
            s_cycle = random.randint(20, max(25, max_simulated_cycles - 15))
            s_date = (base_date - timedelta(days=int((max_simulated_cycles - s_cycle) * 2.1))).strftime("%Y-%m-%d")
            s_type = random.choice(["Scheduled", "Scheduled", "Unscheduled"])
            serviced_part = random.choice(COMPONENTS)
            
            notes = [
                f"Routine {s_cycle}-cycle inspection. No structural cracks observed. Cleared for flight.",
                f"Minor wear debris detected in filter mesh during {s_type.lower()} servicing. Flushed oil reservoir.",
                f"Seal clearance inspection performed on {serviced_part.lower()}. Tolerances calibrated to MIL-STD-1530.",
                f"Preventive checkup. Rotor balance adjusted. Sensor diagnostic log nominal."
            ]
            
            service_records.append({
                "record_id": f"SR-{asset_id}-{s_idx+1}",
                "asset_id": asset_id,
                "service_date": s_date,
                "service_type": s_type,
                "component_serviced": serviced_part,
                "technician_notes": random.choice(notes)
            })

        # Generate CMAPSS-style Sensor Time Series per operating cycle
        # We start with baseline values + random walk / Gaussian noise
        # Degradation acceleration factor grows as cycle approaches failure_cycle
        for c in range(1, max_simulated_cycles + 1):
            # Degradation fraction: 0 at start, approaches 1 as c approaches failure_cycle
            deg_progress = c / failure_cycle
            # Accelerating curve (exponential/power law)
            exp_deg = np.power(deg_progress, 3.2) if not is_clean else (deg_progress * 0.15)
            
            # Base values with operational noise
            vib = np.random.normal(BASELINE_PARAMS["vibration_level"]["mean"], BASELINE_PARAMS["vibration_level"]["std"])
            oil = np.random.normal(BASELINE_PARAMS["oil_debris_count"]["mean"], BASELINE_PARAMS["oil_debris_count"]["std"])
            temp = np.random.normal(BASELINE_PARAMS["engine_temp_c"]["mean"], BASELINE_PARAMS["engine_temp_c"]["std"])
            press = np.random.normal(BASELINE_PARAMS["pressure_ratio"]["mean"], BASELINE_PARAMS["pressure_ratio"]["std"])
            fuel = np.random.normal(BASELINE_PARAMS["fuel_flow_rate"]["mean"], BASELINE_PARAMS["fuel_flow_rate"]["std"])
            rpm = np.random.normal(BASELINE_PARAMS["rotational_speed_rpm"]["mean"], BASELINE_PARAMS["rotational_speed_rpm"]["std"])

            if failure_signature == "bearing_gearbox":
                # Signature 1: Vibration and metallic oil debris rise sharply together
                vib += exp_deg * 3.4
                oil += exp_deg * 42.0
                temp += exp_deg * 45.0  # slight secondary thermal friction
                rpm += (np.random.normal(0, 30.0) * exp_deg)

            elif failure_signature == "turbine_thermal":
                # Signature 2: Engine temperature spikes, compressor pressure drops
                temp += exp_deg * 165.0
                press -= exp_deg * 3.8
                fuel += exp_deg * 0.75
                vib += exp_deg * 0.9

            elif failure_signature == "hydraulic_fuel":
                # Signature 3: Fuel flow rate surges, rotational speed fluctuates wildly
                fuel += exp_deg * 0.95
                rpm -= exp_deg * 480.0 + np.random.normal(0, 110.0 * exp_deg)
                temp += exp_deg * 55.0
                oil += exp_deg * 12.0

            elif failure_signature == "clean":
                # Normal minor aging without abnormal threshold breach
                vib += np.random.normal(0, 0.05)
                oil += np.random.normal(0, 0.5)
                temp += np.random.normal(0, 2.0)
                press -= np.random.normal(0, 0.05)

            # Prevent physical impossibilities
            vib = max(0.5, round(float(vib), 3))
            oil = max(0.0, round(float(oil), 1))
            temp = round(float(temp), 1)
            press = max(5.0, round(float(press), 2))
            fuel = max(0.5, round(float(fuel), 3))
            rpm = round(float(rpm), 1)

            sensor_readings.append({
                "asset_id": asset_id,
                "cycle": c,
                "vibration_level": vib,
                "oil_debris_count": oil,
                "engine_temp_c": temp,
                "pressure_ratio": press,
                "fuel_flow_rate": fuel,
                "rotational_speed_rpm": rpm
            })

    # Convert to DataFrames
    df_assets = pd.DataFrame(assets)
    df_sensors = pd.DataFrame(sensor_readings)
    df_services = pd.DataFrame(service_records)
    df_failures = pd.DataFrame(failure_labels)

    # Save to CSV
    df_assets.to_csv(os.path.join(output_dir, "assets.csv"), index=False)
    df_sensors.to_csv(os.path.join(output_dir, "sensor_readings.csv"), index=False)
    df_services.to_csv(os.path.join(output_dir, "service_records.csv"), index=False)
    df_failures.to_csv(os.path.join(output_dir, "failure_labels.csv"), index=False)

    # Also save JSON metadata summary
    from datetime import timezone
    summary = {
        "num_assets": len(df_assets),
        "clean_assets_count": clean_assets_count,
        "total_sensor_cycles": len(df_sensors),
        "total_service_records": len(df_services),
        "asset_types": df_assets["asset_type"].value_counts().to_dict(),
        "signatures": df_assets["simulated_signature"].value_counts().to_dict(),
        "generated_timestamp": datetime.now(timezone.utc).isoformat()
    }
    with open(os.path.join(output_dir, "dataset_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)

    print(f"[DATA GENERATOR] Successfully generated data for {num_assets} assets ({len(df_sensors)} cycles)")
    print(f"[DATA GENERATOR] Output files saved in {output_dir}")
    return df_assets, df_sensors, df_services, df_failures


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synthetic HUMS CMAPSS Data Generator")
    parser.add_argument("--assets", type=int, default=40, help="Number of assets to simulate")
    parser.add_argument("--clean", type=int, default=7, help="Number of clean control assets")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--output-dir", type=str, default="./data/raw", help="Target output directory")
    args = parser.parse_args()

    generate_synthetic_hums_data(
        num_assets=args.assets,
        clean_assets_count=args.clean,
        seed=args.seed,
        output_dir=args.output_dir
    )
