// ============================================
// Category Routes
// ============================================

const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const categoryController = require('../controllers/category.controller');

const router = Router();

router.use(requireAuth);

// GET /api/categories — List categories (all roles)
router.get('/', categoryController.listCategories);

// POST /api/categories — Create (admin only)
router.post(
  '/',
  requireRole(['admin']),
  [body('name').trim().notEmpty().withMessage('Nome categoria obbligatorio')],
  validate,
  categoryController.createCategory
);

// PATCH /api/categories/:id — Update (admin only)
router.patch(
  '/:id',
  requireRole(['admin']),
  [param('id').isInt()],
  validate,
  categoryController.updateCategory
);

// DELETE /api/categories/:id — Deactivate (admin only)
router.delete(
  '/:id',
  requireRole(['admin']),
  [param('id').isInt()],
  validate,
  categoryController.deleteCategory
);

module.exports = router;
