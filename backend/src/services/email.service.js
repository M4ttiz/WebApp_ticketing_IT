// ============================================
// Email Service — Nodemailer with dynamic SMTP
// ============================================

const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');

let transporter = null;

/**
 * Get SMTP config from database settings, falling back to env vars.
 */
async function getSmtpConfig() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'smtp' } });
    if (setting && setting.value && setting.value.host) {
      return setting.value;
    }
  } catch (err) {
    console.warn('⚠️  Could not load SMTP settings from DB, using env vars');
  }

  return {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'IT Ticketing <noreply@example.com>',
  };
}

/**
 * Create/refresh the Nodemailer transporter with current SMTP settings.
 */
async function getTransporter() {
  const config = await getSmtpConfig();

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    tls: { rejectUnauthorized: false },
  });

  transporter._fromAddress = config.from;
  return transporter;
}

/**
 * Send an email. Automatically refreshes transporter on each call
 * to pick up any SMTP config changes from the admin panel.
 */
async function sendEmail({ to, subject, html }) {
  try {
    const transport = await getTransporter();
    const result = await transport.sendMail({
      from: transport._fromAddress,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`❌ Email send failed to ${to}:`, error.message);
    // Don't throw — email failures shouldn't break the app flow
    return null;
  }
}

/**
 * Test the SMTP connection with given config (used by admin panel).
 */
async function testSmtpConnection(config) {
  const testTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    tls: { rejectUnauthorized: false },
  });

  await testTransporter.verify();
  return true;
}

/**
 * Invalidate the cached transporter (called when SMTP settings are updated).
 */
function invalidateTransporter() {
  transporter = null;
}

module.exports = {
  sendEmail,
  testSmtpConnection,
  invalidateTransporter,
  getSmtpConfig,
};
