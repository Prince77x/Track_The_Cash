# Spec: Track the Cash — SIH 2026 (MHA/I4C PS SIH26184)

Status: ready-for-agent
Version: 1.0
Derived from: `docs/PRD.md` v1.1

---

## Problem Statement

India's NCRP receives approximately 8,000 cybercrime complaints every day. When a fraud is committed, the perpetrator withdraws cash from an ATM — typically within 10 minutes of the fraud event. By the time a victim files a complaint and law enforcement acts, the cash is gone and recovery is nearly impossible.

Existing systems like CFCFRMS (1930 helpline) and MuleHunter.AI detect fraud and block funds reactively, but neither system predicts *where* cash will be physically withdrawn on a map. Law enforcement agencies (LEAs) have no geographic intelligence to act on before withdrawal occurs. The result: ₹22,848 crore lost in 2024 alone (41× growth since 2021) with low recovery rates.

---

## Solution

Track the Cash is an AI-powered predictive analytics platform that ingests synthetic complaint data calibrated to I4C statistics, clusters mule account locations, and scores every ATM in the database with a 24-hour fraud withdrawal risk probability using an XGBoost model combined with a rule-based complaint velocity spike detector.

The platform surfaces ranked, color-coded ATM risk zones on a Leaflet.js heatmap served inside a React SPA. Two role-based dashboards are provided:

- **LEA View** — field officers see a live heatmap with flagged ATMs, a real-time alert feed, and automatic email notifications when a spike is detected
- **Admin / I4C View** — analysts see complaint velocity trend charts, cross-state mule flow arrows on the map, a manual alert trigger, model performance metrics, and a CSV report download

The full system runs on Docker Compose and is demo-completable in under 3 minutes.

---

## User Stories

### Authentication

1. As a LEA field officer, I want to log in with my credentials, so that I can access my authorized dashboard without seeing admin controls.
2. As an I4C admin, I want to log in with my credentials, so that I can access both the LEA view and the Admin view.
3. As any user, I want to be redirected to the login page if my session token is missing or expired, so that unauthorized access is prevented.
4. As any user, I want to see a clear error message when I enter wrong credentials, so that I know to try again.
5. As any user, I want my session to remain active for 8 hours, so that I don't need to log in repeatedly during a shift.

### LEA Field Officer — Heatmap & ATM Risk

6. As a LEA field officer, I want to see a map of India centered on my region with district boundaries rendered, so that I can orient myself geographically.
7. As a LEA field officer, I want ATM markers color-coded by risk level (green < 0.4, amber 0.4–0.7, red > 0.7), so that I can visually identify danger zones at a glance.
8. As a LEA field officer, I want to click on any ATM marker and see a popup with ATM ID, risk score, district, bank name, and cross-state flag, so that I have actionable context without leaving the map.
9. As a LEA field officer, I want cross-state mule account cases visually distinguished from regular ATMs on the map (e.g. a different icon), so that I can prioritize inter-jurisdiction cases.
10. As a LEA field officer, I want the heatmap to auto-refresh risk data every 60 seconds without a full page reload, so that I always see current intelligence.
11. As a LEA field officer, I want to see which ATMs are in the top-10 highest risk list, so that I can prioritize field team deployment.

### LEA Field Officer — Alerts

12. As a LEA field officer, I want to see an alert feed panel showing the latest 10 spike alerts with timestamp and district, so that I am aware of active spikes without checking the whole map.
13. As a LEA field officer, I want to receive an automatic email alert when a complaint velocity spike is detected in my region, so that I am notified even when not watching the dashboard.
14. As a LEA field officer, I want the alert feed to update in near real-time when a new spike fires, so that I don't miss an escalation event.

### I4C Admin — Analytics & Oversight

