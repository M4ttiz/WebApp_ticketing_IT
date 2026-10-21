const { randomUUID } = require('crypto');
const prisma = require('../lib/prisma');
const { AppError, NotFoundError } = require('../utils/errors');

function validateSparePartPayload(data = {}, { allowQuantity = true, requireName = true } = {}) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const code = typeof data.code === 'string' ? data.code.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const notes = typeof data.notes === 'string' ? data.notes.trim() : '';
  const quantity = Number(data.quantity ?? 0);
  const minimumStock = Number(data.minimumStock ?? data.minimum_stock ?? 0);

  if (requireName && !name) {
    throw new AppError('Il nome del ricambio è obbligatorio', 400);
  }

  if (allowQuantity && (!Number.isInteger(quantity) || quantity < 0)) {
    throw new AppError('La quantità disponibile deve essere un numero intero non negativo', 400);
  }

  if (allowQuantity && (!Number.isInteger(minimumStock) || minimumStock < 0)) {
    throw new AppError('La soglia minima di stock deve essere un numero intero non negativo', 400);
  }

  return {
    name,
    code: code || null,
    description: description || null,
    quantity: allowQuantity ? quantity : 0,
    notes: notes || null,
    minimumStock: allowQuantity ? minimumStock : 0,
  };
}

async function applyMinimumStockToSparePart(id, minimumStock) {
  if (minimumStock === undefined || minimumStock === null) {
    return null;
  }

  const parsed = Number(minimumStock);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError('La soglia minima di stock deve essere un numero intero non negativo', 400);
  }

  await prisma.$executeRawUnsafe(`UPDATE "spare_parts" SET "minimum_stock" = ${parsed} WHERE "id" = '${id}'`);
  return parsed;
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

async function appendSparePartStockMovement(tx, { sparePartId, ticketId = null, movementType, quantity, note = null }) {
  const normalizedType = movementType === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
  const ticketValue = ticketId === null || ticketId === undefined ? 'NULL' : Number(ticketId);
  const noteValue = note ? String(note).replace(/'/g, "''") : null;

  await tx.$executeRawUnsafe(`
    INSERT INTO "spare_part_stock_movements"
      ("spare_part_id", "ticket_id", "movement_type", "quantity", "note", "created_at")
    VALUES ('${sparePartId}', ${ticketValue}, '${normalizedType}', ${Number(quantity)}, ${noteValue ? `'${noteValue}'` : 'NULL'}, NOW())
  `);
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

    const whereSql = [];
    if (includeInactive !== 'true') {
      whereSql.push('sp.is_active = true');
    }

    if (search) {
      const escaped = String(search).replace(/'/g, "''");
      whereSql.push(`(LOWER(sp.name) LIKE '%${escaped.toLowerCase()}%' OR LOWER(COALESCE(sp.code, '')) LIKE '%${escaped.toLowerCase()}%' OR LOWER(COALESCE(sp.description, '')) LIKE '%${escaped.toLowerCase()}%')`);
    }

    const items = await prisma.$queryRawUnsafe(`
      SELECT
        sp.id,
        sp.name,
        sp.code,
        sp.description,
        sp.quantity,
        sp.notes,
        sp.is_active AS "isActive",
        sp.created_at AS "createdAt",
        sp.updated_at AS "updatedAt",
        COALESCE(sp.minimum_stock, 0)::int AS "minimumStock"
      FROM spare_parts sp
      ${whereSql.length ? `WHERE ${whereSql.join(' AND ')}` : ''}
      ORDER BY sp.is_active DESC, sp.name ASC
    `);

    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function getSparePart(req, res, next) {
  try {
    const { id } = req.params;
    const items = await prisma.$queryRawUnsafe(`
      SELECT
        sp.id,
        sp.name,
        sp.code,
        sp.description,
        sp.quantity,
        sp.notes,
        sp.is_active AS "isActive",
        sp.created_at AS "createdAt",
        sp.updated_at AS "updatedAt",
        COALESCE(sp.minimum_stock, 0)::int AS "minimumStock"
      FROM spare_parts sp
      WHERE sp.id = '${id}'
      LIMIT 1
    `);

    if (!items.length) throw new NotFoundError('Ricambio');
    res.json(items[0]);
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

    const item = await prisma.sparePart.create({
      data: {
        id: randomUUID(),
        name: payload.name,
        code: payload.code,
        description: payload.description,
        quantity: payload.quantity,
        notes: payload.notes,
        isActive: true,
      },
    });

    await applyMinimumStockToSparePart(item.id, payload.minimumStock);
    res.status(201).json({ ...item, minimumStock: payload.minimumStock });
  } catch (error) {
    next(error);
  }
}

async function updateSparePart(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.sparePart.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Ricambio');

    const payload = validateSparePartPayload(req.body, { allowQuantity: true, requireName: false });
    const updateData = {};

    if (req.body.name !== undefined) updateData.name = payload.name || existing.name;
    if (req.body.code !== undefined) updateData.code = payload.code || null;
    if (req.body.description !== undefined) updateData.description = payload.description || null;
    if (req.body.quantity !== undefined) updateData.quantity = payload.quantity;
    if (req.body.notes !== undefined) updateData.notes = payload.notes || null;
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);

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

    const delta = req.body.quantity !== undefined ? Number(payload.quantity) - Number(existing.quantity ?? 0) : 0;

    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.sparePart.update({
        where: { id },
        data: updateData,
      });

      if (req.body.quantity !== undefined && delta > 0) {
        await appendSparePartStockMovement(tx, {
          sparePartId: id,
          movementType: 'POSITIVE',
          quantity: delta,
          note: 'Acquisto / rifornimento',
        });
      }

      return updated;
    });

    const minimumStock = req.body.minimumStock !== undefined || req.body.minimum_stock !== undefined
      ? await applyMinimumStockToSparePart(id, req.body.minimumStock ?? req.body.minimum_stock)
      : Number(existing.quantity ?? 0) >= 0 ? await prisma.$queryRawUnsafe(`SELECT COALESCE("minimum_stock", 0)::int AS "minimumStock" FROM "spare_parts" WHERE "id" = '${id}' LIMIT 1`) : null;

    res.json({
      ...item,
      minimumStock: minimumStock && Array.isArray(minimumStock) ? Number(minimumStock[0]?.minimumStock ?? 0) : Number(minimumStock ?? 0),
    });
  } catch (error) {
    next(error);
  }
}

