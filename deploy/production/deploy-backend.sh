#!/usr/bin/env bash
# ============================================================================
# deploy-backend.sh — Build backend locally, transfer image to EC2
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/deploy.conf"

PROJECT_ROOT="$SCRIPT_DIR/../.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# --- Architecture Check & QEMU Initialization ---
if [[ "$(uname -m)" == "aarch64" || "$(uname -m)" == "arm64" ]]; then
    log "ARM architecture detected. Ensuring QEMU registration for linux/amd64..."
    # Try the multi-arch binfmt first
    if ! docker run --privileged --rm tonistiigi/binfmt --install all > /dev/null 2>&1; then
        warn "Automatic QEMU registration via Docker failed."
        warn "To fix 'exec format error', please run this natively on your host:"
        if command -v dnf >/dev/null 2>&1; then
             warn "  sudo dnf install qemu-user-static && sudo systemctl restart systemd-binfmt"
        elif command -v apt-get >/dev/null 2>&1; then
             warn "  sudo apt-get update && sudo apt-get install -y qemu-user-static"
        else
             warn "  Install 'qemu-user-static' via your package manager."
        fi
    fi
fi

echo "============================================"
echo "  Deploying: Backend (unified-backend)"
echo "  Target: $REMOTE_IP"
echo "  Strategy: Remote Build on EC2"
echo "============================================"

log "Syncing backend code to remote server for native build..."
rsync -avz -e "ssh $SSH_OPTS" --exclude 'venv' --exclude '__pycache__' "$PROJECT_ROOT/unified-backend/" "$REMOTE_USER@$REMOTE_IP:/tmp/unified-backend/"

log "Building and restarting backend on remote server..."
ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_IP" << 'REMOTE_EOF'
    echo "Building backend image natively on EC2..."
    cd /tmp/unified-backend
    docker build -t myrush-backend:prod .

    echo "Stopping old backend container..."
    docker stop myrush-backend-prod 2>/dev/null || true
    docker rm myrush-backend-prod 2>/dev/null || true

    echo "Starting backend..."
    docker run -d --name myrush-backend-prod \
        -p 8000:8000 \
        --restart unless-stopped \
        --env-file /opt/env.myrush-api \
        myrush-backend:prod

    echo "Cleaning up source..."
    rm -rf /tmp/unified-backend

    echo "Backend container status:"
    docker ps --filter name=myrush-backend-prod
REMOTE_EOF

log "Backend deployed successfully!"
