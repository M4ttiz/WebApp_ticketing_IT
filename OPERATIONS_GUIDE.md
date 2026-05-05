# IT Ticketing Bible - Operations, Troubleshooting, and Runbook

This document is the operational reference for the entire ticketing platform:
architecture, key files, deployment, Docker/runtime diagnostics, database and
attachments, CIFS shared storage, incident response, and CLI recovery playbooks.

Use this as first-line documentation for administrators and maintainers.

---

## 1) Platform Overview

### 1.1 Components

- **Frontend** (`frontend/`): React + Vite SPA served on port 80 via container.
- **Backend** (`backend/`): Node.js + Express API on port 5000.
- **Database** (`db` service): PostgreSQL 15.
- **File storage for attachments**: backend writes in `/usr/src/app/uploads`.
  This path must be bind-mounted to persistent host storage (local disk or CIFS share).

### 1.2 End-to-End request flow

1. User action in browser.
2. Frontend calls backend API (`/api/...`).
3. Backend validates auth/role and business rules.
4. Backend persists metadata in PostgreSQL.
5. If files are involved, backend stores binary file in uploads mount.
6. Response returned to frontend.

---

## 2) Repository Map (What Files Do)

### 2.1 Root-level files

- `docker-compose.yml`: main runtime topology (db, backend, frontend), env vars, ports, volumes.
- `README.md`: high-level project overview and quickstart.
- `DOCKER_DEPLOYMENT_GUIDE.md`: deployment walkthrough.
- `DEPLOYMENT_CHECKLIST.md`: production readiness checklist.
- `OPERATIONS_GUIDE.md` (this file): complete runbook.

### 2.2 Backend files

- `backend/src/server.js`
  - starts Express app
  - registers middleware (cors, helmet, parsers, auth routes)
  - mounts API routes
  - global error handler
- `backend/src/routes/*.js`
  - route declarations and request validation bindings
- `backend/src/controllers/*.js`
  - business logic implementation
- `backend/src/middleware/upload.js`
  - multer setup: accepted MIME types, size limits, destination
- `backend/src/lib/prisma.js`
  - Prisma client instance
- `backend/prisma/schema.prisma`
  - data model and enums
- `backend/prisma/migrations/`
  - schema migration history

### 2.3 Frontend files

- `frontend/src/App.jsx`
  - routes and role-guarded access
- `frontend/src/api/axios.js`
  - shared HTTP client behavior (auth/cookies/interceptors)
- `frontend/src/pages/*.jsx`
  - user-facing pages (dashboard, tickets, detail, inventory...)
- `frontend/src/components/*.jsx`
  - reusable UI blocks
- `frontend/src/lib/utils.js`
  - UI tokens (`ui.page`, `ui.cardSection`, etc.)

---

## 3) Runtime Topology and Important Paths

### 3.1 Standard Docker paths

- Backend container app root: `/usr/src/app`
- Backend attachment path: `/usr/src/app/uploads`
- Host mount target for attachments (recommended): `/mnt/ticketing_uploads`

### 3.2 Data persistence strategy

- DB persistence through Docker volume (`db_data`).
- Attachments persistence through bind mount:
  - local disk (`./backend/uploads`) OR
  - network share mount (`/mnt/ticketing_uploads`) preferred in production.

---

## 4) Daily Ops - Essential Commands

```bash
# service state
docker compose ps

# live logs
docker compose logs -f --tail=100 backend
docker compose logs -f --tail=100 frontend
docker compose logs -f --tail=100 db

# image/container resource snapshot
docker stats

# git branch/deploy state
git branch --show-current
git status -sb
git log --oneline -5
```

---

## 5) Deployment Runbook (Ubuntu + Docker)

```bash
cd /home/it/WebApp_ticketing_IT

git fetch origin
git checkout <branch-name>
git pull --ff-only

docker compose down
docker compose up -d --build

docker compose ps
docker compose logs -f --tail=100 backend
```

If frontend build-time env changed (e.g. `VITE_API_URL`), use:

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

---

## 6) Attachments and Shared Storage (CIFS)

### 6.1 Objective

Store uploaded files on `\\einstein\tool ticketing` by mounting it on Ubuntu and binding into backend container.

### 6.2 Secure credential storage (server-side only)

Create `/etc/samba/ticketing-cred`:

```ini
username=<username>
password=<password>
domain=<domain>
```

Protect it:

```bash
sudo chmod 600 /etc/samba/ticketing-cred
```

### 6.3 `/etc/fstab` entry for persistent mount

```fstab
//einstein/tool\040ticketing /mnt/ticketing_uploads cifs credentials=/etc/samba/ticketing-cred,iocharset=utf8,vers=3.0,uid=1000,gid=1000,file_mode=0664,dir_mode=0775,_netdev,nofail,x-systemd.automount 0 0
```

Apply and verify:

```bash
sudo systemctl daemon-reload
sudo mount -a
findmnt /mnt/ticketing_uploads
```

### 6.4 Docker volume mapping (critical)

In `docker-compose.yml` backend service:

```yaml
volumes:
  - /mnt/ticketing_uploads:/usr/src/app/uploads
```

Then restart:

```bash
docker compose down
docker compose up -d --build
```

Confirm runtime mount:

