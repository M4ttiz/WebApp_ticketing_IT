// ============================================
// Settings Controller — SMTP configuration
// ============================================

const prisma = require('../lib/prisma');
const { testSmtpConnection, invalidateTransporter } = require('../services/email.service');
const { AppError } = require('../utils/errors');

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

module.exports = { getSmtpSettings, updateSmtpSettings, testSmtp };
