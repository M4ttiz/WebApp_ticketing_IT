// ============================================
// Category Controller — CRUD for ticket categories
// ============================================

const prisma = require('../lib/prisma');
const { NotFoundError, AppError } = require('../utils/errors');

/**
 * GET /api/categories
 */
async function listCategories(req, res, next) {
  try {
    const { includeInactive = 'false' } = req.query;
    const where = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      include: { _count: { select: { tickets: true } } },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/categories
 */
async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;

    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) {
      throw new AppError('Una categoria con questo nome esiste già', 409);
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), description: description?.trim() || null },
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/categories/:id
 */
async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { name, description, isActive } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Categoria');

    const updateData = {};
    if (name !== undefined) {
      const dup = await prisma.category.findFirst({ where: { name: name.trim(), NOT: { id } } });
      if (dup) throw new AppError('Una categoria con questo nome esiste già', 409);
      updateData.name = name.trim();
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { tickets: true } } },
    });

    res.json(category);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/categories/:id
 * Soft-deactivate a category.
 */
async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });
    if (!existing) throw new NotFoundError('Categoria');

    // Deactivate instead of delete (preserves ticket references)
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Categoria disattivata' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
