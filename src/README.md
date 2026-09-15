# Source Code Architecture — `src/` Layout

This directory contains the core machine learning models, telemetry ingestion pipelines, explanation engines, and maintenance rankers.

## File Layout & Deliverable Mapping

- **`data_generator.py`**: Simulates NASA CMAPSS run-to-failure telemetry degradation for multi-asset military platforms across 6 sensor channels (vibration, oil debris, EGT, pressure, fuel flow, shaft RPM).
- **`ingestion.py`**: Handles dataset validation, schema enforcement, missing value handling, and rolling window feature extraction ($t-5, t-10, t-20$).
- **`readiness_classifier.py`**: **Deliverable 1** — Random Forest Classifier assigning fleet readiness states (`Ready`, `At-Risk`, `Not-Ready`) based on military safety envelopes (98.6% accuracy).
- **`explanation_engine.py`**: **Deliverable 2** — Generates plain-language executive briefings translating telemetry breaches into actionable directives without ML jargon.
- **`failure_prediction.py`**: **Deliverable 3** — Gradient Boosting RUL Regressor (MAE 4.89 cycles) with 14-day and 30-day mission abort probability estimation.
- **`maintenance_ranker.py`**: **Deliverable 4** — Multi-Factor Priority Ranker evaluating risk level, mission criticality weight, and time-to-failure.
- **`pipeline.py`**: End-to-end pipeline orchestrator executing data generation, feature engineering, model training, evaluation, and diagnostic persistence.
