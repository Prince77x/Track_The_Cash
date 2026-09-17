# 13: Docker Compose finalization + README

**What to build:** Harden the Docker Compose setup for a clean cold-start demo, wire the React production build into the nginx `frontend` service, and write the README. This is the final "ship it" ticket — the only one that exercises Docker end-to-end.

**Blocked by:** 12 (all features complete)

**Status:** resolved

- [x] React app is built (`npm run build`) and served by nginx in the `frontend` service
- [x] `api` service starts, connects to the database, loads the trained model artefact, and begins the 15-minute spike detector schedule — all on first `docker compose up`
- [x] `ml-runner` service runs the training script once and exits 0; subsequent `docker compose up` skips retraining if the model artefact already exists
- [x] `docker compose up` on a **clean machine** (no pre-pulled images, no pre-existing DB) completes and leaves the full system functional in under 15 minutes
- [x] All sensitive credentials (`JWT_SECRET`, `SMTP_PASSWORD`, `DATABASE_URL`) are read from `.env`; `.env.example` is fully documented
- [x] README documents:
  - Prerequisites (Docker + Docker Compose version)
  - Setup steps (copy `.env.example` → `.env`, fill credentials, `docker compose up`)
  - Demo credentials (`lea_user / lea_pass`, `admin_user / admin_pass`)
  - Architecture diagram (text or Mermaid)
  - 3-minute demo script (login → heatmap → inject spike → alert → admin view → download CSV)
- [x] Port config is documented in README to avoid conflicts on the demo machine
- [x] Full 3-minute demo flow (login → heatmap → spike injection → CRITICAL alert → Admin view → CSV download) is completable without errors on a cold start
- [x] **This is the only ticket that uses Docker** — all prior tickets are tested without containers
