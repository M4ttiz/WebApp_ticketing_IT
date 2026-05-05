// ============================================
// Dashboard Controller — Unified KPI endpoint
// ============================================

const prisma = require('../lib/prisma');

/**
 * GET /api/dashboard
 * Returns all KPIs, charts, and recent tickets.
 */
async function getDashboard(req, res, next) {
  try {
    const statusFilterRaw = String(req.query.status || 'ALL').toUpperCase();
    const statusFilter = ['OPEN', 'CLOSED', 'ALL'].includes(statusFilterRaw) ? statusFilterRaw : 'ALL';

    const monthRaw = req.query.month;
    const yearRaw = req.query.year;
    const month = monthRaw !== undefined ? parseInt(monthRaw, 10) : null;
    const year = yearRaw !== undefined ? parseInt(yearRaw, 10) : null;

    const hasMonthYear = Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(year) && year >= 1970;
    const rangeStart = hasMonthYear ? new Date(year, month - 1, 1, 0, 0, 0) : null;
    const rangeEnd = hasMonthYear ? new Date(year, month, 0, 23, 59, 59, 999) : null;

    const openStatuses = ['APERTO', 'IN_LAVORAZIONE', 'IN_ATTESA'];
    const closedStatuses = ['RISOLTO', 'CHIUSO', 'RIFIUTATO'];
    const resolvedStatuses = ['RISOLTO', 'CHIUSO'];

    const statusIn =
      statusFilter === 'OPEN' ? openStatuses
        : statusFilter === 'CLOSED' ? closedStatuses
          : null;

    const shouldShowOpen = statusFilter === 'ALL' || statusFilter === 'OPEN';
    const shouldShowClosed = statusFilter === 'ALL' || statusFilter === 'CLOSED';

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday

    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const { role, id: userId } = req.user;
    const normalizedRole = String(role || '').toLowerCase();

    if (normalizedRole === 'user') {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    // Base where clause depending on role
    const baseWhere = {};
    if (normalizedRole === 'technician') {
      baseWhere.assigneeId = userId;
    }

    const createdAtWhere = rangeStart && rangeEnd ? { createdAt: { gte: rangeStart, lte: rangeEnd } } : {};
    const statusWhereCreated = statusIn ? { status: { in: statusIn } } : {};

    // ─── KPI Counts ─────────────────────────
    const [
      totalOpen,
      inProgress,
      onHold,
      resolvedToday,
      totalTickets,
      avgResolutionTickets,
    ] = await Promise.all([
      shouldShowOpen ? prisma.ticket.count({ where: { ...baseWhere, ...createdAtWhere, status: 'APERTO' } }) : Promise.resolve(0),
      shouldShowOpen ? prisma.ticket.count({ where: { ...baseWhere, ...createdAtWhere, status: 'IN_LAVORAZIONE' } }) : Promise.resolve(0),
      shouldShowOpen ? prisma.ticket.count({ where: { ...baseWhere, ...createdAtWhere, status: 'IN_ATTESA' } }) : Promise.resolve(0),
      shouldShowClosed
        ? prisma.ticket.count({
          where: {
            ...baseWhere,
            status: { in: resolvedStatuses },
            closedAt: rangeStart && rangeEnd ? { gte: rangeStart, lte: rangeEnd } : { gte: startOfToday },
          },
        })
        : Promise.resolve(0),
      prisma.ticket.count({
        where: { ...baseWhere, ...createdAtWhere, ...statusWhereCreated },
      }),
      shouldShowClosed
        ? prisma.ticket.findMany({
          where: {
            ...baseWhere,
            status: { in: resolvedStatuses },
            closedAt: rangeStart && rangeEnd ? { gte: rangeStart, lte: rangeEnd } : { gte: startOfToday },
          },
          select: { createdAt: true, closedAt: true },
          take: 500,
          orderBy: { closedAt: 'desc' },
        })
        : Promise.resolve([]),
    ]);

    let avgResolutionHours = 0;
    if (avgResolutionTickets.length > 0) {
      const totalMs = avgResolutionTickets.reduce((sum, t) => sum + (t.closedAt.getTime() - t.createdAt.getTime()), 0);
      avgResolutionHours = Math.round((totalMs / avgResolutionTickets.length) / (1000 * 60 * 60) * 10) / 10;
    }

    // ─── Tickets by status (optional for front) ─────
    const byStatus = await prisma.ticket.groupBy({
      by: ['status'],
      where: { ...baseWhere, ...createdAtWhere, ...statusWhereCreated },
      _count: { id: true },
    });

    // ─── Tickets by category (bar chart) ─────
    const groupedByCategory = await prisma.ticket.groupBy({
      by: ['categoryId'],
      where: { ...baseWhere, ...createdAtWhere, ...statusWhereCreated },
      _count: { id: true },
    });

    const categoryIds = groupedByCategory.map((g) => g.categoryId).filter(Boolean);
    const categories = categoryIds.length
      ? await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } })
      : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const byCategory = groupedByCategory
      .map((g) => ({ category: categoryMap.get(g.categoryId) || '—', count: g._count.id }))
      .filter((x) => x.category !== '—')
      .sort((a, b) => b.count - a.count);

    // ─── Tickets by day (line chart) ─────
    const ticketsByDayStart = hasMonthYear ? rangeStart : sevenDaysAgo;
    const ticketsByDayEnd = hasMonthYear ? rangeEnd : now;

    const statusSql = statusIn
      ? ` AND status IN (${statusIn.map((s) => `'${s}'`).join(',')})`
      : '';
    const assigneeSql = normalizedRole === 'technician' ? ` AND assignee_id = '${userId}'` : '';

    const ticketsByDay = await prisma.$queryRawUnsafe(`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM tickets
      WHERE created_at BETWEEN '${ticketsByDayStart.toISOString()}' AND '${ticketsByDayEnd.toISOString()}'
      ${statusSql}
      ${assigneeSql}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // ─── Top agents by resolved tickets ─────
    const topAgents = shouldShowClosed
      ? await prisma.$queryRawUnsafe(`
        SELECT
          u.first_name || ' ' || u.last_name as name,
          COUNT(t.id)::int as resolved
        FROM tickets t
        JOIN users u ON t.assignee_id = u.id
        WHERE t.status IN ('RISOLTO', 'CHIUSO')
          AND t.closed_at ${rangeStart && rangeEnd ? `BETWEEN '${rangeStart.toISOString()}' AND '${rangeEnd.toISOString()}'` : `>= '${startOfWeek.toISOString()}'`}
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY resolved DESC
        LIMIT 5
      `)
      : [];

    const recentTickets = await prisma.ticket.findMany({
      where: { ...baseWhere, ...createdAtWhere, ...statusWhereCreated },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        requester: { select: { firstName: true, lastName: true } },
        assignee: { select: { firstName: true, lastName: true } },
      },
    });

    res.json({
      kpi: {
        totalOpen,
        inProgress,
        onHold,
        resolvedToday,
        totalTickets,
        avgResolutionHours,
      },
      charts: {
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
        byCategory,
        ticketsByDay,
      },
      topAgents,
      recentTickets,
    });
  } catch (err) {
    const knownSchemaIssues = err?.code === 'P2021' || String(err?.message || '').includes('invalid input value for enum');
    if (knownSchemaIssues) {
      return res.json({
        kpi: {
          totalOpen: 0,
          inProgress: 0,
          onHold: 0,
          resolvedToday: 0,
          totalTickets: 0,
          avgResolutionHours: 0,
        },
        charts: {
          byStatus: [],
          byCategory: [],
          ticketsByDay: [],
        },
        topAgents: [],
        recentTickets: [],
      });
    }
    console.error('Dashboard error:', err);
    next(err);
  }
}

module.exports = { getDashboard };

