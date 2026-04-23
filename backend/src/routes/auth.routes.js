// ============================================
// Auth Routes
// ============================================

const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Email non valida').normalizeEmail(),
    body('password').notEmpty().withMessage('Password obbligatoria'),
  ],
  validate,
  authController.login
);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Email non valida').normalizeEmail()],
  validate,
  authController.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token obbligatorio'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La password deve avere almeno 8 caratteri'),
  ],
  validate,
  authController.resetPassword
);

module.exports = router;