15. As an I4C admin, I want to see a complaint velocity trend chart showing the last 7 days broken down by the top 5 fraud states, so that I can identify emerging hotspots across jurisdictions.
16. As an I4C admin, I want to see cross-state mule flow patterns visualized as directional arrows on the map (origin state → mule account state), so that I can coordinate inter-jurisdiction response.
17. As an I4C admin, I want to see model performance metrics (ROC-AUC and Precision@K) displayed on the dashboard, so that I can assess the reliability of the predictions.
18. As an I4C admin, I want to manually trigger an alert email for a specific district with a chosen severity level and message, so that I can notify LEAs of a situation I have identified myself.
19. As an I4C admin, I want to see a success confirmation after sending a manual alert, so that I know the email was dispatched.
20. As an I4C admin, I want to download a CSV report of the current ATM risk predictions, so that I can share intelligence with state police who don't have dashboard access.

### I4C Admin — Demo / Simulation

21. As an I4C admin, I want to click an "Inject Spike" button on the dashboard to trigger the scripted 2-stage demo scenario, so that I can run a controlled demonstration for judges.
22. As an I4C admin, I want Stage 1 of the spike scenario (cross-state Rajasthan→UP) to fire a CRITICAL alert and highlight UP ATMs within 60 seconds, so that the demo tells a clear story.
23. As an I4C admin, I want Stage 2 of the spike scenario (UP single-state complaint spike) to fire a WARNING alert and elevate additional UP ATMs to red zone, so that the escalation arc is visible on map.
24. As an I4C admin, I want to switch the live complaint stream between random and scripted modes and control the ingestion rate, so that I can tune the demo pacing.

### Spike Detector

25. As a spike detector, I want to fire a WARNING alert when a district's complaint count exceeds 2× its 7-day rolling average within the last 6-hour window, so that emerging fraud patterns are surfaced quickly.
26. As a spike detector, I want to escalate a WARNING to CRITICAL automatically when the spiking district also has active cross-state mule accounts, so that inter-jurisdiction cases receive higher priority.
27. As a spike detector, I want to suppress duplicate alert emails for the same district within a 6-hour window, so that LEAs are not overwhelmed with repeated notifications.
28. As a spike detector, I want every detected spike event to be logged to the alerts table with district, severity, timestamp, and trigger source (auto/manual), so that there is a full audit trail.
29. As a spike detector, I want elevated ATM risk scores in the affected district to be reflected on the heatmap within 1 minute of spike detection, so that map and alerts stay in sync.

### Data Pipeline

30. As a data pipeline operator, I want to run a batch data generation command that produces 30 days × 8,000 complaints (~240,000 records) in under 5 minutes, so that training data is ready quickly.
31. As a data pipeline operator, I want the generated state distribution to match the top-5 fraud states (UP, Maharashtra, Rajasthan, Telangana, Karnataka) within ±5% of calibration ratios, so that the synthetic data is realistic.
32. As a data pipeline operator, I want the crime type split to be approximately OTP fraud 45% / ATM card fraud 30% / Investment scam 25% within ±3%, so that model features reflect real-world proportions.
33. As a data pipeline operator, I want at least 20% of generated mule accounts to have the cross-state flag set, so that cross-state detection scenarios are well-represented in training data.
34. As a data pipeline operator, I want weekday complaint counts to exceed weekend counts by a factor of ~1.3×, so that temporal patterns are realistic.
35. As a data pipeline operator, I want to run the generator with a `--reset` flag and have it be fully idempotent, so that I can re-seed the database safely.
36. As a data pipeline operator, I want to pre-fetch real Indian ATM coordinates from the OSM Overpass API for the top 10 high-fraud states, so that predictions are anchored to real geography.
37. As a data pipeline operator, I want the ATM ingestion script to be idempotent (no duplicates on re-run) and store at least 1,000 ATM records, so that the geographic backbone is stable.

### DevOps / Deployment

38. As a developer, I want to run `docker compose up` and have the full system start on a clean machine in under 15 minutes, so that setup time is minimal before the demo.
39. As a developer, I want sensitive credentials (JWT secret, SMTP password) stored in environment variables and a `.env` file, not in source code, so that they are not accidentally committed.
40. As a developer, I want a README that documents setup steps, demo credentials, and an architecture diagram, so that any team member can onboard quickly.

---

## Implementation Decisions

