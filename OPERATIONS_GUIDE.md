# Operational & Maintenance Guide

## System Overview

**IT Ticketing System** — Self-hosted Node.js + PostgreSQL stack  
**Tech Stack**: Express.js, Prisma ORM, React + Vite, Nginx  
**Infrastructure**: Ubuntu 22.04+ LTS (single-server deployment)

## Monitoring & Alerting

### Essential Metrics

#### Application Health
- PM2 process status: `pm2 status`
- Memory usage: `pm2 monit`
- CPU utilization by process
- Restart count (indicates crashes): should be 0 or increasing slowly

#### Database
- Connection pool exhaustion (Prisma logs)
- Slow query log (PostgreSQL)
- Disk space on DB partition
- Backup success/failure logs

#### System
- Disk utilization (especially `/` and `/var` for logs)
- Memory available
- CPU load
- Network I/O

### Recommended Monitoring Stack

**Option 1: Lightweight (PM2 + Prometheus)**
```bash
npm install -D pm2-auto-pull
pm2 start ecosystem.config.js
pm2 install pm2-prometheus  # Exposes metrics on :9090
```

**Option 2: Full Stack (Sentry + Datadog/New Relic)**
```bash
# Backend
npm install @sentry/node
```
Then configure in `src/server.js`:
```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());
```

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| App restart count | >2/hr | Check PM2 logs, check for OOM |
| Memory usage | >80% | Scale up instance, optimize queries |
| CPU usage | >80% sustained | Optimize slow queries, add indexing |
| Disk usage | >85% | Free up space (old logs, uploads), add storage |
| Response time (p95) | >2s | Identify slow endpoints, optimize DB |
| Error rate | >1% | Review error logs, check integrations |
| DB connections | >80% of max | Increase connection pool, add PgBouncer |

## Log Management

### Log Locations

| Source | Path | Retention |
|--------|------|-----------|
| PM2 application logs | `~/.pm2/logs/` | Keep 7 days (rotate) |
| Nginx access | `/var/log/nginx/access.log` | Rotate weekly (logrotate) |
| Nginx errors | `/var/log/nginx/error.log` | Rotate on-size (10MB) |
| PostgreSQL | `/var/log/postgresql/` | Rotate by system |
| Systemd logs | `journalctl` | Rotate by system |

### Logrotate Configuration

Create `/etc/logrotate.d/ticketing`:
```
/var/log/nginx/ticketing*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        nginx -s reload > /dev/null 2>&1 || true
    endscript
}

/home/ticketing/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
}
```

### Structured Logging (Future Enhancement)

Add to `src/server.js`:
```javascript
const logger = require('pino')({
    level: process.env.LOG_LEVEL || 'info',
});

app.use(require('pino-http')({ logger }));
```

## Database Maintenance

### Backups

**Daily backup script** (`/usr/local/bin/backup_ticketing.sh`):
```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups/ticketing"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="ticketing_db"
DB_USER="ticketing_user"

# Create backup
pg_dump -U ${DB_USER} -d ${DB_NAME} --format=custom --file="${BACKUP_DIR}/ticketing_${TIMESTAMP}.dump"

# Keep last 30 days
find ${BACKUP_DIR} -name "ticketing_*.dump" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "${BACKUP_DIR}/ticketing_${TIMESTAMP}.dump" s3://my-backup-bucket/

echo "Backup completed: ticketing_${TIMESTAMP}.dump"
```

**Setup cron job**:
```bash
0 2 * * * /usr/local/bin/backup_ticketing.sh >> /var/log/ticketing_backup.log 2>&1
```

**Restore from backup**:
```bash
pg_restore -U ticketing_user -d ticketing_db /backups/ticketing/ticketing_20260423_020000.dump
```

### Maintenance Tasks

**Daily**:
- Check PM2 status
- Review error logs
- Verify backups

**Weekly**:
- `VACUUM ANALYZE;` on PostgreSQL (or enable autovacuum)
- Disk usage check
- Certificate expiration check (`certbot certificates`)

**Monthly**:
- Analyze slow queries (PostgreSQL slow_query_log)
- Review user login patterns
- Archive old logs
- Test backup restoration

**Quarterly**:
- PostgreSQL reindex (if needed)
- Major dependency updates (npm audit)
- SSL certificate renewal test

### PostgreSQL Performance

**Enable slow query log**:
```sql
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries >1s
SELECT pg_reload_conf();
```

**View slow queries**:
```bash
sudo tail -f /var/log/postgresql/postgresql.log | grep "duration:"
```

**Optimize indexes**:
```sql
-- Check for missing indexes
SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0;

-- Rebuild indexes (if fragmented)
REINDEX DATABASE ticketing_db;
```

## Common Issues & Troubleshooting

### App won't start

1. Check PM2 logs: `pm2 logs`
2. Check database connection: `psql -U ticketing_user -d ticketing_db`
3. Check `.env` file (missing/incorrect vars)
4. Check file permissions: `ls -la /opt/ticketing/`
5. Manually test: `cd /opt/ticketing/backend && node src/server.js`

