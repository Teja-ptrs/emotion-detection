#!/usr/bin/env bash
set -e

echo "=== [1/3] Installing Python Dependencies ==="
pip install -r requirements.txt

echo "=== [2/3] Installing Node Dependencies & Building React Frontend ==="
npm --prefix frontend install
npm --prefix frontend run build

echo "=== [3/3] Verifying Frontend Build Output ==="
if [ ! -f "frontend/dist/index.html" ]; then
    echo "[ERROR] frontend/dist/index.html not found after build!"
    exit 1
fi

echo "[SUCCESS] Frontend build complete. frontend/dist/index.html is ready."