### Architecture

- **Frontend:** React SPA with Leaflet.js integrated as a React component via `react-leaflet`. The SPA handles login, role-based routing, heatmap rendering, alert feed, admin charts, and simulation controls.
- **Backend:** FastAPI (Python) serving JSON and GeoJSON over REST. One FastAPI service handles auth, predictions, heatmap generation, alerts, analytics, simulation, and report export.
- **ML Engine:** XGBoost model and spike detector are Python modules. The model is trained offline (one-shot container) and the trained artefact is loaded by the FastAPI service at startup. Spike detection runs on a 15-minute scheduler inside the FastAPI process (APScheduler or equivalent) and is also callable on-demand via the `/alerts/spike-check` endpoint.
- **Database:** PostgreSQL (Supabase or Neon free tier). No PostGIS — plain lat/lng float columns with application-layer spatial calculations.
- **Email:** SMTP via Gmail App Password (primary) or SendGrid free tier (fallback). Email is sent synchronously from FastAPI; failure returns a 500 with a clear error message.
- **Deployment:** Docker Compose with three services: `api` (FastAPI), `frontend` (React, served via nginx), `ml-runner` (one-shot training container). Hosted on a cloud VM (Railway or Render free tier).

### Database Schema

Six tables in PostgreSQL:

**`complaints`**: `complaint_id`, `timestamp`, `state`, `district`, `crime_type` (enum: `otp_fraud | atm_card_fraud | investment_scam`), `amount_inr`, `mule_account_id` (FK), `status` (enum: `pending | resolved`)

**`mule_accounts`**: `mule_id`, `registered_state`, `registered_district`, `registered_lat`, `registered_lng`, `account_bank`, `is_cross_state` (bool), `linked_atm_ids` (array of nearest 3 ATM IDs)

**`atm_locations`**: `atm_id`, `lat`, `lng`, `state`, `district`, `bank_name`

**`atm_risk_history`**: `history_id`, `atm_id`, `date`, `risk_score`, `complaint_count`, `spike_flag` (bool), `district`, `state`

**`predictions`**: `atm_id`, `risk_score`, `predicted_at` (latest prediction per ATM; upserted on each prediction run)

**`alerts`**: `alert_id`, `district`, `state`, `severity` (enum: `WARNING | CRITICAL`), `detected_at`, `triggered_by` (enum: `auto | manual`), `complaint_count`, `rolling_avg`, `cross_state` (bool)

### XGBoost Feature Vector

Per-ATM features:
- `district_fraud_density` — complaints per district per day (rolling 7-day mean)
- `complaint_velocity_6h` — complaint count in the last 6-hour window for the ATM's district
- `mule_proximity_km` — distance in km from ATM to nearest mule cluster centroid
- `atm_count_in_district` — total ATMs in district (density normalizer)
- `cross_state_flag` — binary: 1 if any active cross-state mule account is linked to nearby ATMs

Target label: `high_risk` (binary) — 1 if the ATM district had ≥ 1 confirmed fraud withdrawal in the 24-hour window following the feature snapshot.

### Spike Detection Rule

```
spike = (complaint_count_last_6h > 2 × rolling_avg_7day) AND (rolling_avg_7day > 0)
severity = CRITICAL if is_cross_state else WARNING
deduplicate = suppress email if same district already alerted within last 6 hours
```

Derived directly from PRD business rules BR-03, BR-04, BR-05.

### Authentication

- Two hardcoded demo users: `lea_user / lea_pass` → role `lea`; `admin_user / admin_pass` → role `admin`
- JWT signed with HS256, 8-hour expiry
- Role stored in JWT claims; all protected endpoints verify token and check role where applicable
- Frontend stores JWT in memory (not localStorage) for the demo; React Router guards redirect unauthenticated routes to `/login`
- Admin role can access both LEA and Admin views; LEA role is restricted to LEA view only

### API Contract

