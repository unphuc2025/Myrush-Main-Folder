#!/usr/bin/env bash
# ============================================================================
# deploy.sh — Deploy MyRush to EC2 production server
#
# This script:
#   1. Sets up Docker & Docker Compose (if not installed)
#   2. Installs Certbot (if not installed)
#   3. Copies Nginx configs to /etc/nginx/conf.d/
#   4. Provisions SSL certificates (first run only)
#   5. Builds and starts all Docker containers
#
# Usage (run ON the EC2 server from the project root):
#   chmod +x deploy.sh
#   ./deploy.sh           # Full deploy (first time or rebuild)
#   ./deploy.sh --quick   # Restart without rebuilding
#   ./deploy.sh --ssl     # Re-provision SSL certificates
# ============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "============================================"
echo "  MyRush Production Deployment"
echo "  $(date)"
echo "============================================"
echo ""

# --- Check .env ---
if [ ! -f .env ]; then
    err ".env file not found. Run: cp .env.production .env && nano .env"
fi
source .env

ACTION="${1:-deploy}"

# ============================================================================
# 1. System Dependencies
# ============================================================================
install_docker() {
    if command -v docker &>/dev/null; then
        log "Docker already installed: $(docker --version)"
        return
    fi
    warn "Installing Docker..."
    sudo dnf install -y docker
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER"
    log "Docker installed. You may need to log out and back in."
}

install_docker_compose() {
    if docker compose version &>/dev/null; then
        log "Docker Compose already available: $(docker compose version)"
        return
    fi
    warn "Installing Docker Compose plugin..."
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f4)
    sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    log "Docker Compose installed: $(docker compose version)"
}

install_certbot() {
    if command -v certbot &>/dev/null; then
        log "Certbot already installed: $(certbot --version 2>&1)"
        return
    fi
    warn "Installing Certbot..."
    sudo dnf install -y certbot python3-certbot-nginx
    log "Certbot installed."
}

# ============================================================================
# 2. Nginx Configuration
# ============================================================================
setup_nginx() {
    log "Setting up Nginx server blocks..."

    # Create ACME challenge directory
    sudo mkdir -p /var/www/certbot

    # Copy server block configs
    sudo cp docker/nginx/api-staging.myrush.in.conf /etc/nginx/conf.d/api-staging.myrush.in.conf
    sudo cp docker/nginx/admin-staging.myrush.in.conf /etc/nginx/conf.d/admin-staging.myrush.in.conf
    sudo cp docker/nginx/staging.myrush.in.conf /etc/nginx/conf.d/staging.myrush.in.conf

    # Test nginx config
    if sudo nginx -t 2>&1 | grep -q "failed"; then
        warn "Nginx config test failed. SSL certs may not exist yet."
        warn "Installing HTTP-only configs first..."

        # Create temporary HTTP-only configs (no SSL blocks)
        for domain in api-staging.myrush.in admin-staging.myrush.in staging.myrush.in; do
            sudo tee /etc/nginx/conf.d/${domain}.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ${domain}$([ "$domain" = "staging.myrush.in" ] && echo " www-staging.myrush.in" || echo "");

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'MyRush is being configured...';
        add_header Content-Type text/plain;
    }
}
EOF
        done
    fi

    sudo nginx -t && sudo systemctl reload nginx
    log "Nginx configured and reloaded."
}

# ============================================================================
# 3. SSL Certificate Provisioning
# ============================================================================
provision_ssl() {
    EMAIL="${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL in .env}"

    log "Provisioning SSL certificates..."

    # Check if certs already exist
    if [ -d "/etc/letsencrypt/live/myrush.in" ] && [ "$ACTION" != "--ssl" ]; then
        log "SSL certificates already exist. Skipping. (Use --ssl to force renewal)"
        return
    fi

    # Get individual certificates for each domain
    sudo certbot certonly --webroot -w /var/www/certbot \
        --email "${EMAIL}" \
        --agree-tos \
        --no-eff-email \
        -d staging.myrush.in \
        -d www-staging.myrush.in

    sudo certbot certonly --webroot -w /var/www/certbot \
        --email "${EMAIL}" \
        --agree-tos \
        --no-eff-email \
        -d admin-staging.myrush.in

    sudo certbot certonly --webroot -w /var/www/certbot \
        --email "${EMAIL}" \
        --agree-tos \
        --no-eff-email \
        -d api-staging.myrush.in

    log "SSL certificates provisioned!"

    # Now copy the full configs with SSL blocks
    sudo cp docker/nginx/api-staging.myrush.in.conf /etc/nginx/conf.d/api-staging.myrush.in.conf
    sudo cp docker/nginx/admin-staging.myrush.in.conf /etc/nginx/conf.d/admin-staging.myrush.in.conf
    sudo cp docker/nginx/staging.myrush.in.conf /etc/nginx/conf.d/staging.myrush.in.conf

    sudo nginx -t && sudo systemctl reload nginx
    log "Nginx reloaded with SSL configuration."

    # Setup auto-renewal cron
    (sudo crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -
    log "Certbot auto-renewal cron job configured (3 AM daily)."
}

# ============================================================================
# 4. Docker Build & Deploy
# ============================================================================
deploy_containers() {
    if [ "$ACTION" = "--quick" ]; then
        log "Quick restart (no rebuild)..."
        docker compose up -d
    else
        log "Pulling base images..."
        docker compose pull postgres

        log "Building application images..."
        docker compose build --parallel

        log "Starting services..."
        docker compose up -d
    fi

    log "Waiting for health checks..."
    sleep 15

    echo ""
    docker compose ps
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================
case "$ACTION" in
    "--quick")
        deploy_containers
        ;;
    "--ssl")
        provision_ssl
        ;;
    *)
        install_docker
        install_docker_compose
        install_certbot
        setup_nginx
        deploy_containers
        provision_ssl
        ;;
esac

echo ""
echo "============================================"
echo -e "  ${GREEN}✅ Deployment complete!${NC}"
echo "============================================"
echo ""
echo "  🌐 https://staging.myrush.in"
echo "  🌐 https://www-staging.myrush.in"
echo "  🔧 https://admin-staging.myrush.in"
echo "  🔗 https://api-staging.myrush.in"
echo "  📚 https://api-staging.myrush.in/docs"
echo ""
echo "  Logs:    docker compose logs -f"
echo "  Status:  docker compose ps"
echo "============================================"
