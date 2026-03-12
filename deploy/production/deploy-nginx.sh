#!/usr/bin/env bash
# ============================================================================
# deploy-nginx.sh — Push nginx configs to EC2
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/deploy.conf"

NGINX_DIR="$SCRIPT_DIR/../nginx"

GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }

echo "============================================"
echo "  Deploying: Nginx Configs"
echo "  Target: $REMOTE_IP"
echo "============================================"

log "Copying nginx configs to server..."
scp $SSH_OPTS \
    "$NGINX_DIR/api-beta.myrush.in.conf" \
    "$NGINX_DIR/admin-beta.myrush.in.conf" \
    "$NGINX_DIR/beta.myrush.in.conf" \
    "$REMOTE_USER@$REMOTE_IP:/tmp/"

log "Installing configs and reloading nginx..."
ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_IP" << 'REMOTE_EOF'
    # Try to find the actual directory for myrush.in certs
    CERT_DIR=$(ls -d /home/ec2-user/.acme.sh/*myrush.in*/ 2>/dev/null | head -n 1)
    
    if [ -z "$CERT_DIR" ]; then
        echo "⚠ Could not find acme.sh directory for myrush.in in /home/ec2-user/.acme.sh/"
        exit 1
    fi
    
    echo "Using certificates from: $CERT_DIR"

    # Update configs with the found path before moving them
    for f in /tmp/api-beta.myrush.in.conf /tmp/admin-beta.myrush.in.conf /tmp/beta.myrush.in.conf; do
        sed -i "s|/home/ec2-user/.acme.sh/myrush.in_ecc/|$CERT_DIR|g" "$f"
    done

    sudo cp /tmp/api-beta.myrush.in.conf /etc/nginx/conf.d/api.myrush.in.conf
    sudo cp /tmp/admin-beta.myrush.in.conf /etc/nginx/conf.d/admin.myrush.in.conf
    sudo cp /tmp/beta.myrush.in.conf /etc/nginx/conf.d/myrush.in.conf
    rm /tmp/*.conf

    echo "Testing nginx config..."
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "Nginx reloaded successfully!"
    else
        echo "⚠ Nginx config test failed! Please check the logs."
        exit 1
    fi

    echo "Setting up SSL auto-rotation cron job..."
    sudo bash -c 'cat > /etc/cron.d/myrush-ssl-rotate << "CRONEOF"
# Auto-rotate SSL via acme.sh as ec2-user every day at midnight
0 0 * * * ec2-user /home/ec2-user/.acme.sh/acme.sh --cron --home /home/ec2-user/.acme.sh > /dev/null 2>&1
# Reload nginx at 00:05 to ensure new certificates take effect
5 0 * * * root systemctl reload nginx > /dev/null 2>&1
CRONEOF'
    sudo chmod 644 /etc/cron.d/myrush-ssl-rotate
    echo "SSL auto-rotation configured in /etc/cron.d/myrush-ssl-rotate"
REMOTE_EOF

log "Nginx configs deployed!"