| Endpoint | Method | Auth | Role | Purpose |
|---|---|---|---|---|
| `/auth/login` | POST | None | Any | Issue JWT |
| `/predict` | GET | Bearer | Any | Ranked ATM risk list |
| `/heatmap` | GET | Bearer | Any | GeoJSON FeatureCollection |
| `/alerts/trigger` | POST | Bearer | Admin | Manual alert email |
| `/alerts/spike-check` | GET | Bearer | Any | On-demand spike detection |
| `/simulation/inject-spike` | POST | Bearer | Admin | 2-stage demo scenario |
| `/simulation/mode` | POST | Bearer | Admin | Switch stream mode/rate |
| `/analytics/velocity` | GET | Bearer | Admin | Velocity trend data |
| `/reports/export` | GET | Bearer | Admin | CSV download |

### Risk Score Color Thresholds (Frontend)

- `risk_score < 0.4` → green marker
- `0.4 ≤ risk_score ≤ 0.7` → amber marker
- `risk_score > 0.7` → red marker
- Cross-state mule flag → distinct icon (e.g. warning triangle overlay)

### ATM Risk Staleness

ATM risk scores older than 24 hours are considered stale and flagged in the `/predict` response (`stale: true`). The frontend renders stale ATMs with a visual indicator (e.g. greyed border).

### Demo Spike Scenario (Scripted)

- **Stage 1 (T+0s):** Complaint records originating in Rajasthan with mule accounts registered in UP are inserted. Cross-state flag triggers CRITICAL alert. UP ATMs elevated on map.
- **Stage 2 (T+60s):** UP complaint count exceeds 2× 7-day rolling average. WARNING alert fires. Additional UP ATMs rise to red zone.
- Triggered via Admin dashboard "Inject Spike" button → `POST /simulation/inject-spike { "stage": "all" }`.

---

## Testing Decisions

### What Makes a Good Test

Tests verify **external behavior through the public API surface**, not internal implementation. A test should not import or call model training functions, database query helpers, or spike detector internals directly — it should make HTTP requests and assert on response codes, response shapes, and database side-effects observable via subsequent HTTP calls. Tests must be deterministic: seed the database with known fixture data before each test, tear down afterwards.

### Primary Test Seam — FastAPI HTTP Layer

This is the **highest and preferred seam**. The majority of tests live here. A test database (separate schema or SQLite in-memory for speed) is used; the XGBoost model is loaded from a pre-trained fixture artefact. Test categories:

- **Auth tests:** valid `lea_user` and `admin_user` credentials return 200 + JWT; invalid credentials return 401; missing token on protected endpoints returns 401; LEA token on admin-only endpoint returns 403.
- **Predict tests:** `GET /predict` returns a list of ATMs with `risk_score` in [0, 1], `atm_id`, `lat`, `lng`, `district`, `state`, `bank_name`, `cross_state_flag`; optional `state` filter narrows results; response time p95 < 300ms.
- **Heatmap tests:** `GET /heatmap` returns a valid GeoJSON FeatureCollection; every feature is a Point with `risk_score` and `severity` in properties.
- **Spike detector tests (via HTTP):** with seeded complaint data exceeding 2× rolling average, `GET /alerts/spike-check` returns a spike event; cross-state data returns `severity: CRITICAL`; same-district second call within 6 hours returns no new spike (deduplication).
- **Manual alert tests:** `POST /alerts/trigger` with admin token returns 200 + `status: sent`; with LEA token returns 403; SMTP mock captures the outgoing email and asserts on district and severity fields.
- **Simulation tests:** `POST /simulation/inject-spike { "stage": "all" }` inserts records and returns `alerts_fired` list; subsequent `GET /predict` shows elevated scores for UP ATMs.
- **Analytics tests:** `GET /analytics/velocity` returns a `trend` array with `date`, `state`, `complaint_count` fields; LEA token returns 403.
- **Export tests:** `GET /reports/export` returns `Content-Disposition: attachment` CSV with correct headers.

### Secondary Test Seam — Spike Detector Module

Spike detection logic is also tested at the module level (pure Python, no HTTP) because the rule conditions and deduplication logic are complex enough to warrant direct unit coverage:

