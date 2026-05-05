// ============================================
// Rate Limiter — Protect sensitive endpoints
// ============================================

const rateLimit = require('express-rate-limit');

const createLimiter = (windowMinutes, maxRequests, message) => rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || windowMinutes) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || maxRequests,
  message: {
    error: message,
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

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

/**
 * Password reset rate limiter.
 */
const passwordResetLimiter = createLimiter(60, 3, 'Troppi tentativi di reset password. Riprova più tardi.');

/**
 * User creation rate limiter.
 */
const userCreateLimiter = createLimiter(15, 10, 'Troppi tentativi di creazione utente. Riprova più tardi.');

/**
 * Ticket creation rate limiter.
 */
const ticketCreateLimiter = createLimiter(15, 20, 'Troppi ticket creati in poco tempo. Riprova più tardi.');

module.exports = { loginLimiter, apiLimiter, passwordResetLimiter, userCreateLimiter, ticketCreateLimiter };
