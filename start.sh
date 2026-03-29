#!/usr/bin/env bash
set -e

PORT="${PORT:-10000}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting FastAPI backend on port 8001..."
cd "$PROJECT_DIR/backend"
uvicorn app.main:app --host 127.0.0.1 --port 8001 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

echo "Starting Next.js frontend on port $PORT..."
cd "$PROJECT_DIR/frontend"

# Find the standalone server.js
if [ -f ".next/standalone/frontend/server.js" ]; then
  HOSTNAME="0.0.0.0" PORT="$PORT" INTERNAL_API_URL="http://127.0.0.1:8001" \
    node .next/standalone/frontend/server.js
elif [ -f ".next/standalone/server.js" ]; then
  HOSTNAME="0.0.0.0" PORT="$PORT" INTERNAL_API_URL="http://127.0.0.1:8001" \
    node .next/standalone/server.js
else
  echo "ERROR: Next.js standalone server not found!"
  echo "Contents of .next/standalone/:"
  ls -la .next/standalone/ 2>/dev/null || echo "Directory not found"
  ls -la .next/standalone/frontend/ 2>/dev/null || echo "frontend/ not found"
  # Fallback: just keep the backend running
  wait $BACKEND_PID
fi
