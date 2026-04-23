// ============================================
// Ticket Routes
// ============================================

const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ticketController = require('../controllers/ticket.controller');

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/tickets — List tickets
router.get('/', ticketController.listTickets);

// POST /api/tickets — Create ticket
router.post(
  '/',
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
      .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Priorità non valida'),
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

// PATCH /api/tickets/:id — Update ticket
router.patch(
  '/:id',
  [
    param('id').isInt().withMessage('ID ticket non valido'),
    body('status')
      .optional()
      .isIn(['open', 'in_progress', 'on_hold', 'resolved', 'closed']),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent']),
  ],
  validate,
  ticketController.updateTicket
);

// POST /api/tickets/:id/assign — Self-assign
router.post(
  '/:id/assign',
  requireRole(['technician', 'admin']),
  [param('id').isInt()],
  validate,
  ticketController.selfAssignTicket
);

// GET /api/tickets/:id/messages
router.get(
  '/:id/messages',
  [param('id').isInt()],
  validate,
  ticketController.getMessages
);

// POST /api/tickets/:id/messages
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
