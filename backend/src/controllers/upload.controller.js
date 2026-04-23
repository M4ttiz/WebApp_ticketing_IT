// ============================================
// Upload Controller — File upload and serving
// ============================================

const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const { NotFoundError, ForbiddenError, AppError } = require('../utils/errors');

/**
 * POST /api/upload
 * Upload files (used standalone or with ticket/message creation).
 */
async function uploadFiles(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }
    // Verify ticket/message ownership if provided
    const ticketId = req.body.ticketId ? parseInt(req.body.ticketId) : null;
    const messageId = req.body.messageId ? parseInt(req.body.messageId) : null;

    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundError('Ticket');
      if (req.user.role === 'user' && ticket.requesterId !== req.user.id) {
        throw new ForbiddenError('Non puoi caricare file su questo ticket');
      }
      if (req.user.role === 'technician' && ticket.assigneeId && ticket.assigneeId !== req.user.id) {
        throw new ForbiddenError('Non puoi caricare file su questo ticket');
      }
    }

    if (messageId) {
      const message = await prisma.ticketMessage.findUnique({ where: { id: messageId } });
      if (!message) throw new NotFoundError('Messaggio');
      // ensure the message belongs to a ticket and check ticket access
      const ticket = await prisma.ticket.findUnique({ where: { id: message.ticketId } });
      if (!ticket) throw new NotFoundError('Ticket');
      if (req.user.role === 'user' && ticket.requesterId !== req.user.id) {
        throw new ForbiddenError('Non puoi caricare file su questo messaggio');
      }
      if (req.user.role === 'technician' && ticket.assigneeId && ticket.assigneeId !== req.user.id) {
        throw new ForbiddenError('Non puoi caricare file su questo messaggio');
      }
    }

    const attachments = [];
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');

    for (const file of req.files) {
      // ensure file path is inside uploads
      const resolved = path.resolve(file.path);
      if (!resolved.startsWith(uploadDir)) {
        // remove the file as an extra safety
        try { fs.unlinkSync(resolved); } catch (e) {}
        throw new AppError('Percorso file non valido', 400);
      }

      const attachment = await prisma.attachment.create({
        data: {
          ticketId: ticketId || null,
          messageId: messageId || null,
          uploaderId: req.user.id,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
        },
      });
      attachments.push(attachment);
    }

    res.status(201).json(attachments);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/uploads/:filename
 * Serve an uploaded file.
 */
async function serveFile(req, res, next) {
  try {
    const { filename } = req.params;
    const attachment = await prisma.attachment.findFirst({ where: { filename } });
    if (!attachment) throw new NotFoundError('File');

    // Determine associated ticket (direct or via message)
    let ticketId = attachment.ticketId;
    if (!ticketId && attachment.messageId) {
      const msg = await prisma.ticketMessage.findUnique({ where: { id: attachment.messageId }, select: { ticketId: true } });
      ticketId = msg?.ticketId || null;
    }

    // Access control
    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { requesterId: true, assigneeId: true } });
      if (!ticket) throw new NotFoundError('Ticket');

      if (req.user.role === 'user' && ticket.requesterId !== req.user.id) {
        throw new ForbiddenError('Non hai accesso a questo file');
      }

      if (req.user.role === 'technician' && ticket.assigneeId && ticket.assigneeId !== req.user.id) {
        throw new ForbiddenError('Non hai accesso a questo file');
      }
    }

    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    const filePath = path.resolve(attachment.path);
    if (!filePath.startsWith(uploadDir)) throw new NotFoundError('File non valido');
    if (!fs.existsSync(filePath)) throw new NotFoundError('File non trovato su disco');

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadFiles, serveFile };
