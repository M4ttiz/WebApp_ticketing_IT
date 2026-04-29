// ============================================
// Asset Routes
// ============================================

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const assetController = require('../controllers/assetController');

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/assets — List assets with filters and pagination
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page non valido'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit non valido'),
    query('category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Categoria non valida'),
    query('status').optional().isIn(['DISPONIBILE', 'IN_USO', 'IN_MANUTENZIONE', 'DISMESSO', 'GUASTO']).withMessage('Stato non valido'),
    query('search').optional().trim().isLength({ max: 200 }).withMessage('Ricerca troppo lunga'),
  ],
  validate,
  assetController.listAssets
);

// GET /api/assets/analytics/top-open-tickets — KPI by product
router.get(
  '/analytics/top-open-tickets',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit non valido'),
    query('category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Categoria non valida'),
    query('location').optional().trim().isLength({ max: 200 }).withMessage('Sede troppo lunga'),
    query('department').optional().trim().isLength({ max: 200 }).withMessage('Reparto troppo lungo'),
    query('status').optional().isIn(['ALL', 'OPEN', 'CLOSED']).withMessage('Filtro stato non valido'),
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Mese non valido'),
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Anno non valido'),
    query('search').optional().trim().isLength({ max: 200 }).withMessage('Ricerca troppo lunga'),
  ],
  validate,
  assetController.topOpenTicketsByProduct
);

// GET /api/assets/:id — Get asset detail with linked tickets
router.get(
  '/:id',
  [param('id').isUUID().withMessage('ID asset non valido')],
  validate,
  assetController.getAsset
);

// POST /api/assets — Create asset (admin or technician)
router.post(
  '/',
  requireRole(['admin', 'technician']),
  [
    body('name').trim().notEmpty().withMessage('Nome obbligatorio').isLength({ max: 255 }).withMessage('Nome troppo lungo'),
    body('category').trim().notEmpty().withMessage('Categoria obbligatoria').isLength({ max: 100 }).withMessage('Categoria non valida'),
    body('status').optional().isIn(['DISPONIBILE', 'IN_USO', 'IN_MANUTENZIONE', 'DISMESSO', 'GUASTO']).withMessage('Stato non valido'),
    body('serialNumber').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Seriale troppo lungo'),
    body('assetTag').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Tag troppo lungo'),
    body('purchaseDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Data acquisto non valida'),
    body('warrantyExpiry').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Data garanzia non valida'),
  ],
  validate,
  assetController.createAsset
);

// PUT /api/assets/:id — Update asset (admin or technician)
router.put(
  '/:id',
  requireRole(['admin', 'technician']),
  [
    param('id').isUUID().withMessage('ID asset non valido'),
    body('name').optional().trim().notEmpty().withMessage('Nome non può essere vuoto').isLength({ max: 255 }).withMessage('Nome troppo lungo'),
    body('category').optional().trim().notEmpty().withMessage('Categoria non valida').isLength({ max: 100 }).withMessage('Categoria non valida'),
    body('status').optional().isIn(['DISPONIBILE', 'IN_USO', 'IN_MANUTENZIONE', 'DISMESSO', 'GUASTO']).withMessage('Stato non valido'),
    body('serialNumber').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Seriale troppo lungo'),
    body('assetTag').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Tag troppo lungo'),
    body('purchaseDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Data acquisto non valida'),
    body('warrantyExpiry').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Data garanzia non valida'),
  ],
  validate,
  assetController.updateAsset
);

// DELETE /api/assets/:id — Delete asset (admin only)
router.delete(
  '/:id',
  requireRole(['admin']),
  [param('id').isUUID().withMessage('ID asset non valido')],
  validate,
  assetController.deleteAsset
);

// POST /api/assets/:id/link-ticket — Link asset to ticket
router.post(
  '/:id/link-ticket',
  requireRole(['admin', 'technician']),
  [
    param('id').isUUID().withMessage('ID asset non valido'),
    body('ticketId').notEmpty().withMessage('ticketId obbligatorio').isInt().withMessage('ticketId deve essere un numero'),
  ],
  validate,
  assetController.linkTicket
);

// DELETE /api/assets/:id/unlink-ticket/:ticketId — Unlink asset from ticket
router.delete(
  '/:id/unlink-ticket/:ticketId',
  requireRole(['admin', 'technician']),
  [
    param('id').isUUID().withMessage('ID asset non valido'),
    param('ticketId').isInt().withMessage('ID ticket non valido'),
  ],
  validate,
  assetController.unlinkTicket
);

module.exports = router;
