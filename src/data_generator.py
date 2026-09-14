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

# Expanded Platform Taxonomy based on Military Aerospace & Ground Fleet Standards:
# Aircraft: Airplanes such as fighter jets, transport planes, surveillance planes, or cargo planes.
# Helicopters: Rotary-wing aircraft such as transport, rescue, medical, or attack helicopters.
# Vehicles: Ground equipment such as military trucks, tanks, armored vehicles, fuel vehicles, and transport vehicles.

PLATFORM_TAXONOMY = {
    "Aircraft": {
        "Fighter Jet": {
            "models": {
                "Su-30MKI Flanker-H": "/images/assets/fighter_jet.jpg",
                "Tejas Mk1A": "/images/assets/tejas_mk1a.jpg",
                "Rafale DH": "/images/assets/rafale_dh.jpg",
                "Mirage 2000": "/images/assets/mirage_2000.jpg"
            },
            "image": "/images/assets/fighter_jet.jpg",
            "criticality": 3.0
        },
        "Transport Plane": {
            "models": {
                "C-130J Super Hercules": "/images/assets/c130j_hercules.jpg",
                "An-32 Tactical Transport": "/images/assets/an32_transport.jpg",
                "C-295MW": "/images/assets/c295_transport.jpg"
            },
            "image": "/images/assets/cargo_plane.jpg",
            "criticality": 2.5
        },
        "Surveillance Plane": {
            "models": {
                "Netra AEW&C": "/images/assets/surveillance_plane.jpg",
                "Phalcon AWACS": "/images/assets/phalcon_awacs.jpg",
                "Dornier 228 Maritime": "/images/assets/dornier_228.jpg"
            },
            "image": "/images/assets/surveillance_plane.jpg",
            "criticality": 2.8
        },
        "Cargo Plane": {
            "models": {
                "C-17 Globemaster III": "/images/assets/cargo_plane.jpg",
                "IL-76 Gajraj Heavy Lifter": "/images/assets/il76_gajraj.jpg"
            },
            "image": "/images/assets/cargo_plane.jpg",
            "criticality": 2.6
        }
    },
    "Helicopters": {
        "Transport Helicopter": {
            "models": {
                "Mi-17V-5 Tactical Transport": "/images/assets/transport_helicopter.jpg",
                "Chinook CH-47F Heavy Lift": "/images/assets/chinook_ch47.jpg",
                "ALH Dhruv Mk-III": "/images/assets/rescue_medical_helicopter.jpg"
            },
            "image": "/images/assets/transport_helicopter.jpg",
            "criticality": 2.2
        },
        "Attack Helicopter": {
            "models": {
                "AH-64E Apache Guardian": "/images/assets/attack_helicopter.jpg",
                "LCH Prachand Combat Heli": "/images/assets/lch_prachand.jpg",
                "Rudra Armed Helicopter": "/images/assets/rudra_armed_heli.jpg"
            },
            "image": "/images/assets/attack_helicopter.jpg",
            "criticality": 2.8
        },
        "Rescue Helicopter": {
            "models": {
                "Chetak Search & Rescue": "/images/assets/chetak_sar.jpg",
                "ALH Dhruv SAR Lifesaver": "/images/assets/rescue_medical_helicopter.jpg"
            },
            "image": "/images/assets/rescue_medical_helicopter.jpg",
            "criticality": 2.0
        },
        "Medical Helicopter": {
            "models": {
                "ALH Dhruv Air Ambulance": "/images/assets/rescue_medical_helicopter.jpg",
                "Mi-17 MEDEVAC Unit": "/images/assets/transport_helicopter.jpg"
            },
            "image": "/images/assets/rescue_medical_helicopter.jpg",
            "criticality": 2.2
        }
    },
    "Vehicles": {
        "Tank": {
            "models": {
                "T-90 Bhishma Main Battle Tank": "/images/assets/tank_t90.jpg",
                "Arjun Mk-1A Heavy Tank": "/images/assets/arjun_mk1a.jpg",
                "T-72 Ajeya Combat Tank": "/images/assets/t72_ajeya.jpg"
            },
            "image": "/images/assets/tank_t90.jpg",
            "criticality": 2.0
        },
        "Armored Vehicle": {
            "models": {
                "BMP-2 Sarath Infantry Vehicle": "/images/assets/armored_vehicle.jpg",
                "K9 Vajra-T Self-Propelled Howitzer": "/images/assets/k9_vajra.jpg",
                "WhAP 8x8 Armoured Carrier": "/images/assets/whap_8x8.jpg"
            },
            "image": "/images/assets/armored_vehicle.jpg",
            "criticality": 1.8
        },
        "Military Truck": {
            "models": {
                "Ashok Leyland Stallion 4x4": "/images/assets/military_truck.jpg",
                "Tatra 8x8 Heavy Tactical Truck": "/images/assets/tatra_8x8.jpg",
                "Swaraj Mazda Gun Towing Truck": "/images/assets/swaraj_mazda.jpg"
            },
            "image": "/images/assets/military_truck.jpg",
            "criticality": 1.4
        },
        "Fuel Vehicle": {
            "models": {
                "Tactical Airfield Fuel Bowser 6x6": "/images/assets/fuel_vehicle.jpg",
                "Heavy Refueler Tanker Bowser": "/images/assets/fuel_vehicle.jpg",
                "Jet-A1 Mobile Dispenser": "/images/assets/jet_a1_dispenser.jpg"
            },
            "image": "/images/assets/fuel_vehicle.jpg",
            "criticality": 1.6
        },
        "Transport Vehicle": {
            "models": {
                "Light Specialist Vehicle (LSV) 4x4": "/images/assets/lsv_4x4.jpg",
                "Troop Carrier Heavy Transport": "/images/assets/tatra_8x8.jpg",
                "Airfield Equipment Tug": "/images/assets/airfield_tug.jpg"
            },
            "image": "/images/assets/military_truck.jpg",
            "criticality": 1.3
        }
    }
}

