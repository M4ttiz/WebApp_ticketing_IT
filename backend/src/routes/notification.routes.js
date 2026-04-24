// ============================================
// Notification Routes
// ============================================

const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');

const router = Router();

router.use(requireAuth);

// GET /api/notifications
router.get('/', notificationController.listNotifications);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', notificationController.markAsRead);

// PATCH /api/notifications/read-all
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;

