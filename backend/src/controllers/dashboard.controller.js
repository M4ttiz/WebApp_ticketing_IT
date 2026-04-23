// ============================================
// Dashboard Controller — KPIs and chart data
// ============================================

const prisma = require('../lib/prisma');

/**
 * GET /api/dashboard/stats
 * Returns KPI cards data.
 */
async function getStats(req, res, next) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday

    const { role, id: userId } = req.user;

    // Base where clause depending on role
    const baseWhere = {};
    if (role === 'technician') {
      baseWhere.assigneeId = userId;
    }

    const [
      totalOpen,
      openToday,
      inProgress,
      resolvedThisWeek,
      totalTickets,
      avgResolutionTime,
    ] = await Promise.all([
      // Total open tickets
      prisma.ticket.count({
        where: { ...baseWhere, status: 'open' },
      }),
      // Opened today
      prisma.ticket.count({
        where: { ...baseWhere, createdAt: { gte: startOfToday } },
      }),
      // In progress
      prisma.ticket.count({
        where: { ...baseWhere, status: 'in_progress' },
      }),
      // Resolved this week
      prisma.ticket.count({
        where: {
          ...baseWhere,
          status: { in: ['resolved', 'closed'] },
          closedAt: { gte: startOfWeek },
        },
      }),
      // Total tickets
      prisma.ticket.count({ where: baseWhere }),
      // Average resolution time (for resolved/closed tickets)
      prisma.ticket.findMany({
        where: {
          ...baseWhere,
          closedAt: { not: null },
        },
        select: { createdAt: true, closedAt: true },
        take: 500,
        orderBy: { closedAt: 'desc' },
      }),
    ]);

    // Calculate avg resolution time in hours
    let avgHours = 0;
    if (avgResolutionTime.length > 0) {
      const totalMs = avgResolutionTime.reduce((sum, t) => {
        return sum + (t.closedAt.getTime() - t.createdAt.getTime());
      }, 0);
      avgHours = Math.round((totalMs / avgResolutionTime.length) / (1000 * 60 * 60) * 10) / 10;
    }

    // On-hold count
    const onHold = await prisma.ticket.count({
      where: { ...baseWhere, status: 'on_hold' },
    });

    res.json({
      totalOpen,
      openToday,
      inProgress,
      onHold,
      resolvedThisWeek,
      totalTickets,
      avgResolutionHours: avgHours,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/charts
 * Returns data for charts.
 */
async function getCharts(req, res, next) {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // ─── Tickets per day (trend line) ────────
    const ticketsByDay = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM tickets
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // ─── Distribution by status (pie) ────────
    const byStatus = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // ─── Distribution by category (bar) ──────
    const byCategory = await prisma.$queryRaw`
      SELECT c.name as category, COUNT(t.id)::int as count
      FROM tickets t
      JOIN categories c ON t.category_id = c.id
      GROUP BY c.name
      ORDER BY count DESC
    `;

    // ─── Tickets per technician (horizontal bar) ──
    const byTechnician = await prisma.$queryRaw`
      SELECT
        u.first_name || ' ' || u.last_name as name,
        COUNT(t.id)::int as total,
        COUNT(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 END)::int as resolved,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END)::int as in_progress
      FROM tickets t
      JOIN users u ON t.assignee_id = u.id
      WHERE u.role IN ('technician', 'admin')
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total DESC
      LIMIT 10
    `;

    // ─── Recent tickets ─────────────────────
    const recentTickets = await prisma.ticket.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        requester: { select: { firstName: true, lastName: true } },
        assignee: { select: { firstName: true, lastName: true } },
      },
    });

    res.json({
      ticketsByDay,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      byCategory,
      byTechnician,
      recentTickets,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getStats, getCharts };
