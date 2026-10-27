const prisma = require('../lib/prisma');

const WEEKDAY = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function localToUtc(year, month, day, hour, minute, timeZone) {
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let i = 0; i < 3; i += 1) {
    const p = zonedParts(new Date(guess), timeZone);
    const represented = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    guess += target - represented;
  }
  return new Date(guess);
}

function nextOccurrence(rule, after = new Date()) {
  const p = zonedParts(after, rule.timeZone);
  const [hour, minute] = rule.time.split(':').map(Number);
  const start = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  for (let offset = 0; offset <= 370; offset += 1) {
    const day = new Date(start.getTime() + offset * 86400000);
    const weekday = day.getUTCDay();
    if (rule.frequency === 'WEEKLY' && weekday !== rule.dayOfWeek) continue;
    if (rule.frequency === 'MONTHLY' && day.getUTCDate() !== rule.dayOfMonth) continue;
    const candidate = localToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hour, minute, rule.timeZone);
    if (candidate > after) return candidate;
  }
  throw new Error('Impossibile calcolare la prossima esecuzione');
}

async function runDueRecurringTickets() {
  const now = new Date();
  const due = await prisma.recurringTicket.findMany({ where: { isActive: true, nextRunAt: { lte: now } }, take: 50, orderBy: { nextRunAt: 'asc' } });
  for (const rule of due) {
    try {
      await prisma.$transaction(async (tx) => {
        const nextRunAt = nextOccurrence(rule, now);
        const claimed = await tx.recurringTicket.updateMany({
          where: { id: rule.id, isActive: true, nextRunAt: rule.nextRunAt },
          data: { nextRunAt },
        });
        if (claimed.count !== 1) return;
        const last = await tx.ticket.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
        const ticketNumber = `TKT-${String((last?.id || 0) + 1).padStart(4, '0')}`;
        await tx.ticket.create({ data: {
          ticketNumber, title: rule.title, description: rule.description, categoryId: rule.categoryId,
          priority: rule.priority, status: 'APERTO', requesterId: rule.requesterId,
          recurringTemplateId: rule.id, occurrenceAt: rule.nextRunAt,
        } });
      });
    } catch (error) {
      console.error(`Errore creazione ticket ricorrente ${rule.id}:`, error.message);
    }
  }
}

function startRecurringTicketScheduler() {
  runDueRecurringTickets();
  const timer = setInterval(runDueRecurringTickets, 30000);
  timer.unref();
}

module.exports = { nextOccurrence, runDueRecurringTickets, startRecurringTicketScheduler };
