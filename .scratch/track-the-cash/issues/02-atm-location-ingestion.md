# 02: ATM location ingestion (OSM Overpass)

**What to build:** A Python script that fetches real Indian ATM coordinates from the OpenStreetMap Overpass API for the top 10 high-fraud states and populates the `atm_locations` table. Re-running the script never creates duplicates.

**Blocked by:** 01 (DB schema must exist)

**Status:** resolved

- [x] Script queries the Overpass API for ATM nodes across the top 10 high-fraud states (UP, Maharashtra, Rajasthan, Telangana, Karnataka, Delhi, West Bengal, Bihar, Madhya Pradesh, Gujarat)
- [x] At least 1,000 ATM records are stored in `atm_locations`
- [x] Every stored record has valid non-null values for `atm_id`, `lat`, `lng`, `state`, and `district`
- [x] `bank_name` is populated where OSM provides it; null otherwise
- [x] Script is idempotent — running it twice does not create duplicate rows (use upsert on `atm_id`)
- [x] Script completes without error on a clean database
- [x] **No Docker** — the script runs directly against the local dev database; Overpass API is called once and the result is cached/seeded; tests that verify record shape mock the HTTP call and assert on DB state
