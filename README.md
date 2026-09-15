# APEX HUMS — Mission Fleet Readiness & Predictive Maintenance System

[![Python 3.14](https://img.shields.io/badge/Python-3.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.139-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/pytest-17%20passed-brightgreen.svg)]()
[![Deployment](https://img.shields.io/badge/Render-Live-brightgreen.svg)](https://iaf-hums-system.onrender.com)

> **End-to-End Physics-Informed Defense & Aerospace Health & Usage Monitoring System (HUMS)**

---

## 👥 Team
- **Team Name**: Team Dark
- **Track**: Defense & Aerospace Predictive Maintenance / Health & Usage Monitoring System (HUMS)
- **Team Lead**: Raulji Siddharthsinh
- **Team Members**: Team Dark Members (Siddharthsinh Raulji & Team)

---

## 🎯 Problem Statement
Military airbases and defense forces experience unexpected asset downtime, catastrophic component failures, and high maintenance costs due to traditional scheduled or reactive servicing schedules. Fleet commanders lack real-time visibility into machine health degradation, leaving them unable to predict Remaining Useful Life (RUL) or quantify 14-day and 30-day mission abort risks before dispatching aircraft or ground vehicles into combat sorties.

---

## 💡 Solution
We built **APEX HUMS**, a physics-informed, explainable predictive fleet readiness and maintenance decision-support platform modeled after NASA CMAPSS run-to-failure degradation dynamics. The system ingests multi-sensor telemetry (vibration, thermal, pressure, RPM), classifies fleet assets into `Ready`, `At-Risk`, or `Not-Ready` states using Random Forest, predicts component Remaining Useful Life (RUL) with Gradient Boosting regression, and generates plain-language executive diagnostic briefings paired with a defensible, multi-factor priority maintenance queue.

---

## ⭐ Key Features
1. **Multi-Class Fleet Readiness Classifier**: Classifies military assets (`Fighter Jet Engines`, `Transport Helicopters`, `Armoured Recon Platforms`) into `Ready`, `At-Risk`, and `Not-Ready` states based on 6 core military safe operating envelopes (vibration, oil debris, EGT, pressure ratio, fuel flow, shaft RPM) achieving **98.6% holdout accuracy**.
2. **Plain-Language Executive Diagnostic Briefings**: Automatically translates complex multi-sensor anomaly threshold breaches into clear, non-technical military briefing summaries with root cause identification and actionable command directives.
3. **Gradient Boosting RUL & Mission Abort Predictor**: Predicts Remaining Useful Life in operating cycles (**MAE: 4.89 cycles**) and converts RUL into 14-day and 30-day combat mission abort probabilities ($P_{14\text{d}}$ and $P_{30\text{d}}$) using Weibull-adjusted failure distributions.
4. **Defensible Multi-Factor Priority Maintenance Queue**: Ranks maintenance interventions using a multi-factor formula combining risk severity, asset mission criticality, and time-to-failure, complete with required parts kits, labor hour estimates, and interactive work order dispatching.
5. **Combat Sortie Mission Simulator**: Interactive simulator allowing commanders to stress-test fleet platforms under custom sortie profiles (Air Superiority, Deep Strike, Recon Patrol) and evaluate mission risk before actual deployment.

---

## 🛠️ Tech Stack
- **Languages**: Python 3.14, JavaScript (ES6+), HTML5, CSS3
- **Machine Learning & Analytics**: Scikit-Learn (Random Forest Classifier, Gradient Boosting Regressor), NumPy, Pandas, Joblib, SciPy
- **Backend Framework**: FastAPI, Uvicorn, Pydantic, CORS Middleware
- **Frontend & UI**: React 19, Vite, Recharts, Lucide React Icons, Glassmorphism CSS Architecture
- **Infrastructure & Cloud**: Render Cloud Deployment (Unified Python/Node Runtime), REST API Architecture

---

## 🚀 How to Run

*(Copied directly from [`docs/setup-guide.md`](file:///c:/Users/Raulji%20Siddharthsinh/OneDrive/Desktop/CHARUSAT/IBM/hums-predictive-maintenance/docs/setup-guide.md))*

### 1. Environment Setup & Dependencies
```bash
# Clone the repository
git clone https://github.com/Siddh7-ai/bob-ai-hackathon-team-dark.git
cd bob-ai-hackathon-team-dark

# Install backend Python dependencies
pip install -r backend/requirements.txt
```

### 2. Generate Data & Train ML Models
```bash
# Run full pipeline (generates CMAPSS telemetry, trains models, evaluates holdout metrics)
python src/pipeline.py
```

### 3. Start Local Application
```bash
# Terminal 1: Start FastAPI backend REST API
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Start React frontend UI
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173` in your browser.

### 4. Run Automated Test Suite
```bash
pytest tests/ -v
```

---

## 🎬 Demo
- **Live Production URL**: [https://iaf-hums-system.onrender.com](https://iaf-hums-system.onrender.com)
- **Interactive REST API Documentation**: [https://iaf-hums-system.onrender.com/docs](https://iaf-hums-system.onrender.com/docs)
- **GitHub Repository**: [https://github.com/Siddh7-ai/bob-ai-hackathon-team-dark](https://github.com/Siddh7-ai/bob-ai-hackathon-team-dark)

---

## ⚠️ Known Limitations
- **Synthetic Sensor Telemetry Baseline**: Telemetry data is simulated based on NASA CMAPSS run-to-failure degradation physics rather than live physical sensors mounted on operational military aircraft.
- **Offline Batch Retraining**: The ML model pipeline retrains asynchronously on dataset generation rather than executing continuous online streaming model parameter updates.
- **Single-Tenant Local Storage**: Work order dispatches and completion state updates persist to JSON storage without multi-tenant authentication or database isolation.

---

## 🏆 What We're Most Proud Of
- **Zero Data Leakage Protocol**: Implemented strict asset-based holdout validation preventing cycle-level cross-contamination between train and test splits, guaranteeing 98.6% classifier accuracy and 4.89 cycles MAE on unseen physical platforms.
- **Plain-English Military Briefing Generator**: Eliminated complex ML feature attribution jargon (SHAP/coefficients) in favor of clear, non-technical commander briefings with direct root cause identification and actionable maintenance directives.
- **Unified 1-Click Production Deployment**: Served both the compiled React 19 single-page app and the FastAPI REST API on a single lightweight Render web service with instant <5ms startup and 90% optimized image assets.
