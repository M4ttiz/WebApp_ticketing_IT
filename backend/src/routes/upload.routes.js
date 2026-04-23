// ============================================
// Upload Routes
// ============================================

const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const uploadController = require('../controllers/upload.controller');

const router = Router();

// POST /api/upload — Upload files (authenticated)
router.post('/', requireAuth, upload.array('files', 5), uploadController.uploadFiles);

// GET /api/uploads/:filename — Serve file (authenticated)
router.get('/:filename', requireAuth, uploadController.serveFile);

module.exports = router;
