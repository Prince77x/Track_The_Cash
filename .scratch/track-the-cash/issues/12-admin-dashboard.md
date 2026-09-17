# 12: Admin dashboard

**What to build:** The full Admin view (`/admin`) — complaint velocity trend chart, cross-state mule flow arrows on the map, model metrics panel, manual "Send Alert" button, "Inject Spike" demo button, and CSV report download.

**Blocked by:** 08 (analytics + export endpoints), 09 (simulation endpoints), 11 (LEA view complete — shared map component reused)

**Status:** resolved

- [x] Complaint velocity trend chart shows the last 7 days of complaint counts broken down by the top 5 fraud states (data from `GET /analytics/velocity`)
- [x] Cross-state mule flow patterns are shown as directional arrow overlays on the map (origin state centroid → mule account registered state centroid)
- [x] Model performance metrics panel shows current ROC-AUC and Precision@10 values (sourced from the trained model artefact metadata or a dedicated API field)
- [x] "Send Alert" button opens a form (district, severity dropdown, message); on submit calls `POST /alerts/trigger`; shows success confirmation or error message
- [x] "Inject Spike" button calls `POST /simulation/inject-spike { "stage": "all" }`; map updates within 60 seconds showing elevated UP ATM scores and CRITICAL alert in the feed
- [x] "Download Report" button calls `GET /reports/export` and triggers a CSV file download in the browser
- [x] Admin can switch to the LEA map view without logging out
- [x] All admin actions that fail (SMTP error, 5xx) show a clear inline error — no silent failures
- [x] **No Docker** — Admin view is verified by manual browser flow against the running FastAPI dev server
