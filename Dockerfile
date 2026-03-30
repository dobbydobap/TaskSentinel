# ============================================
# TaskSentinel — Multi-stage Docker Build
# Stage 1: Build Next.js frontend
# Stage 2: Run FastAPI + Next.js standalone
# ============================================

# --- Stage 1: Build frontend ---
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=/api
RUN npm run build

# Copy static assets into standalone
RUN mkdir -p .next/standalone/.next/static && \
    cp -r .next/static/* .next/standalone/.next/static/ && \
    cp -r public .next/standalone/public 2>/dev/null || true

# --- Stage 2: Production runtime ---
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for Next.js standalone server
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy frontend standalone build from stage 1
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend/.next/standalone

# Copy start script
COPY start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 10000

ENV PORT=10000
ENV INTERNAL_API_URL=http://127.0.0.1:8001

CMD ["bash", "start.sh"]
