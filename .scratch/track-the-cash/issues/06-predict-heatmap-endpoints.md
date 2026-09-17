# 06: Predict + heatmap API endpoints

**What to build:** `GET /predict` and `GET /heatmap` — the two endpoints that power the LEA map. `/predict` returns a ranked ATM risk list from the `predictions` table. `/heatmap` transforms that list into a valid GeoJSON FeatureCollection for Leaflet.

**Blocked by:** 04 (predictions must exist in DB), 05 (auth middleware must be in place)

**Status:** resolved

- [x] `GET /predict` returns `{ "predictions": [...], "generated_at": timestamp }` where each prediction has `atm_id`, `lat`, `lng`, `risk_score`, `district`, `state`, `bank_name`, `cross_state_flag`, `stale` (bool)
- [x] Results are sorted by `risk_score` descending
- [x] Optional `?state=` query param filters results to that state only
- [x] Optional `?limit=` param (default 50) caps the result list
- [x] Risk scores older than 24 hours have `stale: true` in the response
- [x] `GET /heatmap` returns a valid GeoJSON FeatureCollection where every feature is a Point with `risk_score` and `severity` (`low` / `medium` / `high`) in properties
- [x] Severity thresholds: `risk_score < 0.4` → `low`; `0.4–0.7` → `medium`; `> 0.7` → `high`
- [x] Both endpoints return 401 without a valid token
- [x] Both endpoints respond within p95 < 300ms under normal load (assert via response timing in tests)
- [x] **No Docker** — tests use `httpx.AsyncClient` + `ASGITransport`; DB is seeded with fixture prediction rows in SQLite in-memory before each test
