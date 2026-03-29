#!/usr/bin/env bash
set -e

echo "=== Installing backend dependencies ==="
cd backend
pip install -r requirements.txt
cd ..

echo "=== Installing frontend dependencies ==="
cd frontend
npm install

echo "=== Building Next.js ==="
NEXT_PUBLIC_API_URL="/api" npm run build

echo "=== Copying static files to standalone ==="
cp -r public .next/standalone/frontend/public 2>/dev/null || true
cp -r .next/static .next/standalone/frontend/.next/static
cd ..

echo "=== Build complete ==="
