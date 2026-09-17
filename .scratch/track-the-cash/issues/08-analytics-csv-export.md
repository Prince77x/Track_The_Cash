# 08: Analytics + CSV export endpoints

**What to build:** `GET /analytics/velocity` (complaint velocity trend chart data for the Admin dashboard) and `GET /reports/export` (CSV download of current ATM risk predictions). Both are admin-only.

**Blocked by:** 03 (complaint data for velocity), 05 (auth middleware)

**Status:** resolved

- [x] `GET /analytics/velocity` returns `{ "trend": [{ "date", "state", "complaint_count" }] }` for the last 7 days across the top 5 fraud states
- [x] Optional `?days=` param overrides the 7-day window (default 7)
- [x] Optional `?states=` param accepts a comma-separated list of states (default: top 5 by complaint volume)
- [x] `GET /analytics/velocity` with a LEA token returns 403
- [x] `GET /reports/export` returns a CSV file with `Content-Disposition: attachment; filename="predictions.csv"`
- [x] CSV includes columns: `atm_id`, `lat`, `lng`, `district`, `state`, `bank_name`, `risk_score`, `predicted_at`, `cross_state_flag`, `stale`
- [x] `GET /reports/export` with a LEA token returns 403
- [x] Both endpoints return 401 without any token
- [x] **No Docker** — tests use `httpx.AsyncClient` + `ASGITransport`; DB seeded with fixture complaint rows and prediction rows in SQLite in-memory; CSV content is asserted on the response body bytes
