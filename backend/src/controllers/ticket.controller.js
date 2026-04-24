// ============================================
// Ticket Controller — CRUD, assign, messages, comments, history, audit log
// ============================================

const prisma = require('../lib/prisma');
const { generateTicketNumber } = require('../services/ticket.service');
const { sendEmail } = require('../services/email.service');
const emailTemplates = require('../utils/emailTemplates');
const { NotFoundError, ForbiddenError, AppError } = require('../utils/errors');

// ─── Allowed state transitions ─────────────
const ALLOWED_TRANSITIONS = {
  APERTO: ['IN_LAVORAZIONE', 'RIFIUTATO'],
  IN_LAVORAZIONE: ['IN_ATTESA', 'RISOLTO'],
  IN_ATTESA: ['IN_LAVORAZIONE', 'CHIUSO'],
  RISOLTO: ['CHIUSO', 'APERTO'],
  CHIUSO: [],
  RIFIUTATO: [],
};

// ─── Shared includes for ticket queries ────
const ticketIncludes = {
  category: { select: { id: true, name: true } },
  requester: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
  _count: { select: { messages: true, attachments: true } },
};

// ─── Audit Log helper ──────────────────────
async function createAuditLog(ticketId, userId, action, oldValue = null, newValue = null) {
  return prisma.auditLog.create({
    data: { ticketId, userId, action, oldValue, newValue },
  });
}

// ─── Notification helper ───────────────────
async function createNotification(userId, title, message, ticketId = null) {
  return prisma.notification.create({
    data: { userId, title, message, ticketId },
  });
}

/**
 * GET /api/tickets
 * List tickets — filtered by role with advanced filters.
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
      assignedTo,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause based on role
    let where = {};

    if (role === 'user') {
      where.requesterId = userId;
    } else if (role === 'technician') {
      where.AND = [{ OR: [{ assigneeId: userId }, { assigneeId: null }] }];
    }

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
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        where.assigneeId = null;
      } else {
        where.assigneeId = assignedTo;
      }
    }
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.createdAt = dateFilter;
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
    const { title, description, categoryId, priority = 'MEDIA' } = req.body;
    const userId = req.user.id;

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
            status: 'APERTO',
            requesterId: userId,
          },
          include: ticketIncludes,
        });
        break;
      } catch (err) {
        if (err.code === 'P2002' && attempt < maxRetries) {
          continue;
        }
        throw err;
      }
    }

    await createAuditLog(ticket.id, userId, 'Ticket creato', null, JSON.stringify({ ticketNumber: ticket.ticketNumber, title, priority }));

    // Handle initial attachments
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

    // Notify technicians
    try {
      const technicians = await prisma.user.findMany({
        where: { role: { in: ['technician', 'admin'] }, isActive: true, isDeleted: false },
        select: { id: true, email: true },
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
        await createNotification(tech.id, 'Nuovo ticket assegnato', `Ticket ${ticket.ticketNumber} è stato creato e ti è stato assegnato.`, ticket.id);
      }
    } catch (emailErr) {
      console.error('Email notification error:', emailErr.message);
    }

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
        auditLogs: {
          include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket');
    }

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
 * Update ticket (priority, category only).
 */
async function updateTicket(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);
    const { role, id: userId } = req.user;
    const { priority, categoryId } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { requester: true },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket');
    }

    if (role === 'user' && ticket.requesterId !== userId) {
      throw new ForbiddenError();
    }

    const updateData = {};

    if (priority && priority !== ticket.priority) {
      updateData.priority = priority;
      await createAuditLog(ticketId, userId, 'Priorità cambiata', ticket.priority, priority);
    }

    if (categoryId && parseInt(categoryId) !== ticket.categoryId) {
      updateData.categoryId = parseInt(categoryId);
      await createAuditLog(ticketId, userId, 'Categoria cambiata', String(ticket.categoryId), String(categoryId));
    }

    if (Object.keys(updateData).length === 0) {
      return res.json(ticket);
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: ticketIncludes,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/tickets/:id/status
 * Change status with state-machine validation.
 */
async function changeStatus(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;
    const { role, id: userId } = req.user;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { requester: true, assignee: true },
    });

    if (!ticket) throw new NotFoundError('Ticket');

    if (role === 'user' && ticket.requesterId !== userId) {
      throw new ForbiddenError();
    }

    // Users can only close their own resolved tickets
    if (role === 'user') {
      if (status !== 'CHIUSO') {
        throw new ForbiddenError('Puoi solo chiudere un ticket risolto');
      }
      if (ticket.status !== 'RISOLTO') {
        throw new ForbiddenError('Il ticket deve essere risolto prima di poterlo chiudere');
      }
    }

    // State machine validation
    if (ticket.status === status) {
      return res.json(ticket);
    }

    const allowed = ALLOWED_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(`Transizione non permessa da ${ticket.status} a ${status}`, 400);
    }

    const updateData = { status };
    if (status === 'CHIUSO') {
      updateData.closedAt = new Date();
    } else if (ticket.closedAt) {
      updateData.closedAt = null;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: ticketIncludes,
    });

    await createAuditLog(ticketId, userId, 'Stato cambiato', ticket.status, status);

    // Email notification to requester
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

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/tickets/:id/assign
 * Assign ticket to an agent (admin only).
 */
