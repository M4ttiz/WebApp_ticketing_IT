# IT Ticketing System

Piattaforma self-hosted per la gestione delle richieste IT, dei ticket periodici, dell'inventario asset e dei ricambi. Lo stack usa React/Vite, Node.js/Express, Prisma e PostgreSQL; in Docker Compose il frontend è servito da Nginx, che inoltra le richieste `/api` al backend.

## Funzionalità

- Ticket con stati, priorità, categorie, assegnatari, commenti, note interne e cronologia.
- Presa in carico da parte di tecnici e amministratori con associazione di un asset.
- Pianificazioni ricorrenti giornaliere, settimanali e mensili, con creazione automatica dei ticket.
- Inventario IT e collegamento degli asset ai ticket.
- Ricambi, movimenti di magazzino e avvisi per scorte minime.
- Dashboard, notifiche e allegati.
- Notifiche email configurabili via SMTP.

## Requisiti

Per l'installazione locale:

- Node.js 18 o successivo e npm.
- PostgreSQL 14 o successivo.
- Git.

Per l'installazione con Docker:

- Docker Engine.
- Docker Compose v2 (`docker compose`).
- OpenSSL, per generare i segreti.

## Installazione locale per sviluppo

### 1. Scarica il progetto

```bash
git clone https://github.com/M4ttiz/WebApp_ticketing_IT.git
cd WebApp_ticketing_IT
```

### 2. Crea database e utente PostgreSQL

Su Linux, apri la console PostgreSQL:

```bash
sudo -u postgres psql
```

Crea un utente e un database. Sostituisci la password di esempio con una password scelta da te:

```sql
CREATE USER ticketing_user WITH PASSWORD 'SCEGLI_UNA_PASSWORD';
CREATE DATABASE ticketing_db OWNER ticketing_user;
\q
```

Se la password contiene caratteri speciali nell'URL PostgreSQL, codificali in formato URL. In alternativa usa una password casuale esadecimale, ad esempio generata con `openssl rand -hex 32`.

### 3. Configura il backend

Crea `backend/.env` con i parametri locali:

```env
DATABASE_URL="postgresql://ticketing_user:SCEGLI_UNA_PASSWORD@localhost:5432/ticketing_db?schema=public"
JWT_ACCESS_SECRET="INSERISCI_UN_SEGRETO_CASUALE_LUNGO"
JWT_REFRESH_SECRET="INSERISCI_UN_ALTRO_SEGRETO_CASUALE_LUNGO"
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=./uploads
```

Puoi generare due segreti distinti con `openssl rand -hex 32`. Non riutilizzare i segreti di esempio in un ambiente accessibile ad altri.

Installa le dipendenze e inizializza **un database nuovo e vuoto**:

```bash
cd backend
npm ci
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Il seed crea le categorie iniziali, un utente amministratore e impostazioni SMTP segnaposto. Le credenziali iniziali dell'amministratore sono `admin@ticketing.local` / `Admin@12345!`; cambia la password subito dopo il primo accesso.

### 4. Avvia il frontend

Apri un secondo terminale nella cartella del progetto:

```bash
cd frontend
```

Crea `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

Poi avvia Vite:

```bash
npm ci
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000). L'API è disponibile su [http://localhost:5000/api](http://localhost:5000/api); il controllo di stato è [http://localhost:5000/api/health](http://localhost:5000/api/health).

### Configurazione SMTP

Accedi con un amministratore e vai in **Impostazioni** per inserire host, porta, sicurezza e credenziali SMTP. Usa il pulsante di test per verificare la connessione. In assenza di una configurazione valida, gli invii email non funzionano: i valori `smtp.example.com` e `noreply@example.com` sono segnaposto.

## Installazione con Docker Compose

> **Importante per la produzione:** il `backend/docker-entrypoint.sh` incluso nel progetto esegue `prisma db push --accept-data-loss` a ogni avvio. Il `docker-compose.yml` base contiene inoltre credenziali e indirizzo IP di esempio. Non avviare un database di produzione con il Compose base senza aver configurato l'override sicuro descritto qui sotto. Non usare mai `docker compose down -v` su un database da conservare.

### 1. Prepara le variabili di ambiente

Dalla cartella principale:

```bash
cp .env.example .env
```

Modifica `.env` e imposta valori casuali per il database e per i due segreti JWT. Genera tre stringhe distinte con:

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
```

Aggiungi a `.env` queste variabili, sostituendo i valori e l'indirizzo con quelli del server. Per `APP_URL` usa l'URL pubblico dell'app, senza slash finale:

```env
POSTGRES_PASSWORD=PRIMA_STRINGA_GENERATA
JWT_ACCESS_SECRET=SECONDA_STRINGA_GENERATA
JWT_REFRESH_SECRET=TERZA_STRINGA_GENERATA
APP_URL=http://IP_O_DOMINIO_DEL_SERVER
```

Per l'uso pubblico configura HTTPS tramite un reverse proxy con certificato TLS; non esporre l'applicazione in chiaro su Internet.

Il Dockerfile del backend richiede che esista `backend/.env` durante la build. Crea il file con valori **segnaposto**, senza copiare al suo interno i segreti reali di produzione: i valori effettivi saranno passati dal Compose all'avvio.

