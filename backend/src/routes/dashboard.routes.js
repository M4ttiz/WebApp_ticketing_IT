// ============================================
// Dashboard Routes
// ============================================

const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboard.controller');

const router = Router();

router.use(requireAuth);
router.use(requireRole(['admin', 'technician']));

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/charts
router.get('/charts', dashboardController.getCharts);

module.exports = router;
