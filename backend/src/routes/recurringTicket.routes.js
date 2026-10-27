const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const controller = require('../controllers/recurringTicket.controller');

const router = Router();
router.use(requireAuth, requireRole(['admin', 'technician']));
router.get('/', controller.list);
router.post('/', [
  body('title').trim().notEmpty().isLength({ max: 255 }),
  body('description').trim().notEmpty(),
  body('categoryId').isInt({ min: 1 }),
  body('priority').optional().isIn(['BASSA', 'MEDIA', 'ALTA', 'CRITICA']),
  body('frequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY']),
  body('dayOfWeek').if(body('frequency').equals('WEEKLY')).isInt({ min: 0, max: 6 }),
  body('dayOfMonth').if(body('frequency').equals('MONTHLY')).isInt({ min: 1, max: 31 }),
  body('time').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
], validate, controller.create);
router.patch('/:id', [
  param('id').isInt({ min: 1 }),
  body('isActive').optional().isBoolean(),
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim().notEmpty(),
  body('categoryId').optional().isInt({ min: 1 }),
  body('priority').optional().isIn(['BASSA', 'MEDIA', 'ALTA', 'CRITICA']),
  body('frequency').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY']),
  body('dayOfWeek').optional().isInt({ min: 0, max: 6 }),
  body('dayOfMonth').optional().isInt({ min: 1, max: 31 }),
  body('time').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/),
], validate, controller.update);
router.delete('/:id', [param('id').isInt({ min: 1 })], validate, controller.remove);
module.exports = router;
