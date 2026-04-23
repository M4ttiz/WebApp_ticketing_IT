# IT Ticketing System 🎫

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/M4ttiz/WebApp_ticketing_IT.svg)](https://github.com/M4ttiz/WebApp_ticketing_IT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](docker-compose.yml)

A professional, self-hosted IT ticket management system built with **Node.js + Express + React**, designed for enterprises and small teams. Deploy locally, on Ubuntu, Windows, or via Docker.

---

## 🚀 Key Features

✅ **Modern Web Interface** - React + Vite + Tailwind CSS  
✅ **RESTful API** - Express.js with comprehensive ticket management  
✅ **PostgreSQL** - Robust database with Prisma ORM  
✅ **JWT Authentication** - Secure with refresh tokens  
✅ **Role-Based Access** - Admin, Agent, Customer roles  
✅ **Ticket Management** - Create, assign, track, resolve  
✅ **File Attachments** - Upload documents to tickets  
✅ **Email Notifications** - SMTP integration  
✅ **Docker Ready** - docker-compose.yml included  
✅ **Multi-Platform** - Ubuntu LTS, Windows, XAMPP  
✅ **Backup Scripts** - PostgreSQL backup automation  
✅ **SSL/HTTPS** - Let's Encrypt Certbot support  

---

## 📋 Quick Start

### Prerequisites
- **Node.js** 18+ & npm
- **PostgreSQL** 14+
- **Nginx** (optional)

### 1️⃣ Clone & Run Locally

```bash
# Clone the repository
git clone https://github.com/M4ttiz/WebApp_ticketing_IT.git
cd WebApp_ticketing_IT

# Backend setup
cd backend
cp .env.example .env
# Edit .env with your database credentials (see DATABASE_URL section)
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev
```

**Access the app**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

### 2️⃣ Docker Deployment (Easiest)

```bash
docker-compose up -d
```

Access at `http://localhost`

⚠️ **Important**: Edit `docker-compose.yml` and set secure credentials before deploying to production!

---

### 3️⃣ Ubuntu Server LTS Deployment

Full guide in [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)

**Quick steps**:
```bash
# Install dependencies
sudo apt update
sudo apt install -y curl gnupg build-essential nodejs postgresql postgresql-contrib nginx

# Create database
sudo -u postgres createuser -P ticketing_user
sudo -u postgres createdb -O ticketing_user ticketing_db

# Clone & setup backend
git clone <repo-url> /opt/ticketing-app
cd /opt/ticketing-app/backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npx prisma migrate deploy
npm run build

# Setup PM2 for background execution
sudo npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save

# Build frontend
cd ../frontend
npm install
npm run build
sudo mkdir -p /var/www/ticketing
sudo cp -r dist/* /var/www/ticketing

# Configure Nginx (see nginx/ticketing.conf)
sudo cp nginx/ticketing.conf /etc/nginx/sites-available/ticketing
sudo ln -s /etc/nginx/sites-available/ticketing /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Enable firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Optional: SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### 4️⃣ Windows Server / XAMPP

**Option A: Windows Server (Node + PostgreSQL)**
- Install [Node.js LTS](https://nodejs.org)
- Install [PostgreSQL for Windows](https://www.postgresql.org/download/windows/)
- Create database: `createdb -U postgres ticketing_db`
- Clone repo and follow backend/frontend setup above

**Option B: Docker Desktop (Recommended)**
```powershell
docker-compose up -d
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing guidelines |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |
| [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md) | Detailed Docker setup |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Pre-production checklist |
| [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) | Running & maintenance |

---

## 🔐 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Bcrypt password hashing
- ✅ CORS protection
- ✅ Rate limiting (login attempts)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ HTTPS/SSL support (Let's Encrypt)
- ✅ Input validation on all endpoints

---

## 📧 Email Integration

Configure SMTP for notifications:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="IT Ticketing <noreply@example.com>"
```

Triggers:
- Ticket assignment
- Status updates
- Comments & replies
- Resolution alerts

---

## 🗄 Database

**PostgreSQL** with Prisma ORM

**Schema includes**:
- Users (roles: admin, agent, customer)
- Tickets (with categories, priorities, statuses)
- Categories (configurable types)
- Attachments (file storage)
- Audit logs

**Migrations**:
```bash
npx prisma migrate dev    # development
npx prisma migrate deploy # production
```

---

## 🚀 Performance Tips

- Enable Redis for session caching
- Use gzip compression in Nginx
- Configure PostgreSQL connection pooling
- Monitor with PM2 Plus (optional)
- Set CDN for static assets

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md)

**Quick start**:
```bash
git checkout -b feature/amazing-feature
# Make changes & commit
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
# Create a Pull Request
```

---

## 📝 License

[MIT License](LICENSE) © 2024 IT Ticketing Contributors

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/M4ttiz/WebApp_ticketing_IT/issues)
- **Discussions**: [GitHub Discussions](https://github.com/M4ttiz/WebApp_ticketing_IT/discussions)

---

## 🎯 Roadmap

- [ ] WhatsApp integration
- [ ] SMS notifications
- [ ] Advanced analytics & reporting
- [ ] AI-powered ticket categorization
- [ ] Mobile app (React Native)
- [ ] GraphQL API

---

**Made with ❤️ by the IT Ticketing Team** · [⬆ back to top](#it-ticketing-system-)
