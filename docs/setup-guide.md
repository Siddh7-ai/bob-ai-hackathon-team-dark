# APEX HUMS — Setup & Installation Guide

This document provides exact step-by-step instructions for installing, configuring, running, and testing the APEX HUMS (Health & Usage Monitoring System) application locally and in production.

---

## 1. System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux (Ubuntu 20.04+)
- **Python**: Python 3.10 or higher (Tested on Python 3.14)
- **Node.js**: Node.js v18.0.0 or higher (Tested on Node.js v24.0.0)
- **Git**: Git 2.30+

---

## 2. Environment Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/Siddh7-ai/bob-ai-hackathon-team-dark.git
cd bob-ai-hackathon-team-dark
```

### Step 2: Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

---

## 3. Data Generation & ML Model Training

Run the end-to-end data pipeline script to generate synthetic CMAPSS run-to-failure telemetry, train the readiness classifier and RUL regressor models, evaluate holdout metrics, and generate initial maintenance plans:

```bash
python src/pipeline.py
```

*Outputs created:*
- Raw datasets in `data/raw/` (`assets.csv`, `sensor_readings.csv`, `service_records.csv`, `failure_labels.csv`)
- Trained models in `data/models/` (`readiness_classifier.joblib`, `rul_regressor.joblib`, `evaluation_report.json`)
- Diagnostics cache in `data/processed/` (`fleet_status.json`, `maintenance_plan.json`, `fleet_kpis.json`)

---

## 4. Running the Local Servers

### Option A: Run Backend & Frontend Separately (Development Mode)

#### Terminal 1: Start FastAPI Backend Server
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

#### Terminal 2: Start React Frontend Application
```bash
cd frontend
npm install
npm run dev
```
- Local Frontend URL: `http://127.0.0.1:5173`

---

### Option B: Unified Single-Server Production Mode

Build the frontend static bundle so FastAPI serves both the Web UI and API on a single port:

```bash
# 1. Build Frontend
cd frontend
npm install
npm run build
cd ..

# 2. Start Unified Server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
- Access full system at: `http://127.0.0.1:8000`

---

## 5. Running Automated Test Suite

Execute the unit tests covering data generation, ingestion, ML models, and FastAPI REST endpoints:

```bash
pytest tests/ -v
```

*Expected output*: 17 passed tests with zero errors.

---

## 6. Live Production Deployment (Render)

- **Build Command**: `cd frontend && npm install && npm run build && cd .. && pip install -r backend/requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Endpoint**: `/health`
- **Live Application URL**: [https://iaf-hums-system.onrender.com](https://iaf-hums-system.onrender.com)
