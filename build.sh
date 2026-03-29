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
# Find the standalone directory structure
STANDALONE_DIR=".next/standalone"

# Create the static directories
mkdir -p "$STANDALONE_DIR/.next/static"
cp -r .next/static/* "$STANDALONE_DIR/.next/static/"
cp -r public "$STANDALONE_DIR/public" 2>/dev/null || true

echo "=== Standalone contents ==="
ls -la "$STANDALONE_DIR/"
ls -la "$STANDALONE_DIR/.next/" 2>/dev/null || true

cd ..
echo "=== Build complete ==="
