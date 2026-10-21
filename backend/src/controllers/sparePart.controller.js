const prisma = require('../lib/prisma');
const { AppError, NotFoundError } = require('../utils/errors');

function validateSparePartPayload(data = {}, { allowQuantity = true } = {}) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const code = typeof data.code === 'string' ? data.code.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const notes = typeof data.notes === 'string' ? data.notes.trim() : '';
  const quantity = Number(data.quantity ?? 0);

  if (!name) {
    throw new AppError('Il nome del ricambio è obbligatorio', 400);
  }

  if (allowQuantity && (!Number.isInteger(quantity) || quantity < 0)) {
    throw new AppError('La quantità disponibile deve essere un numero intero non negativo', 400);
  }

  return {
    name,
    code: code || null,
    description: description || null,
    quantity: allowQuantity ? quantity : 0,
    notes: notes || null,
  };
}

function validateTicketSparePartPayload(data = {}) {
  const sparePartId = typeof data.sparePartId === 'string' ? data.sparePartId.trim() : '';
  const quantity = Number(data.quantity ?? 0);

  if (!sparePartId) {
    throw new AppError('Il ricambio è obbligatorio', 400);
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AppError('La quantità utilizzata deve essere un numero intero maggiore di zero', 400);
  }

  return { sparePartId, quantity };
}

function normalizeUsedSpareParts(rawParts = []) {
  if (!Array.isArray(rawParts)) {
    throw new AppError('Lista ricambi utilizzati non valida', 400);
  }

  return rawParts.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new AppError('Ricambio non valido', 400);
    }

    const sparePartId = typeof entry.sparePartId === 'string' ? entry.sparePartId.trim() : '';
    const quantity = Number(entry.quantity ?? 0);

    if (!sparePartId) {
      throw new AppError('ID ricambio obbligatorio', 400);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError('Quantità ricambio non valida', 400);
    }

    return { sparePartId, quantity };
  });
}

async function listSpareParts(req, res, next) {
  try {
    const { search, includeInactive = 'false' } = req.query;
    const where = {};

    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { code: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const items = await prisma.sparePart.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function getSparePart(req, res, next) {
  try {
    const { id } = req.params;
    const item = await prisma.sparePart.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Ricambio');
    res.json(item);
  } catch (error) {
    next(error);
  }
}

async function createSparePart(req, res, next) {
  try {
    const payload = validateSparePartPayload(req.body, { allowQuantity: true });

    const existing = await prisma.sparePart.findFirst({
      where: {
        OR: [
          { name: payload.name },
          ...(payload.code ? [{ code: payload.code }] : []),
        ],
      },
    });

    if (existing) {
      throw new AppError('Esiste già un ricambio con lo stesso nome o codice', 409);
    }

    const item = await prisma.sparePart.create({ data: payload });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

async function updateSparePart(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.sparePart.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Ricambio');

    const payload = validateSparePartPayload(req.body, { allowQuantity: true });
    const updateData = { ...payload };

    if (req.body.isActive !== undefined) {
      updateData.isActive = Boolean(req.body.isActive);
    }

    const dup = await prisma.sparePart.findFirst({
      where: {
        id: { not: id },
        OR: [
          { name: payload.name },
          ...(payload.code ? [{ code: payload.code }] : []),
        ],
      },
    });

    if (dup) {
      throw new AppError('Esiste già un ricambio con lo stesso nome o codice', 409);
    }

    const item = await prisma.sparePart.update({
      where: { id },
      data: updateData,
    });

    res.json(item);
  } catch (error) {
    next(error);
  }
}

async function deleteSparePart(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.sparePart.findUnique({
      where: { id },
      include: { ticketUsages: true },
    });

    if (!existing) throw new NotFoundError('Ricambio');

    if (existing.ticketUsages.length > 0) {
      await prisma.sparePart.update({
        where: { id },
        data: { isActive: false },
      });
      return res.json({ message: 'Ricambio disattivato; lo storico dei ticket è stato mantenuto.' });
    }

    await prisma.sparePart.delete({ where: { id } });
    res.json({ message: 'Ricambio eliminato' });
  } catch (error) {
    next(error);
  }
}

async function getTicketSpareParts(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket');

    const items = await prisma.ticketSparePart.findMany({
      where: { ticketId },
      include: { sparePart: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function upsertTicketSparePart(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket');

    const payload = validateTicketSparePartPayload(req.body);
    const sparePart = await prisma.sparePart.findUnique({ where: { id: payload.sparePartId } });
    if (!sparePart) throw new NotFoundError('Ricambio');
    if (!sparePart.isActive) {
      throw new AppError('Questo ricambio è stato disattivato e non può essere usato', 400);
    }

    const item = await prisma.ticketSparePart.upsert({
      where: {
        ticketId_sparePartId: {
          ticketId,
          sparePartId: payload.sparePartId,
        },
      },
      create: {
        ticketId,
        sparePartId: payload.sparePartId,
        quantity: payload.quantity,
      },
      update: {
        quantity: payload.quantity,
      },
      include: { sparePart: true },
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

async function deleteTicketSparePart(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const sparePartId = req.params.sparePartId;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket');

    const item = await prisma.ticketSparePart.findUnique({
      where: {
        ticketId_sparePartId: {
          ticketId,
          sparePartId,
        },
      },
    });

    if (!item) return res.json({ message: 'Nessun ricambio associato al ticket' });

    await prisma.ticketSparePart.delete({
      where: {
        ticketId_sparePartId: {
          ticketId,
          sparePartId,
        },
      },
    });

    res.json({ message: 'Ricambio rimosso dal ticket' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateSparePartPayload,
  validateTicketSparePartPayload,
  normalizeUsedSpareParts,
  listSpareParts,
  getSparePart,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  getTicketSpareParts,
  upsertTicketSparePart,
  deleteTicketSparePart,
};
