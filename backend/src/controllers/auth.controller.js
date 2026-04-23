// ============================================
// Auth Controller — Login, Refresh, Logout, Password Reset
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { sendEmail } = require('../services/email.service');
const emailTemplates = require('../utils/emailTemplates');
const { UnauthorizedError, NotFoundError, AppError } = require('../utils/errors');


/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account disabilitato. Contatta l\'amministratore.' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });

    res.json({
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'Refresh token mancante', code: 'NO_REFRESH_TOKEN' });
    }

    // Find the stored refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Clean up expired token
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ error: 'Sessione scaduta, effettua di nuovo il login', code: 'REFRESH_EXPIRED' });
    }

    const user = storedToken.user;
    if (!user.isActive || user.isDeleted) {
      return res.status(403).json({ error: 'Account disabilitato' });
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const newRefreshToken = await generateRefreshToken(user);
    const accessToken = generateAccessToken(user);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    res.json({
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ message: 'Logout effettuato' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return success to prevent email enumeration
    if (!user || user.isDeleted || !user.isActive) {
      return res.json({ message: 'Se l\'email è registrata, riceverai un link per il reset.' });
    }

    // Generate reset token (JWT with short expiry)
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'password_reset' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    const html = emailTemplates.passwordReset(`${user.firstName} ${user.lastName}`, resetUrl);

    await sendEmail({
      to: user.email,
      subject: '🔑 Reset Password — IT Ticketing',
      html,
    });

    res.json({ message: 'Se l\'email è registrata, riceverai un link per il reset.' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Link di reset non valido o scaduto' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Token non valido' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });

    // Invalidate all refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    next(error);
  }
}

// ─── Helpers ────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
}

async function generateRefreshToken(user) {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  return token;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    department: user.department,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

module.exports = { login, refresh, logout, forgotPassword, resetPassword };
