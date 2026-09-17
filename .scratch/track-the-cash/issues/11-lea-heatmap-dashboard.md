# 11: LEA heatmap dashboard

**What to build:** The full LEA view (`/lea`) — a `react-leaflet` map of India with district boundaries, color-coded ATM risk markers, cross-state icons, clickable popups, and a live alert feed panel. The map auto-refreshes risk data every 60 seconds.

**Blocked by:** 06 (predict + heatmap endpoints), 07 (alert feed data), 10 (login + routing in place)

**Status:** resolved

- [x] Map loads centered on India with district boundary GeoJSON rendered (sourced from datameet/india-district-boundaries)
- [x] ATM markers are color-coded by risk score: green (`< 0.4`), amber (`0.4–0.7`), red (`> 0.7`)
- [x] Cross-state mule flag (`cross_state_flag: true`) renders a distinct icon (e.g. warning triangle overlay) on the marker
- [x] Stale ATM scores (`stale: true`) are rendered with a visual indicator (e.g. greyed border or faded marker)
- [x] Clicking an ATM marker opens a popup showing: ATM ID, risk score, district, bank name, cross-state flag, stale flag
- [x] Alert feed panel (sidebar or bottom strip) shows the latest 10 spike alerts with timestamp, district, and severity
- [x] Map and alert feed auto-refresh every 60 seconds by polling `/predict` and `/alerts/spike-check` — no full page reload
- [x] Map container div has an explicit CSS height set (required for `react-leaflet` to render)
- [x] `react-leaflet` v4+ with Leaflet 1.9+ is used
- [x] **No Docker** — LEA view is verified by manual browser flow against the running FastAPI dev server (no automated E2E container)
