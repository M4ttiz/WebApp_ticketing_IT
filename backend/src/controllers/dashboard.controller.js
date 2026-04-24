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
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday

    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const { role, id: userId } = req.user;

    // Base where clause depending on role
    const baseWhere = {};
    if (role === 'technician') {
      baseWhere.assigneeId = userId;
    }

    // ─── KPI Counts ─────────────────────────
    const [
      totalOpen,
      inProgress,
      onHold,
      resolvedToday,
      totalTickets,
      avgResolutionTickets,
    ] = await Promise.all([
      prisma.ticket.count({ where: { ...baseWhere, status: 'APERTO' } }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'IN_LAVORAZIONE' } }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'IN_ATTESA' } }),
      prisma.ticket.count({
        where: {
          ...baseWhere,
          status: { in: ['RISOLTO', 'CHIUSO'] },
          closedAt: { gte: startOfToday },
        },
      }),
      prisma.ticket.count({ where: baseWhere }),
      prisma.ticket.findMany({
        where: { ...baseWhere, closedAt: { not: null } },
        select: { createdAt: true, closedAt: true },
        take: 500,
        orderBy: { closedAt: 'desc' },
      }),
    ]);

    // Calculate avg resolution time in hours
    let avgResolutionHours = 0;
    if (avgResolutionTickets.length > 0) {
      const totalMs = avgResolutionTickets.reduce((sum, t) => {
        return sum + (t.closedAt.getTime() - t.createdAt.getTime());
      }, 0);
      avgResolutionHours = Math.round((totalMs / avgResolutionTickets.length) / (1000 * 60 * 60) * 10) / 10;
    }

    // ─── Tickets by status (for charts) ─────
    const byStatus = await prisma.ticket.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { id: true },
    });

    // ─── Tickets by category (for bar chart) ─
    const byCategory = await prisma.$queryRaw`
      SELECT c.name as category, COUNT(t.id)::int as count
      FROM tickets t
      JOIN categories c ON t.category_id = c.id
      ${role === 'technician' ? prisma.$queryRaw`WHERE t.assignee_id = ${userId}` : prisma.$queryRaw``}
      GROUP BY c.name
      ORDER BY count DESC
    `;

    // ─── Tickets created last 7 days ────────
    const ticketsByDay = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM tickets
      WHERE created_at >= ${sevenDaysAgo}
      ${role === 'technician' ? prisma.$queryRaw`AND assignee_id = ${userId}` : prisma.$queryRaw``}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // ─── Top 5 agents by resolved tickets ───
    const topAgents = await prisma.$queryRaw`
      SELECT
        u.first_name || ' ' || u.last_name as name,
        COUNT(t.id)::int as resolved
      FROM tickets t
      JOIN users u ON t.assignee_id = u.id
      WHERE t.status IN ('RISOLTO', 'CHIUSO')
      AND t.closed_at >= ${startOfWeek}
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY resolved DESC
      LIMIT 5
    `;

    // ─── Recent tickets ─────────────────────
    const recentTickets = await prisma.ticket.findMany({
      where: baseWhere,
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
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };

