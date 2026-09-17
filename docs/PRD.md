# PRD: Track the Cash

> **Status:** Draft | **Version:** 1.1 | **Last Updated:** September 17, 2026

---

## 1. Executive Summary

Track the Cash is an AI-powered predictive analytics framework built for SIH 2026 (Problem Statement SIH26184, MHA/I4C). It addresses the core gap in India's cybercrime response pipeline: by the time a complaint is registered on NCRP and law enforcement acts, cash has already been withdrawn from ATMs — often within 10 minutes of the fraud. The system ingests synthetic complaint data calibrated to I4C statistics, clusters mule account locations, and runs an XGBoost model with a rule-based complaint velocity spike detector to produce ranked ATM-level risk scores for the next 24 hours. A Leaflet.js heatmap dashboard serves two roles — LEA (field officers) and Admin/I4C — with automatic and manual email alerts. Success means LEAs receive actionable ATM-zone alerts before cash withdrawal, not after.

---

## 2. Problem Statement

- **Current problem:** India's NCRP receives ~8,000 cybercrime complaints daily. Cash withdrawal from ATMs happens within 10 minutes of fraud. Existing systems (CFCFRMS 1930 helpline, MuleHunter.AI) detect fraud and block funds reactively but do not predict *where* cash will be withdrawn geographically.
- **Who faces it:** Law enforcement agencies (LEAs) at state and local levels, coordinated by I4C, who need proactive intelligence to deploy field teams or alert local banks/ATMs before withdrawal occurs.
- **Cost of inaction:** ₹22,848 crore lost in 2024 alone (41× growth from 2021). Without proactive location prediction, recovery rates remain low and ATM-level intervention is impossible.

---

## 3. Goals

| # | Goal | Metric | Target |
|---|------|--------|--------|
| 1 | Predict ATM cash withdrawal risk zones 24 hrs ahead | Precision@K (top-K ATMs flagged correctly) | ≥ 0.70 |
| 2 | Detect complaint velocity spikes in near real-time | Spike detection latency | < 5 minutes from data ingestion |
| 3 | Surface actionable alerts to LEA | Time from spike detection to dashboard alert | < 1 minute |
| 4 | Flag cross-state mule account cases | Cross-state mismatch detection rate | 100% of synthetic cross-state cases |
| 5 | Demonstrate end-to-end pipeline for hackathon judges | Full demo flow completable | ≤ 3 minutes |

---

## 4. Success Metrics

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|--------------------|
| XGBoost ROC-AUC | 0.50 (random) | ≥ 0.80 | sklearn roc_auc_score on test split |
| Precision@K (K=10) | — | ≥ 0.70 | Top-10 ATMs flagged vs actual high-risk ATMs |
| API response time | — | p95 < 300ms | FastAPI middleware timing |
| Spike detector latency | — | < 5 min | Timestamp delta: complaint ingestion → alert trigger |
| Dashboard load time | — | < 3s | Browser network tab |

---

## 5. Stakeholders

| Role | Name/Team | Responsibility |
|------|-----------|---------------|
| DevOps / Data | Mohit | Docker, DB schema, OSM ATM fetch, synthetic data pipeline, deployment |
| ML Engineer | Shubham | Feature engineering, XGBoost model, spike detector, model evaluation |
| Backend | Hari | FastAPI endpoints, JWT auth, email alerts, DB integration |
| Frontend | Prince | Leaflet.js dashboard, LEA view, Admin view, login page |

---

## 6. User Personas

### Persona 1: LEA Field Officer
- **Goals:** See which ATMs in their jurisdiction are high-risk right now; receive alerts before cash is withdrawn
- **Pain Points:** Currently reactive — only knows about fraud after it happens; no geographic intelligence
- **Technical Level:** Low — needs a simple map with clear risk indicators, no data science knowledge assumed
- **Usage Frequency:** Daily, during active shift

### Persona 2: I4C Admin / Analyst
- **Goals:** Monitor complaint velocity across states; trigger manual alerts; generate and download intelligence reports; see cross-state mule flow patterns
- **Pain Points:** No unified dashboard for complaint trends + ATM risk in one view; cross-jurisdiction coordination is manual
- **Technical Level:** Intermediate — comfortable with dashboards and data tables
- **Usage Frequency:** Daily

---

## 7. User Stories

| # | Story | Priority | Persona |
|---|-------|----------|---------|
| US-01 | As a LEA officer, I want to log in securely so that I access only my authorized view | Must | LEA Officer |
| US-02 | As a LEA officer, I want to see a live heatmap of ATM risk zones so that I can deploy field teams proactively | Must | LEA Officer |
| US-03 | As a LEA officer, I want to receive an automatic alert when a spike is detected so that I am notified without checking the dashboard | Must | LEA Officer |
| US-04 | As a LEA officer, I want to see which ATMs are flagged as high-risk with a risk score so that I can prioritize response | Must | LEA Officer |
| US-05 | As an I4C admin, I want to see complaint velocity trends by state so that I can identify emerging fraud hotspots | Must | I4C Admin |
| US-06 | As an I4C admin, I want to see cross-state mule account flags on the map so that I can coordinate inter-jurisdiction response | Must | I4C Admin |
| US-07 | As an I4C admin, I want to manually trigger an alert email so that I can control notifications during the demo and in operations | Must | I4C Admin |
| US-08 | As an I4C admin, I want to download an intelligence report so that I can share findings with state police | Should | I4C Admin |
| US-09 | As an I4C admin, I want to see model performance metrics (ROC-AUC, Precision@K) so that I can assess prediction reliability | Should | I4C Admin |

---

## 8. Functional Requirements

### Feature: Synthetic Data Generator

- **Description:** Python CLI script that generates all training and simulation data calibrated to I4C published statistics. Operates in two modes: `batch` (30-day offline training dataset) and `live` (real-time complaint stream replay for demo). Spike injection is controllable via CLI flag or Admin dashboard button.
- **Inputs:** CLI args — `--days` (default 30), `--mode batch|live|spike`, `--inject-spike` (bool), `--complaints-per-day` (default 8000)
- **Outputs:** Populates PostgreSQL tables: `complaints`, `mule_accounts`, `atm_risk_history`; ATM locations sourced separately from OSM

**Calibration Anchors (real-world statistics):**

| Parameter | Value | Source |
|---|---|---|
| Daily complaints | 8,000 | PS / I4C |
| Top fraud states | UP, Maharashtra, Rajasthan, Telangana, Karnataka | I4C annual report |
| Cross-state mule rate | 20% of cases | Lit review assumption |
| Avg fraud amount | ₹10,000–₹5,00,000 | CFCFRMS data |
| OTP fraud share | 45% | NCRB category ratios |
| ATM card fraud share | 30% | NCRB |
| Investment scam share | 25% | NCRB |

**Database Schemas:**

`complaints` table:
```
complaint_id, timestamp, state, district,
crime_type (otp_fraud | atm_card_fraud | investment_scam),
amount_inr, mule_account_id (FK), status (pending | resolved)
```

`mule_accounts` table:
```
mule_id, registered_state, registered_district,
registered_lat, registered_lng, account_bank,
is_cross_state (bool), linked_atm_ids (array of nearest 3 ATM IDs)
```

`atm_risk_history` table:
```
history_id, atm_id, date, risk_score,
complaint_count, spike_flag (bool), district, state
```

**Demo Spike Scenario (scripted, triggered via Admin dashboard "Inject Spike" button):**
1. **T+0s** — Cross-state event: fraud complaints originate in Rajasthan, mule accounts registered in UP → cross-state CRITICAL alert fires, UP ATMs highlighted on map
2. **T+60s** — Single-state spike: UP complaint count exceeds 2× 7-day rolling average → WARNING alert fires, additional UP ATMs elevated to red zone

**Live Mode Behaviour:**
- Replays complaints at configurable rate (default: 1 complaint/2 seconds)
- Random mode: probabilistic generation from calibrated distributions
- Scripted mode: deterministic scenario replay for demo control

- **Acceptance Criteria:**
  - [ ] `batch` mode generates 30 days × 8,000 complaints = ~240,000 records, completes in < 5 minutes
  - [ ] State distribution matches top-5 fraud states within ±5% of calibration ratios
  - [ ] Crime type split: OTP 45% / ATM card 30% / Investment scam 25% within ±3%
  - [ ] ≥ 20% of mule accounts have `is_cross_state = true`
  - [ ] Temporal pattern applied: weekday complaint count > weekend by factor of 1.3×
  - [ ] `live` mode streams complaints to DB at configured rate without errors
  - [ ] `--inject-spike` flag or Admin dashboard button triggers scripted 2-stage scenario correctly
  - [ ] All generated records persist to PostgreSQL; script is idempotent with `--reset` flag
  - [ ] `atm_risk_history` populated with 30 days of historical risk scores for Admin velocity chart

---

### Feature: ATM Location Ingestion

- **Description:** Pre-fetches real Indian ATM coordinates from OpenStreetMap via Overpass API and stores them in the database as the geographic backbone of the prediction system.
- **Inputs:** Overpass API query for ATM nodes across top 10 high-fraud states
- **Outputs:** `atm_locations` table with columns: `atm_id`, `lat`, `lng`, `state`, `district`, `bank_name`
- **Acceptance Criteria:**
  - [ ] ≥ 1,000 real ATM coordinate records ingested and stored
  - [ ] Each record has valid lat/lng, state, and district fields
  - [ ] Script is idempotent (re-running does not duplicate records)
  - [ ] District GeoJSON boundaries loaded from datameet/india-district-boundaries

---

### Feature: XGBoost Prediction Engine

- **Description:** Trained XGBoost classifier that scores each ATM in the database with a fraud withdrawal risk probability for the next 24-hour window.
- **Inputs:** Feature vector per ATM — district fraud density, complaint velocity (last 6 hrs), mule proximity distance (km to nearest mule cluster centroid), ATM count in district, cross-state flag
- **Outputs:** Risk score (0–1) per ATM, persisted to `predictions` table with timestamp
- **Acceptance Criteria:**
  - [ ] Model trained and evaluated on synthetic dataset with 80/20 train-test split
  - [ ] ROC-AUC ≥ 0.80 on test set
  - [ ] Precision@10 ≥ 0.70 on test set
  - [ ] Prediction run completes in < 60 seconds for full ATM dataset
  - [ ] Results stored in `predictions` table with `atm_id`, `risk_score`, `predicted_at`

---

### Feature: Complaint Velocity Spike Detector

- **Description:** Rule-based system that monitors complaint ingest rate per district and fires an alert when a statistically significant spike is detected, especially when combined with a cross-state mule flag.
- **Inputs:** Complaint counts per district per 6-hour window; 7-day rolling average per district; cross-state mule flag
- **Outputs:** Spike event record; triggers alert pipeline; elevates ATM risk scores in affected district
- **Acceptance Criteria:**
  - [ ] Spike fires when district complaint count > 2× 7-day rolling average in last 6 hrs
  - [ ] Cross-state flag elevates spike severity level from WARNING to CRITICAL
  - [ ] Spike event logged to `alerts` table with district, severity, timestamp
  - [ ] Spike detection runs on a schedule (every 15 minutes or on-demand via API)
  - [ ] Elevated ATM risk scores reflected in heatmap within 1 minute of spike detection

---

### Feature: FastAPI Backend

- **Description:** REST API serving prediction results, heatmap GeoJSON, and alert triggers to the frontend, with JWT-based role authentication.
- **Inputs:** HTTP requests from frontend; scheduled spike detector runs; SMTP config for email
- **Outputs:** JSON responses for all endpoints; email alerts via SMTP
- **Acceptance Criteria:**
  - [ ] JWT login endpoint returns valid token for `lea_user` and `admin_user` hardcoded credentials
  - [ ] Token required on all protected endpoints; returns 401 on missing/invalid token
  - [ ] `/predict` returns ranked list of ATMs with risk scores in < 300ms (p95)
  - [ ] `/heatmap` returns valid GeoJSON FeatureCollection for Leaflet rendering
  - [ ] `/alerts/trigger` (POST) sends email via SMTP and returns 200 on success
  - [ ] `/alerts/auto` spike detector endpoint callable on schedule
  - [ ] All endpoints return appropriate 4xx/5xx with error message on failure

---

### Feature: Leaflet.js Heatmap Dashboard — LEA View

- **Description:** Map-based interface for field officers showing real-time ATM risk zones, color-coded by risk score, with an alert feed.
- **Inputs:** `/heatmap` GeoJSON from backend; `/alerts` feed
- **Outputs:** Interactive map with risk zone overlays; alert notification panel
- **Acceptance Criteria:**
  - [ ] Map loads with India centered, correct district boundaries rendered
  - [ ] ATMs colored by risk: green (< 0.4), amber (0.4–0.7), red (> 0.7)
  - [ ] Clicking an ATM marker shows popup: ATM ID, risk score, district, bank name
  - [ ] Alert feed panel shows latest 10 spike alerts with timestamp and district
  - [ ] Map auto-refreshes risk data every 60 seconds without full page reload
  - [ ] Cross-state mule cases visually distinguished (e.g. different icon)

---

### Feature: Admin / I4C Dashboard

- **Description:** Analytics-focused view for I4C analysts with complaint velocity trends, cross-state mule flow visualization, manual alert trigger, and report download.
- **Inputs:** `/predict`, `/heatmap`, `/alerts` endpoints; admin JWT token
- **Outputs:** Analytics charts; manual alert trigger; downloadable report (CSV or PDF)
- **Acceptance Criteria:**
  - [ ] Complaint velocity trend chart shows last 7 days by state (top 5 states)
  - [ ] Cross-state mule cases shown as arrow overlays on map (origin state → mule state)
  - [ ] "Send Alert" button triggers `/alerts/trigger` and shows success confirmation
  - [ ] Model metrics panel shows ROC-AUC and Precision@K values
  - [ ] Report download button exports current predictions as CSV

---

### Feature: Authentication

- **Description:** JWT-based login with two hardcoded demo users, role-based dashboard redirect.
- **Inputs:** Username + password from login form
- **Outputs:** JWT token; redirect to LEA or Admin dashboard based on role
- **Acceptance Criteria:**
  - [ ] `lea_user` / `lea_pass` → redirects to LEA view
  - [ ] `admin_user` / `admin_pass` → redirects to Admin view
  - [ ] Invalid credentials return 401 with error message
  - [ ] JWT token expires after 8 hours
  - [ ] All dashboard routes redirect to login if no valid token present

---

## 9. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | API response time | p95 < 300ms |
| Performance | Dashboard initial load | < 3 seconds |
| Performance | ML prediction run | < 60 seconds full dataset |
| Scalability | Concurrent demo users | ≥ 10 (hackathon demo) |
| Reliability | Demo uptime | 100% during presentation window |
| Security | Auth standard | JWT (HS256) |
| Security | Passwords | Hardcoded for demo; env-var backed |
| Deployment | Environment | Docker Compose, single VM |
| Portability | Setup time on new machine | < 15 minutes via docker compose up |

---

## 10. System Scope

**In Scope:**
- Synthetic complaint + mule account data generation calibrated to I4C statistics
- Real ATM coordinates ingested from OpenStreetMap Overpass API
- Real district GeoJSON boundaries from datameet/india-district-boundaries
- XGBoost model with mule proximity, complaint velocity, and spatial features
- Rule-based spike detector with cross-state mule flag
- FastAPI backend with JWT auth, prediction, heatmap, and alert endpoints
- Leaflet.js dashboard — LEA view and Admin/I4C view
- Automatic + manual email alert via SMTP
- Docker Compose deployment on cloud VM

**Out of Scope:**
- Live NCRP complaint data integration (restricted to I4C; requires government API access)
- MuleHunter.AI API integration
- Bank role dashboard
- SMS alerts (Twilio/MSG91)
- Mobile application
- Real-time streaming pipeline (Kafka, etc.)
- User registration / account management
- Hawkes process temporal modelling (future scope)
- LSTM spatio-temporal forecasting (future scope)
- PostGIS geospatial queries (plain PostgreSQL used instead)

---

## 11. User Journey

```
User opens Track the Cash URL
        ↓
Login page — enters role credentials (lea_user or admin_user)
        ↓
JWT issued → role detected → redirect to appropriate dashboard
        ↓
[LEA View]                          [Admin View]
Map loads with ATM risk heatmap     Complaint velocity chart loads
        ↓                                   ↓
Spike detector fires (auto)         Cross-state mule arrows appear on map
        ↓                                   ↓
Red ATM zones highlighted           Alert feed updates with spike event
        ↓                                   ↓
Email auto-sent to LEA              Admin clicks "Send Alert" manually
        ↓                                   ↓
LEA clicks ATM marker               Admin downloads CSV report
        ↓
Popup: risk score + district + bank name
        ↓
LEA deploys field team to flagged ATM zone — demo complete
```

---

## 12. Business Rules

- BR-01: Only authenticated users with a valid JWT may access any dashboard or API endpoint beyond `/login`
- BR-02: LEA role may only access LEA view; Admin role may access both views
- BR-03: A spike alert email is sent at most once per district per 6-hour window (deduplication) to prevent alert fatigue
- BR-04: ATM risk scores must be recalculated before each heatmap render; stale scores older than 24 hours must be flagged
- BR-05: Cross-state mule cases (complaint district ≠ mule account district) must always be escalated to CRITICAL severity regardless of complaint count
- BR-06: All spike events and alert triggers must be logged to the `alerts` table with timestamp, triggered_by (auto/manual), and severity

---

## 13. Data Requirements

| Aspect | Detail |
|--------|--------|
| Sources | Synthetic complaint/mule generator (calibrated to I4C stats); OpenStreetMap Overpass API (ATM coordinates); datameet/india-district-boundaries (GeoJSON) |
| Ownership | All synthetic data generated and owned by the project team; OSM data under ODbL license |
| Retention | Demo data retained for duration of hackathon; no PII in synthetic dataset |
| Privacy/Compliance | No real citizen data used; synthetic records contain no real personal identifiers |
| Sensitive fields | JWT secrets stored as environment variables; SMTP credentials in `.env`, not in source code |

---

## 14. API Requirements

### `POST /auth/login`
- **Purpose:** Authenticate user and return JWT token
- **Input:** `{ "username": string, "password": string }`
- **Output:** `{ "access_token": string, "role": "lea" | "admin", "expires_in": 28800 }` — 200 OK
- **Error Cases:** 401 on invalid credentials; 422 on malformed request body

---

### `GET /predict`
- **Purpose:** Return ranked list of ATMs with risk scores for next 24 hours
- **Input:** Header: `Authorization: Bearer <token>`; Query params: `state` (optional filter), `limit` (default 50)
- **Output:** `{ "predictions": [{ "atm_id", "lat", "lng", "risk_score", "district", "state", "bank_name", "cross_state_flag" }], "generated_at": timestamp }`
- **Error Cases:** 401 unauthorized; 500 if model not loaded

---

### `GET /heatmap`
- **Purpose:** Return GeoJSON FeatureCollection for Leaflet rendering
- **Input:** Header: `Authorization: Bearer <token>`
- **Output:** Valid GeoJSON FeatureCollection with ATM Point features, `risk_score` and `severity` in properties
- **Error Cases:** 401 unauthorized; 500 on GeoJSON generation failure

---

### `POST /alerts/trigger`
- **Purpose:** Manually trigger alert email (Admin only)
- **Input:** Header: `Authorization: Bearer <token>`; Body: `{ "district": string, "severity": "WARNING" | "CRITICAL", "message": string }`
- **Output:** `{ "status": "sent", "recipients": [...], "triggered_at": timestamp }` — 200 OK
- **Error Cases:** 401 unauthorized; 403 if role is not admin; 500 on SMTP failure

---

