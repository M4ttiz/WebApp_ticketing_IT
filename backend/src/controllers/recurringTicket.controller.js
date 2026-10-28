const prisma = require('../lib/prisma');
const { nextOccurrence } = require('../services/recurringTicket.service');
const { AppError } = require('../utils/errors');

async function list(req, res, next) {
  try {
    res.json(await prisma.recurringTicket.findMany({ include: { category: { select: { id: true, name: true } }, _count: { select: { tickets: true } } }, orderBy: [{ isActive: 'desc' }, { nextRunAt: 'asc' }] }));
  } catch (error) { next(error); }
}

async function create(req, res, next) {
  try {
    const { title, description, categoryId, priority = 'MEDIA', frequency, dayOfWeek, dayOfMonth, time } = req.body;
    const rule = { frequency, dayOfWeek: dayOfWeek ?? null, dayOfMonth: dayOfMonth ?? null, time, timeZone: 'Europe/Rome' };
    const created = await prisma.recurringTicket.create({ data: {
      title: title.trim(), description: description.trim(), categoryId: Number(categoryId), priority,
      ...rule, nextRunAt: nextOccurrence(rule), requesterId: req.user.id,
    }, include: { category: { select: { id: true, name: true } } } });
    res.status(201).json(created);
  } catch (error) { next(error); }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const current = await prisma.recurringTicket.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Pianificazione non trovata' });
    if (req.body.isActive !== undefined && Object.keys(req.body).length === 1) {
      return res.json(await prisma.recurringTicket.update({ where: { id }, data: { isActive: req.body.isActive } }));
    }
    const { title, description, categoryId, priority, frequency, dayOfWeek, dayOfMonth, time } = req.body;
    const nextFrequency = frequency ?? current.frequency;
    const rule = {
      frequency: nextFrequency,
      dayOfWeek: nextFrequency === 'WEEKLY'
        ? (dayOfWeek !== undefined ? Number(dayOfWeek) : current.dayOfWeek)
        : null,
      dayOfMonth: nextFrequency === 'MONTHLY'
        ? (dayOfMonth !== undefined ? Number(dayOfMonth) : current.dayOfMonth)
        : null,
      time: time ?? current.time,
      timeZone: current.timeZone,
    };
    if (rule.frequency === 'WEEKLY' && rule.dayOfWeek === null) {
      throw new AppError('Seleziona il giorno della settimana', 400);
    }
    if (rule.frequency === 'MONTHLY' && rule.dayOfMonth === null) {
      throw new AppError('Seleziona il giorno del mese', 400);
    }
    const scheduleChanged = frequency !== undefined || dayOfWeek !== undefined
      || dayOfMonth !== undefined || time !== undefined;
    const data = {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
      ...(priority !== undefined && { priority }), ...rule,
      ...(scheduleChanged && { nextRunAt: nextOccurrence(rule) }),
    };
    res.json(await prisma.recurringTicket.update({ where: { id }, data, include: { category: { select: { id: true, name: true } } } }));
  } catch (error) { next(error); }
}

async function remove(req, res, next) {
  try {
    await prisma.recurringTicket.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Pianificazione eliminata' });
  } catch (error) { next(error); }
}

module.exports = { list, create, update, remove };