```bash
docker inspect "$(docker compose ps -q backend)" --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Expected:

```text
/mnt/ticketing_uploads -> /usr/src/app/uploads
```

### 6.5 Quick write test

```bash
docker compose exec backend sh -lc 'echo "test-$(date +%s)" > /usr/src/app/uploads/_mount_test.txt'
ls -la /mnt/ticketing_uploads | tail -n 5
```

If `_mount_test.txt` is visible in `/mnt/ticketing_uploads`, storage path is correct.

---

## 7) Most Common Issues and CLI Fixes

Ordered from simple/common to specific/advanced.

### 7.1 Containers keep restarting

Symptoms:
- `docker compose ps` shows `Restarting`.

Checks:

```bash
docker compose logs --tail=200 backend
docker compose logs --tail=200 db
```

Likely causes:
- invalid env var
- DB connection failure
- missing migration
- syntax/runtime error in app

Fix:

```bash
docker compose down
docker compose up -d --build
```

If still failing: inspect exact stack trace in logs and fix source/env.

### 7.2 Upload works but file is not visible in share

Likely cause:
- wrong volume destination typo (example seen in production: `/usr/src/app/uploads1~`).

Checks:

```bash
grep -n "uploads" docker-compose.yml
docker inspect "$(docker compose ps -q backend)" --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Fix destination to exact `/usr/src/app/uploads`, restart containers.

### 7.3 Clicking attachment returns "Token di accesso mancante"

Cause:
- protected endpoint hit via direct link (without auth headers/cookies in expected way).

Fix pattern:
- open attachment through authenticated API request (`axios` + `responseType: blob`)
  and then open/download blob URL in browser.

### 7.4 Attachment opens with protocol/domain mismatch errors

Symptoms:
- mixed `http`/`https`
- unsafe frame load

Fix:
- align all URLs and env vars to one scheme (prefer HTTPS in production):
  - backend `APP_URL`
  - frontend build arg `VITE_API_URL`
  - reverse proxy configuration

### 7.5 DB migrations fail during deploy

```bash
docker compose exec backend npx prisma migrate status
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma generate
```

### 7.6 API up but UI stale/old behavior

Cause:
- old frontend image/cache.

Fix:

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

Hard-refresh browser after deployment.

### 7.7 502 Bad Gateway (if using host Nginx/proxy)

Checks:

```bash
docker compose ps
docker compose logs --tail=100 backend
sudo nginx -t
sudo systemctl status nginx
```

### 7.8 Disk usage growing quickly

Check:

```bash
df -h
docker system df
du -sh /mnt/ticketing_uploads
```

Clean-up cautiously:

```bash
docker image prune -f
docker container prune -f
docker builder prune -f
```

Do not prune volumes unless you understand data impact.

---

## 8) Database Backup and Restore

### 8.1 Backup

```bash
docker compose exec db pg_dump -U ticketing_user -d ticketing_db > "ticketing_$(date +%F_%H%M).sql"
```

### 8.2 Restore

```bash
docker compose exec -T db psql -U ticketing_user -d ticketing_db < ticketing_2026-05-05_0200.sql
```

### 8.3 Backup uploads

```bash
tar -czf "uploads_$(date +%F_%H%M).tar.gz" /mnt/ticketing_uploads
```

---

## 9) Incident Response Playbooks

### 9.1 P1 - App down

1. Check service status.
2. Check backend/db logs.
3. Restart stack.
4. Validate health endpoint/login.
5. If unresolved, rollback to previous commit/image.

Commands:

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 db
docker compose down && docker compose up -d --build
```

### 9.2 P1 - Data path/storage outage

1. Verify share mount.
2. Verify backend mount mapping.
3. Test write from container to uploads path.
4. If share unavailable, choose temporary local fallback mount.

Commands:

```bash
findmnt /mnt/ticketing_uploads
docker inspect "$(docker compose ps -q backend)" --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
docker compose exec backend sh -lc 'touch /usr/src/app/uploads/_probe.txt && ls -la /usr/src/app/uploads | tail -n 5'
```

### 9.3 P1 - Suspected security compromise

Immediate:
- rotate JWT/DB/SMTP/share secrets
- invalidate active sessions if supported
- review access logs and suspicious requests
- preserve logs for investigation

---

## 10) Security and Secret Management

- Never store passwords in git-tracked files.
- Store CIFS credentials in `/etc/samba/ticketing-cred` with `chmod 600`.
- Prefer HTTPS end-to-end in production.
- Rotate secrets periodically and after any accidental exposure.
- Keep role permissions audited (admin/technician/user/viewer).

---

## 11) Operator Checklist (Daily/Weekly/Monthly)

### Daily
- `docker compose ps`
- backend logs quick scan
- verify ticket create/open attachment flow

### Weekly
- check mount persistence (`findmnt`)
- check disk usage (`df -h`)
- verify one DB backup file exists and is recent

### Monthly
- test DB restore in staging
- test attachment restore from backup
- rotate/verify expiring secrets and certificates

---

## 12) Handy Command Reference

```bash
# stack lifecycle
docker compose up -d --build
docker compose down
docker compose restart backend

# diagnostics
docker compose ps
docker compose logs -f --tail=100 backend
docker inspect "$(docker compose ps -q backend)" --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'

# mount checks
findmnt /mnt/ticketing_uploads
ls -la /mnt/ticketing_uploads | tail -n 20

# DB checks
docker compose exec db psql -U ticketing_user -d ticketing_db -c "SELECT now();"
docker compose exec backend npx prisma migrate status
```

---

## 13) Change and Recovery Policy

- Every production change must be traceable to:
  - branch
  - commit hash
  - deploy timestamp
  - operator
- Keep rollback-ready tag or previous image before release.
- For risky releases, deploy with maintenance window and smoke tests.

---

## 14) Recommended Next Improvements

- Add healthcheck blocks in `docker-compose.yml` for backend/db/frontend.
- Add automated smoke tests post-deploy.
- Add centralized logs (Loki/ELK/Sentry).
- Add nightly backup and restore-verification job.
- Add a `docs/runbooks/` folder with per-incident SOPs.

---

**Last Updated**: 2026-05-05  
**Version**: 2.0 (Comprehensive Operations Bible)
