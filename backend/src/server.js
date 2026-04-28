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
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/assets', require('./routes/assets'));

// ─── Health Check ──────────────────────────
app.get('/api/health', (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7715/ingest/c0d27ced-16c6-45ed-94f5-165834a5a336',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d042ee'},body:JSON.stringify({sessionId:'d042ee',runId:'pre-fix',hypothesisId:'H1',location:'server.js:61',message:'Health endpoint reached',data:{method:req.method,path:req.originalUrl},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7715/ingest/c0d27ced-16c6-45ed-94f5-165834a5a336',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d042ee'},body:JSON.stringify({sessionId:'d042ee',runId:'pre-fix',hypothesisId:'H4',location:'server.js:76',message:'Global error handler reached',data:{method:req.method,path:req.originalUrl,statusCode:err?.statusCode||500,name:err?.name||null,code:err?.code||null,message:err?.message||null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
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

  if (statusCode === 500) {
    console.error('❌ Server Error:', {
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    });
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
  // #region agent log
  fetch('http://127.0.0.1:7715/ingest/c0d27ced-16c6-45ed-94f5-165834a5a336',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d042ee'},body:JSON.stringify({sessionId:'d042ee',runId:'pre-fix',hypothesisId:'H1',location:'server.js:119',message:'Backend server startup callback',data:{port:PORT,nodeEnv:process.env.NODE_ENV||'development'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
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