```bash
cp .env.example backend/.env
```

### 2. Crea un override Compose sicuro

Crea `docker-compose.production.yml` nella cartella principale:

```yaml
services:
  db:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Imposta POSTGRES_PASSWORD in .env}

  backend:
    entrypoint: ["node", "src/server.js"]
    command: []
    environment:
      DATABASE_URL: postgresql://ticketing_user:${POSTGRES_PASSWORD}@db:5432/ticketing_db
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:?Imposta JWT_ACCESS_SECRET in .env}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:?Imposta JWT_REFRESH_SECRET in .env}
      APP_URL: ${APP_URL:?Imposta APP_URL in .env}
      CORS_ORIGIN: ${APP_URL:?Imposta APP_URL in .env}
      NODE_ENV: production

  frontend:
    build:
      args:
        VITE_API_URL: ${APP_URL:?Imposta APP_URL in .env}
```

Usa **entrambi** i file Compose in tutti i comandi seguenti. L'override evita lo script che esegue `db push --accept-data-loss`; il frontend usa l'URL del server e inoltra le API attraverso Nginx.

### 3. Compila e inizializza un database nuovo

Questi passaggi sono per la **prima installazione con un database vuoto**. Non ripetere `prisma db push` su un database di produzione già esistente.

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml build
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d db
```

Attendi che PostgreSQL sia pronto:

```bash
until docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec -T db pg_isready -U ticketing_user -d ticketing_db; do sleep 2; done
```

Applica lo schema al database appena creato e inserisci categorie e amministratore iniziali:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  run --rm --no-deps --entrypoint npx backend prisma db push

docker compose -f docker-compose.yml -f docker-compose.production.yml \
  run --rm --no-deps --entrypoint node backend prisma/seed.js
```

Avvia l'applicazione senza ricreare o riavviare il database:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  up -d --no-deps backend frontend
```

Apri `http://IP_O_DOMINIO_DEL_SERVER`. Verifica i servizi e l'API:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml ps
docker compose -f docker-compose.yml -f docker-compose.production.yml logs --tail=100 backend frontend
curl -fsS http://localhost/api/health
```

Cambia immediatamente la password dell'account amministratore iniziale. Configura SMTP da **Impostazioni**. In produzione limita l'accesso diretto alla porta `5000` e pubblica il servizio tramite HTTPS.

### Dati persistenti e backup Docker

PostgreSQL salva i dati nel volume Docker `db_data`; gli allegati sono salvati nella cartella `backend/uploads` del server. `docker compose down` ferma e rimuove i container ma conserva il volume. **`docker compose down -v` rimuove anche i volumi e cancella il database: non usarlo per aggiornare o riavviare l'applicazione.**

Prima di ogni aggiornamento, crea un backup del database:

```bash
mkdir -p backups
BACKUP="backups/ticketing_$(date +%Y%m%d_%H%M%S).dump"
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec -T db pg_dump -U ticketing_user -d ticketing_db -Fc > "$BACKUP"
test -s "$BACKUP" && ls -lh "$BACKUP"
```

Esegui anche il backup degli allegati:

```bash
tar -czf "backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz" backend/uploads
```

### Aggiornare un'installazione esistente

Fai prima il backup del database e degli allegati, quindi aggiorna il codice e ricostruisci solo backend e frontend con l'override sicuro:

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.production.yml build backend frontend
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  up -d --no-deps backend frontend
```

Se la versione introduce una migrazione SQL, controlla le istruzioni e verifica che non sia già stata applicata prima di eseguirla. Per esempio, per la migrazione dei ticket periodici inclusa nel progetto:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec -T db psql -U ticketing_user -d ticketing_db \
  -tAc "SELECT to_regclass('public.recurring_tickets')"
```

Se la tabella non esiste ancora, applica la migrazione in una singola transazione:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec -T db psql -1 -v ON_ERROR_STOP=1 -U ticketing_user -d ticketing_db \
  < backend/prisma/migrations/20261027_add_recurring_tickets/migration.sql
```

Non applicare due volte la stessa migrazione. Per altre modifiche allo schema, segui le istruzioni SQL specifiche della release. Non eseguire `prisma db push --accept-data-loss` su database con dati da conservare.

## Configurazione e ruoli

- `user`: apre e segue i propri ticket.
- `technician`: gestisce i ticket assegnati, gli asset, i ricambi e le pianificazioni periodiche.
- `admin`: gestisce utenti, categorie, configurazioni e ticket.
- `viewer`: accesso di sola consultazione alle aree abilitate.

Gli utenti vengono creati da un amministratore dalla sezione **Utenti**. I ticket periodici sono gestibili da amministratori e tecnici.

## Struttura del progetto

- `backend/`: API Express, controllori, servizi e schema Prisma.
- `frontend/`: applicazione React e pagine.
- `backend/prisma/migrations/`: migrazioni SQL disponibili.
- `docker-compose.yml`: servizi Docker di base.
- `frontend/nginx.conf`: Nginx, file statici e proxy `/api`.

## Licenza

MIT
