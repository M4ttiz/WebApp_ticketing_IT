// ============================================
// Dashboard Routes
// ============================================

const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboard.controller');

const router = Router();

router.use(requireAuth);
router.use(requireRole(['admin', 'technician']));

// GET /api/dashboard
router.get('/', dashboardController.getDashboard);

module.exports = router;

