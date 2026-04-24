# 🚀 Guida Aggiornamento Produzione — IT Ticketing Refactor

> ⚠️ **ATTENZIONE**: Questo refactor cambia gli enum del database (`TicketStatus` e `Priority` da inglese a italiano) e aggiunge nuove tabelle. **È obbligatorio fare un backup prima di procedere.**

---

## 1. Pre-aggiornamento (sul server Ubuntu)

### 1.1 Entra nella directory del progetto
```bash
cd /path/to/WebApp_ticketing_IT
```

### 1.2 Ferma solo backend e frontend (lascia attivo il DB)
```bash
docker-compose stop backend frontend
```

### 1.3 Backup completo del database
```bash
docker-compose exec -T db pg_dump -U ticketing_user -d ticketing_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

Verifica che il backup sia stato creato:
```bash
ls -lh backup_*.sql
```

### 1.4 Backup dei file di configurazione (opzionale ma consigliato)
```bash
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup
```

---

## 2. Aggiornamento codice

### 2.1 Scarica il nuovo codice
Se usi Git:
```bash
git pull origin main
```

Oppure se usi un archivio, estrai i file sovrascrivendo quelli esistenti (escludendo `.env` e `docker-compose.yml` se li hai personalizzati).

### 2.2 Copia lo script di migrazione SQL nel container DB
Il file `backend/prisma/migrations/refactor_enums/migration.sql` contiene la migrazione sicura.

```bash
# Crea la directory nel container DB (se necessario)
docker-compose exec db mkdir -p /tmp/migration

# Copia lo script
docker cp backend/prisma/migrations/refactor_enums/migration.sql $(docker-compose ps -q db):/tmp/migration/
```

---

## 3. Migrazione Database

### 3.1 Esegui la migrazione SQL direttamente nel DB
Questo passaggio converte i vecchi enum inglesi nei nuovi italiani e crea le nuove tabelle.

```bash
docker-compose exec -T db psql -U ticketing_user -d ticketing_db -f /tmp/migration/migration.sql
```

### 3.2 Verifica che la migrazione sia andata a buon fine
```bash
docker-compose exec db psql -U ticketing_user -d ticketing_db -c "\dt"
docker-compose exec db psql -U ticketing_user -d ticketing_db -c "SELECT status, priority FROM tickets LIMIT 5;"
```

Dovresti vedere i valori in italiano (`APERTO`, `MEDIA`, ecc.) e le nuove tabelle `audit_logs` e `notifications`.

### 3.3 Aggiorna il Prisma schema nel container backend
Dopo aver applicato la migrazione SQL, genera il Prisma Client aggiornato:

```bash
cd backend
npm install
npx prisma generate
```

---

## 4. Build e avvio

### 4.1 Ricostruisci i container
```bash
cd ..  # torna alla root del progetto
docker-compose down  # ferma eventuali residui
docker-compose up -d --build
```

### 4.2 Verifica i log
```bash
docker-compose logs -f backend
```

In un altro terminale:
```bash
docker-compose logs -f frontend
```

### 4.3 Health check
```bash
curl http://localhost/api/health
```

---

## 5. Rollback (se qualcosa va storto)

Se l'aggiornamento fallisce, puoi tornare alla versione precedente:

```bash
# Ferma tutto
docker-compose down

# Ripristina il database
docker-compose up -d db  # avvia solo il DB
docker-compose exec -T db psql -U ticketing_user -d ticketing_db < backup_YYYYMMDD_HHMMSS.sql

# Torna al codice vecchio (git checkout o ripristina i file)
git checkout HEAD~1  # oppure il commit/tag precedente

# Riavvia con la vecchia versione
docker-compose up -d --build
```

---

## 6. Checklist post-aggiornamento

- [ ] Login funzionante
- [ ] Dashboard mostra KPI corretti
- [ ] Lista ticket con filtri funzionante
- [ ] Creazione ticket multi-step funzionante
- [ ] Dettaglio ticket con cambio stato funzionante
- [ ] Commenti pubblici e interni funzionanti
- [ ] Notifiche in-app (polling ogni 30s)
- [ ] Profilo utente modificabile
- [ ] Gestione utenti (admin) funzionante
- [ ] Gestione categorie (admin) funzionante

---

## ⚡ Metodo alternativo: zero-downtime (avanzato)

Se hai un proxy/load balancer e vuoi minimizzare il downtime:

1. **Clona** il progetto in una nuova directory (`/opt/ticketing_v2/`)
2. Applica la migrazione SQL mentre il vecchio sistema è ancora attivo (ATTENZIONE: i vecchi container potrebbero avere problemi a leggere i nuovi enum)
3. Builda i nuovi container nella directory clonata
4. Cambia la porta del proxy (es. da 80 a 8080) o usa un reverse proxy dinamico
5. Se tutto funziona, rimuovi la vecchia versione

> **Nota**: Il metodo zero-downtime è complesso a causa della breaking change sugli enum. Per un singolo server Docker Compose, il downtime di 2-3 minuti con backup è l'approccio più sicuro.

