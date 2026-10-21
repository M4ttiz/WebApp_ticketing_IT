const { Router } = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const sparePartController = require('../controllers/sparePart.controller');

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  [
    query('search').optional().trim().isLength({ max: 200 }).withMessage('Ricerca troppo lunga'),
    query('includeInactive').optional().isBoolean().withMessage('includeInactive deve essere booleano'),
  ],
  validate,
  sparePartController.listSpareParts
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('ID ricambio non valido')],
  validate,
  sparePartController.getSparePart
);

router.get(
  '/:id/history',
  [param('id').isUUID().withMessage('ID ricambio non valido')],
  validate,
  sparePartController.getSparePartHistory
);

router.post(
  '/',
  requireRole(['admin', 'technician']),
  [
    body('name').trim().notEmpty().withMessage('Nome obbligatorio'),
    body('code').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Codice troppo lungo'),
    body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Descrizione troppo lunga'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantità non valida'),
    body('minimumStock').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Soglia minima non valida'),
    body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Note troppo lunghe'),
  ],
  validate,
  sparePartController.createSparePart
);

router.patch(
  '/:id',
  requireRole(['admin', 'technician']),
  [
    param('id').isUUID().withMessage('ID ricambio non valido'),
    body('name').optional().trim().notEmpty().withMessage('Nome obbligatorio'),
    body('code').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Codice troppo lungo'),
    body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Descrizione troppo lunga'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantità non valida'),
    body('minimumStock').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Soglia minima non valida'),
    body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Note troppo lunghe'),
    body('isActive').optional().isBoolean().withMessage('isActive deve essere booleano'),
  ],
  validate,
  sparePartController.updateSparePart
);

router.delete(
  '/:id',
  requireRole(['admin', 'technician']),
  [param('id').isUUID().withMessage('ID ricambio non valido')],
  validate,
  sparePartController.deleteSparePart
);

router.get(
  '/ticket/:id',
  requireRole(['admin', 'technician', 'user']),
  [param('id').isInt().withMessage('ID ticket non valido')],
  validate,
  sparePartController.getTicketSpareParts
);

router.post(
  '/ticket/:id',
  requireRole(['admin', 'technician']),
  [
    param('id').isInt().withMessage('ID ticket non valido'),
    body('sparePartId').notEmpty().withMessage('Ricambio obbligatorio').isUUID().withMessage('ID ricambio non valido'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantità non valida'),
  ],
  validate,
  sparePartController.upsertTicketSparePart
);

router.delete(
  '/ticket/:id/:sparePartId',
  requireRole(['admin', 'technician']),
  [
    param('id').isInt().withMessage('ID ticket non valido'),
    param('sparePartId').isUUID().withMessage('ID ricambio non valido'),
  ],
  validate,
  sparePartController.deleteTicketSparePart
);

module.exports = router;