# Exact 1-to-1 Model-to-Photograph mapping for every military platform
MODEL_IMAGES = {}
FLATTENED_TYPES = []

for cat, subdict in PLATFORM_TAXONOMY.items():
    for sub, data in subdict.items():
        models_data = data["models"]
        if isinstance(models_data, dict):
            models_list = list(models_data.keys())
            for m_name, m_img in models_data.items():
                MODEL_IMAGES[m_name] = m_img
        else:
            models_list = list(models_data)
            for m_name in models_list:
                MODEL_IMAGES[m_name] = data.get("image", "/images/assets/fighter_jet.jpg")

        FLATTENED_TYPES.append({
            "category": cat,
            "asset_type": sub,
            "models": models_list,
            "image": data["image"],
            "criticality": data["criticality"]
        })


# Realistic Military Squadron & Brigade Units mapped by Category
CATEGORY_UNITS = {
    "Aircraft": [
        "101st Tactical Fighter Squadron",
        "4th Strike Fighter Wing",
        "22nd Heavy Cargo Airlift Wing",
        "12th Air Surveillance Squadron"
    ],
    "Helicopters": [
        "82nd Airborne Combat Aviation",
        "10th Mountain Aviation Support",
        "15th Tactical Helicopter Squadron"
    ],
    "Vehicles": [
        "3rd Armoured Brigade",
        "7th Mechanized Recon Cavalry",
        "50th Tactical Logistics Regiment"
    ]
}

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
        type_info = FLATTENED_TYPES[(i - 1) % len(FLATTENED_TYPES)]
        category = type_info["category"]
        asset_type = type_info["asset_type"]
        model_name = type_info["models"][(i - 1) % len(type_info["models"])]
        image_url = MODEL_IMAGES.get(model_name, type_info["image"])
        criticality = type_info["criticality"]
        unit_options = CATEGORY_UNITS.get(category, CATEGORY_UNITS["Aircraft"])
        unit = unit_options[(i - 1) % len(unit_options)]
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
            "category": category,
            "asset_type": asset_type,
            "model_name": model_name,
            "image_url": image_url,
            "unit": unit,
            "mission_criticality": criticality,
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
