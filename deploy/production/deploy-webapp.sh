#!/usr/bin/env bash
# ============================================================================
# deploy-webapp.sh — Build user webapp locally, transfer image to EC2
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/deploy.conf"
source "$SCRIPT_DIR/.env.prod"

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
    if ! docker run --privileged --rm tonistiigi/binfmt --install all > /dev/null 2>&1; then
        warn "Automatic QEMU registration via Docker failed."
        warn "To fix 'exec format error', please run this natively on your host:"
        if command -v dnf >/dev/null 2>&1; then
             warn "  sudo dnf install qemu-user-static && sudo systemctl restart systemd-binfmt"
        elif command -v apt-get >/dev/null 2>&1; then
             warn "  sudo apt-get update && sudo apt-get install -y qemu-user-static"
        fi
    fi
fi

echo "============================================"
echo "  Deploying: User WebApp"
echo "  Target: $REMOTE_IP"
echo "============================================"

log "Building user webapp image locally (linux/amd64)..."
docker buildx build --platform linux/amd64 -t myrush-user-webapp:prod \
    --build-arg VITE_API_URL="${VITE_USER_API_URL}" \
    --build-arg VITE_GEMINI_API_KEY="${VITE_GEMINI_API_KEY}" \
    "$PROJECT_ROOT/myrush_webApp" --load

log "Saving image..."
mkdir -p "$SCRIPT_DIR/temp_images"
docker save myrush-user-webapp:prod | gzip > "$SCRIPT_DIR/temp_images/webapp.tar.gz"

log "Transferring image to $REMOTE_IP..."
ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_IP" "mkdir -p $REMOTE_DIR"
scp $SSH_OPTS "$SCRIPT_DIR/temp_images/webapp.tar.gz" "$REMOTE_USER@$REMOTE_IP:$REMOTE_DIR/"

log "Loading image and starting container on remote..."
ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_IP" << 'REMOTE_EOF'
    cd /home/ec2-user/myrush-prod

    echo "Loading user webapp image..."
    gunzip -c webapp.tar.gz | docker load

    echo "Stopping old webapp container..."
    docker stop myrush-webapp-prod 2>/dev/null || true
    docker rm myrush-webapp-prod 2>/dev/null || true

    echo "Starting user webapp..."
    docker run -d --name myrush-webapp-prod \
        -p 3002:80 \
        --restart unless-stopped \
        myrush-user-webapp:prod

    rm -f webapp.tar.gz

    echo "WebApp container status:"
    docker ps --filter name=myrush-webapp-prod
REMOTE_EOF

rm -rf "$SCRIPT_DIR/temp_images/webapp.tar.gz"
log "User webapp deployed successfully!"
