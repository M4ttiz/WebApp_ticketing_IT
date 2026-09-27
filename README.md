# IT Ticketing System 🎫

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)  
A concise, self-hosted IT ticketing system built with Node.js, Express and React. Includes PostgreSQL (Prisma), JWT auth and role-based access (admin/agent/customer).

---

## Key features

- Modern React + Vite frontend with Tailwind
- RESTful Express API
- PostgreSQL + Prisma ORM
- JWT authentication with refresh tokens
- Role-based access: admin, agent, customer
- File attachments and email notifications
- Docker compose for quick deployment

---

## Quick start (development)

1. Clone:

```bash
git clone https://github.com/M4ttiz/WebApp_ticketing_IT.git
cd WebApp_ticketing_IT
```

2. Backend:

```bash
cd backend
cp .env.example .env     # edit DATABASE_URL and other secrets
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

3. Frontend (separate terminal):

```bash
cd frontend
npm install
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Docker (quick deploy)

```bash
docker-compose up -d
```

Edit `docker-compose.yml` before production to set secure credentials.

---

## Notes

- See `DOCKER_DEPLOYMENT_GUIDE.md` and other docs in the repo for full production steps.
- Removed non-actionable roadmap from this README to keep docs focused and up-to-date.

---

## License

[MIT License](LICENSE)