### `GET /alerts/spike-check`
- **Purpose:** Run spike detector on-demand and return any new spike events
- **Input:** Header: `Authorization: Bearer <token>`
- **Output:** `{ "spikes": [{ "district", "severity", "complaint_count", "rolling_avg", "cross_state": bool, "detected_at" }] }`
- **Error Cases:** 401 unauthorized

---

### `POST /simulation/inject-spike`
- **Purpose:** Trigger the scripted 2-stage demo spike scenario (Admin only) — inserts calibrated spike records into DB and fires spike detector
- **Input:** Header: `Authorization: Bearer <token>`; Body: `{ "stage": 1 | 2 | "all" }` — stage 1 = cross-state Rajasthan→UP, stage 2 = UP single-state spike, "all" = both in sequence
- **Output:** `{ "status": "injected", "stage": ..., "alerts_fired": [...], "affected_atms": [...] }` — 200 OK
- **Error Cases:** 401 unauthorized; 403 if role is not admin; 409 if spike already active

---

### `POST /simulation/mode`
- **Purpose:** Switch live complaint stream between random and scripted modes
- **Input:** Header: `Authorization: Bearer <token>`; Body: `{ "mode": "random" | "scripted", "rate_per_second": float }`
- **Output:** `{ "status": "updated", "mode": ..., "rate_per_second": ... }` — 200 OK
- **Error Cases:** 401 unauthorized; 403 if role is not admin

---

### `GET /analytics/velocity`
- **Purpose:** Return complaint velocity trend data for Admin dashboard charts
- **Input:** Header: `Authorization: Bearer <token>`; Query: `days` (default 7), `states` (comma-separated, default top 5)
- **Output:** `{ "trend": [{ "date", "state", "complaint_count" }] }`
- **Error Cases:** 401 unauthorized; 403 if role is not admin

---

### `GET /reports/export`
- **Purpose:** Export current predictions as CSV for download
- **Input:** Header: `Authorization: Bearer <token>`
- **Output:** CSV file download (`Content-Disposition: attachment`)
- **Error Cases:** 401 unauthorized; 403 if role is not admin

---

## 15. Architecture Overview

```
[Synthetic Data Generator (Python CLI)]
   ├── --mode batch   → seeds 30-day training data
   ├── --mode live    → streams complaints to DB (random or scripted)
   └── --inject-spike → triggers 2-stage demo scenario
        ↓
[PostgreSQL on Supabase/Neon]
   ├── complaints
   ├── mule_accounts
   ├── atm_locations (pre-fetched from OSM)
   ├── atm_risk_history
   ├── predictions
   └── alerts
        ↓
[ML Engine: XGBoost + Spike Detector (Python)]
   ├── Feature engineering from DB
   ├── Model training + scoring
   └── Writes predictions → DB
        ↓
[FastAPI Backend]
   ├── /auth/login
   ├── /predict
   ├── /heatmap
   ├── /alerts/trigger
   ├── /alerts/spike-check
   ├── /analytics/velocity
   ├── /reports/export
   ├── /simulation/inject-spike
   └── /simulation/mode
        ↓ REST JSON / GeoJSON
[Frontend: Vanilla JS + Leaflet.js]
   ├── Login Page
   ├── LEA View (heatmap + alert feed)
   └── Admin View (charts + manual alert + export)
        ↓
[Email: SMTP (Gmail/SendGrid)]

[Docker Compose]
   ├── service: api (FastAPI)
   ├── service: frontend (nginx or static serve)
   └── service: ml-runner (one-shot container for training)

[Cloud VM: Railway / Render free tier]
```

**Key integrations:** Supabase/Neon (PostgreSQL), OpenStreetMap Overpass API (one-time data fetch), SMTP provider (Gmail App Password or SendGrid free tier), datameet GitHub (GeoJSON boundaries)

---

