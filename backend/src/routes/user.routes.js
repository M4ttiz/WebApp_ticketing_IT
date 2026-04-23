// ============================================
// User Routes
// ============================================

const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const userController = require('../controllers/user.controller');

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ─── Self routes (any role) ─────────────────

// GET /api/users/me
router.get('/me', userController.getProfile);

// PATCH /api/users/me
router.patch(
  '/me',
  [
    body('firstName').optional().trim().notEmpty().withMessage('Nome obbligatorio'),
    body('lastName').optional().trim().notEmpty().withMessage('Cognome obbligatorio'),
  ],
  validate,
  userController.updateProfile
);

// PATCH /api/users/me/password
router.patch(
  '/me/password',
  [
    body('currentPassword').optional(),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La nuova password deve avere almeno 8 caratteri'),
  ],
  validate,
  userController.changeOwnPassword
);

// ─── Admin routes ───────────────────────────

// GET /api/users — List all users
router.get('/', requireRole(['admin']), userController.listUsers);

// POST /api/users — Create user
router.post(
  '/',
  requireRole(['admin']),
  [
    body('firstName').trim().notEmpty().withMessage('Nome obbligatorio'),
    body('lastName').trim().notEmpty().withMessage('Cognome obbligatorio'),
    body('email').isEmail().withMessage('Email non valida').normalizeEmail(),
    body('role')
      .optional()
      .isIn(['user', 'technician', 'admin']).withMessage('Ruolo non valido'),
    body('department').optional().trim(),
  ],
  validate,
  userController.createUser
);

// GET /api/users/:id
router.get(
  '/:id',
  requireRole(['admin']),
  [param('id').isUUID().withMessage('ID utente non valido')],
  validate,
  userController.getUser
);

// PATCH /api/users/:id — Update user
router.patch(
  '/:id',
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('ID utente non valido'),
    body('email').optional().isEmail().withMessage('Email non valida'),
    body('role').optional().isIn(['user', 'technician', 'admin']),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  userController.updateUser
);

// DELETE /api/users/:id — Soft delete
router.delete(
  '/:id',
  requireRole(['admin']),
  [param('id').isUUID()],
  validate,
  userController.deleteUser
);

// POST /api/users/:id/reset-password — Admin reset
router.post(
  '/:id/reset-password',
  requireRole(['admin']),
  [param('id').isUUID()],
  validate,
  userController.adminResetPassword
);

module.exports = router;