### High CPU/Memory Usage

1. Check slow queries: `SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;`
2. Check PM2 process: `pm2 monit`
3. Kill hanging connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'ticketing_db';`
4. Restart app: `pm2 restart all`

### Database Connection Issues

1. Check connection pool: `SELECT count(*) FROM pg_stat_activity WHERE datname = 'ticketing_db';`
2. Restart app to reset connection pool
3. Consider adding PgBouncer for connection pooling

### Nginx 502 Bad Gateway

1. Check backend running: `pm2 status`
2. Check backend port: `netstat -tlnp | grep 5000`
3. Check Nginx config: `nginx -t`
4. Restart Nginx: `sudo systemctl restart nginx`

### SSL Certificate Issues

1. Check expiration: `sudo certbot certificates`
2. Manual renewal: `sudo certbot renew --force-renewal`
3. Check Nginx config references correct cert paths

## Scaling & Performance

### Single-Server Optimization

1. **Database Connection Pooling**:
   ```bash
   sudo apt install pgbouncer
   # Configure in /etc/pgbouncer/pgbouncer.ini
   ```

2. **Redis Caching (optional)**:
   ```bash
   npm install redis
   # Cache dashboard stats, session data
   ```

3. **CDN for Static Files** (optional):
   - Serve frontend from CloudFront/Cloudflare
   - Serve uploads from S3 + CloudFront

4. **Database Query Optimization**:
   - Add `.include()` or `.select()` to Prisma queries
   - Avoid N+1 queries (use `include` for related data)
   - Index frequently queried columns

### Multi-Server Scaling (Future)

1. **Separate Backend & Database**:
   - App server: Node.js on c5.xlarge
   - Database: RDS PostgreSQL on db.r5.large

2. **Load Balancer**:
   - AWS ALB or HAProxy
   - Health check endpoint: `GET /health`

3. **Session Storage**:
   - Move refresh tokens to Redis
   - Share session state across instances

## Security Hardening

### Regular Tasks

- **Dependency updates**: `npm audit fix` (monthly)
- **Secret rotation**: Rotate JWT secrets annually
- **Access reviews**: Audit user permissions quarterly
- **SSL certificate renewal**: Automatic (Certbot) but verify monthly
- **Firewall rules**: Review ufw rules quarterly

### Additional Hardening

```bash
# Enable UFW logging
sudo ufw logging on

# Monitor login attempts
sudo tail -f /var/log/auth.log | grep "ticketing"

# Check active connections
sudo netstat -tlnp

# Review sudo usage
sudo journalctl -u sudo
```

### Secrets Management (Recommended)

Instead of `.env` file, use:
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **1Password Business** (self-hosted)

## Incident Response

### Critical Issue (App Down)

1. Assess: `pm2 status` + ping database
2. Restart: `pm2 restart all`
3. If still down, restore from backup:
   ```bash
   pg_restore -U ticketing_user -d ticketing_db /backups/latest.dump
   ```
4. Document incident

### Data Corruption

1. Stop app: `pm2 stop all`
2. Restore from backup: `pg_restore -d ticketing_db /backups/ticketing_YYYYMMDD_HHMMSS.dump`
3. Verify data integrity
4. Restart app: `pm2 start all`

### Security Incident (Breach Suspected)

1. **Immediate**:
   - Rotate all secrets (JWT, SMTP password, DB password)
   - Review access logs for anomalies
   - Reset admin password

2. **Short-term**:
   - Apply security patches
   - Update dependencies
   - Enable audit logging

3. **Follow-up**:
   - Conduct security audit
   - Consider penetration testing
   - Implement additional monitoring

## Upgrade Procedures

### Node.js Update

```bash
# Test in staging first
node --version  # Current
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -  # New version
sudo apt install -y nodejs
node --version  # Verify
pm2 restart all
```

### PostgreSQL Update

```bash
# Create backup before upgrading
pg_dumpall > /backups/ticketing_pre_upgrade.sql

# Upgrade
sudo apt update && sudo apt upgrade postgresql-*

# Verify
sudo -u postgres psql -d ticketing_db -c "SELECT version();"
```

### Application Update

```bash
# Create backup
/usr/local/bin/backup_ticketing.sh

# Pull new code
cd /opt/ticketing
git pull origin main  # or copy new files

# Install & migrate
cd backend
npm install --production
npx prisma migrate deploy

# Rebuild frontend
cd ../frontend
npm install --production
npm run build
sudo cp -r dist/* /var/www/ticketing

# Restart
pm2 restart all
```

## Support & Documentation

- **Internal Wiki**: Keep RunBook with passwords (encrypted)
- **Alert Escalation**: Define who to contact on-call
- **Disaster Recovery Plan**: Document RTO/RPO targets
- **Change Log**: Track all deployments & configuration changes

---

**Last Updated**: 2026-04-23  
**Version**: 1.0
