#!/bin/sh
set -e

echo "=== [1/4] Initializing Database Schema ==="
python backend/scripts/init_db.py

echo "=== [2/4] Ingesting ATM Locations ==="
python backend/scripts/fetch_atms.py

# echo "=== [3/4] Checking / Generating Synthetic Complaint Data ==="
# python backend/scripts/generate.py --mode batch --days 30

# echo "=== [4/4] Training / Scoring XGBoost Model ==="
# python backend/scripts/train_model.py

echo "=== Starting FastAPI Application Server on 0.0.0.0:8000 ==="
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
