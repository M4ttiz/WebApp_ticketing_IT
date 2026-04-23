// ============================================
// Ticket Service — Business logic helpers
// ============================================

const prisma = require('../lib/prisma');

/**
 * Generate the next ticket number in format TKT-0001.
 */
async function generateTicketNumber() {
  const lastTicket = await prisma.ticket.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });

  const nextNum = (lastTicket?.id || 0) + 1;
  return `TKT-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Log an action to the ticket history.
 */
async function logTicketHistory(ticketId, userId, action, details = null) {
  return prisma.ticketHistory.create({
    data: {
      ticketId,
      userId,
      action,
      details,
    },
  });
}

/**
 * Map status enum to Italian labels.
 */
const STATUS_LABELS = {
  open: 'Aperto',
  in_progress: 'In lavorazione',
  on_hold: 'In attesa',
  resolved: 'Risolto',
  closed: 'Chiuso',
};

/**
 * Map priority enum to Italian labels.
 */
const PRIORITY_LABELS = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

module.exports = {
  generateTicketNumber,
  logTicketHistory,
  STATUS_LABELS,
  PRIORITY_LABELS,
};
