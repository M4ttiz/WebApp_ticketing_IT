// ============================================
// Express Server — Main entry point
// ============================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { apiLimiter } = require('./middleware/rateLimiter');

// ─── Initialize Express ────────────────────
const app = express();
// Trust reverse proxy (nginx) so req.ip and secure cookies work correctly behind proxy
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT, 10) || 5000;

// ─── Create uploads directory ──────────────
const uploadsDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadsDir}`);
}

// ─── Middleware Stack ──────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting on all API routes
app.use('/api', apiLimiter);

// ─── API Routes ────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/upload', require('./routes/upload.routes'));

// ─── Health Check ──────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Serve uploads statically (with auth in route) ──
// Files are served through the upload controller with auth

// ─── Global Error Handler ──────────────────
app.use((err, req, res, next) => {
  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File troppo grande. Dimensione massima: 10MB',
    });
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Troppi file o campo file non previsto',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Errore interno del server';

  if (statusCode === 500 && process.env.NODE_ENV !== 'production') {
    console.error('❌ Server Error:', err);
  }

  res.status(statusCode).json({
    error: message,
    ...(err.errors && { details: err.errors }),
    ...(process.env.NODE_ENV !== 'production' && statusCode === 500 && { stack: err.stack }),
  });
});

// ─── 404 Handler ───────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// ─── Start Server ──────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════╗
║       🎫 IT Ticketing API Server             ║
║──────────────────────────────────────────────║
║  Port:    ${PORT}                              ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                      ║
║  Time:    ${new Date().toLocaleString('it-IT')}       ║
╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