## 16. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Overpass API rate limit or downtime during data fetch | Low | High | Pre-fetch ATM data in setup script and cache in DB; never query live during demo |
| Supabase/Neon free tier connection limits | Medium | High | Use connection pooling in FastAPI (SQLAlchemy pool); fallback to local SQLite if needed |
| XGBoost model underperforms on synthetic data (AUC < 0.75) | Medium | High | Tune class weights; inject stronger signal into synthetic features; Shubham validates early (by Hour 16) |
| SMTP email blocked or misconfigured | Medium | Medium | Test SMTP in Hour 12; use Gmail App Password as primary, SendGrid as backup |
| Frontend Leaflet GeoJSON render fails | Low | Medium | Validate GeoJSON with geojson.io before integration; fallback to simple marker layer |
| Synthetic data signal too weak — XGBoost finds no pattern | Medium | High | Inject strong synthetic signal: cross-state mules always within 50km of high-fraud ATMs; Shubham validates AUC by Hour 16 |
| Live stream DB writes cause latency spike during demo | Low | Medium | Batch-insert complaints in groups of 10; use async DB writes in generator |
| Time overrun — not all features complete by Hour 48 | High | High | Core must-haves (heatmap + predict + login) by Hour 36; alerts + admin view by Hour 44; polish Hour 44–48 |
| Docker Compose port conflicts on demo machine | Low | Medium | Document port config in README; test docker compose up on clean machine by Hour 46 |

---

## 17. Assumptions & Dependencies

**Assumptions:**
- Raw NCRP complaint-level data remains unavailable; synthetic calibrated data is acceptable for hackathon judges
- OSM Overpass API returns sufficient ATM nodes for top 10 Indian states (validated during setup)
- Supabase/Neon free tier is sufficient for demo-scale data (< 100K rows)
- SMTP credentials are available and working before Hour 12
- Judges evaluate on demo quality and technical depth, not production readiness

**Dependencies:**
- OpenStreetMap Overpass API — ATM coordinate data (one-time fetch, Mohit, Hour 2–4)
- datameet/india-district-boundaries GitHub repo — GeoJSON district boundaries
- Supabase or Neon — hosted PostgreSQL (Mohit sets up, Hour 1)
- SMTP provider — Gmail App Password or SendGrid free tier (Hari configures, Hour 12)
- Docker + Docker Compose — installed on deployment VM (Mohit, Hour 1)

---

## 18. Release Plan

| Phase | Features | Goal |
|-------|----------|------|
| **MVP (Hour 0–24)** | Data pipeline + DB schema + OSM ATM fetch + XGBoost model + `/predict` endpoint + basic Leaflet map with markers | Working prediction engine with map |
| **Demo Ready (Hour 24–44)** | Spike detector + `/heatmap` GeoJSON + LEA dashboard + Admin dashboard + JWT auth + email alerts + cross-state flag visualization | Full demo flow completable |
| **Polish (Hour 44–48)** | UI styling + Docker Compose finalized + README + demo script rehearsal + model metrics panel | Judge-ready prototype |
| **Future Scope** | Hawkes process temporal modelling; LSTM spatio-temporal forecasting; Bank role dashboard; Live NCRP API integration (when I4C grants access) | Production-grade system |

---

## 19. Acceptance Criteria *(Project-Level Definition of Done)*

The prototype is demo-ready when ALL of the following are verifiable:

- [ ] `docker compose up` starts the full system on a clean machine in < 15 minutes
- [ ] Login works for both `lea_user` and `admin_user` with correct role-based redirect
- [ ] Leaflet heatmap loads with real ATM coordinates and color-coded risk zones
- [ ] XGBoost model ROC-AUC ≥ 0.80 and Precision@10 ≥ 0.70 on test set
- [ ] Spike detector fires correctly on injected spike scenario and elevates ATM risk scores
- [ ] Cross-state mule case appears as distinct visual element on map
- [ ] Auto email alert sends successfully when spike is detected
- [ ] Manual "Send Alert" button in Admin view sends email and shows confirmation
- [ ] Admin dashboard shows complaint velocity trend chart for top 5 states
- [ ] CSV report downloads correctly from Admin view
- [ ] Full 3-minute demo flow (login → heatmap → spike → alert → admin view) completable without errors
- [ ] README documents setup steps, demo credentials, and architecture diagram

---

*Generated by write-prd skill | Claude | Track the Cash — SIH 2026 (MHA/I4C PS SIH26184)*
