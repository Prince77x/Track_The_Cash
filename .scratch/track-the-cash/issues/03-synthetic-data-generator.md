# 03: Synthetic data generator — batch + live mode

**What to build:** A Python CLI (`generate.py`) that seeds all training and simulation data calibrated to I4C statistics. Supports `--mode batch` (30-day offline dataset) and `--mode live` (real-time complaint stream replay). A `--reset` flag wipes and re-seeds cleanly. A `--inject-spike` flag triggers the scripted 2-stage scenario.

**Blocked by:** 01 (DB schema must exist)

**Status:** resolved

- [x] `--mode batch` generates 30 days × 8,000 complaints = ~240,000 records and completes in under 5 minutes
- [x] State distribution across generated complaints matches the top-5 fraud states within ±5% of calibration ratios
- [x] Crime type split is within ±3% of: OTP fraud 45% / ATM card fraud 30% / Investment scam 25%
- [x] At least 20% of generated mule accounts have `is_cross_state = true`
- [x] Weekday complaint count exceeds weekend count by a factor of ≥ 1.2×
- [x] Each complaint's `mule_account_id` references a valid mule account row
- [x] `atm_risk_history` is populated with 30 days of historical risk scores for every ATM district
- [x] `--mode live` streams complaints to the DB at the configured rate (default: 1 per 2 seconds) without errors
- [x] `--reset` wipes and re-seeds all generated tables; running it twice produces the same result
- [x] `--inject-spike` triggers the scripted 2-stage demo scenario (Stage 1: Rajasthan→UP cross-state; Stage 2: UP single-state spike)
- [x] **No Docker** — tests run the generator function directly (not via subprocess/container), seed a SQLite in-memory DB, and assert on record counts and ratio distributions
