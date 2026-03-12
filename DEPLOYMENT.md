# MyRush — EC2 Staging Deployment Guide

## Architecture

```
Internet (ports 80 & 443 only)
  └─ Host Nginx (Amazon Linux 2023, SSL termination)
       ├─ admin-staging.myrush.in      → localhost:3001 (Docker: admin-frontend)
       ├─ staging.myrush.in / www-staging.myrush.in → localhost:3002 (Docker: user-webapp)
       └─ api-staging.myrush.in        → localhost:8000 (Docker: backend)
                                            └─ Docker: PostgreSQL (5432, localhost-only)
```

**EC2 Instance:** `13.235.225.220`
**SSH Key:** `rush-prod-sshkey.pem.pem`

---

## Step 1: DNS Configuration

Create these **A records** pointing to `13.235.225.220`:

| Type | Name | Value |
|------|------|-------|
| A | `staging.myrush.in` | `13.235.225.220` |
| A | `www-staging.myrush.in` | `13.235.225.220` |
| A | `admin-staging.myrush.in` | `13.235.225.220` |
| A | `api-staging.myrush.in` | `13.235.225.220` |

Verify: `dig +short api-staging.myrush.in` should return `13.235.225.220`

---

## Step 2: EC2 Security Group

Ensure inbound rules allow:

| Port | Protocol | Source |
|------|----------|--------|
| 80 | TCP | 0.0.0.0/0 |
| 443 | TCP | 0.0.0.0/0 |
| 22 | TCP | Your IP |

---

## Step 3: SSH & Deploy

```bash
# SSH into the EC2
ssh -i rush-prod-sshkey.pem.pem ec2-user@13.235.225.220

# Clone the prod branch
cd /home/ec2-user
git clone -b prod <your-repo-url> myrush
cd myrush

# Configure environment
cp .env.production .env
nano .env   # Fill in all your secrets

# Make deploy script executable and run
chmod +x deploy.sh
./deploy.sh
```

The deploy script automatically:
1. Installs Docker & Docker Compose (if needed)
2. Installs Certbot (if needed)
3. Configures Nginx server blocks for all 3 domains
4. Builds and starts Docker containers
5. Provisions Let's Encrypt SSL certificates
6. Sets up auto-renewal cron

---

## Step 4: Verify

```bash
# Check containers
docker compose ps

# Test endpoints
curl https://staging.myrush.in
curl https://admin-staging.myrush.in
curl https://api-staging.myrush.in/health

# View logs
docker compose logs -f
```

---

## Day-to-Day Operations

### Redeploy after code changes

```bash
ssh -i rush-prod-sshkey.pem.pem ec2-user@13.235.225.220
cd /home/ec2-user/myrush
git pull origin prod
./deploy.sh              # Full rebuild
# or
./deploy.sh --quick      # Restart without rebuild
```

### View logs

```bash
docker compose logs -f                 # All services
docker compose logs -f backend         # Backend only
sudo tail -f /var/log/nginx/access.log # Nginx access logs
sudo tail -f /var/log/nginx/error.log  # Nginx error logs
```

### Database operations

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U myrush -d myrush

# Backup
docker compose exec postgres pg_dump -U myrush myrush > backup_$(date +%Y%m%d).sql
```

### Force SSL renewal

```bash
./deploy.sh --ssl
```

---

## Migrating to External PostgreSQL

1. Edit `.env`:
   ```env
   DATABASE_URL=postgresql://user:pass@your-pg-host:5432/myrush
   ```

2. In `docker-compose.yml`, comment out `postgres` service and remove its `depends_on`.

3. Redeploy: `./deploy.sh`

---

## File Structure

```
Myrush-Main-Folder/
├── docker-compose.yml              # Docker services (backend, admin, webapp, postgres)
├── .env.production                 # Environment template
├── deploy.sh                       # EC2 deploy script (Docker + Nginx + SSL)
├── DEPLOYMENT.md                   # This guide
├── docker/
│   └── nginx/
│       ├── api-staging.myrush.in.conf          # Nginx: API backend
│       ├── admin-staging.myrush.in.conf        # Nginx: Admin panel
│       └── staging.myrush.in.conf              # Nginx: User webapp
├── unified-backend/
│   ├── Dockerfile
│   └── .dockerignore
├── Admin_Myrush/myrush-admin-frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
└── myrush_webApp/
    ├── Dockerfile
    ├── nginx.conf
    └── .dockerignore
```