async function getSparePartHistory(req, res, next) {
  try {
    const { id } = req.params;
    const item = await prisma.sparePart.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Ricambio');

    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        sm.id,
        sm."created_at" AS "createdAt",
        sm.quantity,
        sm."movement_type" AS "movementType",
        sm.note,
        sm."ticket_id" AS "ticketId",
        t."ticket_number" AS "ticketNumber",
        t.title AS "ticketTitle",
        t.status AS "ticketStatus"
      FROM "spare_part_stock_movements" sm
      LEFT JOIN "tickets" t ON t.id = sm."ticket_id"
      WHERE sm."spare_part_id" = '${id}'
      ORDER BY sm."created_at" DESC
    `);

    const history = rows.map((entry) => ({
      id: entry.id,
      ticketId: entry.ticketId,
      ticketNumber: entry.ticketNumber,
      title: entry.ticketId ? entry.ticketTitle : (entry.note || 'Acquisto / rifornimento'),
      status: entry.ticketStatus,
      quantity: Number(entry.quantity),
      movementType: entry.movementType,
      note: entry.note,
      createdAt: entry.createdAt,
    }));

    res.json(history);
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

    const existingUsage = await prisma.ticketSparePart.findUnique({
      where: {
        ticketId_sparePartId: {
          ticketId,
          sparePartId: payload.sparePartId,
        },
      },
    });

    const currentTicketQty = existingUsage?.quantity || 0;
    const delta = payload.quantity - currentTicketQty;

    if (delta > 0 && sparePart.quantity < delta) {
      throw new AppError(`Giacenza insufficiente per "${sparePart.name}"`, 400);
    }

    const nextQuantity = delta > 0
      ? sparePart.quantity - delta
      : sparePart.quantity + Math.abs(delta);

    const item = await prisma.$transaction(async (tx) => {
      await tx.sparePart.update({
        where: { id: sparePart.id },
        data: { quantity: nextQuantity },
      });

      if (delta > 0) {
        await appendSparePartStockMovement(tx, {
          sparePartId: payload.sparePartId,
          ticketId,
          movementType: 'NEGATIVE',
          quantity: delta,
          note: 'Utilizzo su ticket',
        });
      }

      if (delta < 0) {
        await appendSparePartStockMovement(tx, {
          sparePartId: payload.sparePartId,
          ticketId,
          movementType: 'POSITIVE',
          quantity: Math.abs(delta),
          note: 'Rimborso stock ticket',
        });
      }

      return tx.ticketSparePart.upsert({
        where: {
          ticketId_sparePartId: {
            ticketId,
            sparePartId: payload.sparePartId,
          },
        },
        create: {
          id: randomUUID(),
          ticketId,
          sparePartId: payload.sparePartId,
          quantity: payload.quantity,
        },
        update: {
          quantity: payload.quantity,
        },
        include: { sparePart: true },
      });
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
      include: { sparePart: true },
    });

    if (!item) return res.json({ message: 'Nessun ricambio associato al ticket' });

    await prisma.$transaction(async (tx) => {
      await tx.sparePart.update({
        where: { id: sparePartId },
        data: {
          quantity: item.sparePart.quantity + item.quantity,
        },
      });

      await appendSparePartStockMovement(tx, {
        sparePartId,
        ticketId,
        movementType: 'POSITIVE',
        quantity: item.quantity,
        note: 'Rimozione utilizzo ticket',
      });

      await tx.ticketSparePart.delete({
        where: {
          ticketId_sparePartId: {
            ticketId,
            sparePartId,
          },
        },
      });
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
  getSparePartHistory,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  getTicketSpareParts,
  upsertTicketSparePart,
  deleteTicketSparePart,
};