- `detect_spikes(district_counts, rolling_avgs, cross_state_flags)` returns correct severity for each scenario
- Edge cases: rolling average is zero (no spike), count exactly equals 2× average (no spike), count equals 2× average + 1 (spike fires)

### Secondary Test Seam — Synthetic Data Generator

CLI output is verified against calibration ratios:

- `batch` mode produces records within ±5% of state distribution targets
- Crime type split is within ±3% of 45/30/25 targets
- At least 20% of mule accounts have `is_cross_state = true`
- Weekday count > weekend count by ≥ 1.2×

### No-Docker Rule (mandatory)

**Tests MUST NOT start or stop Docker containers.** Docker Compose is for deployment only — never for the test loop.

- The FastAPI HTTP seam uses `httpx.AsyncClient` with `ASGITransport` directly against the FastAPI app instance (no server process, no ports).
- The database under test is either SQLite in-memory or a separate PostgreSQL schema created once per session via a `pytest-anyio` session-scoped fixture — whichever the team chooses, it must start in milliseconds.
- SMTP is mocked with `unittest.mock` patching the send call; no real SMTP server is needed.
- Docker Compose is exercised **only** in the final manual smoke test (Ticket 13). No CI/agent step spins up a container during the red→green loop.

Rationale: Docker start/stop adds 30–60 s per cycle, burns context-window tokens on container output, and makes the test loop too slow for TDD.

### Prior Art

No existing tests in the repo yet. The FastAPI HTTP tests should follow the `httpx.AsyncClient` + `pytest-asyncio` pattern (standard for FastAPI testing). SMTP should be mocked with `unittest.mock` patching the SMTP send call.

---

## Out of Scope

- **Live NCRP data integration** — Raw complaint-level NCRP data is restricted to I4C and requires government API access. All data is synthetic for the hackathon.
- **MuleHunter.AI API integration** — No integration with the RBI MuleHunter system.
- **Bank role dashboard** — Only LEA and Admin roles are implemented.
- **SMS alerts** — No Twilio/MSG91 integration; email only.
- **Mobile application** — Web SPA only.
- **Real-time streaming pipeline** — No Kafka or similar. Live mode uses a polling/insert loop in the synthetic data generator.
- **User registration / account management** — Credentials are hardcoded for the demo.
- **Hawkes process temporal modelling** — Future scope; not in this build.
- **LSTM spatio-temporal forecasting** — Future scope; XGBoost only.
- **PostGIS** — Plain PostgreSQL with float lat/lng; spatial calculations in application code.
- **Frontend E2E browser tests** — Frontend QA is manual during the hackathon demo.

---

## Further Notes

- **Hackathon timeline:** MVP (data pipeline + XGBoost + `/predict` + basic React map) by Hour 24; Demo-ready (spike detector + heatmap GeoJSON + LEA dashboard + Admin dashboard + JWT + email alerts) by Hour 44; Polish by Hour 48.
- **Key risk — XGBoost AUC:** If AUC < 0.75 on the first evaluation (Hour 16), tune class weights and strengthen synthetic signal (ensure cross-state mule accounts are placed within 50km of high-fraud ATMs). Do not delay this validation.
- **Key risk — SMTP:** Test SMTP by Hour 12. Primary: Gmail App Password. Fallback: SendGrid free tier.
- **OSM Overpass API:** ATM data must be pre-fetched and cached in the database during setup. Never query the Overpass API live during the demo.
- **GeoJSON validation:** Validate the `/heatmap` GeoJSON output with `geojson.io` before frontend integration to prevent silent Leaflet render failures.
- **No PII:** The synthetic dataset contains no real personal identifiers. JWT secrets and SMTP credentials live in `.env`, not in source code.
- **Supabase/Neon connection limits:** Use SQLAlchemy connection pooling in FastAPI. Fallback to local SQLite if free-tier connection limits are hit during the demo.
- **react-leaflet version:** Use `react-leaflet` v4+ (requires Leaflet 1.9+). The map container div must have an explicit CSS height set, otherwise the map will render blank.

## Comments
