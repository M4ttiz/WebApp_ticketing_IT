// ============================================
// Ticket Controller — CRUD, assign, messages, history
// ============================================

const prisma = require('../lib/prisma');
const { generateTicketNumber, logTicketHistory } = require('../services/ticket.service');
const { sendEmail } = require('../services/email.service');
const emailTemplates = require('../utils/emailTemplates');
const { NotFoundError, ForbiddenError, AppError } = require('../utils/errors');


// ─── Shared includes for ticket queries ────
const ticketIncludes = {
  category: { select: { id: true, name: true } },
  requester: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
  _count: { select: { messages: true, attachments: true } },
};

/**
 * GET /api/tickets
 * List tickets — filtered by role.
 */
async function listTickets(req, res, next) {
  try {
    const { role, id: userId } = req.user;
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      categoryId,
      assigneeId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause based on role
    let where = {};

    if (role === 'user') {
      // Users see only their own tickets
      where.requesterId = userId;
    } else if (role === 'technician') {
      // Technicians see tickets assigned to them OR unassigned (open pool)
      // We'll restrict to that by default and combine with other filters below
      where.AND = [{ OR: [{ assigneeId: userId }, { assigneeId: null }] }];
    }
    // Admin sees everything

    // Apply filters
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }
    if (assigneeId) {
      if (assigneeId === 'unassigned') {
        where.assigneeId = null;
      } else {
        where.assigneeId = assigneeId;
      }
    }
    if (search) {
      const searchFilter = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { ticketNumber: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      };
      if (where.AND) where.AND.push(searchFilter);
      else where = { ...where, ...searchFilter };
    }

    // Allowed sort fields
    const allowedSorts = ['createdAt', 'updatedAt', 'priority', 'status', 'ticketNumber'];
    const orderField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: ticketIncludes,
        skip,
        take,
        orderBy: { [orderField]: orderDir },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tickets
 * Create a new ticket.
 */
async function createTicket(req, res, next) {
  try {
    const { title, description, categoryId, priority = 'medium' } = req.body;
    const userId = req.user.id;

    // Create ticket with retry loop to avoid rare ticket_number unique collisions
    let ticket = null;
    const maxRetries = 5;
    let attempt = 0;
    while (!ticket) {
      attempt += 1;
      const ticketNumber = await generateTicketNumber();
      try {
        ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            title,
            description,
            categoryId: parseInt(categoryId),
            priority,
            status: 'open',
            requesterId: userId,
          },
          include: ticketIncludes,
        });
        break;
      } catch (err) {
        // Prisma unique constraint error code P2002 on ticket_number
        if (err.code === 'P2002' && attempt < maxRetries) {
          // retry: loop will compute a new ticketNumber
          continue;
        }
        throw err;
      }
    }

    // Log history
    await logTicketHistory(ticket.id, userId, 'Ticket creato', {
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      priority,
    });

    // Handle initial attachments if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await prisma.attachment.create({
          data: {
            ticketId: ticket.id,
            uploaderId: userId,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
          },
        });
      }
    }

    // Send email notification to technicians
    try {
      const technicians = await prisma.user.findMany({
        where: { role: { in: ['technician', 'admin'] }, isActive: true, isDeleted: false },
        select: { email: true },
      });

      const emailData = {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        category: ticket.category.name,
        priority: ticket.priority,
        status: ticket.status,
        requesterName: `${ticket.requester.firstName} ${ticket.requester.lastName}`,
        createdAt: ticket.createdAt,
      };

      for (const tech of technicians) {
        sendEmail({
          to: tech.email,
          subject: `🎫 Nuovo Ticket ${ticket.ticketNumber} — ${ticket.title}`,
          html: emailTemplates.ticketCreated(emailData, process.env.APP_URL),
        });
      }
    } catch (emailErr) {
      console.error('Email notification error:', emailErr.message);
    }

    // Refetch with attachments
    const fullTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: { ...ticketIncludes, attachments: true },
    });

    res.status(201).json(fullTicket);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tickets/:id
 * Get ticket detail.
 */
