// ============================================
// Settings Routes
// ============================================

const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const settingsController = require('../controllers/settings.controller');

const router = Router();

router.use(requireAuth);
router.use(requireRole(['admin']));

// GET /api/settings/smtp
router.get('/smtp', settingsController.getSmtpSettings);

// PUT /api/settings/smtp
router.put(
  '/smtp',
  [
    body('host').trim().notEmpty().withMessage('Host SMTP obbligatorio'),
    body('port').isInt({ min: 1, max: 65535 }).withMessage('Porta non valida'),
    body('from').trim().notEmpty().withMessage('Mittente obbligatorio'),
  ],
  validate,
  settingsController.updateSmtpSettings
);

// POST /api/settings/smtp/test
router.post('/smtp/test', settingsController.testSmtp);

// GET /api/settings/asset-categories
router.get('/asset-categories', settingsController.getAssetCategories);

// PUT /api/settings/asset-categories
router.put(
  '/asset-categories',
  [
    body('selected').isArray({ min: 1 }).withMessage('Seleziona almeno una categoria'),
    body('selected.*').isString().withMessage('Valore categoria non valido'),
    body('custom').optional().isArray().withMessage('Categorie personalizzate non valide'),
    body('custom.*').optional().isString().withMessage('Categoria personalizzata non valida'),
  ],
  validate,
  settingsController.updateAssetCategories
);

module.exports = router;
