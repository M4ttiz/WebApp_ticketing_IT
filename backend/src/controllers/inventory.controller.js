// ============================================
// Inventory Controller — CRUD operations for Device management
// ============================================

const prisma = require('../lib/prisma');
const { NotFoundError, ForbiddenError, AppError } = require('../utils/errors');

// ─── Shared includes for device queries ────
const deviceIncludes = {
  assignedUser: {
    select: { id: true, firstName: true, lastName: true, email: true }
  }
};

/**
 * GET /api/inventory/devices
 * List devices with optional filters
 */
async function listDevices(req, res, next) {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (type) {
      where.type = type.toUpperCase();
    }
    
    if (status) {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        include: deviceIncludes,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.device.count({ where })
    ]);

    res.json({
      devices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/inventory/devices/:id
 * Get single device by ID
 */
async function getDevice(req, res, next) {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id },
      include: deviceIncludes
    });

    if (!device) {
      throw new NotFoundError('Dispositivo non trovato');
    }

    res.json(device);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/inventory/devices
 * Create new device
 */
async function createDevice(req, res, next) {
  try {
    const {
      name,
      type,
      brand,
      model,
      serialNumber,
      status = 'AVAILABLE',
      purchaseDate,
      assignedTo
    } = req.body;

    // Validate required fields
    if (!name || !type || !brand || !model || !serialNumber) {
      throw new AppError('I campi nome, tipo, marca, modello e numero di serie sono obbligatori', 400);
    }

    // Check if serial number already exists
    const existingDevice = await prisma.device.findUnique({
      where: { serialNumber }
    });

    if (existingDevice) {
      throw new AppError('Un dispositivo con questo numero di serie esiste già', 409);
    }

    // Validate assigned user if provided
    if (assignedTo) {
      const user = await prisma.user.findUnique({
        where: { id: assignedTo }
      });

      if (!user) {
        throw new AppError('Utente specificato non trovato', 400);
      }
    }

    const device = await prisma.device.create({
      data: {
        name,
        type: type.toUpperCase(),
        brand,
        model,
        serialNumber,
        status: status.toUpperCase(),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        assignedTo
      },
      include: deviceIncludes
    });

    res.status(201).json(device);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/inventory/devices/:id
 * Update existing device
 */
async function updateDevice(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      brand,
      model,
      serialNumber,
      status,
      purchaseDate,
      assignedTo
    } = req.body;

    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id }
    });

    if (!existingDevice) {
      throw new NotFoundError('Dispositivo non trovato');
    }

    // Check serial number uniqueness if changed
    if (serialNumber && serialNumber !== existingDevice.serialNumber) {
      const duplicateDevice = await prisma.device.findUnique({
        where: { serialNumber }
      });

      if (duplicateDevice) {
        throw new AppError('Un dispositivo con questo numero di serie esiste già', 409);
      }
    }

    // Validate assigned user if provided
    if (assignedTo) {
      const user = await prisma.user.findUnique({
        where: { id: assignedTo }
      });

      if (!user) {
        throw new AppError('Utente specificato non trovato', 400);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type.toUpperCase();
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (status !== undefined) updateData.status = status.toUpperCase();
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;

    const device = await prisma.device.update({
      where: { id },
      data: updateData,
      include: deviceIncludes
    });

    res.json(device);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/inventory/devices/:id
 * Delete device (soft delete by status)
 */
async function deleteDevice(req, res, next) {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id }
    });

    if (!device) {
      throw new NotFoundError('Dispositivo non trovato');
    }

    // Soft delete by setting status to RETIRED
    const updatedDevice = await prisma.device.update({
      where: { id },
      data: { status: 'RETIRED', assignedTo: null },
      include: deviceIncludes
    });

    res.json({
      message: 'Dispositivo ritirato con successo',
      device: updatedDevice
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/inventory/stats
 * Get inventory statistics
 */
async function getInventoryStats(req, res, next) {
  try {
    const [
      totalDevices,
      availableDevices,
      deployedDevices,
      brokenDevices,
      maintenanceDevices,
      retiredDevices,
      devicesByType
    ] = await Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { status: 'AVAILABLE' } }),
      prisma.device.count({ where: { status: 'DEPLOYED' } }),
      prisma.device.count({ where: { status: 'BROKEN' } }),
      prisma.device.count({ where: { status: 'MAINTENANCE' } }),
      prisma.device.count({ where: { status: 'RETIRED' } }),
      prisma.device.groupBy({
        by: ['type'],
        _count: { type: true }
      })
    ]);

    res.json({
      total: totalDevices,
      byStatus: {
        available: availableDevices,
        deployed: deployedDevices,
        broken: brokenDevices,
        maintenance: maintenanceDevices,
        retired: retiredDevices
      },
      byType: devicesByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  getInventoryStats
};
