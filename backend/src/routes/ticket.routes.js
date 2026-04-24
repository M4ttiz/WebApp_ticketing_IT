// ============================================
// Ticket Routes
// ============================================

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { ticketCreateLimiter } = require('../middleware/rateLimiter');
const ticketController = require('../controllers/ticket.controller');

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/tickets — List tickets
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page non valido'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit non valido'),
    query('status').optional().isIn(['APERTO', 'IN_LAVORAZIONE', 'IN_ATTESA', 'RISOLTO', 'CHIUSO', 'RIFIUTATO']).withMessage('Stato non valido'),
    query('priority').optional().isIn(['BASSA', 'MEDIA', 'ALTA', 'CRITICA']).withMessage('Priorità non valida'),
    query('categoryId').optional().isInt().withMessage('Categoria non valida'),
    query('assignedTo').optional().isString().withMessage('Assegnato a non valido'),
    query('dateFrom').optional().isISO8601().withMessage('Data inizio non valida'),
    query('dateTo').optional().isISO8601().withMessage('Data fine non valida'),
    query('search').optional().trim().isLength({ max: 200 }).withMessage('Ricerca troppo lunga'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'priority', 'status', 'ticketNumber']).withMessage('Ordinamento non valido'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Direzione ordinamento non valida'),
  ],
  validate,
  ticketController.listTickets
);

// POST /api/tickets — Create ticket
router.post(
  '/',
  ticketCreateLimiter,
  upload.array('attachments', 5),
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Titolo obbligatorio')
      .isLength({ max: 255 }).withMessage('Titolo troppo lungo (max 255 caratteri)'),
    body('description')
      .trim()
      .notEmpty().withMessage('Descrizione obbligatoria'),
    body('categoryId')
      .notEmpty().withMessage('Categoria obbligatoria')
      .isInt().withMessage('Categoria non valida'),
    body('priority')
      .optional()
      .isIn(['BASSA', 'MEDIA', 'ALTA', 'CRITICA']).withMessage('Priorità non valida'),
  ],
  validate,
  ticketController.createTicket
);

// GET /api/tickets/:id — Get ticket detail
router.get(
  '/:id',
  [param('id').isInt().withMessage('ID ticket non valido')],
  validate,
  ticketController.getTicket
);

// PATCH /api/tickets/:id — Update ticket (priority, category)
router.patch(
  '/:id',
  [
    param('id').isInt().withMessage('ID ticket non valido'),
    body('priority')
      .optional()
      .isIn(['BASSA', 'MEDIA', 'ALTA', 'CRITICA']),
    body('categoryId')
      .optional()
      .isInt(),
  ],
  validate,
  ticketController.updateTicket
);

// PATCH /api/tickets/:id/status — Change status with state-machine validation
router.patch(
  '/:id/status',
  requireRole(['technician', 'admin']),
  [
    param('id').isInt().withMessage('ID ticket non valido'),
    body('status')
      .notEmpty().withMessage('Stato obbligatorio')
      .isIn(['APERTO', 'IN_LAVORAZIONE', 'IN_ATTESA', 'RISOLTO', 'CHIUSO', 'RIFIUTATO']).withMessage('Stato non valido'),
  ],
  validate,
  ticketController.changeStatus
);

// PATCH /api/tickets/:id/assign — Assign ticket to an agent (admin only)
router.patch(
  '/:id/assign',
  requireRole(['admin']),
  [
    param('id').isInt().withMessage('ID ticket non valido'),
    body('assigneeId')
      .optional({ nullable: true })
      .isUUID().withMessage('ID agente non valido'),
  ],
  validate,
  ticketController.assignTicket
);

// POST /api/tickets/:id/assign — Self-assign (technician)
router.post(
  '/:id/assign',
  requireRole(['technician', 'admin']),
  [param('id').isInt()],
  validate,
  ticketController.selfAssignTicket
);

// POST /api/tickets/:id/comments — Add comment (public or internal)
router.post(
  '/:id/comments',
  upload.array('attachments', 5),
  [
    param('id').isInt().withMessage('ID ticket non valido'),
    body('content').trim().notEmpty().withMessage('Contenuto obbligatorio'),
    body('isInternal').optional().isBoolean().withMessage('isInternal deve essere booleano'),
  ],
  validate,
  ticketController.addComment
);

// GET /api/tickets/:id/messages
router.get(
  '/:id/messages',
  [param('id').isInt()],
  validate,
  ticketController.getMessages
);

// POST /api/tickets/:id/messages (legacy alias, redirects to comments internally)
router.post(
  '/:id/messages',
  upload.array('attachments', 5),
  [
    param('id').isInt(),
    body('content').trim().notEmpty().withMessage('Messaggio obbligatorio'),
  ],
  validate,
  ticketController.addMessage
);

// GET /api/tickets/:id/history
router.get(
  '/:id/history',
  [param('id').isInt()],
  validate,
  ticketController.getHistory
);

module.exports = router;

