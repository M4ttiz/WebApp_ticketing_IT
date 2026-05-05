// ============================================
// Settings Controller — SMTP configuration
// ============================================

const prisma = require('../lib/prisma');
const { testSmtpConnection, invalidateTransporter } = require('../services/email.service');
const { AppError } = require('../utils/errors');

const DEFAULT_ASSET_CATEGORIES = [
  'LAPTOP',
  'DESKTOP',
  'MONITOR',
  'STAMPANTE',
  'ACCESS_POINT',
  'SERVER',
  'SWITCH',
  'ROUTER',
  'TELEFONO',
  'TABLET',
  'ALTRO',
];

function normalizeCategory(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

function readAssetCategoryConfig(setting) {
  const selectedRaw = Array.isArray(setting?.value?.selected) ? setting.value.selected : DEFAULT_ASSET_CATEGORIES;
  const customRaw = Array.isArray(setting?.value?.custom) ? setting.value.custom : [];

  const custom = [...new Set(customRaw.map(normalizeCategory).filter(Boolean))];
  const available = [...new Set([...DEFAULT_ASSET_CATEGORIES, ...custom])];
  const selected = [...new Set(selectedRaw.map(normalizeCategory).filter(Boolean))]
    .filter((category) => available.includes(category));

  return {
    custom,
    available,
    selected: selected.length ? selected : available,
  };
}

/**
 * GET /api/settings/smtp
 */
async function getSmtpSettings(req, res, next) {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'smtp' } });
    if (!setting) {
      return res.json({
        host: '',
        port: 587,
        secure: false,
        user: '',
        pass: '',
        from: '',
      });
    }

    // Mask password for display
    const config = { ...setting.value };
    if (config.pass) {
      config.pass = '••••••••';
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/settings/smtp
 */
async function updateSmtpSettings(req, res, next) {
  try {
    const { host, port, secure, user, pass, from } = req.body;

    // Get current settings to preserve password if masked
    const current = await prisma.setting.findUnique({ where: { key: 'smtp' } });
    const currentPass = current?.value?.pass || '';

    const config = {
      host: host?.trim() || '',
      port: parseInt(port) || 587,
      secure: !!secure,
      user: user?.trim() || '',
      pass: pass === '••••••••' ? currentPass : (pass || ''),
      from: from?.trim() || '',
    };

    await prisma.setting.upsert({
      where: { key: 'smtp' },
      update: { value: config },
      create: { key: 'smtp', value: config },
    });

    // Invalidate cached transporter
    invalidateTransporter();

    res.json({ message: 'Configurazione SMTP aggiornata' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/settings/smtp/test
 */
async function testSmtp(req, res, next) {
  try {
    const { host, port, secure, user, pass } = req.body;

    // Get current password if masked
    const current = await prisma.setting.findUnique({ where: { key: 'smtp' } });
    const actualPass = pass === '••••••••' ? (current?.value?.pass || '') : (pass || '');

    await testSmtpConnection({
      host: host?.trim(),
      port: parseInt(port) || 587,
      secure: !!secure,
      user: user?.trim(),
      pass: actualPass,
    });

    res.json({ message: 'Connessione SMTP riuscita!' });
  } catch (error) {
    res.status(400).json({ error: `Test SMTP fallito: ${error.message}` });
  }
}

/**
 * GET /api/settings/asset-categories
 */
async function getAssetCategories(req, res, next) {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'asset.categories' } });
    const config = readAssetCategoryConfig(setting);

    res.json({
      available: config.available,
      selected: config.selected,
      custom: config.custom,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/settings/asset-categories
 */
async function updateAssetCategories(req, res, next) {
  try {
    const { selected, custom = [] } = req.body;
    if (!Array.isArray(selected) || selected.length === 0) {
      throw new AppError('Seleziona almeno una categoria', 400);
    }
    if (!Array.isArray(custom)) {
      throw new AppError('Formato categorie personalizzate non valido', 400);
    }

    const normalizedCustom = [...new Set(custom.map(normalizeCategory).filter(Boolean))];
    const invalidCustom = normalizedCustom.filter((item) => item.length > 100);
    if (invalidCustom.length > 0) {
      throw new AppError('Una o più categorie personalizzate sono troppo lunghe', 400);
    }

    const available = [...new Set([...DEFAULT_ASSET_CATEGORIES, ...normalizedCustom])];
    const uniqueSelected = [...new Set(selected.map(normalizeCategory).filter(Boolean))];
    const invalid = uniqueSelected.filter((c) => !available.includes(c));
    if (invalid.length > 0) {
      throw new AppError(`Categorie non valide: ${invalid.join(', ')}`, 400);
    }

    await prisma.setting.upsert({
      where: { key: 'asset.categories' },
      update: { value: { selected: uniqueSelected, custom: normalizedCustom } },
      create: { key: 'asset.categories', value: { selected: uniqueSelected, custom: normalizedCustom } },
    });

    res.json({
      message: 'Categorie asset aggiornate',
      selected: uniqueSelected,
      custom: normalizedCustom,
      available,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSmtpSettings,
  updateSmtpSettings,
  testSmtp,
  getAssetCategories,
  updateAssetCategories,
};