async function assignTicket(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);
    const { assigneeId } = req.body;
    const { id: userId } = req.user;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { requester: true },
    });

    if (!ticket) throw new NotFoundError('Ticket');

    const updateData = {};
    let oldAssignee = ticket.assigneeId;

    if (assigneeId === null || assigneeId === undefined) {
      updateData.assigneeId = null;
      await createAuditLog(ticketId, userId, 'Assegnazione rimossa', oldAssignee || 'Nessuno', 'Nessuno');
    } else {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      });
      if (!assignee) throw new NotFoundError('Agente');

      updateData.assigneeId = assigneeId;
      if (ticket.status === 'APERTO') {
        updateData.status = 'IN_LAVORAZIONE';
      }

      await createAuditLog(ticketId, userId, 'Ticket assegnato', oldAssignee || 'Nessuno', `${assignee.firstName} ${assignee.lastName}`);

      // Notify assignee
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
        await createNotification(assignee.id, 'Ticket assegnato', `Ti è stato assegnato il ticket ${ticket.ticketNumber}.`, ticket.id);
      } catch (e) { /* non-blocking */ }
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: ticketIncludes,
    });

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
        status: ticket.status === 'APERTO' ? 'IN_LAVORAZIONE' : ticket.status,
      },
      include: ticketIncludes,
    });

    await createAuditLog(ticketId, userId, 'Ticket preso in carico', 'Nessuno', `${req.user.firstName} ${req.user.lastName}`);

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tickets/:id/comments
 * Add a comment (public or internal).
 */
async function addComment(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);
    const { content, isInternal = false } = req.body;
    const userId = req.user.id;
    const { role } = req.user;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { email: true, firstName: true, lastName: true } },
        assignee: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    if (!ticket) throw new NotFoundError('Ticket');

    if (role === 'user' && ticket.requesterId !== userId) {
      throw new ForbiddenError();
    }

    // Customers cannot post internal comments
    if (role === 'user' && isInternal) {
      throw new ForbiddenError('Non puoi creare commenti interni');
    }

    const comment = await prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: userId,
        content,
        isInternal: !!isInternal,
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
            messageId: comment.id,
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

    // Update ticket updatedAt
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    await createAuditLog(ticketId, userId, isInternal ? 'Commento interno aggiunto' : 'Commento pubblico aggiunto', null, content.slice(0, 200));

    // Send email to the other party (only for public comments)
    if (!isInternal) {
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
    }

    // Refetch with attachments
    const fullComment = await prisma.ticketMessage.findUnique({
      where: { id: comment.id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        attachments: true,
      },
    });

    res.status(201).json(fullComment);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tickets/:id/messages
 * Get messages (hides internal comments from customers).
 */
async function getMessages(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id);
    const { role, id: userId } = req.user;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket');

    if (role === 'user' && ticket.requesterId !== userId) {
      throw new ForbiddenError();
    }

    const where = { ticketId };
    if (role === 'user') {
      where.isInternal = false;
    }

    const messages = await prisma.ticketMessage.findMany({
      where,
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
 * Legacy message endpoint (public only).
 */
async function addMessage(req, res, next) {
  try {
    req.body.isInternal = false;
    return addComment(req, res, next);
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
  changeStatus,
  assignTicket,
  selfAssignTicket,
  addComment,
  getMessages,
  addMessage,
  getHistory,
};

