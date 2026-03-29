#!/usr/bin/env bash
set -e

PORT="${PORT:-10000}"

echo "Starting FastAPI backend on port 8001..."
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8001 &
cd ..

echo "Starting Next.js frontend on port $PORT..."
cd frontend
HOSTNAME="0.0.0.0" PORT="$PORT" INTERNAL_API_URL="http://127.0.0.1:8001" node .next/standalone/frontend/server.js
