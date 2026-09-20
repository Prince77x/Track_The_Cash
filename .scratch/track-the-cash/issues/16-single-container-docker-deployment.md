# 16: Single-container multi-stage Docker build & unified deployment

**What to build:** A unified multi-stage Dockerfile that compiles the React frontend into static assets with Node.js and packages it inside the Python runtime image with FastAPI, SQLite, and ML models. The entire application runs as a single self-contained container listening on port 8000.

**Blocked by:** 14, 15

**Status:** resolved

- [x] Unified root `Dockerfile` uses multi-stage build: Stage 1 (Node) builds React; Stage 2 (Python) bundles backend + static files
- [x] Container startup script (`entrypoint.sh`) initializes SQLite DB, loads ATM data, seeds initial complaints, trains ML model, and starts `uvicorn` on port 8000
- [x] `docker-compose.yml` simplified to a single standalone `app` service exposing port 8000
- [x] Single `docker run -p 8000:8000 track-the-cash` boots the complete frontend + backend + database with zero external dependencies
- [x] README updated with single-container deployment instructions
