# IT Ticketing System 🎫

A self-hosted IT ticketing platform built with Node.js, Express, React, Vite and PostgreSQL. It covers ticket workflow, asset inventory, dashboard KPIs, user roles, notifications and spare-part stock tracking.

---

## Main features

- Ticket lifecycle management with status transitions and audit history
- User authentication and role-based access control
- Asset inventory with assignment and internal tracking
- Spare-part catalog independent from assets
- Minimum stock threshold alerting and low-stock dashboard
- Stock movement history for purchases and usage
- Ticket-to-spare-part association with stock deduction validation
- Dashboard cards, metrics and charts for operational monitoring
- File attachments, comments and notifications
- Docker-based deployment for quick local setup

---

## Functional areas

### Ticketing

- Create, assign and update tickets
- Validate state changes such as in progress, waiting, resolved and closed
- Enforce required resolution note before setting ticket as resolved
- Prevent takeover without selecting an asset when required by workflow
- Add comments and internal notes
- Track ticket history and audits

### Inventory and assets

- Manage assets with category, status, owner and assignment info
- Link assets to tickets
- Use asset pickup and release flow
- Keep a separate asset inventory independent from spare-part stock

### Spare parts

- Manage a standalone spare-part catalog
- Keep a quantity and a minimum stock value
- Prevent negative stock and block allocation when not enough stock is available
- Deduct stock when a spare part is attached to a ticket
- Restore stock when a part is removed from a ticket
- Show low-stock items in dashboard and quick restock action
- Record positive stock movements such as purchases and negative movements such as usage
- Open the historical log for each part and navigate directly to the related ticket

### Dashboard

- KPI cards for open, in progress, waiting, resolved and closed tickets
- Most-used spare parts chart
- Low-stock spare parts card with quick restock
- Recent ticket list and operational overview

---

## Technology stack

- Backend: Node.js + Express + Prisma
- Frontend: React + Vite + Tailwind CSS
- Database: PostgreSQL
- Auth: JWT + refresh tokens
- Deployment: Docker Compose + Nginx
- Monitoring: basic operational dashboard and system metrics

---

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL 14+ or Docker Desktop
- optional: Docker and Docker Compose

---

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/M4ttiz/WebApp_ticketing_IT.git
cd WebApp_ticketing_IT
```

### 2. Backend setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Docker setup

```bash
docker compose up -d --build
```

Then access:

- Frontend: http://localhost
- Backend: http://localhost:5000

---

## Fresh database setup from Prisma schema

If you want to recreate the database from the current schema without relying on the old migration chain, use one of these commands:

```bash
cd backend
npx prisma generate
npx prisma db push
```

Or for a fully versioned workflow:

```bash
cd backend
npx prisma migrate dev --name init
```

This is the recommended flow when the schema file is the source of truth.

---

## Project structure

- backend: Express API, Prisma client, controllers, routes, services
- frontend: React UI and dashboards
- nginx: reverse proxy and static frontend configuration
- docker-compose.yml: full local stack

---

## Useful files

- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- [backend/src/controllers/ticket.controller.js](backend/src/controllers/ticket.controller.js)
- [backend/src/controllers/sparePart.controller.js](backend/src/controllers/sparePart.controller.js)
- [backend/src/controllers/dashboard.controller.js](backend/src/controllers/dashboard.controller.js)
- [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx)
- [frontend/src/pages/SpareParts.jsx](frontend/src/pages/SpareParts.jsx)

---

## Notes about the stock logic

The spare-part workflow is designed to avoid stock inconsistencies:

- stock is reduced when a part is assigned to a ticket
- stock is blocked when not enough quantity is available
- stock is restored when usage is removed
- minimum stock is used to represent the alert threshold
- purchases and replenishments are recorded as positive movements
- ticket usage is recorded as negative movements

This makes the dashboard and history reliable even when the app is reinstalled or restored.

---

## License

MIT
