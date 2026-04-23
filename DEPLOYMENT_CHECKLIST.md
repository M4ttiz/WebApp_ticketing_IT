# Deployment Checklist — IT Ticketing System

## Pre-Deployment Verification

### Code Quality ✓
- [x] Backend syntax validation (25 files, 0 errors)
- [x] All Prisma singleton patterns applied
- [x] Security hardening patches applied
- [x] No leftover PrismaClient instantiations
- [ ] Frontend npm install completed
- [ ] Frontend build succeeds without errors

### Security Review ✓
- [x] JWT tokens: 15m access + 7d refresh
- [x] Bcrypt password hashing (12 rounds)
- [x] Helmet.js security headers
- [x] Rate limiting on login (5 attempts/15min)
- [x] CORS properly restricted
- [x] File upload MIME whitelist & size limits
- [x] Upload path validation (no traversal)
- [x] File ownership checks on serve
- [x] Technician view restrictions (own + unassigned)
- [x] Admin-only ticket assignment
- [x] Refresh tokens invalidated on password change
- [x] Temp passwords NOT returned in API responses
- [x] `trust proxy = 1` set for Nginx

### Database Schema ✓
- [x] Prisma schema complete
- [x] All tables defined (Users, Tickets, Messages, History, Attachments, Settings, RefreshTokens)
- [x] Foreign keys & indexes
- [ ] Migration files ready
- [ ] Seed data ready

### Environment Configuration
- [ ] `.env` file with:
  - [ ] DATABASE_URL (PostgreSQL connection)
  - [ ] JWT_ACCESS_SECRET (64+ random chars)
  - [ ] JWT_REFRESH_SECRET (64+ random chars, different from access)
  - [ ] PORT=5000
  - [ ] NODE_ENV=production
  - [ ] APP_URL=https://ticketing.example.com
  - [ ] CORS_ORIGIN=https://ticketing.example.com
  - [ ] SMTP config (configurable via Admin UI after first login)
  - [ ] UPLOAD_DIR=/var/data/uploads (writable by app user)
  - [ ] MAX_FILE_SIZE=10485760 (10MB)

### Deployment Artifacts ✓
- [x] Dockerfile (backend)
- [x] Dockerfile (frontend)
- [x] docker-compose.yml
- [x] nginx/ticketing.conf
- [x] frontend/nginx.conf
- [x] ecosystem.config.js (PM2)
- [x] README.md with deployment instructions
- [x] AUDIT_REPORT.md with findings

### Docker Build & Deploy
- [ ] Build backend image: `docker build -t ticketing-backend ./backend`
- [ ] Build frontend image: `docker build -t ticketing-frontend ./frontend`
- [ ] Test docker-compose: `docker-compose -f docker-compose.yml build`
- [ ] Verify no build errors or warnings

### Ubuntu Server Deployment

#### System Setup
- [ ] OS: Ubuntu 22.04 LTS or 24.04 LTS
- [ ] User: Create non-root app user (`sudo useradd -m -s /bin/bash ticketing`)
- [ ] Firewall: ufw allow OpenSSH, Nginx Full, enable firewall

#### Node.js & PostgreSQL
- [ ] Node.js 18+ installed (via NodeSource)
- [ ] PostgreSQL 14 or 15 installed
- [ ] Create DB user: `sudo -u postgres createuser -P ticketing_user`
- [ ] Create database: `sudo -u postgres createdb -O ticketing_user ticketing_db`
- [ ] Test connection: `psql -U ticketing_user -d ticketing_db`

#### Backend Installation
- [ ] Clone/copy repo to `/opt/ticketing`
- [ ] `cd /opt/ticketing/backend`
- [ ] `npm install --production`
- [ ] `npx prisma generate`
- [ ] `npx prisma migrate deploy`
- [ ] `node prisma/seed.js` (creates default admin)
- [ ] Verify `uploads` directory writable: `chown ticketing:ticketing ./uploads`
- [ ] Test run: `node src/server.js` (should listen on port 5000)
- [ ] Start with PM2: `pm2 start ecosystem.config.js --env production`

#### Frontend Build
- [ ] `cd /opt/ticketing/frontend`
- [ ] `npm install --production`
- [ ] `npm run build`
- [ ] Verify `dist` directory created
- [ ] Copy to Nginx root: `sudo mkdir -p /var/www/ticketing && sudo cp -r dist/* /var/www/ticketing`

#### Nginx Configuration
- [ ] Copy `nginx/ticketing.conf` to `/etc/nginx/sites-available/ticketing`
- [ ] Update domain name in config (replace `ticketing.example.com`)
- [ ] Update backend upstream port if not 5000
- [ ] Create symlink: `sudo ln -s /etc/nginx/sites-available/ticketing /etc/nginx/sites-enabled/`
- [ ] Test Nginx: `sudo nginx -t`
- [ ] Enable on boot: `sudo systemctl enable nginx`
- [ ] Start/reload: `sudo systemctl restart nginx`

