// ============================================
// Inventory Routes — Device management endpoints
// ============================================

const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  getInventoryStats
} = require('../controllers/inventory.controller');

// Apply authentication and role protection to all routes
router.use(requireAuth);
router.use(requireRole(['admin', 'technician']));

/**
 * GET /api/inventory/devices
 * List devices with filters (type, status, search, pagination)
 */
router.get('/devices', listDevices);

/**
 * GET /api/inventory/devices/:id
 * Get single device by ID
 */
router.get('/devices/:id', getDevice);

/**
 * POST /api/inventory/devices
 * Create new device
 */
router.post('/devices', createDevice);

/**
 * PUT /api/inventory/devices/:id
 * Update existing device
 */
router.put('/devices/:id', updateDevice);

/**
 * DELETE /api/inventory/devices/:id
 * Delete device (soft delete)
 */
router.delete('/devices/:id', deleteDevice);

/**
 * GET /api/inventory/stats
 * Get inventory statistics
 */
router.get('/stats', getInventoryStats);

module.exports = router;
