// ============================================
// Auth Middleware — JWT verification + role guards
// ============================================

const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * Verify JWT access token from Authorization header.
 * Attaches req.user = { id, email, role, firstName, lastName }
 */
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token di accesso mancante');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token scaduto', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token non valido', code: 'TOKEN_INVALID' });
    }
    next(error);
  }
}

/**
 * Guard: require specific role(s).
 * Usage: requireRole(['admin']) or requireRole(['admin', 'technician'])
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Non hai i permessi per questa azione'));
    }
    next();
  };
}

/**
 * Optional auth — doesn't fail if no token, but attaches user if present.
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
      };
    }
  } catch (e) {
    // Ignore — optional auth
  }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