#### SSL/TLS (Let's Encrypt)
- [ ] Install Certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Generate certificate: `sudo certbot --nginx -d ticketing.example.com`
- [ ] Verify auto-renewal: `sudo systemctl enable certbot.timer`
- [ ] Test renewal: `sudo certbot renew --dry-run`

#### PM2 Setup
- [ ] Install globally: `sudo npm install -g pm2`
- [ ] Start app: `pm2 start /opt/ticketing/backend/ecosystem.config.js --env production`
- [ ] Generate startup script: `pm2 startup`
- [ ] Save process list: `pm2 save`
- [ ] Verify auto-start on reboot

#### Database Backup
- [ ] Create backup script: `/usr/local/bin/backup_ticketing.sh`
- [ ] Add cron job: `0 2 * * * /usr/local/bin/backup_ticketing.sh` (2 AM daily)
- [ ] Test backup manually

### Initial Admin Setup
- [ ] Server started and accessible
- [ ] Navigate to https://ticketing.example.com
- [ ] Login with:
  - Username: `admin`
  - Password: `Admin@1234` (from seed)
- [ ] **IMMEDIATELY** change admin password
- [ ] Configure SMTP settings in Admin UI (Settings > Email)
- [ ] Test email send (send test email)
- [ ] Create additional users as needed

### Post-Deployment Testing

#### Auth Flows
- [ ] Login with admin → access token returned
- [ ] Refresh endpoint → new token via httpOnly cookie
- [ ] Logout → refresh cookie cleared
- [ ] Password reset email → received with token link
- [ ] Change password → invalidates refresh tokens (forces re-login)

#### Ticket Management
- [ ] Create ticket with attachment → file stored, DB record created
- [ ] Technician views only assigned/unassigned tickets (not others' assigned)
- [ ] Admin assigns ticket → technician can now view
- [ ] Update ticket status → `closedAt` set only on status=closed
- [ ] Search/filter tickets → works correctly

#### File Uploads
- [ ] Authorize upload (only ticket owner/admin/assignee)
- [ ] Upload file → stored in `uploads` dir, DB record created
- [ ] Download file → correct file served
- [ ] Try unauthorized download → 403 Forbidden
- [ ] Try path traversal → blocked

#### Dashboard & Reporting
- [ ] Dashboard loads charts
- [ ] Stats endpoint returns expected counts
- [ ] Export reports (if implemented)

#### Email Service
- [ ] User creation → welcome email sent
- [ ] Password reset → reset token email sent
- [ ] Ticket assignment → notification email sent
- [ ] Admin settings → can update SMTP config and test

### Performance & Monitoring

#### Database Performance
- [ ] Verify indexes created (check Prisma schema)
- [ ] Monitor slow queries: `postgres slow query log`
- [ ] Consider PgBouncer if connection pooling needed

#### Logs & Monitoring
- [ ] PM2 logs accessible: `pm2 logs`
- [ ] Nginx logs: `/var/log/nginx/access.log` and `error.log`
- [ ] Application logs (add structured logging later)
- [ ] Set up error tracking (Sentry) - optional but recommended

#### Rate Limiting & Security
- [ ] Test login rate limit (>5 attempts → 429 Too Many Requests)
- [ ] Verify CORS blocks unauthorized origins
- [ ] Check security headers: `curl -I https://ticketing.example.com`
  - Should see: Strict-Transport-Security, X-Content-Type-Options, etc.

### DNS & Availability
- [ ] DNS record points to server IP
- [ ] HTTPS certificate valid (no warnings)
- [ ] Availability monitor (uptime check) configured
- [ ] Server reboot test → app auto-starts

### Documentation
- [ ] README reviewed and updated
- [ ] API endpoints documented (optional: Swagger/OpenAPI)
- [ ] Deployment runbook created
- [ ] Emergency contact information available
- [ ] Backup/restore procedures documented

## Post-Deployment Maintenance

### Weekly
- [ ] Monitor PM2 logs for errors
- [ ] Check disk space (especially `uploads` dir)
- [ ] Verify backups completed

### Monthly
- [ ] Review user access logs
- [ ] Check SSL certificate expiration
- [ ] Test backup restoration
- [ ] Review database size & plan growth

### Quarterly
- [ ] Security audit (dependencies, secrets rotation)
- [ ] Performance review & optimization
- [ ] Update to latest Node.js/PostgreSQL patch versions

### Annually
- [ ] Full system upgrade test
- [ ] Disaster recovery drill
- [ ] Security assessment & penetration testing

---

**Checklist Version**: 1.0  
**Last Updated**: 2026-04-23  
**Status**: Ready for deployment
