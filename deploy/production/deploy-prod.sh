#!/usr/bin/env bash
# ============================================================================
# deploy-prod.sh — Deploy ALL services (backend + admin + webapp)
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  MyRush Full Production Deploy"
echo "  $(date)"
echo "============================================"

bash "$SCRIPT_DIR/deploy-backend.sh"
bash "$SCRIPT_DIR/deploy-admin.sh"
bash "$SCRIPT_DIR/deploy-webapp.sh"

echo "============================================"
echo "  All services deployed!"
echo "============================================"
