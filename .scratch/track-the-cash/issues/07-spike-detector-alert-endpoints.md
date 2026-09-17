# 07: Spike detector + email alert endpoints

**What to build:** The complaint velocity spike detector and alert pipeline. Implements the detection rule, CRITICAL escalation for cross-state cases, 6-hour email deduplication, `GET /alerts/spike-check`, and `POST /alerts/trigger`. All spike events are logged to the `alerts` table.

**Blocked by:** 03 (complaint data needed to detect spikes), 05 (auth middleware)

**Status:** resolved

- [x] Spike detection rule: `complaint_count_last_6h > 2 × rolling_avg_7day` AND `rolling_avg_7day > 0`
- [x] Severity is `CRITICAL` if the spiking district has active cross-state mule accounts; otherwise `WARNING`
- [x] Email deduplication: no alert email is sent for the same district within a 6-hour window
- [x] Every spike event is written to `alerts` with `district`, `state`, `severity`, `detected_at`, `triggered_by: auto`, `complaint_count`, `rolling_avg`, `cross_state`
- [x] `GET /alerts/spike-check` runs the detector on-demand and returns `{ "spikes": [...] }` with all fields above
- [x] `GET /alerts/spike-check` called twice within 6 hours for the same district returns the spike in the first call but suppresses the email on the second (row still returned, email not sent again)
- [x] `POST /alerts/trigger` (admin only) sends an email immediately and returns `{ "status": "sent", "recipients": [...], "triggered_at": timestamp }`; writes to `alerts` with `triggered_by: manual`
- [x] `POST /alerts/trigger` with a LEA token returns 403
- [x] Spike detector is also scheduled to run every 15 minutes automatically (APScheduler or equivalent inside FastAPI)
- [x] Edge cases: rolling average is zero → no spike; count exactly equals 2× average → no spike; count equals 2× average + 1 → spike fires
- [x] **No Docker** — tests use `httpx.AsyncClient` + `ASGITransport`; SMTP send call is mocked with `unittest.mock`; DB seeded with controlled complaint fixtures in SQLite in-memory; spike detector logic is also tested at the module level (pure Python, no HTTP) for the edge cases above
