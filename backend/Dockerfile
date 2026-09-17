FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY data/ /app/data/

ENV PYTHONPATH=/app
EXPOSE 8000

CMD ["sh", "-c", "python backend/scripts/init_db.py && python backend/scripts/fetch_atms.py && python backend/scripts/generate.py --mode batch --days 30 && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"]
