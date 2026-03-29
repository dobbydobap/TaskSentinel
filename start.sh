#!/usr/bin/env bash
set -e

PORT="${PORT:-10000}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting FastAPI backend on port 8001..."
cd "$PROJECT_DIR/backend"
uvicorn app.main:app --host 127.0.0.1 --port 8001 &

sleep 3

echo "Starting Next.js frontend on port $PORT..."
cd "$PROJECT_DIR/frontend/.next/standalone"

HOSTNAME="0.0.0.0" PORT="$PORT" INTERNAL_API_URL="http://127.0.0.1:8001" \
  node server.js
