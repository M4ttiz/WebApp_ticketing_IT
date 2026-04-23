// ============================================
// Validation Middleware — express-validator wrapper
// ============================================

const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results
 * and returns 400 with errors if validation failed.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errore di validazione',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = { validate };
