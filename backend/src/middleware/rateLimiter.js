// ============================================
// Rate Limiter — Protect login endpoint
// ============================================

const rateLimit = require('express-rate-limit');

/**
 * Login rate limiter: max N attempts per window per IP.
 */
const loginLimiter = rateLimit({
  windowMs: (parseInt(process.env.LOGIN_WINDOW_MINUTES, 10) || 15) * 60 * 1000,
  max: parseInt(process.env.LOGIN_MAX_ATTEMPTS, 10) || 5,
  message: {
    error: 'Troppi tentativi di accesso. Riprova tra qualche minuto.',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

/**
 * General API rate limiter.
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Troppe richieste. Riprova tra qualche momento.',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter };
