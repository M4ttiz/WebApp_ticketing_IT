// ============================================
// Notification Controller — In-app notifications
// ============================================

const prisma = require('../lib/prisma');
const { NotFoundError } = require('../utils/errors');

/**
 * GET /api/notifications
 * Get current user's notifications (unread first).
 */
async function listNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { unreadOnly = 'false', limit = '20' } = req.query;

    const where = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: parseInt(limit),
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read.
 */
async function markAsRead(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundError('Notifica');
    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read.
 */
async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'Tutte le notifiche lette' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listNotifications, markAsRead, markAllAsRead };

