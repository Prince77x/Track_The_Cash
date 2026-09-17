# 09: Simulation endpoints + demo scenario

**What to build:** `POST /simulation/inject-spike` (scripted 2-stage Rajasthan→UP demo scenario) and `POST /simulation/mode` (switch live stream between random/scripted and control ingestion rate). Both are admin-only.

**Blocked by:** 07 (spike detector and alert pipeline must be in place)

**Status:** resolved

- [x] `POST /simulation/inject-spike { "stage": 1 }` inserts Stage 1 complaint records (Rajasthan origin, UP mule accounts) and fires the spike detector, returning `{ "status": "injected", "stage": 1, "alerts_fired": [...], "affected_atms": [...] }`
- [x] `POST /simulation/inject-spike { "stage": 2 }` inserts Stage 2 records (UP single-state spike) and fires the detector, returning the same shape
- [x] `POST /simulation/inject-spike { "stage": "all" }` runs Stage 1 then Stage 2 in sequence with approximately 60 seconds between stages (or immediately if `fast: true` is passed for test/demo use)
- [x] Stage 1 produces a `CRITICAL` alert (cross-state); Stage 2 produces a `WARNING` alert (single-state)
- [x] After Stage 1 inject, `GET /predict` returns elevated `risk_score` values for UP ATMs
- [x] `POST /simulation/inject-spike` returns 409 if a spike injection is already in progress
- [x] `POST /simulation/mode { "mode": "random" | "scripted", "rate_per_second": float }` updates the live stream config and returns `{ "status": "updated", "mode": ..., "rate_per_second": ... }`
- [x] Both endpoints return 403 with a LEA token; 401 with no token
- [x] **No Docker** — tests use `httpx.AsyncClient` + `ASGITransport`; SMTP mocked; DB seeded in SQLite in-memory; `fast: true` is used in tests to skip the 60-second inter-stage delay
