# MyRush — Production Deployment Guide

All deployment scripts are in `deploy/production/`.

## Prerequisites

1.  **SSH Key**: Set the path in `deploy/production/deploy.conf` (default: `~/.ssh/myrush-prod-ssh.pem`).
2.  **Frontend Build Args**: Edit `deploy/production/.env.prod` with production API URLs.
3.  **Server**: Docker installed on `10.20.8.242`, Nginx configured, backend env at `/opt/env.myrush-api`.

## Usage

### Deploy a single service

```bash
# Backend only
./deploy/production/deploy-backend.sh

# Admin frontend only
./deploy/production/deploy-admin.sh

# User webapp only
./deploy/production/deploy-webapp.sh
```

### Deploy all services

```bash
./deploy/production/deploy-prod.sh
```

## What each script does

1.  **Syncs** the relevant source code to the EC2 via `rsync`.
2.  **Builds** the Docker image natively on the server.
3.  **Stops** the old container and **starts** a new one.

## Port Mapping

| Service | Container Name | Host Port |
|---------|---------------|-----------|
| Backend | `myrush-backend-prod` | 8000 |
| Admin   | `myrush-admin-prod`   | 3001 |
| WebApp  | `myrush-webapp-prod`  | 3002 |

## Verification

```bash
ssh -i ~/.ssh/myrush-prod-ssh.pem ec2-user@10.20.8.242 "docker ps"
```

## Configuration

Edit `deploy/production/deploy.conf` to change:
- `SSH_KEY` — path to your `.pem` file
- `REMOTE_IP` — server IP
- `REMOTE_USER` — SSH user
- `REMOTE_DIR` — deployment directory on server
