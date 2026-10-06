# ==============================================================================
# DIGITAL MINE SAFETY OFFICER - UNIFIED PRODUCTION DOCKERFILE
# Multi-stage build: React 19 Frontend + FastAPI Backend
# ==============================================================================

# Stage 1: Build React 19 Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Static Asset Serving
FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-builder /frontend/dist ./static

RUN mkdir -p /app/storage /app/vectorstore
ENV DB_PATH="/app/storage/rag_cache.db"

EXPOSE 8000 7860

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
