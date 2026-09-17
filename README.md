# Track the Cash: AI-Powered Predictive Analytics Framework

> **Smart India Hackathon (SIH 2026)** | Problem Statement: `SIH26184` (MHA / I4C)  
> **Mission:** Transform India's cybercrime response from reactive fund blocking to proactive, geographic ATM cash-out defense before withdrawal occurs.

---

## 📌 Executive Summary

India's NCRP receives ~8,000 cybercrime complaints daily. Cash withdrawal from ATMs happens within 10 minutes of fraud. Existing systems detect fraud and block funds reactively but do not predict *where* cash will be withdrawn geographically.

**Track the Cash** ingests synthetic complaint data calibrated to I4C statistics, clusters mule account networks, and runs an **XGBoost Classifier (ROC-AUC ≥ 0.85)** combined with a rule-based **Complaint Velocity Spike Detector** to predict ranked ATM-level cash-out risk for the next 24 hours. A real-time **Leaflet.js + React Dashboard** serves Law Enforcement Field Officers (LEA) and I4C National Analysts with automatic/manual SMTP alerts.

---

## 🚀 System Architecture

```
                                  ┌───────────────────────────┐
                                  │   OpenStreetMap Overpass  │ (Real Indian ATM Nodes)
                                  └─────────────┬─────────────┘
                                                ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│ Synthetic Data Generator  │────▶│   PostgreSQL / SQLite     │
│ (I4C Calibrated Pipeline) │     │ (Complaints, Mules, ATMs) │
└───────────────────────────┘     └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │   XGBoost ML Engine &     │
                                  │   Spike Velocity Engine   │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │      FastAPI Backend      │
                                  │  (/predict, /heatmap, …)  │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │    React + Leaflet SPA    │
                                  │  [ LEA View | Admin View ]│
                                  └───────────────────────────┘
```

---

## 🔑 Demo Credentials

| Role | Username | Password | Dashboard Access |
|---|---|---|---|
| **LEA Field Officer** | `lea_user` | `lea_pass` | Interactive ATM Heatmap, Alert Feed, Patrol Deployment |
| **I4C Admin Analyst** | `admin_user` | `admin_pass` | Velocity Charts, Inter-State Mule Flows, Simulation Inject, CSV Export |

---

## 🎬 3-Minute Hackathon Demo Script

1. **Sign In**: Navigate to `http://localhost:3000` (or `http://localhost:5173` in dev). Click the quick access button **"LEA Field Officer"** (`lea_user`).
2. **LEA Tactical Heatmap**:
   - Observe live colored ATM risk markers across India (Red > 70% risk, Amber 40–70%, Green < 40%).
   - Click any red marker in Noida / Lucknow to view ATM ID, bank name, risk score, and cross-state mule linkage.
   - Click **"Deploy Patrol Team"** on the top ranked ATM in the priority table.
3. **Switch to I4C Admin View**: Log in as **"I4C Admin Analyst"** (`admin_user`).
4. **Inter-Jurisdictional Mule Flows & Analytics**:
   - Observe the 7-day state complaint velocity charts.
   - Inspect the dotted cross-state cash-out flow vectors (e.g. *Rajasthan Origin ➔ UP Mule Accounts*).
   - Review XGBoost validation metrics (ROC-AUC 0.85+, Precision@10 0.80+).
5. **Inject 2-Stage Spike Scenario**:
   - Click **"Inject Demo Spike"** in the Admin command bar.
   - Stage 1 fires an immediate `CRITICAL` cross-state alert and elevates UP ATM risk scores.
   - Stage 2 triggers single-state velocity spike `WARNING` alert.
   - View newly populated spike alerts in real-time.
6. **Export Intelligence**: Click **"Export CSV Intelligence"** to download the official predictions spreadsheet for state police dispatch.

---

## 🛠️ Local Quick Start (Without Docker)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Initialize database schema & fetch ATM coordinates
python scripts/init_db.py
python scripts/fetch_atms.py

# Generate calibrated synthetic training complaints (30 days)
python scripts/generate.py --mode batch --days 30

# Train XGBoost model and score all ATMs
python scripts/train_model.py

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

Run the complete leak-free test suite across all seams (No Docker required):

```bash
python3 -m pytest backend/tests/ -v
```

Test Coverage:
- `test_db.py`: Database models, schemas, and CHECK constraints
- `test_fetch_atms.py`: ATM ingestion and coordinate idempotency
- `test_generate.py`: Calibrated data distributions, crime type ratios, and spike generation
- `test_ml.py`: Feature engineering, XGBoost training, ROC-AUC, and Precision@10
- `test_auth.py`: JWT login, claims, and role-based authentication
- `test_predict_heatmap.py`: `/predict` and `/heatmap` GeoJSON API responses
- `test_alerts_spike.py`: Spike detector rule, cross-state escalation, and 6-hour deduplication
- `test_analytics_reports.py`: 7-day velocity aggregation and CSV report exports
- `test_simulation.py`: Demo 2-stage spike injection and mode configuration

---

## 🐳 Docker Compose Deployment (Single Command)

```bash
docker compose up --build
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Docs (Swagger)**: `http://localhost:8000/docs`

---

## 👥 Team
- **Mohit** (DevOps / Data Pipeline)
- **Shubham** (Machine Learning & Feature Engineering)
- **Hari** (Backend & API Integration)
- **Prince** (Frontend & Geospatial Visualization)
