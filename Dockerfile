# ==========================================
# Stage 1: Build React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Single-Container Python Runtime
# ==========================================
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code and data
COPY backend/ /app/backend/
COPY data/ /app/data/

# Copy built frontend assets from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

# Create runtime directories and make entrypoint executable
RUN mkdir -p /app/models /app/data/cache && chmod +x /app/backend/entrypoint.sh

ENV PYTHONPATH=/app
ENV DATABASE_URL=sqlite:///./track_the_cash.db
ENV APP_BASE_URL=https://track-the-cash.onrender.com
ENV PORT=8000

EXPOSE 8000

ENTRYPOINT ["/app/backend/entrypoint.sh"]
