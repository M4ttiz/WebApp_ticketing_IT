// ============================================
// User Controller — CRUD, role management, password reset
// ============================================

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { sendEmail } = require('../services/email.service');
const emailTemplates = require('../utils/emailTemplates');
const { NotFoundError, ForbiddenError, AppError } = require('../utils/errors');


const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  department: true,
  isActive: true,
  isDeleted: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { ticketsRequested: true, ticketsAssigned: true } },
};

/**
 * GET /api/users
 * List all users (admin only).
 */
async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 50, role, search, includeDeleted = 'false' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (includeDeleted !== 'true') {
      where.isDeleted = false;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users
 * Create a new user (admin only).
 */
async function createUser(req, res, next) {
  try {
    const { firstName, lastName, email, role = 'user', department } = req.body;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      throw new AppError('Questa email è già registrata', 409);
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(6).toString('base64url').slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        department: department?.trim() || null,
        mustChangePassword: true,
      },
      select: userSelect,
    });

    // Send welcome email with temp password
    try {
      sendEmail({
        to: user.email,
        subject: '👋 Benvenuto in IT Ticketing — Il tuo account',
        html: emailTemplates.accountCreated(
          { firstName: user.firstName, email: user.email, role: user.role },
          tempPassword,
          process.env.APP_URL
        ),
      });
    } catch (e) {
      console.error('Failed to send welcome email:', e.message);
    }

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:id
 */
async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: userSelect,
    });

    if (!user || user.isDeleted) {
      throw new NotFoundError('Utente');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/:id
 * Update user data (admin only).
 */
async function updateUser(req, res, next) {
  try {
    const { firstName, lastName, email, role, department, isActive } = req.body;
    const targetId = req.params.id;

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target || target.isDeleted) {
      throw new NotFoundError('Utente');
    }

    // Prevent admin from demoting themselves
    if (targetId === req.user.id && role && role !== 'admin') {
      throw new AppError('Non puoi cambiare il tuo stesso ruolo', 400);
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) {
      const emailLower = email.toLowerCase().trim();
      if (emailLower !== target.email) {
        const existing = await prisma.user.findUnique({ where: { email: emailLower } });
        if (existing) throw new AppError('Email già in uso', 409);
        updateData.email = emailLower;
      }
    }
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: userSelect,
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/:id
 * Hard delete when no requester tickets exist (admin only).
 */
async function deleteUser(req, res, next) {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      throw new AppError('Non puoi eliminare il tuo stesso account', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user || user.isDeleted) {
      throw new NotFoundError('Utente');
    }

    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { assigneeId: targetId },
        data: { assigneeId: null },
      }),
      // Delete tickets created by / assigned to this user so foreign keys don't block user deletion.
      prisma.ticket.deleteMany({
        where: {
          OR: [
            { requesterId: targetId },
            { assigneeId: targetId },
          ],
        },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: targetId } }),
      prisma.notification.deleteMany({ where: { userId: targetId } }),
      prisma.auditLog.deleteMany({ where: { userId: targetId } }),
      prisma.ticketHistory.deleteMany({ where: { userId: targetId } }),
      prisma.attachment.deleteMany({ where: { uploaderId: targetId } }),
      prisma.ticketMessage.deleteMany({ where: { authorId: targetId } }),
      prisma.user.delete({ where: { id: targetId } }),
    ]);

    res.json({ message: 'Utente cancellato definitivamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users/:id/reset-password
 * Admin resets a user's password.
 */
async function adminResetPassword(req, res, next) {
  try {
    const targetId = req.params.id;
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user || user.isDeleted) {
      throw new NotFoundError('Utente');
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(6).toString('base64url').slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: targetId },
      data: { passwordHash, mustChangePassword: true },
    });

    // Invalidate refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: targetId } });

    // Send email with new temp password
    try {
      sendEmail({
        to: user.email,
        subject: '🔑 Password reimpostata — IT Ticketing',
        html: emailTemplates.adminPasswordReset(
          `${user.firstName} ${user.lastName}`,
          tempPassword,
          process.env.APP_URL
        ),
      });
    } catch (e) {
      console.error('Failed to send password reset email:', e.message);
    }

    res.json({ message: 'Password reimpostata' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/me/password
 * User changes their own password.
 */
async function changeOwnPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Utente');

    // If mustChangePassword is true (first login), currentPassword may be the temp one
    if (!user.mustChangePassword) {
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        throw new AppError('Password attuale non corretta', 400);
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    // Invalidate all refresh tokens after a password change
    await prisma.refreshToken.deleteMany({ where: { userId } });

    res.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/me
 * Get current user profile.
 */
async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userSelect,
    });
    if (!user) throw new NotFoundError('Utente');
    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/me
 * Update own profile (limited fields + safe email change).
 */
async function updateProfile(req, res, next) {
  try {
    const { firstName, lastName, email, department } = req.body;
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (department !== undefined) updateData.department = department?.trim() || null;

    if (email !== undefined) {
      const emailLower = email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email: emailLower } });
      if (existing && existing.id !== req.user.id) {
        throw new AppError('Email già in uso', 409);
      }
      updateData.email = emailLower;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: userSelect,
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  adminResetPassword,
  changeOwnPassword,
  getProfile,
  updateProfile,
};