async function getTicket(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);
    const { role, id: userId } = req.user;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        ...ticketIncludes,
        attachments: {
          include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket');
    }

    // Access control: users can only see their own tickets
    if (role === 'user' && ticket.requesterId !== userId) {
      throw new ForbiddenError('Non hai accesso a questo ticket');
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/tickets/:id
 * Update ticket (status, priority, assignee).
 */
async function updateTicket(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);
    const { role, id: userId } = req.user;
    const { status, priority, assigneeId, categoryId } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { requester: true, assignee: true },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket');
    }

    // Role-based access
    if (role === 'user') {
      // Users can only close their own resolved tickets
      if (ticket.requesterId !== userId) {
        throw new ForbiddenError();
      }
      if (status && status !== 'closed') {
        throw new ForbiddenError('Puoi solo chiudere un ticket risolto');
      }
      if (status === 'closed' && ticket.status !== 'resolved') {
        throw new ForbiddenError('Il ticket deve essere risolto prima di poterlo chiudere');
      }
    }

    const updateData = {};
    const historyEntries = [];

    // Status change
    if (status && status !== ticket.status) {
      updateData.status = status;
      if (status === 'closed') {
        updateData.closedAt = new Date();
      } else if (ticket.closedAt) {
        updateData.closedAt = null;
      }
      historyEntries.push({
        action: 'Stato cambiato',
        details: { from: ticket.status, to: status },
      });

      // Email notification to requester on status change
      try {
        sendEmail({
          to: ticket.requester.email,
          subject: `📋 Ticket ${ticket.ticketNumber} — Stato aggiornato`,
          html: emailTemplates.ticketStatusChanged(
            { id: ticket.id, ticketNumber: ticket.ticketNumber, title: ticket.title },
            ticket.status,
            status,
            process.env.APP_URL
          ),
        });
      } catch (e) { /* non-blocking */ }
    }

    // Priority change
    if (priority && priority !== ticket.priority) {
      updateData.priority = priority;
      historyEntries.push({
        action: 'Priorità cambiata',
        details: { from: ticket.priority, to: priority },
      });
    }

    // Assignee change — only admins can assign to arbitrary users.
    if (assigneeId !== undefined) {
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('Solo un amministratore può assegnare il ticket ad altri');
      }

      if (assigneeId === null) {
        updateData.assigneeId = null;
        historyEntries.push({ action: 'Assegnazione rimossa', details: {} });
      } else {
        updateData.assigneeId = assigneeId;
        if (ticket.status === 'open') {
          updateData.status = 'in_progress';
        }
        const assignee = await prisma.user.findUnique({
          where: { id: assigneeId },
          select: { firstName: true, lastName: true, email: true },
        });
        if (assignee) {
          historyEntries.push({
            action: 'Ticket assegnato',
            details: { assigneeName: `${assignee.firstName} ${assignee.lastName}` },
          });

          // Email to assigned technician
          try {
            sendEmail({
              to: assignee.email,
              subject: `🎫 Ticket ${ticket.ticketNumber} assegnato a te`,
              html: emailTemplates.ticketAssigned(
                { id: ticket.id, ticketNumber: ticket.ticketNumber, title: ticket.title },
                `${assignee.firstName} ${assignee.lastName}`,
                process.env.APP_URL
              ),
            });
          } catch (e) { /* non-blocking */ }
        }
      }
    }

    // Category change
    if (categoryId && categoryId !== ticket.categoryId) {
      updateData.categoryId = parseInt(categoryId);
      historyEntries.push({
        action: 'Categoria cambiata',
        details: { from: ticket.categoryId, to: parseInt(categoryId) },
      });
    }

    if (Object.keys(updateData).length === 0) {
      return res.json(ticket);
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: ticketIncludes,
    });

    // Log all history entries
    for (const entry of historyEntries) {
      await logTicketHistory(ticketId, userId, entry.action, entry.details);
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tickets/:id/assign
 * Self-assign a ticket (technician takes it).
 */
async function selfAssignTicket(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);
    const userId = req.user.id;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundError('Ticket');
    }

    if (ticket.assigneeId) {
      throw new AppError('Questo ticket è già assegnato', 400);
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assigneeId: userId,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
      },
      include: ticketIncludes,
    });

    await logTicketHistory(ticketId, userId, 'Ticket preso in carico', {
      technicianName: `${req.user.firstName} ${req.user.lastName}`,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tickets/:id/messages
 */
async function getMessages(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);

    // Verify ticket access
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket');

    if (req.user.role === 'user' && ticket.requesterId !== req.user.id) {
      throw new ForbiddenError();
    }

    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tickets/:id/messages
 */
async function addMessage(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { email: true, firstName: true, lastName: true } },
        assignee: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    if (!ticket) throw new NotFoundError('Ticket');

    if (req.user.role === 'user' && ticket.requesterId !== userId) {
      throw new ForbiddenError();
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: userId,
        content,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    });

    // Handle attachments
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await prisma.attachment.create({
          data: {
            ticketId,
            messageId: message.id,
            uploaderId: userId,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
          },
        });
      }
    }

    // Update ticket's updatedAt
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    // Send email to the other party
    try {
      const senderName = `${req.user.firstName} ${req.user.lastName}`;
      let recipientEmail = null;

      if (userId === ticket.requesterId && ticket.assignee) {
        recipientEmail = ticket.assignee.email;
      } else if (userId !== ticket.requesterId) {
        recipientEmail = ticket.requester.email;
      }

      if (recipientEmail) {
        sendEmail({
          to: recipientEmail,
          subject: `💬 Nuovo messaggio su ${ticket.ticketNumber}`,
          html: emailTemplates.newMessage(
            { id: ticket.id, ticketNumber: ticket.ticketNumber, title: ticket.title },
            senderName,
            content,
            process.env.APP_URL
          ),
        });
      }
    } catch (e) { /* non-blocking */ }

    // Refetch with attachments
    const fullMessage = await prisma.ticketMessage.findUnique({
      where: { id: message.id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        attachments: true,
      },
    });

    res.status(201).json(fullMessage);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tickets/:id/history
 */
async function getHistory(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket');

    if (req.user.role === 'user' && ticket.requesterId !== req.user.id) {
      throw new ForbiddenError();
    }

    const history = await prisma.ticketHistory.findMany({
      where: { ticketId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  selfAssignTicket,
  getMessages,
  addMessage,
  getHistory,
};
