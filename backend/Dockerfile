FROM python:3.11-slim

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --default-timeout=1000 --retries 10 -r requirements.txt

# Copy application files
COPY backend/ /app/backend/
COPY data/ /app/data/

# Create models and cache directories
RUN mkdir -p /app/models /app/data/cache && chmod +x /app/backend/entrypoint.sh

ENV PYTHONPATH=/app
EXPOSE 8000

ENTRYPOINT ["/app/backend/entrypoint.sh"]
