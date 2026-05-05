// ============================================
// Asset Controller — IT Asset Inventory
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { NotFoundError, ForbiddenError } = require('../utils/errors');

const ASSET_SELECT = {
  id: true,
  name: true,
  category: true,
  brand: true,
  model: true,
  serialNumber: true,
  assetTag: true,
  status: true,
  location: true,
  assignedTo: true,
  assignedUserId: true,
  assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
  purchaseDate: true,
  warrantyExpiry: true,
  notes: true,
  ipAddress: true,
  macAddress: true,
  osVersion: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { tickets: true } },
};

/**
 * GET /api/assets — Lista asset con filtri e paginazione
 */
async function listAssets(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(1000, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { category, status, search } = req.query;

    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        take: limit,
        skip,
        orderBy: [
          { assetTag: 'asc' },
          { name: 'asc' },
        ],
        select: ASSET_SELECT,
      }),
      prisma.asset.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/assets/analytics/top-open-tickets
 * KPI Top prodotti per ticket aperti
 */
async function topOpenTicketsByProduct(req, res, next) {
  try {
    const { category, location, department, search, status = 'OPEN', month, year } = req.query;
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));

    const where = {};
    if (category) where.category = category;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (department) where.assignedTo = { contains: department, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      select: {
        id: true,
        name: true,
        model: true,
        category: true,
        location: true,
        assignedTo: true,
        assetTag: true,
      },
    });

    if (!assets.length) {
      return res.json({ items: [] });
    }

    const assetIds = assets.map((asset) => asset.id);
    const openStatuses = ['APERTO', 'IN_LAVORAZIONE', 'IN_ATTESA'];
    const closedStatuses = ['RISOLTO', 'CHIUSO', 'RIFIUTATO'];
    const selectedStatuses = status === 'CLOSED'
      ? closedStatuses
      : status === 'ALL'
        ? [...openStatuses, ...closedStatuses]
        : openStatuses;

    let createdAt;
    if (month || year) {
      const now = new Date();
      const y = Number(year || now.getFullYear());
      const m = Number(month || 1);
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 1, 0, 0, 0, 0);
      createdAt = { gte: start, lt: end };
    }

    const grouped = await prisma.ticketAsset.groupBy({
      by: ['assetId'],
      where: {
        assetId: { in: assetIds },
        ticket: {
          status: { in: selectedStatuses },
          ...(createdAt ? { createdAt } : {}),
        },
      },
      _count: { ticketId: true },
    });

    const countsByAsset = new Map(grouped.map((g) => [g.assetId, g._count.ticketId]));

    const items = assets
      .map((asset) => ({
        id: asset.id,
        descrizione: asset.name,
        modello: asset.model || '-',
        categoria: asset.category,
        sede: asset.location || '-',
        reparto: asset.assignedTo || '-',
        codiceProdotto: asset.assetTag || '',
        openTickets: countsByAsset.get(asset.id) || 0,
      }))
      .filter((item) => item.openTickets > 0)
      .sort((a, b) => {
        if (b.openTickets !== a.openTickets) return b.openTickets - a.openTickets;
        return a.codiceProdotto.localeCompare(b.codiceProdotto, 'it');
      })
      .slice(0, limit);

    return res.json({ items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/assets/:id — Dettaglio asset con ticket collegati
 */
async function getAsset(req, res, next) {
  try {
    const { id } = req.params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        tickets: {
          include: {
            ticket: {
              select: {
                id: true,
                ticketNumber: true,
                title: true,
                status: true,
                priority: true,
                createdAt: true,
                requester: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset) throw new NotFoundError('Asset non trovato');

    res.json(asset);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/assets — Crea asset (admin o technician)
 */
async function createAsset(req, res, next) {
  try {
    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      assetTag,
      status,
      location,
      assignedTo,
      assignedUserId,
      purchaseDate,
      warrantyExpiry,
      notes,
      ipAddress,
      macAddress,
      osVersion,
    } = req.body;

    const asset = await prisma.asset.create({
      data: {
        name,
        category,
        brand: brand || null,
        model: model || null,
        serialNumber: serialNumber || null,
        assetTag: assetTag || null,
        status: status || 'DISPONIBILE',
        location: location || null,
        assignedTo,
        assignedTo: assignedTo || null,
        assignedUserId: assignedUserId || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        notes: notes || null,
        ipAddress: ipAddress || null,
        macAddress: macAddress || null,
        osVersion: osVersion || null,
      },
      select: ASSET_SELECT,
    });

    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/assets/:id — Modifica asset (admin o technician)
 */
async function updateAsset(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Asset non trovato');

    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      assetTag,
      status,
      location,
      assignedTo,
      assignedUserId,
      purchaseDate,
      warrantyExpiry,
      notes,
      ipAddress,
      macAddress,
      osVersion,
    } = req.body;

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        category,
        brand: brand || null,
        model: model || null,
        serialNumber: serialNumber || null,
        assetTag: assetTag || null,
        status,
        location: location || null,
        assignedTo: assignedTo || null,
        assignedUserId: assignedUserId || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        notes: notes || null,
        ipAddress: ipAddress || null,
        macAddress: macAddress || null,
        osVersion: osVersion || null,
      },
      select: ASSET_SELECT,
    });

    res.json(asset);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/assets/:id — Elimina asset (admin only)
 */
async function deleteAsset(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Asset non trovato');

    await prisma.asset.delete({ where: { id } });
    res.json({ message: 'Asset eliminato' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/assets/:id/link-ticket — Collega asset a ticket
 */
async function linkTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId obbligatorio' });
    }

    const [asset, ticket] = await Promise.all([
      prisma.asset.findUnique({ where: { id } }),
      prisma.ticket.findUnique({ where: { id: parseInt(ticketId, 10) } }),
    ]);

    if (!asset) throw new NotFoundError('Asset non trovato');
    if (!ticket) throw new NotFoundError('Ticket non trovato');

    await prisma.ticketAsset.create({
      data: {
        assetId: id,
        ticketId: parseInt(ticketId, 10),
      },
    });

    res.status(201).json({ message: 'Ticket collegato all\'asset' });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ticket già collegato a questo asset' });
    }
    next(err);
  }
}

/**
 * DELETE /api/assets/:id/unlink-ticket/:ticketId — Scollega asset da ticket
 */
async function unlinkTicket(req, res, next) {
  try {
    const { id, ticketId } = req.params;

    const link = await prisma.ticketAsset.findUnique({
      where: { ticketId_assetId: { assetId: id, ticketId: parseInt(ticketId, 10) } },
    });

    if (!link) throw new NotFoundError('Collegamento non trovato');

    await prisma.ticketAsset.delete({
      where: { ticketId_assetId: { assetId: id, ticketId: parseInt(ticketId, 10) } },
    });

    res.json({ message: 'Ticket scollegato dall\'asset' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  linkTicket,
  unlinkTicket,
  topOpenTicketsByProduct,
};
