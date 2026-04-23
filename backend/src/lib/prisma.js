const { PrismaClient } = require('@prisma/client');

// Reuse Prisma client in dev to avoid too many connections during hot-reload
const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

module.exports = prisma;
