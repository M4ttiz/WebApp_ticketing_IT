# Docker Deployment Guide

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum, 4GB recommended

### Build & Run Locally

```bash
cd c:\MASTER_TICK_TOOL  # or /opt/ticketing

# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access Points
- **Frontend**: http://localhost (proxied through Nginx)
- **Backend API**: http://localhost/api (via Nginx reverse proxy)
- **Direct backend**: http://localhost:5000 (if exposed)

## Services

### Database (PostgreSQL 15)
- **Container**: `ticketing-db`
- **Port**: 5432 (internal only, not exposed)
- **User**: `ticketing_user`
- **Database**: `ticketing_db`
- **Volume**: `db_data` (persistent)

```bash
# Access PostgreSQL CLI
docker-compose exec db psql -U ticketing_user -d ticketing_db

# Backup database
docker-compose exec db pg_dump -U ticketing_user ticketing_db > backup.sql

# Restore database
docker-compose exec -T db psql -U ticketing_user ticketing_db < backup.sql
```

### Backend (Node.js + Express)
- **Container**: `ticketing-backend`
- **Port**: 5000 (internal, proxied by Nginx)
- **Environment**: From `docker-compose.yml` (development mode)
- **Volume**: `./backend/uploads:/usr/src/app/uploads`

```bash
# View backend logs
docker-compose logs -f backend

# SSH into container
docker-compose exec backend bash

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend node prisma/seed.js

# Restart service
docker-compose restart backend
```

### Frontend (React + Vite + Nginx)
- **Container**: `ticketing-frontend`
- **Port**: 80 (HTTP)
- **Volume**: Built `dist` directory served by Nginx

```bash
# View frontend logs
docker-compose logs -f frontend

# Rebuild frontend
docker-compose exec frontend npm run build

# No direct SSH needed (static files only)
```

### Nginx (Reverse Proxy)
- Included in docker-compose as reverse proxy
- Routes `/api/*` → backend:5000
- Routes `/*` → frontend static files
- Uses `frontend/nginx.conf`

## Development Workflow

### With Docker Compose

```bash
# Terminal 1: Start all services
docker-compose up

# Terminal 2: Watch backend logs
docker-compose logs -f backend

# Terminal 3: Watch frontend logs  
docker-compose logs -f frontend

# Make code changes
# Backend: Changes require restart
docker-compose restart backend

# Frontend: Rebuild required
docker-compose exec frontend npm run build
```

### Local Development (No Docker)

If you prefer to develop locally:

```bash
# Backend
cd backend
npm install
npx prisma generate
node src/server.js  # Runs on :5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev  # Runs on :5173 (Vite dev server)

# Update CORS in backend .env
CORS_ORIGIN=http://localhost:5173
```

## Production Deployment

### Pre-Deployment Checklist

1. **Update environment**:
   - Change `NODE_ENV` to `production`
   - Set real `DATABASE_URL`
   - Generate strong JWT secrets
   - Update `APP_URL` and `CORS_ORIGIN` to production domain
   - Configure SMTP settings

2. **Build images**:
   ```bash
   docker build -t ticketing-backend:1.0 ./backend
   docker build -t ticketing-frontend:1.0 ./frontend
   docker tag ticketing-backend:1.0 myregistry.azurecr.io/ticketing-backend:1.0
   docker tag ticketing-frontend:1.0 myregistry.azurecr.io/ticketing-frontend:1.0
   ```

3. **Push to registry**:
   ```bash
   docker push myregistry.azurecr.io/ticketing-backend:1.0
   docker push myregistry.azurecr.io/ticketing-frontend:1.0
   ```

### Single-Server Deployment (Production)

**On Ubuntu server**:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create data directories
sudo mkdir -p /data/postgres /data/uploads
sudo chown 1000:1000 /data/uploads

# Copy docker-compose.yml
sudo mkdir -p /opt/ticketing
sudo cp docker-compose.yml /opt/ticketing/
cd /opt/ticketing

# Update environment
sudo cp .env.example .env
sudo nano .env  # Edit with real values

# Start services
sudo docker-compose up -d

# Verify
sudo docker-compose ps
```

### Kubernetes Deployment (Advanced)

Example `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ticketing-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ticketing-backend
  template:
    metadata:
      labels:
        app: ticketing-backend
    spec:
      containers:
      - name: backend
        image: myregistry.azurecr.io/ticketing-backend:1.0
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ticketing-secrets
              key: database-url
        volumeMounts:
        - name: uploads
          mountPath: /usr/src/app/uploads
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: ticketing-uploads
---
apiVersion: v1
kind: Service
metadata:
  name: ticketing-backend
spec:
  selector:
    app: ticketing-backend
  ports:
  - protocol: TCP
    port: 5000
    targetPort: 5000
```

Deploy:
```bash
kubectl apply -f k8s-deployment.yaml
kubectl set image deployment/ticketing-backend backend=myregistry.azurecr.io/ticketing-backend:1.1
```

## Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs

# Follow logs (streaming)
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since specific time
docker-compose logs --since 10m backend
```

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Frontend
curl http://localhost/

# Check container status
docker-compose ps

# View resource usage
docker stats
```

### Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (data loss!)
docker-compose down -v

# Remove unused images
docker image prune

# Remove all containers, networks, dangling images
docker system prune
```

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache

# Verify ports not in use
netstat -tlnp | grep 5000
netstat -tlnp | grep 80
```

### Database migration fails

```bash
# Check database connection
docker-compose exec backend psql $DATABASE_URL -c "SELECT 1"

# Manually run migration
docker-compose exec backend npx prisma migrate deploy

# Reset database (careful!)
docker-compose exec db psql -U ticketing_user -d ticketing_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose exec backend npx prisma migrate deploy
```

### File upload permissions

```bash
# Check upload directory permissions
ls -la ./backend/uploads

# Fix permissions
sudo chown 1000:1000 ./backend/uploads
sudo chmod 755 ./backend/uploads
```

### Memory/Performance issues

```bash
# Monitor resource usage
docker stats

# Increase limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Volume Persistence

Current docker-compose uses:
- `db_data`: PostgreSQL data (survived container restart)
- `./backend/uploads`: Host-mounted directory (survives restart)

To add volume for logs:
```yaml
services:
  backend:
    volumes:
      - ./logs:/usr/src/app/logs
```

## Environment Variables

Key variables in `docker-compose.yml`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | postgres://user:pass@db:5432/db | DB connection |
| `NODE_ENV` | production | Node environment |
| `PORT` | 5000 | Backend port |
| `POSTGRES_PASSWORD` | example_password | DB password (change!) |

## Backup & Restore

### Backup

```bash
# Backup database only
docker-compose exec db pg_dump -U ticketing_user ticketing_db > ticketing_backup.sql

# Backup uploads
tar -czf uploads_backup.tar.gz ./backend/uploads

# Full backup (compose state)
docker-compose down
tar -czf ticketing_full_backup.tar.gz ./
```

### Restore

```bash
# Restore database
docker-compose exec -T db psql -U ticketing_user ticketing_db < ticketing_backup.sql

# Restore uploads
tar -xzf uploads_backup.tar.gz
```

---

**Last Updated**: 2026-04-23  
**Version**: 1.0
